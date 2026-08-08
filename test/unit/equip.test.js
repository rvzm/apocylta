import { test } from "node:test";
import assert from "node:assert/strict";
import { equipSlotOf } from "../../item_backbone.js";
import { createInitialState, equipItem } from "../../state/gameState.js";

test("equipSlotOf() resolves weapon items to the weapon slot", () => {
  assert.equal(equipSlotOf("iron_sword"), "weapon");
});

test("equipSlotOf() resolves slingshot weapons to their own dedicated slot, not weapon", () => {
  assert.equal(equipSlotOf("wooden_slingshot"), "slingshot");
});

test("equipSlotOf() resolves tool items to the tool slot", () => {
  assert.equal(equipSlotOf("pickaxe"), "tool");
  assert.equal(equipSlotOf("iron_pickaxe"), "tool");
});

test("equipSlotOf() resolves armor items to their armor slot", () => {
  assert.equal(equipSlotOf("leather_pants"), "legs");
});

// Regression test for ALL_ITEMS' global-tag inheritance: TOOLBELTS entries
// only declare `type`/`slot` on their `global` tag, not per-entry, unlike
// every other catalog - equipSlotOf() previously returned null for every
// belt because ALL_ITEMS was a naive flat spread with no global inheritance.
test("equipSlotOf() resolves belt items (TOOLBELTS) to the belt slot", () => {
  assert.equal(equipSlotOf("leather_belt"), "belt");
  assert.equal(equipSlotOf("mythic_belt"), "belt");
});

test("equipSlotOf() returns null for unequippable or unknown items", () => {
  assert.equal(equipSlotOf("tin_ore"), null);
  assert.equal(equipSlotOf("not_a_real_item"), null);
});

test("equipItem() equips into the given slot and returns null when nothing was equipped before", () => {
  const state = createInitialState();
  state.inventory.wooden_slingshot = 1;
  const previous = equipItem(state, "wooden_slingshot", "slingshot");
  assert.equal(previous, null);
  assert.equal(state.equipment.slingshot, "wooden_slingshot");
  assert.equal("wooden_slingshot" in state.inventory, false);
});

test("equipItem() swaps out the previously-equipped item back into inventory", () => {
  const state = createInitialState();
  state.inventory.wooden_slingshot = 1;
  state.inventory.copper_slingshot = 1;
  equipItem(state, "wooden_slingshot", "slingshot");

  const previous = equipItem(state, "copper_slingshot", "slingshot");
  assert.equal(previous, "wooden_slingshot");
  assert.equal(state.equipment.slingshot, "copper_slingshot");
  assert.equal(state.inventory.wooden_slingshot, 1); // returned to backpack
  assert.equal("copper_slingshot" in state.inventory, false);
});
