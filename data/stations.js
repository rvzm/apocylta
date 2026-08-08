// apocylta world data - crafting stations
// Maps a station id to its recipe collection + skill, derived directly from
// each recipe collection's own `global` entry in item_backbone.js - adding a
// new collection there needs no changes here.

import {
  ALL_ITEMS,
  SHOP_RARITY_DISPLAY,
  STATIONS,
  SMITHING_RECIPES,
  CRAFTING_RECIPES,
  COOKING_RECIPES,
  POTION_RECIPES,
  METALURGY,
  WEAPON_TYPES,
  ARMOR_TYPES,
  TOOL_CATAGORIES,
  FOOD_SUBTYPES,
  POTION_CATAGORIES,
} from "../item_backbone.js";
import { removeItem } from "../state/gameState.js";
import { hasBeltEquipped } from "./toolbelt.js";

const COLLECTIONS = [SMITHING_RECIPES, CRAFTING_RECIPES, COOKING_RECIPES, POTION_RECIPES];

// Every other location's available stations come straight from its static
// hubFeatures list. playerhome is the one exception: stations there are
// whatever the player has personally bought (state.ownedStations), since
// they get built at your house rather than being fixed location content.
export function stationIdsAtLocation(state, location) {
  const staticIds = location.hubFeatures.filter((id) => STATIONS[id]);
  if (location.id !== "playerhome") return staticIds;
  return [...new Set([...staticIds, ...state.ownedStations])];
}

// global.station is a bare id for single-station collections (forge,
// alchemy_table) but an array for collections shared across stations
// (crafting_table/anvil both draw from CRAFTING_RECIPES, cooking_station/
// campfire both draw from COOKING_RECIPES) - register the same recipes
// object under every id in either case rather than keying by the array
// itself (which previously coerced to one bogus combined-string key that
// never matched any real station id).
export const STATION_RECIPES = {};
for (const collection of COLLECTIONS) {
  const { station, skill } = collection.global;
  const recipes = { ...collection };
  delete recipes.global;
  for (const id of Array.isArray(station) ? station : [station]) {
    STATION_RECIPES[id] = { skill, recipes };
  }
}

export function getStationRecipes(stationId) {
  return STATION_RECIPES[stationId];
}

// recipe.result is usually a bare item id (qty 1), but a few recipes yield
// a batch via an { itemId: qty } map instead - normalize to the map shape.
export function normalizeResult(result) {
  return typeof result === "string" ? { [result]: 1 } : result;
}

export function primaryResultId(recipe) {
  return Object.keys(normalizeResult(recipe.result))[0];
}

// What tab a recipe belongs in - the item type of its (primary) result.
export function recipeTypeOf(recipe) {
  return ALL_ITEMS[primaryResultId(recipe)]?.type ?? null;
}

// Metal names, longest first so "black_cobalt"/"black_steel" aren't
// shadowed by "cobalt"/"steel" when matched as an id prefix below.
const METAL_MATCH_ORDER = Object.keys(METALURGY).sort((a, b) => b.length - a.length);

function metalOf(itemId) {
  return METAL_MATCH_ORDER.find((metal) => itemId === metal || itemId.startsWith(`${metal}_`));
}

// The in-tab sort/group key for a recipe. Smithing results (bars) get their
// metal derived from the item id itself rather than trusting the item's own
// `subtype` - bar items are inconsistent there (tin_bar.subtype === "tin",
// but bronze_bar/steel_bar.subtype === "alloy", which would wrongly lump
// every alloy bar into one bucket instead of its own metal). Every other
// type's `subtype` is already the right axis: armor's subtype is the metal
// name, weapon's/tool's subtype is the weapon/tool category, food's/potion's
// subtype matches FOOD_SUBTYPES/POTION_CATAGORIES.
export function recipeGroupOf(recipe) {
  const resultId = primaryResultId(recipe);
  const item = ALL_ITEMS[resultId];
  if (!item) return null;
  if (item.type === "smithing") return metalOf(resultId) ?? item.subtype ?? null;
  return item.subtype ?? null;
}

const CATEGORY_ORDER = {
  smithing: Object.keys(METALURGY),
  weapon: WEAPON_TYPES,
  armor: ARMOR_TYPES,
  tool: TOOL_CATAGORIES,
  food: FOOD_SUBTYPES,
  potion: POTION_CATAGORIES,
};

// The declared ordering to sort a tab's group headers by, or null to signal
// "no declared order - sort alphabetically" (covers the mixed-type "All"
// tab and any future recipe type with no matching catalog above).
export function groupOrderFor(type) {
  return CATEGORY_ORDER[type] ?? null;
}

export const RECIPE_TAB_LABELS = {
  smithing: "Bars",
  weapon: "Weapons",
  armor: "Armor",
  tool: "Tools",
  food: "Food",
  potion: "Potions",
  crafting: "Crafting",
};

const BASE_XP_PER_CRAFT = 2;

function rarityLevel(itemId) {
  return SHOP_RARITY_DISPLAY[ALL_ITEMS[itemId]?.rarity]?.level ?? 1;
}

// Same multiplicative-by-rarity-level shape as data/shops.js's getBarterXp,
// applied per unit of output produced.
export function getCraftXp(itemId, qty) {
  return BASE_XP_PER_CRAFT * rarityLevel(itemId) * qty;
}

// "water" is a recipe-only ingredient id with no backing inventory item -
// it's checked/spent against state.toolbelt.waterBottle instead, and only
// usable at all with a belt equipped (the water bottle lives on the belt).
// Exported so "have/need" displays (ui/screens/spellbook.js's learn costs)
// read the same number hasIngredients() checks against, water included.
export function ingredientCount(state, id) {
  if (id !== "water") return state.inventory[id] || 0;
  return hasBeltEquipped(state) ? state.toolbelt.waterBottle : 0;
}

export function hasIngredients(state, ingredients) {
  return Object.entries(ingredients).every(([id, qty]) => ingredientCount(state, id) >= qty);
}

export function spendIngredients(state, ingredients) {
  for (const [id, qty] of Object.entries(ingredients)) {
    if (id === "water") {
      // Water comes off the belt rather than the inventory, so it misses
      // removeItem's godmode/infinite guard and needs its own.
      if (!state.godmode) state.toolbelt.waterBottle -= qty;
    } else {
      removeItem(state, id, qty);
    }
  }
}
