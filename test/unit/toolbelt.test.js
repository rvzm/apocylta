import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasBeltEquipped,
  slingshotAmmoCap,
  waterBottleCap,
  quiverCap,
  backpackWeightCap,
  backpackWeightUsed,
  toolbeltWeightCap,
  toolbeltWeightUsed,
  weightRoomFor,
  loadFraction,
  potionSlotCap,
  potionSlotsUsed,
  potionSlotsFree,
} from "../../data/toolbelt.js";
import { createInitialState } from "../../state/gameState.js";
import { ALL_ITEMS, BACKPACKS, equipSlotOf, weightOf, storeInOf } from "../../item_backbone.js";

// A fresh character has strength 1, worth +2 on both budgets
// (WEIGHT_PER_STRENGTH). Stated once rather than buried in each assertion.
const STRENGTH_1 = 2;

test("with no belt equipped: on-the-belt resources are fully gated, storage falls to the baseline", () => {
  const state = createInitialState();
  // The starter belt is worn from the start, so the ungirded case is reached by
  // taking it off - which is still reachable in play, via the Toolbelt screen.
  state.equipment.belt = null;
  assert.equal(hasBeltEquipped(state), false);
  assert.equal(slingshotAmmoCap(state), 0);
  assert.equal(waterBottleCap(state), 0);
  assert.equal(quiverCap(state), 0);
  assert.equal(backpackWeightCap(state), 100 + STRENGTH_1);
  assert.equal(toolbeltWeightCap(state), 8 + STRENGTH_1, "no belt means next to no belt capacity");
  assert.equal(potionSlotCap(state), 5);
});

test("with a belt equipped: every cap comes from the belt's own tier", () => {
  const state = createInitialState();
  state.equipment.belt = "plate_belt"; // { slingAmmo: 20, potions: 15, backpack: 200, toolbelt: 35 }
  assert.equal(hasBeltEquipped(state), true);
  assert.equal(slingshotAmmoCap(state), 20);
  assert.equal(waterBottleCap(state), 100);
  assert.equal(quiverCap(state), Infinity);
  assert.equal(backpackWeightCap(state), 200 + STRENGTH_1);
  assert.equal(toolbeltWeightCap(state), 35 + STRENGTH_1);
  assert.equal(potionSlotCap(state), 15);
});

test("a better belt is a strict upgrade on every axis", () => {
  const bare = createInitialState();
  bare.equipment.belt = "leather_belt";
  const rich = createInitialState();
  rich.equipment.belt = "apocyltas_eye";

  assert.ok(backpackWeightCap(rich) > backpackWeightCap(bare));
  assert.ok(toolbeltWeightCap(rich) > toolbeltWeightCap(bare));
  assert.ok(potionSlotCap(rich) > potionSlotCap(bare));
  assert.ok(slingshotAmmoCap(rich) > slingshotAmmoCap(bare));
});

// ----- what counts against what -----

test("weight is charged by quantity, not by how many different things you carry", () => {
  const state = createInitialState();
  state.inventory = { iron_ore: 1 };
  const one = backpackWeightUsed(state);
  state.inventory = { iron_ore: 10 };

  assert.ok(one > 0, "one ore is not free, which the old slot count made it");
  assert.equal(backpackWeightUsed(state), Math.round(one * 10 * 100) / 100);
});

test("storeIn routes an item to its own budget, and the two don't bleed into each other", () => {
  const state = createInitialState();
  state.inventory = { iron_ore: 10, scrap_metal: 10 };

  assert.equal(storeInOf("iron_ore"), "backpack");
  assert.equal(storeInOf("scrap_metal"), "toolbelt");
  assert.equal(backpackWeightUsed(state), weightOf("iron_ore") * 10);
  assert.equal(toolbeltWeightUsed(state), weightOf("scrap_metal") * 10);
});

test("tools, scrap, bait and hooks ride the belt; nets and everything else ride the pack", () => {
  for (const id of ["iron_pickaxe", "hammer", "scrap_metal", "fishing_bait", "fishing_hook"]) {
    assert.equal(storeInOf(id), "toolbelt", `${id} should be on the belt`);
  }
  for (const id of ["fishing_net", "iron_ore", "bread", "iron_sword"]) {
    assert.equal(storeInOf(id), "backpack", `${id} should be in the pack`);
  }
});

// Potions have a pouch of their own, counted in slots - a potion costs no
// weight in either weighed container.
test("potions cost a pouch slot and no weight at all", () => {
  const state = createInitialState();
  state.inventory = { healing_potion: 50, mana_potion: 1 };

  assert.equal(backpackWeightUsed(state), 0, "potions are not backpack weight");
  assert.equal(toolbeltWeightUsed(state), 0);
  assert.equal(potionSlotsUsed(state), 2, "two distinct potion ids, whatever the amounts");
});

test("potionSlotsFree(): topping up a potion you already carry never needs a slot", () => {
  const state = createInitialState();
  state.equipment.belt = "leather_belt"; // 5 pouch slots
  state.inventory = { healing_potion: 1 };
  assert.equal(potionSlotsFree(state, "healing_potion"), Infinity);
  assert.equal(potionSlotsFree(state, "mana_potion"), 4);
});

// ----- strength -----

test("strength raises both weight budgets", () => {
  const state = createInitialState();
  state.equipment.belt = "plate_belt";
  const backpack = backpackWeightCap(state);
  const toolbelt = toolbeltWeightCap(state);

  state.skills.strength.level = 21; // +20 levels
  assert.equal(backpackWeightCap(state), backpack + 40);
  assert.equal(toolbeltWeightCap(state), toolbelt + 40);
});

test("strength counts through an enhancement, like every other effective-level read", () => {
  const state = createInitialState();
  const trained = backpackWeightCap(state);
  state.enhancements.charm = "strength_charm"; // effect: { strengthUp: 5 }
  assert.equal(backpackWeightCap(state), trained + 10, "+5 effective strength is +10 weight");
  assert.equal(state.skills.strength.level, 1, "and the trained level is untouched");
});

// ----- backpacks -----

test("a worn backpack raises general storage above the belt's number", () => {
  const state = createInitialState();
  const beltOnly = backpackWeightCap(state);

  state.equipment.backpack = "large_backpack"; // capacity 300
  assert.equal(backpackWeightCap(state), 300 + STRENGTH_1);
  assert.ok(backpackWeightCap(state) > beltOnly);
});

// Max, not sum: they answer the same question, so adding them would make a
// leather belt worth +100 on top of God's Back and make taking a belt off to
// make room a real (and absurd) trade.
test("belt and backpack take the larger, never the sum", () => {
  const state = createInitialState();
  state.equipment.belt = "apocyltas_eye"; // backpack 500
  state.equipment.backpack = "starter_backpack"; // capacity 100
  assert.equal(backpackWeightCap(state), 500 + STRENGTH_1, "the better belt wins");

  state.equipment.backpack = "gods back"; // capacity 2000
  assert.equal(backpackWeightCap(state), 2000 + STRENGTH_1, "the better backpack wins");
});

test("a backpack does nothing for the toolbelt's budget - that's the belt's job", () => {
  const state = createInitialState();
  const before = toolbeltWeightCap(state);
  state.equipment.backpack = "gods back";
  assert.equal(toolbeltWeightCap(state), before);
});

test("every backpack resolves through ALL_ITEMS and equips into the backpack slot", () => {
  for (const id of Object.keys(BACKPACKS).filter((key) => key !== "global")) {
    assert.ok(ALL_ITEMS[id], `${id} missing from ALL_ITEMS`);
    assert.equal(equipSlotOf(id), "backpack", `${id} does not equip into the backpack slot`);
  }
});

// ----- room, and how full -----

test("weightRoomFor(): reports what's left in the item's own container", () => {
  const state = createInitialState();
  state.equipment.belt = "plate_belt"; // backpack 200, toolbelt 35
  state.inventory = { iron_ore: 10 };

  assert.equal(weightRoomFor(state, "iron_ore"), 200 + STRENGTH_1 - weightOf("iron_ore") * 10);
  assert.equal(weightRoomFor(state, "scrap_metal"), 35 + STRENGTH_1, "the belt is still empty");
  assert.equal(weightRoomFor(state, "healing_potion"), Infinity, "a potion's limit is slots");
});

test("loadFraction(): takes the fuller of the two containers", () => {
  const state = createInitialState();
  state.equipment.belt = "plate_belt";
  assert.equal(loadFraction(state), 0);

  // Fill the belt and leave the pack empty - the belt is what should show.
  state.inventory = { scrap_metal: Math.floor(toolbeltWeightCap(state) / weightOf("scrap_metal")) };
  assert.equal(backpackWeightUsed(state), 0, "the pack itself is empty");
  assert.ok(loadFraction(state) > 0.9, `a full belt should read as loaded, got ${loadFraction(state)}`);
});
