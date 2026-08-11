// apocylta world data - fishing
// Species selection + skill/tool/gear gating for the "fish" action, mirroring
// data/mining.js: the location decides what's present, the player's skill and
// kit decide what they can actually take.

import { ALL_ITEMS, FISH, FISHING_CATALOG, FISHING_SUBTYPES, catchItemsFor } from "../item_backbone.js";
import { SKILL_BLOCKS } from "../skill_backbone.js";
import { getWaterType } from "./locations.js";
import { removeItem, effectiveSkillLevel } from "../state/gameState.js";

// The gear a `caught` method needs in the backpack, and what to call it when
// refusing. "rod" isn't here: the rod is equipped, not carried, so it's checked
// against the tool slot instead.
const CATCH_GEAR = {
  bait: { fishingType: "bait", label: "bait" },
  net: { fishingType: "net", label: "fishing net" },
  hook: { fishingType: "hook", label: "fishing hook" },
};

function requiredLevelFor(fish) {
  return SKILL_BLOCKS.fishing.catches[fish?.difficulty] ?? null;
}

// Every species this location's water holds, sorted by the fishing level it
// needs - drives the fish selector's rows.
//
// `water: true` on a species means both waters: it shows up wherever there's
// water at all, freshwater or salt.
//
// Omitting `locationId` applies no gate, the same carve-out mineableOres()
// documents - the water type only means anything while standing at one, and a
// caller that just wants the catalog shouldn't have to invent a location.
export function catchableFish(locationId = null) {
  const water = locationId === null ? null : getWaterType(locationId);
  if (locationId !== null && !water) return [];

  return Object.entries(FISH)
    .filter(([, fish]) => !water || fish.water === true || fish.water === water)
    .map(([id, fish]) => ({ id, fish, itemIds: catchItemsFor(id), requiredLevel: requiredLevelFor(fish) }))
    // A species whose catch items were never added yields nothing to put in the
    // backpack, so it's not offered rather than starting an action that can
    // never produce anything.
    .filter(({ itemIds }) => itemIds.length > 0)
    .sort((a, b) => (a.requiredLevel ?? Infinity) - (b.requiredLevel ?? Infinity));
}

// An equipped rod missing from SKILL_BLOCKS.fishing.tools defaults to tier 1 -
// the same convention data/mining.js's equippedToolTier() uses for the untiered
// starter pickaxe. Anything else in the tool slot (a pickaxe, an axe) is not a
// rod and can't fish at all, hence null rather than 1.
//
// Matched on the canonical subtype so both ladders count: the metal rods in
// ITEMS and the basic->godlike rods in FISHING_ITEMS all carry "fishing rod".
export function equippedRodTier(state) {
  const toolId = state.equipment.tool;
  if (!toolId || ALL_ITEMS[toolId]?.subtype !== "fishing rod") return null;
  return SKILL_BLOCKS.fishing.tools[toolId] ?? 1;
}

// The best bait/net/hook in the backpack for a catch method, or null. "Best" is
// the FISHING_SUBTYPES tier order, so a mixed stack spends the cheapest bait
// last rather than whichever the inventory happens to list first.
export function fishingGearFor(state, method) {
  const gear = CATCH_GEAR[method];
  if (!gear) return null;
  const tiers = FISHING_SUBTYPES[gear.fishingType] ?? [];
  return (
    Object.keys(state.inventory)
      .filter((id) => state.inventory[id] > 0 && FISHING_CATALOG[id]?.fishingType === gear.fishingType)
      .sort((a, b) => tiers.indexOf(FISHING_CATALOG[b].fishingTier) - tiers.indexOf(FISHING_CATALOG[a].fishingTier))[0] ?? null
  );
}

// Player needs fishing skill >= the species' required level, AND an equipped rod
// whose own tier reaches that level, AND - for anything not caught on the rod
// alone - the bait/net/hook in the backpack. Refusals are ordered cheapest-fix
// last, the same way canMineOre() reports skill before tool.
export function canCatchFish(state, speciesId) {
  const fish = FISH[speciesId];
  const requiredLevel = requiredLevelFor(fish);
  if (!fish || requiredLevel == null || catchItemsFor(speciesId).length === 0) {
    return { ok: false, reason: "That can't be caught." };
  }

  if (effectiveSkillLevel(state, "fishing") < requiredLevel) {
    return { ok: false, reason: `Requires fishing level ${requiredLevel}.` };
  }

  const rodTier = equippedRodTier(state);
  if (rodTier == null || rodTier < requiredLevel) {
    return { ok: false, reason: "You need a better fishing rod equipped to catch that." };
  }

  const gear = CATCH_GEAR[fish.caught];
  if (gear && !fishingGearFor(state, fish.caught)) {
    return { ok: false, reason: `You need ${gear.label} in your backpack to catch that.` };
  }

  return { ok: true };
}

// Bait is spent per catch; nets and hooks are reused. Returns false when a bait
// species has nothing left to bait with, which is what ends the run.
//
// removeItem is called WITHOUT { force } on purpose: bait is a cost, so godmode
// and adminInfinite make it free - the same rule useItem() and spendIngredients()
// follow, as against equip/drop/sell which do force.
export function spendBait(state, speciesId) {
  if (FISH[speciesId]?.caught !== "bait") return true;
  const baitId = fishingGearFor(state, "bait");
  if (!baitId) return false;
  removeItem(state, baitId, 1);
  return true;
}
