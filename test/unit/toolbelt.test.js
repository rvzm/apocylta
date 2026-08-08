import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasBeltEquipped,
  slingshotAmmoCap,
  waterBottleCap,
  quiverCap,
  backpackSlotCap,
  potionSlotCap,
  backpackSlotsUsed,
  potionSlotsUsed,
} from "../../data/toolbelt.js";
import { createInitialState } from "../../state/gameState.js";

test("with no belt equipped: on-the-belt resources are fully gated, general storage uses the baseline", () => {
  const state = createInitialState();
  assert.equal(hasBeltEquipped(state), false);
  assert.equal(slingshotAmmoCap(state), 0);
  assert.equal(waterBottleCap(state), 0);
  assert.equal(quiverCap(state), 0);
  assert.equal(backpackSlotCap(state), 100);
  assert.equal(potionSlotCap(state), 5);
});

test("with a belt equipped: caps come from the belt's own tier, quiver becomes uncapped", () => {
  const state = createInitialState();
  state.equipment.belt = "plate_belt"; // { slingAmmo: 20, potions: 15, backpack: 200 }
  assert.equal(hasBeltEquipped(state), true);
  assert.equal(slingshotAmmoCap(state), 20);
  assert.equal(waterBottleCap(state), 100);
  assert.equal(quiverCap(state), Infinity);
  assert.equal(backpackSlotCap(state), 200);
  assert.equal(potionSlotCap(state), 15);
});

test("higher-tier belts grant strictly more capacity than the baseline", () => {
  const state = createInitialState();
  state.equipment.belt = "mythic_belt"; // { slingAmmo: 30, potions: 20, backpack: 300 }
  assert.ok(backpackSlotCap(state) > 100);
  assert.ok(potionSlotCap(state) > 5);
});

test("backpackSlotsUsed()/potionSlotsUsed() count distinct item ids, excluding tools", () => {
  const state = createInitialState();
  state.inventory = { wood: 5, iron_ore: 2, hammer: 1, healing_potion: 3, mana_potion: 1 };
  assert.equal(backpackSlotsUsed(state), 2); // wood, iron_ore - hammer (tool) and potions excluded
  assert.equal(potionSlotsUsed(state), 2); // healing_potion, mana_potion
});
