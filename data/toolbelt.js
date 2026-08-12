// data/toolbelt.js - what you can carry, and where it goes.
//
// Three containers, and they measure different things:
//
//   toolbelt  - WEIGHT. Scrap, tools, bait and hooks (item_backbone.js's
//               `storeIn: "toolbelt"`). Budget comes from the belt you wear.
//   backpack  - WEIGHT. Everything else. Budget is the better of the belt's own
//               storage number and a worn backpack's capacity.
//   potions   - SLOTS, still. A potion costs one pouch slot and no weight in
//               either container, which is why it's keyed off type here rather
//               than off `storeIn`.
//
// This used to count distinct item ids for both containers, so 5000 logs cost
// exactly what one log did, and tools were free because nothing had a budget to
// charge them against.
import { ALL_ITEMS, weightOf, storeInOf } from "../item_backbone.js";
import { effectiveSkillLevel } from "../state/gameState.js";

// Baseline with no belt at all - matches leather_belt's own numbers, so any
// belt (even the starter one) is a strict upgrade, never a downgrade, once
// actually worn. The toolbelt baseline is deliberately lower than any real
// belt: with nothing round your waist you're carrying tools in your hands.
const NO_BELT_BASELINE = { backpack: 100, potions: 5, toolbelt: 8 };

// Your own back counts for something. Strength reads the EFFECTIVE level, so a
// Strength Charm or a blessing lifts your capacity too - the same seam every
// other gate and scaling factor uses.
const WEIGHT_PER_STRENGTH = 2;

function equippedBelt(state) {
  return state.equipment.belt ? ALL_ITEMS[state.equipment.belt]?.belt : null;
}

function equippedBackpack(state) {
  return state.equipment.backpack ? ALL_ITEMS[state.equipment.backpack]?.backpack : null;
}

function strengthBonus(state) {
  return effectiveSkillLevel(state, "strength") * WEIGHT_PER_STRENGTH;
}

export function hasBeltEquipped(state) {
  return equippedBelt(state) != null;
}

// On-the-belt resources: unusable at all without one equipped. These are plain
// counters in state.toolbelt rather than inventory items, and they deliberately
// sit OUTSIDE the weight system - a full water bottle costs no toolbelt budget.
export function slingshotAmmoCap(state) {
  return equippedBelt(state)?.slingAmmo ?? 0;
}

export function waterBottleCap(state) {
  return hasBeltEquipped(state) ? 100 : 0;
}

export function quiverCap(state) {
  return hasBeltEquipped(state) ? Infinity : 0;
}

// --- weight budgets ---------------------------------------------------------

// The larger of belt and backpack, not the sum. They're two answers to one
// question - "how much can you carry" - so adding them would make a leather
// belt worth +100 on top of God's Back, and would mean taking a belt off to
// free up room was never a trade.
export function backpackWeightCap(state) {
  const gear = Math.max(
    equippedBelt(state)?.backpack ?? NO_BELT_BASELINE.backpack,
    equippedBackpack(state)?.capacity ?? 0
  );
  return gear + strengthBonus(state);
}

export function toolbeltWeightCap(state) {
  return (equippedBelt(state)?.toolbelt ?? NO_BELT_BASELINE.toolbelt) + strengthBonus(state);
}

// Rounded to 2dp on the way out: weights go down to 0.01, and summing floats
// gives you 12.000000000000002 to show a player.
function weightUsed(state, container) {
  let total = 0;
  for (const [itemId, qty] of Object.entries(state.inventory)) {
    if (qty <= 0) continue;
    if (ALL_ITEMS[itemId]?.type === "potion") continue; // pouch, not weight
    if (storeInOf(itemId) !== container) continue;
    total += weightOf(itemId) * qty;
  }
  return Math.round(total * 100) / 100;
}

export function backpackWeightUsed(state) {
  return weightUsed(state, "backpack");
}

export function toolbeltWeightUsed(state) {
  return weightUsed(state, "toolbelt");
}

// How much more of `itemId` will fit, in that item's own container. Returns
// Infinity for a potion, whose limit is slots - see potionSlotsFree().
export function weightRoomFor(state, itemId) {
  if (ALL_ITEMS[itemId]?.type === "potion") return Infinity;
  const container = storeInOf(itemId);
  return container === "toolbelt"
    ? toolbeltWeightCap(state) - toolbeltWeightUsed(state)
    : backpackWeightCap(state) - backpackWeightUsed(state);
}

// --- the potion pouch (still slots) -----------------------------------------

export function potionSlotCap(state) {
  return equippedBelt(state)?.potions ?? NO_BELT_BASELINE.potions;
}

export function potionSlotsUsed(state) {
  return Object.keys(state.inventory).filter((id) => ALL_ITEMS[id]?.type === "potion").length;
}

// Stacking more of a potion you already carry costs nothing - only a new id
// takes a slot, which is how the pouch has always worked.
export function potionSlotsFree(state, itemId) {
  if (itemId in state.inventory) return Infinity;
  return potionSlotCap(state) - potionSlotsUsed(state);
}

// --- how full are you -------------------------------------------------------

// The fuller of the two weighed containers, 0..1+. Drives data/flavor.js's
// packLine and anything else that wants one number for "how loaded am I".
export function loadFraction(state) {
  const backpack = backpackWeightCap(state);
  const toolbelt = toolbeltWeightCap(state);
  return Math.max(
    backpack > 0 ? backpackWeightUsed(state) / backpack : 0,
    toolbelt > 0 ? toolbeltWeightUsed(state) / toolbelt : 0
  );
}
