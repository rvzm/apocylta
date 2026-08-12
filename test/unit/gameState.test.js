import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, formatClock, isLocationOpen, addItem, removeItem, finalizeCharacter, walletTotal } from "../../state/gameState.js";
import { backpackWeightCap, backpackWeightUsed, toolbeltWeightCap } from "../../data/toolbelt.js";
import { weightOf } from "../../item_backbone.js";
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

// addItem() takes what fits and returns HOW MUCH, not a boolean - a pack with
// room for two of the three ore you just mined gives you two rather than
// voiding the haul. Under weight, every add is checked: stacking more of
// something you already carry costs exactly what the first one did.

test("addItem() returns the amount actually taken", () => {
  const state = createInitialState();
  assert.equal(addItem(state, "wood", 5), 5);
  assert.equal(state.inventory.wood, 5);
});

test("addItem() fills to the brim and reports the shortfall, rather than refusing outright", () => {
  const state = createInitialState();
  const each = weightOf("iron_ore");
  const fits = Math.floor(backpackWeightCap(state) / each);

  assert.equal(addItem(state, "iron_ore", fits - 2), fits - 2, "well within the pack");
  // Ask for five more when only two will fit.
  assert.equal(addItem(state, "iron_ore", 5), 2, "takes what fits");
  assert.equal(state.inventory.iron_ore, fits);
  assert.equal(addItem(state, "iron_ore", 1), 0, "and nothing at all once full");
});

test("addItem() charges every add, not just the one that opens a new id", () => {
  const state = createInitialState();
  const before = backpackWeightUsed(state);
  addItem(state, "iron_ore", 1);
  const afterFirst = backpackWeightUsed(state);
  addItem(state, "iron_ore", 1);

  assert.ok(afterFirst > before, "the first one costs");
  assert.equal(backpackWeightUsed(state) - afterFirst, afterFirst - before, "and so does the second");
});

test("addItem() spends the toolbelt's budget for belt-stored items, leaving the pack alone", () => {
  const state = createInitialState();
  const fits = Math.floor(toolbeltWeightCap(state) / weightOf("scrap_metal"));

  assert.equal(addItem(state, "scrap_metal", fits + 10), fits, "capped by the belt, not the pack");
  assert.equal(backpackWeightUsed(state), 0, "and the pack is untouched");
  assert.equal(addItem(state, "iron_ore", 1), 1, "which still has all its own room");
});

test("addItem() gates potions on pouch slots, not weight", () => {
  const state = createInitialState();
  // Baseline potion cap is 5 - fill it with 5 distinct potions.
  const potions = ["healing_potion", "mana_potion", "attack_potion", "strength_potion", "defense_potion"];
  for (const id of potions) assert.equal(addItem(state, id, 1), 1);

  assert.equal(addItem(state, "poison_potion", 1), 0, "potion pouch is full");
  assert.equal("poison_potion" in state.inventory, false);
  assert.equal(addItem(state, "healing_potion", 99), 99, "but topping up an existing one is free");
  assert.equal(addItem(state, "wood", 1), 1, "and general storage is unaffected");
});

// Godmode already skips every cost in removeItem(); a badge that says the rules
// don't apply shouldn't leave you rummaging for space.
test("addItem() ignores capacity entirely in godmode", () => {
  const state = createInitialState();
  const fits = Math.floor(backpackWeightCap(state) / weightOf("iron_ore"));
  assert.equal(addItem(state, "iron_ore", fits + 500), fits, "mortals are capped");

  const god = createInitialState();
  god.godmode = true;
  assert.equal(addItem(god, "iron_ore", fits + 500), fits + 500);
});

// A save written before weight existed can sit over its new budget. It must
// load and behave, simply accepting nothing more until it's back under.
test("addItem() copes with an already-overloaded inventory", () => {
  const state = createInitialState();
  state.inventory.iron_ore = 10_000; // far past any cap

  assert.ok(backpackWeightUsed(state) > backpackWeightCap(state));
  assert.equal(addItem(state, "iron_ore", 1), 0);
  assert.equal(addItem(state, "wood", 1), 0);
  assert.equal(state.inventory.iron_ore, 10_000, "and nothing already carried is lost");
});

test("hauling a heavy load trains strength", () => {
  const state = createInitialState();
  assert.equal(state.skills.strength.xp, 0, "strength has no other source in this test");

  // A light pickup teaches nothing.
  addItem(state, "iron_ore", 1);
  assert.equal(state.skills.strength.xp, 0);

  // Loading up past HEAVY_LOAD_FRACTION does.
  addItem(state, "iron_ore", Math.floor(backpackWeightCap(state) / weightOf("iron_ore")));
  assert.ok(state.skills.strength.xp > 0, "carrying a real load is how strength trains");
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
