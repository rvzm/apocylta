import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, formatClock, isLocationOpen, addItem, removeItem, finalizeCharacter, walletTotal } from "../../state/gameState.js";
import { backpackSlotsUsed } from "../../data/toolbelt.js";
import { ALL_ITEMS } from "../../item_backbone.js";

test("formatClock() formats minutes-since-midnight as 12h time", () => {
  const state = createInitialState();
  state.clock.totalMinutes = 0;
  assert.equal(formatClock(state), "12:00am");
  state.clock.totalMinutes = 12 * 60; // noon
  assert.equal(formatClock(state), "12:00pm");
  state.clock.totalMinutes = 19 * 60 + 38; // 7:38pm
  assert.equal(formatClock(state), "7:38pm");
});

test("isLocationOpen() handles a normal (non-wrapping) hour range", () => {
  const state = createInitialState();
  state.currentLocationId = "weapons_shop"; // open: 8, close: 20
  state.clock.totalMinutes = 12 * 60;
  assert.equal(isLocationOpen(state), true);
  state.clock.totalMinutes = 2 * 60;
  assert.equal(isLocationOpen(state), false);
});

test("isLocationOpen() handles a midnight-wrapping hour range", () => {
  const state = createInitialState();
  state.currentLocationId = "black_market"; // open: 23, close: 6
  state.clock.totalMinutes = 23 * 60 + 30; // 11:30pm - open
  assert.equal(isLocationOpen(state), true);
  state.clock.totalMinutes = 2 * 60; // 2am - open (wrapped)
  assert.equal(isLocationOpen(state), true);
  state.clock.totalMinutes = 10 * 60; // 10am - closed
  assert.equal(isLocationOpen(state), false);
});

test("isLocationOpen() is always true when a location has no openHours", () => {
  const state = createInitialState();
  state.currentLocationId = "town_square";
  assert.equal(isLocationOpen(state), true);
});

test("addItem()/removeItem() manage inventory quantities, deleting at zero", () => {
  const state = createInitialState();
  addItem(state, "wood", 3);
  assert.equal(state.inventory.wood, 3);
  removeItem(state, "wood", 1);
  assert.equal(state.inventory.wood, 2);
  removeItem(state, "wood", 2);
  assert.equal("wood" in state.inventory, false);
});

test("addItem() returns true and succeeds while stacking an already-held item, even at the slot cap", () => {
  const state = createInitialState();
  state.inventory.wood = 1; // pre-existing slot, no belt equipped (baseline cap 100)
  assert.equal(addItem(state, "wood", 5), true);
  assert.equal(state.inventory.wood, 6);
});

test("addItem() blocks a brand-new item id once the backpack slot cap is reached", () => {
  const state = createInitialState();
  // No belt equipped -> baseline backpack cap is 100 - fill it exactly with
  // real, distinct, non-tool/non-potion item ids (backpackSlotsUsed only
  // counts ids that actually resolve through ALL_ITEMS).
  const fillerIds = Object.entries(ALL_ITEMS)
    .filter(([id, item]) => id !== "wood" && item.type !== "tool" && item.type !== "potion")
    .slice(0, 100)
    .map(([id]) => id);
  assert.equal(fillerIds.length, 100, "expected at least 100 non-tool/non-potion items in the catalog");
  for (const id of fillerIds) state.inventory[id] = 1;

  assert.equal(addItem(state, "wood", 1), false, "backpack is full - new item should be rejected");
  assert.equal("wood" in state.inventory, false);

  assert.equal(addItem(state, fillerIds[0], 1), true, "stacking an existing item never costs a slot");
  assert.equal(state.inventory[fillerIds[0]], 2);
});

test("addItem() gates potions against their own separate cap, not the general backpack cap", () => {
  const state = createInitialState();
  // Baseline potion cap is 5 - fill it with 5 distinct potions.
  const potions = ["healing_potion", "mana_potion", "attack_potion", "strength_potion", "defense_potion"];
  for (const id of potions) assert.equal(addItem(state, id, 1), true);

  assert.equal(addItem(state, "poison_potion", 1), false, "potion pouch is full");
  assert.equal("poison_potion" in state.inventory, false);
  // General backpack items are unaffected by the full potion pouch.
  assert.equal(addItem(state, "wood", 1), true);
});

test("addItem() never counts tools against either cap", () => {
  const state = createInitialState();
  assert.equal(addItem(state, "hammer", 1), true);
  assert.equal(addItem(state, "pickaxe", 1), true);
  assert.equal(backpackSlotsUsed(state), 0, "tools are excluded from the backpack slot count");
});

test("finalizeCharacter() merges race + starter pack items/gold and sets proficient skills to level 5", () => {
  const state = createInitialState();
  const draft = {
    name: "  Tester  ",
    difficultyId: "normal",
    starterPackId: "deep_pockets",
    raceId: "human", // skillPro: mining, barter; starters: gold 500, hammer 1
    classId: "warrior", // skillPro: fighting, defense
    proficientSkillIds: ["cooking"],
  };

  finalizeCharacter(state, draft);

  assert.equal(state.name, "Tester");
  assert.equal(walletTotal(state), 5500); // 500 (human) + 5000 (deep_pockets)
  assert.equal(state.inventory.hammer, 1);
  // STARTER_ITEMS (player_backbone.js) - granted to every character regardless
  // of race/class, and worn from the start: createInitialState() seeds the
  // weapon and belt slots from the same lists, so they're both in the inventory
  // and on the character.
  assert.equal(state.inventory.leather_belt, 1);
  assert.equal(state.inventory.wooden_dagger, 1);
  assert.equal(state.equipment.belt, "leather_belt");
  assert.equal(state.equipment.weapon, "wooden_dagger");
  assert.equal(state.characterDraft, null);

  for (const skillId of ["mining", "barter", "fighting", "defense", "cooking"]) {
    assert.equal(state.skills[skillId].level, 5, `${skillId} should be level 5`);
    assert.equal(state.skills[skillId].proficient, true, `${skillId} should be proficient`);
  }
  assert.equal(state.skills.fishing.level, 1); // untouched skill stays at default
});
