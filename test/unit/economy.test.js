// The craft economy has one hard invariant, and it only became checkable once
// every item carried a real price.
//
// Buying a recipe's ingredients and selling its output is a money printer
// whenever `sell(output) > buy(inputs)`. Selling returns SELL_FRACTION of the
// buy price, so the ceiling is exactly `1 / SELL_FRACTION` - cross it and gold
// can be minted in a loop with no gathering, no combat and no travel.
//
// The bound only applies where every ingredient can actually be BOUGHT. That
// is a much smaller set than it looks: no shop's `types` lists "mining" or
// "smithing", so every ore, bar and lump of coal is unpurchasable and the whole
// smithing tree is immune by construction. Cooking and alchemy are where the
// risk lives, because their inputs are `food` and shop_general sells food.
//
// The REVERSE bound - "crafting from gathered materials should be profitable" -
// is deliberately NOT asserted. It cannot hold against the current catalog:
// steel_chestplate is tagged `uncommon` (band ceiling 120) while eating four
// steel bars, each of which is iron_ore + bronze_bar + 2 coal, and every iron_*
// piece has the same shape. That is a rarity-tagging problem in the item data,
// not a pricing one, so it is pinned below as a known list rather than dressed
// up as a failing test.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ALL_ITEMS,
  SMITHING_RECIPES, CRAFTING_RECIPES, COOKING_RECIPES, POTION_RECIPES, FISHING_RECIPES,
} from "../../item_backbone.js";
import { SHOPS, SELL_FRACTION, getBuyPrice } from "../../data/shops.js";

const RECIPE_COLLECTIONS = {
  SMITHING_RECIPES, CRAFTING_RECIPES, COOKING_RECIPES, POTION_RECIPES, FISHING_RECIPES,
};

// Derived, not hardcoded: re-pitching SELL_FRACTION should re-pitch the test.
const MAX_RATIO = 1 / SELL_FRACTION;

// Every item type any shop actually stocks.
const SHOP_TYPES = new Set(Object.values(SHOPS).flatMap((shop) => shop.types ?? []));

// "water" is free and refilled from the belt (state/gameState.js), so it is
// both purchasable-in-effect and costs nothing.
const FREE_INGREDIENTS = new Set(["water"]);

// Same pre-existing data gap test/unit/itemBackboneConsistency.test.js pins:
// COOKING_RECIPES.pie wants an ingredient named "fruit", which is not an item.
const SKIP_RECIPES = new Set(["COOKING_RECIPES.pie"]);

const firstOf = (v) => (Array.isArray(v) ? v[0] : v);
const priceOf = (id) => (ALL_ITEMS[id] ? getBuyPrice(ALL_ITEMS[id]) : null);
const purchasable = (id) => FREE_INGREDIENTS.has(id) || SHOP_TYPES.has(firstOf(ALL_ITEMS[id]?.type));

function outputsOf(recipe) {
  const result = recipe.result;
  if (typeof result === "string") return { [result]: 1 };
  return result ?? {};
}

// Walks every recipe and hands back the ones worth costing, with their totals.
function costedRecipes({ onlyPurchasableInputs }) {
  const out = [];
  for (const [collectionName, collection] of Object.entries(RECIPE_COLLECTIONS)) {
    const { global, ...recipes } = collection;
    for (const [key, recipe] of Object.entries(recipes)) {
      const label = `${collectionName}.${key}`;
      if (SKIP_RECIPES.has(label)) continue;

      const ins = Object.entries(recipe.ingredients ?? {});
      const outs = Object.entries(outputsOf(recipe));
      if (!ins.length || !outs.length) continue;

      // A recipe naming an item that doesn't exist is a different bug, already
      // covered by KNOWN_DANGLING_RECIPE_REFS in the consistency test.
      if (!ins.every(([id]) => FREE_INGREDIENTS.has(id) || ALL_ITEMS[id])) continue;
      if (!outs.every(([id]) => ALL_ITEMS[id])) continue;

      if (onlyPurchasableInputs && !ins.every(([id]) => purchasable(id))) continue;

      const inSum = ins.reduce((a, [id, qty]) => a + (FREE_INGREDIENTS.has(id) ? 0 : priceOf(id) * qty), 0);
      const outSum = outs.reduce((a, [id, qty]) => a + priceOf(id) * qty, 0);
      if (inSum <= 0) continue;

      out.push({ label, inSum, outSum, ratio: outSum / inSum });
    }
  }
  return out;
}

test("no recipe with all-purchasable inputs is a money printer", () => {
  const offenders = costedRecipes({ onlyPurchasableInputs: true })
    .filter((r) => r.ratio > MAX_RATIO)
    .map((r) => `${r.label}: in=${r.inSum} out=${r.outSum} ratio=${r.ratio.toFixed(2)} (max ${MAX_RATIO})`);

  assert.deepEqual(offenders, [], "buying these ingredients and selling the output mints gold");
});

test("the craft ceiling is derived from the sell fraction, not hardcoded", () => {
  // If SELL_FRACTION moves, MAX_RATIO has to move with it or the test above
  // silently stops meaning anything.
  assert.equal(MAX_RATIO, 1 / SELL_FRACTION);
  assert.ok(SELL_FRACTION > 0 && SELL_FRACTION < 1, "a sell fraction outside (0,1) breaks the whole model");
});

// Not an assertion about every recipe - a pin on the shape of the problem, so
// that a change making crafting broadly value-destroying is noticed.
test("crafting is not systematically value-destroying", () => {
  const all = costedRecipes({ onlyPurchasableInputs: false });
  const destroying = all.filter((r) => r.ratio < 1);

  assert.ok(all.length > 200, `expected the full recipe graph, costed ${all.length}`);
  assert.ok(
    destroying.length < all.length * 0.35,
    `${destroying.length}/${all.length} recipes are worth less than their inputs - the ` +
      `iron/steel gear is tagged too cheap for what it eats, but this should not spread`
  );
});

test("the smithing tree is immune to the printer by construction", () => {
  // No shop stocks "mining" or "smithing", so ores, bars and coal cannot be
  // bought at all. If that ever changes, the invariant above starts applying to
  // 77 smithing recipes at once and this test says so first.
  assert.ok(!SHOP_TYPES.has("mining"), "a shop now sells ore - re-check the craft invariant");
  assert.ok(!SHOP_TYPES.has("smithing"), "a shop now sells bars - re-check the craft invariant");
});
