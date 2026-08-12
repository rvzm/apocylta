// data/toolbelt.js - belt-derived capacity for the Toolbelt and Backpack.
import { ALL_ITEMS } from "../item_backbone.js";

// Baseline when no belt is equipped at all - matches leather_belt's own
// numbers, so any belt (even the starter one) is a strict upgrade, never a
// downgrade, once actually worn.
const NO_BELT_BASELINE = { backpack: 100, potions: 5 };

function equippedBelt(state) {
  return state.equipment.belt ? ALL_ITEMS[state.equipment.belt]?.belt : null;
}

export function hasBeltEquipped(state) {
  return equippedBelt(state) != null;
}

// On-the-belt resources: unusable at all without one equipped. Only
// slingshot ammo scales by belt tier when worn - water bottle and quiver
// just switch on/off.
export function slingshotAmmoCap(state) {
  return equippedBelt(state)?.slingAmmo ?? 0;
}

export function waterBottleCap(state) {
  return hasBeltEquipped(state) ? 100 : 0;
}

export function quiverCap(state) {
  return hasBeltEquipped(state) ? Infinity : 0;
}

function equippedBackpack(state) {
  return state.equipment.backpack ? ALL_ITEMS[state.equipment.backpack]?.backpack : null;
}

// General storage: always has a baseline, and both a belt and a worn backpack
// (BACKPACKS in item_backbone.js) can raise it.
//
// The larger of the two wins rather than the sum. They're two ways of answering
// the same question - "how much can you carry" - so adding them would make a
// leather belt worth +100 slots on top of God's Back, and would mean taking a
// belt off to make room was never a trade. Max keeps every piece of gear a
// strict upgrade and keeps a character with no backpack behaving exactly as
// they did before the ladder existed.
export function backpackSlotCap(state) {
  return Math.max(
    equippedBelt(state)?.backpack ?? NO_BELT_BASELINE.backpack,
    equippedBackpack(state)?.capacity ?? 0
  );
}

export function potionSlotCap(state) {
  return equippedBelt(state)?.potions ?? NO_BELT_BASELINE.potions;
}

function slotsUsed(state, predicate) {
  return Object.keys(state.inventory).filter((id) => predicate(ALL_ITEMS[id])).length;
}

// Tools live in the Toolbelt screen, not the backpack, so they don't count
// against either cap; potions get their own separate pouch-style cap rather
// than competing with general backpack slots.
export function backpackSlotsUsed(state) {
  return slotsUsed(state, (item) => item && item.type !== "tool" && item.type !== "potion");
}

export function potionSlotsUsed(state) {
  return slotsUsed(state, (item) => item?.type === "potion");
}
