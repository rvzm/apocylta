// Godmode skips costs, not moves or voluntary disposals. Every case here
// asserts both directions - a flag that's never observed to *not* fire proves
// nothing, and a leaked `state.godmode` would silently neuter the combat
// suite's death tests rather than failing loudly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, removeItem, equipItem } from "../../state/gameState.js";
import { buildEncounter, beginCombat, resolveRound } from "../../data/combat.js";
import { canCastSpell, castSpell } from "../../data/magic.js";
import { canAfford, chargeGold } from "../../data/shops.js";
import { spendIngredients } from "../../data/stations.js";

// Forces every chance-gated branch to miss (crit/dodge/block all compare
// rng() < chance), so the enemy's hit always lands.
const NEVER = () => 0.99;

function fighter({ godmode = false } = {}) {
  const state = createInitialState();
  state.difficulty = "normal";
  state.currentLocationId = "wilderness";
  state.godmode = godmode;
  return state;
}

// --------------------------------------------------------------------- hp

test("godmode: enemy attacks deal no damage", () => {
  const mortal = fighter();
  beginCombat(mortal, buildEncounter(mortal, "deranged_raider")); // dps 50
  resolveRound(mortal, { type: "attack" }, NEVER);
  assert.ok(mortal.hp < mortal.hpMax, "control: damage lands without godmode");

  const god = fighter({ godmode: true });
  beginCombat(god, buildEncounter(god, "deranged_raider"));
  resolveRound(god, { type: "attack" }, NEVER);
  assert.equal(god.hp, god.hpMax);
});

// The zeroed damage alone doesn't cover this: hp can't be reduced to 0 under
// godmode, but the Admin stats editor can set it there directly, and the death
// check would otherwise fire on the next round regardless.
test("godmode: hp already at zero still doesn't trigger defeat", () => {
  const mortal = fighter();
  mortal.hp = 1;
  beginCombat(mortal, buildEncounter(mortal, "deranged_raider"));
  resolveRound(mortal, { type: "attack" }, NEVER);
  assert.equal(mortal.currentCombat.outcome, "defeat", "control: dying works normally");

  const god = fighter({ godmode: true });
  god.hp = 0;
  god.inventory = { stone: 5 };
  beginCombat(god, buildEncounter(god, "deranged_raider"));
  resolveRound(god, { type: "attack" }, NEVER);

  assert.equal(god.currentCombat.outcome, null, "the fight carries on");
  assert.equal(god.lastDefeat, null, "no defeat recorded");
  assert.deepEqual(god.inventory, { stone: 5 }, "the backpack isn't wiped");
});

// --------------------------------------------------------------------- mp

test("godmode: spells are castable at zero mana and cost nothing", () => {
  const mortal = fighter();
  mortal.mp = 0;
  assert.equal(canCastSpell(mortal, "magic_missle"), false, "control: refused when broke");

  const god = fighter({ godmode: true });
  god.mp = 0;
  // Both halves matter - the gate has to give way as well as the spend, or the
  // spell is refused before it ever reaches the point of being free.
  assert.equal(canCastSpell(god, "magic_missle"), true);

  const target = { name: "Goblin", hp: 100 };
  const result = castSpell(god, "magic_missle", target);
  assert.ok(result, "the cast goes through");
  assert.equal(god.mp, 0, "no mana spent");
  assert.ok(target.hp < 100, "and it still does its job");
  assert.ok(god.skills.magic.xp > 0, "xp is still granted");
  assert.equal(god.lifetime.cast.magic_missle, 1, "and the cast is still recorded");
});

test("godmode: mana is left alone even when there's plenty", () => {
  const god = fighter({ godmode: true });
  const before = god.mp;
  castSpell(god, "magic_missle", { name: "Goblin", hp: 100 });
  assert.equal(god.mp, before);
});

// ------------------------------------------------------------------- gold

test("godmode: everything is affordable and nothing is charged", () => {
  const mortal = fighter();
  mortal.gold = 10;
  assert.equal(canAfford(mortal, 500), false, "control: broke means broke");
  chargeGold(mortal, 10);
  assert.equal(mortal.gold, 0, "control: gold is spent normally");

  const god = fighter({ godmode: true });
  god.gold = 0;
  assert.equal(canAfford(god, 999999), true);
  chargeGold(god, 999999);
  assert.equal(god.gold, 0, "gold never goes negative, or anywhere at all");
});

// ------------------------------------------------------------------ items

test("godmode: costs are waived but forced removals still work", () => {
  const mortal = fighter();
  mortal.inventory = { wood: 5 };
  removeItem(mortal, "wood", 2);
  assert.equal(mortal.inventory.wood, 3, "control: items are consumed normally");

  const god = fighter({ godmode: true });
  god.inventory = { wood: 5 };

  removeItem(god, "wood", 2);
  assert.equal(god.inventory.wood, 5, "a cost takes nothing");

  // Dropping and selling are the player asking for it gone - godmode making
  // items undroppable would be a bug, not a perk.
  removeItem(god, "wood", 2, { force: true });
  assert.equal(god.inventory.wood, 3);
});

test("godmode: equipping still moves the item rather than duplicating it", () => {
  const god = fighter({ godmode: true });
  god.inventory = { iron_sword: 1 };

  equipItem(god, "iron_sword", "weapon");
  assert.equal(god.equipment.weapon, "iron_sword");
  assert.equal(god.inventory.iron_sword, undefined, "equip is a move, and forces past godmode");
});

test("godmode: crafting ingredients and belt water are both free", () => {
  const ingredients = { wood: 2, water: 10 };

  const mortal = fighter();
  mortal.inventory = { wood: 5 };
  mortal.equipment.belt = "leather_belt";
  spendIngredients(mortal, ingredients);
  assert.equal(mortal.inventory.wood, 3, "control: ingredients are consumed");
  assert.equal(mortal.toolbelt.waterBottle, 90, "control: water is drawn from the belt");

  const god = fighter({ godmode: true });
  god.inventory = { wood: 5 };
  god.equipment.belt = "leather_belt";
  spendIngredients(god, ingredients);

  assert.equal(god.inventory.wood, 5);
  // Water comes off the toolbelt rather than the inventory, so it misses
  // removeItem's guard entirely and needs its own.
  assert.equal(god.toolbelt.waterBottle, 100);
});

// ------------------------------------------------------------------- seed

test("godmode: defaults off, seeded from player_config", async () => {
  const { player_config } = await import("../../config.js");
  assert.equal(player_config.godmode, false, "shipped default");
  assert.equal(createInitialState().godmode, false);
});
