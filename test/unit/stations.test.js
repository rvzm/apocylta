import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stationIdsAtLocation,
  getStationRecipes,
  hasIngredients,
  spendIngredients,
  getCraftXp,
  normalizeResult,
  recipeTypeOf,
  recipeGroupOf,
  groupOrderFor,
} from "../../data/stations.js";
import { LOCATIONS } from "../../data/locations.js";
import { createInitialState } from "../../state/gameState.js";

test("stationIdsAtLocation() returns the location's static stations (non-playerhome)", () => {
  const ids = stationIdsAtLocation(createInitialState(), LOCATIONS.safehouse);
  assert.deepEqual(ids.sort(), ["alchemy_table", "anvil", "cooking_station", "crafting_table"]);
});

test("stationIdsAtLocation() at playerhome uses state.ownedStations instead of static hubFeatures", () => {
  const state = createInitialState();
  state.ownedStations = new Set(["forge"]);
  assert.deepEqual(stationIdsAtLocation(state, LOCATIONS.playerhome), ["forge"]);
});

test("getStationRecipes() resolves single-station recipe collections (forge, alchemy_table)", () => {
  assert.ok(getStationRecipes("forge"), "forge should have recipes (SMITHING_RECIPES.global.station)");
  assert.ok(getStationRecipes("alchemy_table"), "alchemy_table should have recipes (POTION_RECIPES.global.station)");
});

// CRAFTING_RECIPES and COOKING_RECIPES in item_backbone.js declare
// `global.station` as an ARRAY (["crafting_table","anvil"],
// ["cooking_station","campfire"]) - both ids in each pair should resolve to
// the same underlying recipes object, since it's one shared recipe pool
// available at either station (previously a bug: keying by the array itself
// coerced to one bogus combined-string key that matched neither real id).
test("getStationRecipes() resolves multi-station collections (crafting_table/anvil, cooking_station/campfire) to a shared recipe pool", () => {
  const craftingTable = getStationRecipes("crafting_table");
  const anvil = getStationRecipes("anvil");
  assert.ok(craftingTable, "crafting_table should have recipes (CRAFTING_RECIPES.global.station)");
  assert.ok(anvil, "anvil should have recipes (CRAFTING_RECIPES.global.station)");
  assert.equal(craftingTable.recipes, anvil.recipes);
  assert.ok("hammer" in craftingTable.recipes);

  const cookingStation = getStationRecipes("cooking_station");
  const campfire = getStationRecipes("campfire");
  assert.ok(cookingStation, "cooking_station should have recipes (COOKING_RECIPES.global.station)");
  assert.ok(campfire, "campfire should have recipes (COOKING_RECIPES.global.station)");
  assert.equal(cookingStation.recipes, campfire.recipes);
  assert.ok("bread" in cookingStation.recipes);
});

test("recipeTypeOf() reads the item type off a recipe's primary result", () => {
  const { recipes } = getStationRecipes("forge");
  assert.equal(recipeTypeOf(recipes.iron_bar), "smithing");
  assert.equal(recipeTypeOf(recipes.iron_sword), "weapon");
  assert.equal(recipeTypeOf(recipes.iron_helmet), "armor");
});

test("recipeGroupOf() groups smithing bars by metal id prefix, not the item's own (inconsistent) subtype", () => {
  const { recipes } = getStationRecipes("forge");
  // tin_bar/iron_bar's own subtype already matches their metal - not the
  // interesting case.
  assert.equal(recipeGroupOf(recipes.tin_bar), "tin");
  // bronze_bar/steel_bar's own subtype is the generic "alloy", which would
  // wrongly lump every alloy bar into one bucket - the id-prefix derivation
  // keeps them under their own metal instead.
  assert.equal(recipeGroupOf(recipes.bronze_bar), "bronze");
  assert.equal(recipeGroupOf(recipes.steel_bar), "steel");
});

test("recipeGroupOf() groups armor by its own metal subtype, weapons by their own weapon-type subtype", () => {
  const { recipes } = getStationRecipes("forge");
  assert.equal(recipeGroupOf(recipes.iron_helmet), "iron");
  assert.equal(recipeGroupOf(recipes.iron_sword), "sword");
  assert.equal(recipeGroupOf(recipes.iron_dagger), "dagger");
});

test("groupOrderFor() returns a declared category list for known types, null otherwise", () => {
  assert.ok(groupOrderFor("smithing").includes("tin"));
  assert.ok(groupOrderFor("weapon").includes("sword"));
  assert.equal(groupOrderFor("nonexistent_type"), null);
});

test("hasIngredients() checks inventory quantities against a requirement map", () => {
  const state = createInitialState();
  state.inventory = { wood: 2, iron_ore: 1 };
  assert.equal(hasIngredients(state, { wood: 2 }), true);
  assert.equal(hasIngredients(state, { wood: 3 }), false);
  assert.equal(hasIngredients(state, { wood: 2, iron_ore: 1 }), true);
  assert.equal(hasIngredients(state, { stone: 1 }), false);
});

test("hasIngredients() checks water against state.toolbelt.waterBottle, and requires a belt equipped", () => {
  const state = createInitialState();
  state.toolbelt.waterBottle = 2;
  assert.equal(hasIngredients(state, { water: 2 }), false, "no belt equipped - water unusable regardless of amount held");

  state.equipment.belt = "leather_belt";
  assert.equal(hasIngredients(state, { water: 2 }), true);
  assert.equal(hasIngredients(state, { water: 3 }), false);
  // Never satisfiable via inventory - "water" has no backing item.
  state.inventory.water = 99;
  assert.equal(hasIngredients(state, { water: 3 }), false);
});

test("spendIngredients() spends water from the toolbelt and other ingredients from inventory", () => {
  const state = createInitialState();
  state.toolbelt.waterBottle = 5;
  state.inventory = { flour: 2 };

  spendIngredients(state, { flour: 2, water: 1 });

  assert.equal(state.toolbelt.waterBottle, 4);
  assert.equal("flour" in state.inventory, false);
  assert.equal("water" in state.inventory, false); // never touches inventory for water
});

test("normalizeResult() wraps a bare item id into a { itemId: 1 } map, passes maps through", () => {
  assert.deepEqual(normalizeResult("wood"), { wood: 1 });
  assert.deepEqual(normalizeResult({ wood: 3 }), { wood: 3 });
});

test("getCraftXp() scales with rarity level and quantity", () => {
  assert.ok(getCraftXp("tin_ore", 2) > 0);
  assert.equal(getCraftXp("tin_ore", 2), getCraftXp("tin_ore", 1) * 2);
});
