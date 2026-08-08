import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../../state/gameState.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { backpackSlotCap, backpackSlotsUsed } from "../../data/toolbelt.js";
import { consumeEffectOf, useItem, attemptRevive } from "../../data/items.js";

// createInitialState() leaves difficulty null, which grantSkillXp tolerates
// (it falls back to the default multipliers), so no character is needed.
function player(inventory = {}) {
  const state = createInitialState();
  state.inventory = inventory;
  return state;
}

// ------------------------------------------------------------- classifier

test("consumeEffectOf(): food is gated on health_boost, not on type alone", () => {
  assert.deepEqual(consumeEffectOf("cooked_rabbit"), { kind: "heal", amount: 15 });
  assert.deepEqual(consumeEffectOf("raw_rabbit"), { kind: "heal", amount: 5 });
  // The ten `subtype: "ingredient"` foods are crafting inputs with no boost -
  // offering them as edible would be wrong.
  assert.equal(consumeEffectOf("flour"), null);
});

test("consumeEffectOf(): potions and aids resolve by subtype", () => {
  assert.deepEqual(consumeEffectOf("healing_potion"), { kind: "heal", amount: 20 });
  assert.deepEqual(consumeEffectOf("mana_potion"), { kind: "mana", amount: 20 });
  assert.deepEqual(consumeEffectOf("poison_potion"), { kind: "poison", amount: 20 });
  // health_poison uses the nested { stat, damage } shape rather than a flat
  // poison_damage - both normalise to the same descriptor.
  assert.deepEqual(consumeEffectOf("health_poison"), { kind: "poison", amount: 25 });
  assert.deepEqual(consumeEffectOf("attack_potion"), { kind: "buff", stat: "attack" });

  assert.deepEqual(consumeEffectOf("bandage"), { kind: "heal", amount: 10 });
  assert.deepEqual(consumeEffectOf("elixir"), { kind: "restore", targets: ["health", "mana"] });
  assert.deepEqual(consumeEffectOf("antidote"), { kind: "cure", targets: ["poison"] });
  // A bare `revive: true` means a full restore; the fraction is what
  // attemptRevive() brings you back with.
  assert.deepEqual(consumeEffectOf("revive"), { kind: "revive", amount: 1 });
});

test("consumeEffectOf(): equipment, materials and unknown ids are not consumable", () => {
  assert.equal(consumeEffectOf("iron_sword"), null);
  assert.equal(consumeEffectOf("leather_belt"), null);
  assert.equal(consumeEffectOf("stone"), null);
  assert.equal(consumeEffectOf("hammer"), null);
  assert.equal(consumeEffectOf("no_such_item"), null);
});

// ------------------------------------------------------------------ using

test("useItem(): food heals, clamped to hpMax, and grants survival xp", () => {
  const state = player({ cooked_rabbit: 2 });
  state.hp = 50;
  const xpBefore = state.skills.survival.xp;

  const first = useItem(state, "cooked_rabbit");
  assert.equal(first.used, true);
  assert.match(first.message, /You eat the Cooked Rabbit and recover 15 HP\./);
  assert.equal(state.hp, 65);
  assert.equal(state.inventory.cooked_rabbit, 1);
  assert.ok(state.skills.survival.xp > xpBefore);

  // Overheal is clamped to what's actually missing, not the full boost.
  state.hp = state.hpMax - 5;
  assert.equal(useItem(state, "cooked_rabbit").used, true);
  assert.equal(state.hp, state.hpMax);
  assert.equal(state.inventory.cooked_rabbit, undefined, "the last one is removed outright");
});

test("useItem(): a potion pays CONSUME - alchemy xp plus the empty bottle back", () => {
  const state = player({ healing_potion: 1 });
  state.hp = 10;
  const xpBefore = state.skills.alchemy.xp;

  const result = useItem(state, "healing_potion");
  assert.equal(result.used, true);
  assert.match(result.message, /You drink the Healing Potion/);
  assert.match(result.message, /You keep the Empty Bottle\./);
  assert.equal(state.inventory.empty_bottle, 1);
  assert.ok(state.skills.alchemy.xp > xpBefore);
});

test("useItem(): food grants no byproduct", () => {
  const state = player({ bread: 1 });
  state.hp = 10;
  useItem(state, "bread");
  assert.equal(state.inventory.empty_bottle, undefined);
});

test("useItem(): an elixir fills both bars", () => {
  const state = player({ elixir: 1 });
  state.hp = 10;
  state.mp = 10;

  const result = useItem(state, "elixir");
  assert.equal(result.used, true);
  assert.match(result.message, /You apply the Elixir/);
  assert.equal(state.hp, state.hpMax);
  assert.equal(state.mp, state.mpMax);
});

test("useItem(): refuses at full hp/mp rather than burning the item", () => {
  const state = player({ healing_potion: 1, mana_potion: 1, elixir: 1 });

  const healed = useItem(state, "healing_potion");
  assert.equal(healed.used, false);
  assert.equal(healed.message, "You're already at full health.");

  assert.equal(useItem(state, "mana_potion").message, "Your mana is already full.");
  assert.equal(useItem(state, "elixir").message, "You're already at full health and mana.");

  assert.deepEqual(state.inventory, { healing_potion: 1, mana_potion: 1, elixir: 1 }, "nothing consumed");
});

test("useItem(): combat-only effects refuse out of combat, with a reason", () => {
  const state = player({ attack_potion: 1, poison_potion: 1 });

  const buff = useItem(state, "attack_potion");
  assert.equal(buff.used, false);
  assert.match(buff.message, /fades with nothing to fight/);

  const thrown = useItem(state, "poison_potion");
  assert.equal(thrown.used, false);
  assert.equal(thrown.message, "There's nothing to throw that at.");

  assert.deepEqual(state.inventory, { attack_potion: 1, poison_potion: 1 }, "nothing consumed");
});

test("useItem(): buff and poison potions land when combat supplies the context", () => {
  const state = player({ attack_potion: 1, poison_potion: 1 });
  const combat = { buffs: {} };
  const target = { name: "Goblin", hp: 100 };

  assert.equal(useItem(state, "attack_potion", { combat }).used, true);
  assert.equal(combat.buffs.attack, 5);

  const thrown = useItem(state, "poison_potion", { target, combat });
  assert.equal(thrown.used, true);
  assert.match(thrown.message, /You hurl the Poison Potion at Goblin for 20\./);
  assert.equal(target.hp, 80);
});

// The player carries no status effects, so a cure has nothing to remove -
// deliberately a refusal that keeps the item rather than a no-op that eats it.
// A revive refuses too, but only off the backpack: it fires from
// attemptRevive() at the one moment it means anything (see below).
test("useItem(): cure and revive refuse and keep the item", () => {
  const state = player({ antidote: 1, antivenom: 1, revive: 1 });

  assert.equal(useItem(state, "antidote").message, "You're not poisoned.");
  assert.equal(useItem(state, "antivenom").message, "You're not poisoned.");
  assert.equal(useItem(state, "revive").message, "Nothing to come back from.");
  assert.deepEqual(state.inventory, { antidote: 1, antivenom: 1, revive: 1 });
});

// ---------------------------------------------------------------- reviving

test("attemptRevive(): spends a revive item and brings you back", () => {
  const state = player({ revive: 1, bread: 2 });
  state.hp = 0;

  const result = attemptRevive(state);
  assert.equal(result.used, true);
  assert.match(result.message, /pulls you back from the brink/);
  assert.equal(state.hp, state.hpMax, "a bare `revive: true` restores fully");
  assert.equal(state.inventory.revive, undefined, "the item is spent");
  assert.deepEqual(state.inventory, { bread: 2 }, "nothing else is touched");
  assert.equal(state.lifetime.used.revive, 1);
});

test("attemptRevive(): returns null with nothing to spend, leaving the caller to handle death", () => {
  const state = player({ bread: 2, healing_potion: 1, antidote: 1 });
  state.hp = 0;

  assert.equal(attemptRevive(state), null);
  assert.equal(state.hp, 0, "nothing was restored");
  assert.deepEqual(state.inventory, { bread: 2, healing_potion: 1, antidote: 1 });
});

test("attemptRevive(): spends the weakest revive first", (t) => {
  // `revive` is a subtype rather than a type, so anything declaring it
  // qualifies - and a numeric `revive` reads as a fraction of hpMax instead of
  // a full restore. Only one revive item ships today, so the second is
  // injected here to exercise both rules.
  ALL_ITEMS.half_revive = { name: "Half Revive", type: "aid", subtype: "revive", rarity: "rare", revive: 0.5 };
  t.after(() => delete ALL_ITEMS.half_revive);

  const state = player({ revive: 1, half_revive: 1 });
  state.hp = 0;

  const result = attemptRevive(state);
  assert.equal(result.used, true);
  assert.equal(state.hp, state.hpMax / 2);
  assert.equal(state.inventory.half_revive, undefined, "the cheap one went");
  assert.equal(state.inventory.revive, 1, "the full revive is still in hand");
});

test("useItem(): non-consumables and unheld items refuse with a distinct reason", () => {
  const state = player({ iron_sword: 1, flour: 3 });

  assert.equal(useItem(state, "iron_sword").message, "Iron Sword can't be used.");
  assert.equal(useItem(state, "flour").message, "Flour can't be used.");
  assert.equal(useItem(state, "healing_potion").message, "You have no Healing Potion.");
  assert.equal(useItem(state, "no_such_item").message, "You don't have that.");
  assert.deepEqual(state.inventory, { iron_sword: 1, flour: 3 });
});

test("useItem(): reports a lost byproduct rather than voiding it silently", () => {
  const state = player({ healing_potion: 1 });
  state.hp = 10;
  // Fill every general backpack slot so addItem() refuses the empty bottle.
  // The cap counts distinct non-tool, non-potion ids, and only ids that
  // resolve in ALL_ITEMS count at all - so these have to be real items.
  const filler = Object.entries(ALL_ITEMS)
    .filter(([id, item]) => item.type !== "tool" && item.type !== "potion" && id !== "empty_bottle")
    .slice(0, backpackSlotCap(state));
  for (const [id] of filler) state.inventory[id] = 1;
  assert.equal(backpackSlotsUsed(state), backpackSlotCap(state), "backpack is genuinely full");

  const result = useItem(state, "healing_potion");
  assert.equal(result.used, true, "the potion still works");
  assert.match(result.message, /won't fit in your backpack/);
  assert.equal(state.inventory.empty_bottle, undefined);
});

test("useItem(): bumps state.lifetime.used only on a successful use", () => {
  const state = player({ bread: 2, antidote: 1 });
  state.hp = 10;

  useItem(state, "bread");
  useItem(state, "bread");
  useItem(state, "antidote"); // refused

  assert.deepEqual(state.lifetime.used, { bread: 2 });
});
