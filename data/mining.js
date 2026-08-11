// apocylta world data - mining
// Ore selection + skill/tool gating for the cave_mines "mine" hub feature.

import { ALL_ITEMS, getMineLockByName, isMineableAtTier } from "../item_backbone.js";
import { SKILL_BLOCKS } from "../skill_backbone.js";
import { getMineType } from "./locations.js";
import { rollLootByType } from "./actions.js";
import { effectiveSkillLevel } from "../state/gameState.js";

// Not ores you pick - incidental finds, handled by rollMineBonuses() below.
// Filtered by subtype rather than by "has no required level", which reads as
// equivalent but isn't: a true ore missing a SKILL_BLOCKS entry is an
// unfinished ore, not a bonus drop.
const BONUS_SUBTYPES = ["fuel", "gemstone"];

// Per loot roll (every 3s while mining), independent of the ore roll and of
// each other. Gems were ~16% before this existed, purely as a side effect of
// rarity weighting in a shared pool.
const FUEL_BONUS_CHANCE = 0.25;
const GEMSTONE_BONUS_CHANCE = 0.08; // ~1 gem per 40s of mining

// All ore items (ALL_ITEMS entries of type "mining"), sorted by their
// SKILL_BLOCKS-required mining level - drives the mine selector's rows.
// Derived from ALL_ITEMS rather than a hardcoded id list so a new ore item
// just needs a SKILL_BLOCKS.mining.ores entry to show up here.
//
// `locationId` narrows the list to what the local mine's MINE_LOCK tier
// unlocks. Omitting it means no gate at all - the tier only means anything
// inside a mine, and callers that just want the catalog shouldn't have to
// invent a location to get it.
export function mineableOres(locationId = null) {
  const lock = getMineLockByName(getMineType(locationId));

  return Object.entries(ALL_ITEMS)
    .filter(
      ([id, item]) =>
        item.type === "mining" &&
        !BONUS_SUBTYPES.includes(item.subtype) &&
        (!lock || isMineableAtTier(lock.tier, id, item.subtype))
    )
    .map(([id, item]) => ({ id, item, requiredLevel: SKILL_BLOCKS.mining.ores[item.subtype] ?? null }))
    .sort((a, b) => (a.requiredLevel ?? Infinity) - (b.requiredLevel ?? Infinity));
}

// Which coal/gem ids this mine's tier permits. The same cumulative rule the
// selector uses - a mid_tier mine yields basic's gems as well as its own -
// applied to the drop, which it never was: rollLootByType matches on subtype,
// and every gemstone shares the subtype "gemstone", so passing it straight
// through let a tier-1 mine turn up a legendary diamond.
function bonusPool(lock, subtype) {
  return Object.keys(ALL_ITEMS).filter((id) => {
    const item = ALL_ITEMS[id];
    return item.type === "mining" && item.subtype === subtype && isMineableAtTier(lock.tier, id, subtype);
  });
}

// The extras that turn up while mining, on top of whatever ore was selected.
// Returns 0-2 { itemId, qty }. Outside a mine there's no tier and so no
// bonuses at all. rng is injectable because state/gameLoop.js's loot block has
// no unit coverage - keeping the rolling here is what makes it testable.
export function rollMineBonuses(state, rng = Math.random) {
  const lock = getMineLockByName(getMineType(state.currentLocationId));
  if (!lock) return [];

  const bonuses = [];
  for (const [chance, subtype] of [
    [FUEL_BONUS_CHANCE, "fuel"],
    [GEMSTONE_BONUS_CHANCE, "gemstone"],
  ]) {
    if (rng() >= chance) continue;
    const loot = rollLootByType("mining", subtype, undefined, rng, bonusPool(lock, subtype));
    if (loot) bonuses.push(loot);
  }
  return bonuses;
}

// An equipped tool missing from SKILL_BLOCKS.mining.tools (e.g. the plain
// untiered starter "pickaxe") defaults to tier 1, same convention
// data/stations.js's rarityLevel() uses for items missing from a level map.
function equippedToolTier(state) {
  const toolId = state.equipment.tool;
  if (!toolId) return null;
  return SKILL_BLOCKS.mining.tools[toolId] ?? 1;
}

// Player needs mining skill >= the ore's required level, AND an equipped
// pickaxe whose own tier is >= that same level - a copper pickaxe can't
// break mithril ore no matter how high the player's mining level is.
export function canMineOre(state, oreId) {
  const item = ALL_ITEMS[oreId];
  const requiredLevel = item ? SKILL_BLOCKS.mining.ores[item.subtype] : null;
  if (requiredLevel == null) return { ok: false, reason: "That can't be mined." };

  if (effectiveSkillLevel(state, "mining") < requiredLevel) {
    return { ok: false, reason: `Requires mining level ${requiredLevel}.` };
  }

  const toolTier = equippedToolTier(state);
  if (toolTier == null || toolTier < requiredLevel) {
    return { ok: false, reason: "You need a better pickaxe equipped to mine that." };
  }

  return { ok: true };
}
