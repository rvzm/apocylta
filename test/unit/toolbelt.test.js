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
import { ALL_ITEMS, BACKPACKS, equipSlotOf } from "../../item_backbone.js";

test("with no belt equipped: on-the-belt resources are fully gated, general storage uses the baseline", () => {
  const state = createInitialState();
  // The starter belt is worn from the start, so the ungirded case is reached by
  // taking it off - which is still reachable in play, via the Toolbelt screen.
  state.equipment.belt = null;
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

// ----- Backpacks -----
//
// BACKPACKS is a second capacity ladder worn in its own `backpack` armor slot,
// alongside the belt rather than instead of it.

test("backpackSlotCap(): a worn backpack raises general storage above the belt's number", () => {
  const state = createInitialState();
  const beltOnly = backpackSlotCap(state);

  state.equipment.backpack = "large_backpack"; // capacity 300
  assert.equal(backpackSlotCap(state), 300);
  assert.ok(300 > beltOnly, "and it is an upgrade on what the belt alone gave");
});

// Max, not sum: they answer the same question, so adding them would make a
// leather belt worth +100 slots on top of God's Back and make taking a belt off
// to make room a real (and absurd) trade.
test("backpackSlotCap(): belt and backpack take the larger, never the sum", () => {
  const state = createInitialState();
  state.equipment.belt = "apocyltas_eye"; // backpack 500
  state.equipment.backpack = "starter_backpack"; // capacity 100
  assert.equal(backpackSlotCap(state), 500, "the better belt wins");

  state.equipment.backpack = "gods back"; // capacity 2000
  assert.equal(backpackSlotCap(state), 2000, "the better backpack wins");
});

test("backpackSlotCap(): no backpack behaves exactly as it did before the ladder existed", () => {
  const bare = createInitialState();
  const withSlot = createInitialState();
  withSlot.equipment.backpack = null;
  assert.equal(backpackSlotCap(withSlot), backpackSlotCap(bare));
});

test("every backpack resolves through ALL_ITEMS and equips into the backpack slot", () => {
  for (const id of Object.keys(BACKPACKS).filter((key) => key !== "global")) {
    assert.ok(ALL_ITEMS[id], `${id} missing from ALL_ITEMS`);
    assert.equal(equipSlotOf(id), "backpack", `${id} does not equip into the backpack slot`);
  }
});
