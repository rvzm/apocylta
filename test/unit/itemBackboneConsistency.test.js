// Permanent version of the audit script used to find the TYPES/CATAGORIES
// drift fixed alongside this test - item_backbone.js is large and heavily
// self-referential (recipes/kits/sets pointing at item ids, items pointing
// at category lists), and nothing else in the codebase catches drift
// between an item's type/subtype/slot/rarity and the list that's supposed
// to enumerate valid values for it. Keeping this as a real test is what
// stops that drift from silently recurring.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as IB from "../../item_backbone.js";

const {
  ITEM_TYPES, WEAPON_TYPES, ARMOR_TYPES, ARMOR_SLOTS, MINING_TYPES, SMITHING_TYPES,
  FOOD_CATAGORIES, FOOD_SUBTYPES, POTION_CATAGORIES, TOOL_CATAGORIES, KIT_CATAGORIES,
  SET_CATAGORIES, MAGIC_CATAGORIES, ITEM_RARITIES,
  ITEMS, MYTHIC_ITEMS, UNIQUE_ITEMS, TREASURE_ITEMS, STARTER_PACKS, METALURGY,
  MINING_RESOURCES, MAGIC_RESOURCES, MAGIC_ITEMS, TOOLBELTS,
  SMITHING_RECIPES, CRAFTING_RECIPES, COOKING_RECIPES, POTION_RECIPES, ALL_ITEMS,
} = IB;

// "water" is the one recipe ingredient with no backing item id by design
// (data/stations.js checks/spends it against state.toolbelt.waterBottle).
const KNOWN_NON_ITEM_INGREDIENTS = new Set(["water"]);

// KNOWN GAP (pre-existing, not introduced by this test): these recipes
// reference items that were never added to any catalog, so they're
// permanently uncraftable today - copper_sword/copper_dagger have no
// matching item (every other weapon type got a copper tier, these two
// didn't), and pie's "fruit" ingredient doesn't match any real item id
// (apple/banana/etc. exist individually, but nothing named exactly "fruit").
// Pinned explicitly (same treatment as the crafting_table/anvil
// STATION_RECIPES bug in test/unit/stations.test.js) rather than silently
// inventing item stats/ingredient substitutions that weren't asked for.
const KNOWN_DANGLING_RECIPE_REFS = new Set([
  "SMITHING_RECIPES.copper_sword: result \"copper_sword\"",
  "SMITHING_RECIPES.copper_dagger: result \"copper_dagger\"",
  "COOKING_RECIPES.pie: ingredient \"fruit\"",
]);

const ITEM_CATALOGS = { ITEMS, TREASURE_ITEMS, MYTHIC_ITEMS, UNIQUE_ITEMS, MAGIC_ITEMS, MINING_RESOURCES, MAGIC_RESOURCES, TOOLBELTS };

function entries(catalog) {
  return Object.entries(catalog).filter(([id]) => id !== "global");
}

test("no item id is defined in more than one catalog", () => {
  const seenIn = {};
  for (const [catName, cat] of Object.entries(ITEM_CATALOGS)) {
    for (const [id] of entries(cat)) (seenIn[id] ??= []).push(catName);
  }
  const duplicates = Object.entries(seenIn).filter(([, cats]) => cats.length > 1);
  assert.deepEqual(duplicates, [], "duplicate item ids found (shown as [id, [catalogs]] pairs)");
});

test("every item's `type` is declared in ITEM_TYPES", () => {
  const offenders = [];
  for (const [catName, cat] of Object.entries(ITEM_CATALOGS)) {
    for (const [id, item] of entries(cat)) {
      if (item.type && !ITEM_TYPES.includes(item.type)) offenders.push(`${catName}.${id}: type "${item.type}"`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("every item's `rarity` is declared in ITEM_RARITIES", () => {
  const offenders = [];
  for (const [catName, cat] of Object.entries(ITEM_CATALOGS)) {
    for (const [id, item] of entries(cat)) {
      if (item.rarity && !ITEM_RARITIES.includes(item.rarity)) offenders.push(`${catName}.${id}: rarity "${item.rarity}"`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("every weapon's subtype is declared in WEAPON_TYPES", () => {
  const offenders = [];
  for (const [catName, cat] of Object.entries({ ITEMS, MYTHIC_ITEMS, UNIQUE_ITEMS })) {
    for (const [id, item] of entries(cat)) {
      if (item.type === "weapon" && item.subtype && !WEAPON_TYPES.includes(item.subtype)) {
        offenders.push(`${catName}.${id}: "${item.subtype}"`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test("every armor item's subtype is declared in ARMOR_TYPES (mage_robe uses its own MAGE_ROBE_TYPES/robetype)", () => {
  const offenders = [];
  for (const [catName, cat] of Object.entries({ ITEMS, MYTHIC_ITEMS, UNIQUE_ITEMS })) {
    for (const [id, item] of entries(cat)) {
      if (item.type !== "armor" || item.subtype === "mage_robe") continue;
      if (item.subtype && !ARMOR_TYPES.includes(item.subtype)) offenders.push(`${catName}.${id}: "${item.subtype}"`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("every armor item's slot is a real equipment slot (ARMOR_SLOTS)", () => {
  const offenders = [];
  for (const [catName, cat] of Object.entries({ ITEMS, MYTHIC_ITEMS, UNIQUE_ITEMS })) {
    for (const [id, item] of entries(cat)) {
      if (item.type === "armor" && item.slot && !ARMOR_SLOTS.includes(item.slot)) {
        offenders.push(`${catName}.${id}: slot "${item.slot}"`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test("every tool's subtype is declared in TOOL_CATAGORIES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "tool" && item.subtype && !TOOL_CATAGORIES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every kit's subtype is declared in KIT_CATAGORIES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "kit" && item.subtype && !KIT_CATAGORIES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every set's subtype is declared in SET_CATAGORIES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "set" && item.subtype && !SET_CATAGORIES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every food's subtype is declared in FOOD_CATAGORIES or FOOD_SUBTYPES", () => {
  const allowed = new Set([...FOOD_CATAGORIES, ...FOOD_SUBTYPES]);
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "food" && item.subtype && !allowed.has(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every potion's subtype is declared in POTION_CATAGORIES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "potion" && item.subtype && !POTION_CATAGORIES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every magic item's subtype is declared in MAGIC_CATAGORIES", () => {
  const offenders = entries(MAGIC_ITEMS)
    .filter(([, item]) => item.subtype && !MAGIC_CATAGORIES.includes(item.subtype))
    .map(([id, item]) => `MAGIC_ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every mining item's subtype is declared in MINING_TYPES", () => {
  const offenders = [];
  for (const [catName, cat] of Object.entries({ ITEMS, MINING_RESOURCES })) {
    for (const [id, item] of entries(cat)) {
      if (item.type === "mining" && item.subtype && !MINING_TYPES.includes(item.subtype)) {
        offenders.push(`${catName}.${id}: "${item.subtype}"`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test("every smithing item's subtype is declared in SMITHING_TYPES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "smithing" && item.subtype && !SMITHING_TYPES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every recipe ingredient/result resolves to a real item (SMITHING/CRAFTING/COOKING/POTION_RECIPES)", () => {
  const offenders = [];
  for (const [name, recipes] of Object.entries({ SMITHING_RECIPES, CRAFTING_RECIPES, COOKING_RECIPES, POTION_RECIPES })) {
    for (const [key, recipe] of entries(recipes)) {
      for (const ingId of Object.keys(recipe.ingredients ?? {})) {
        if (KNOWN_NON_ITEM_INGREDIENTS.has(ingId)) continue;
        if (!(ingId in ALL_ITEMS)) offenders.push(`${name}.${key}: ingredient "${ingId}"`);
      }
      const resultIds = typeof recipe.result === "string" ? [recipe.result] : Object.keys(recipe.result ?? {});
      for (const resId of resultIds) {
        if (!(resId in ALL_ITEMS)) offenders.push(`${name}.${key}: result "${resId}"`);
      }
    }
  }
  const unexpected = offenders.filter((o) => !KNOWN_DANGLING_RECIPE_REFS.has(o));
  assert.deepEqual(unexpected, [], "new dangling recipe references beyond the known/pinned ones");
});

test("every METALURGY alloy's ingredients resolve to real items", () => {
  const offenders = [];
  for (const [id, metal] of entries(METALURGY)) {
    for (const ingId of metal.ingredients ?? []) {
      if (!(ingId in ALL_ITEMS)) offenders.push(`METALURGY.${id}: ingredient "${ingId}"`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("every STARTER_PACKS item resolves to a real item", () => {
  const offenders = [];
  for (const [id, pack] of Object.entries(STARTER_PACKS)) {
    for (const itemId of Object.keys(pack.items ?? {})) {
      if (itemId === "gold") continue;
      if (!(itemId in ALL_ITEMS)) offenders.push(`STARTER_PACKS.${id}: item "${itemId}"`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("every SET's pieces and KIT's contents/recipes resolve to real items", () => {
  const offenders = [];
  for (const [catName, cat] of Object.entries({ ITEMS, MYTHIC_ITEMS })) {
    for (const [id, item] of entries(cat)) {
      if (item.type === "set") {
        const pieceIds = Array.isArray(item.items) ? item.items : Object.keys(item.items ?? {});
        for (const pieceId of pieceIds) if (!(pieceId in ALL_ITEMS)) offenders.push(`SET ${catName}.${id}: piece "${pieceId}"`);
      }
      if (item.type === "kit") {
        const contentIds = Array.isArray(item.contents) ? item.contents : Object.keys(item.contents ?? {});
        for (const cId of contentIds) if (!(cId in ALL_ITEMS)) offenders.push(`KIT ${catName}.${id}: content "${cId}"`);
        for (const rId of item.recipes ?? []) if (!(rId in ALL_ITEMS)) offenders.push(`KIT ${catName}.${id}: recipe-result "${rId}"`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test("ALL_ITEMS actually resolves belts (TOOLBELTS' global-tag inheritance)", () => {
  for (const [id] of entries(TOOLBELTS)) {
    assert.ok(id in ALL_ITEMS, `TOOLBELTS.${id} should be resolvable via ALL_ITEMS`);
    assert.equal(ALL_ITEMS[id].type, "armor", `TOOLBELTS.${id} should inherit type "armor" from its global tag`);
    assert.equal(ALL_ITEMS[id].slot, "belt", `TOOLBELTS.${id} should inherit slot "belt" from its global tag`);
  }
});
