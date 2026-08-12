// Permanent version of the audit script used to find the TYPES/CATEGORIES
// drift fixed alongside this test - item_backbone.js is large and heavily
// self-referential (recipes/kits/sets pointing at item ids, items pointing
// at category lists), and nothing else in the codebase catches drift
// between an item's type/subtype/slot/rarity and the list that's supposed
// to enumerate valid values for it. Keeping this as a real test is what
// stops that drift from silently recurring.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as IB from "../../item_backbone.js";
import { SKILL_BLOCKS } from "../../skill_backbone.js";

const {
  ITEM_TYPES, WEAPON_TYPES, ARMOR_TYPES, ARMOR_SLOTS, MINING_TYPES, SMITHING_TYPES,
  FOOD_CATEGORIES, FOOD_SUBTYPES, POTION_CATEGORIES, TOOL_CATEGORIES, KIT_CATEGORIES,
  SET_CATEGORIES, MAGIC_CATEGORIES, ITEM_RARITIES,
  ITEMS, MYTHIC_ITEMS, UNIQUE_ITEMS, TREASURE_ITEMS, STARTER_PACKS, METALURGY,
  MINING_RESOURCES, MAGIC_RESOURCES, MAGIC_ITEMS, TOOLBELTS, BACKPACKS, FISHING_CATALOG, BLACKMARKET_CATALOG,
  SMITHING_RECIPES, CRAFTING_RECIPES, COOKING_RECIPES, POTION_RECIPES, FISHING_RECIPES, ALL_ITEMS,
  FISH, catchItemsFor, equipSlotOf, RARITY_BANDS, STATIONS, PROPERTY,
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
// copper_sword/copper_dagger used to be listed here too - the quest
// "smithy_smithy" asks you to craft a copper sword, so the missing items became
// a blocked objective rather than a curiosity, and both were added to ITEMS.
const KNOWN_DANGLING_RECIPE_REFS = new Set([
  "COOKING_RECIPES.pie: ingredient \"fruit\"",
]);

// FISHING_CATALOG rather than FISHING_ITEMS: the raw catalog is authored in
// fishing vocabulary (type "rod", "mollusk"...) and only becomes a real item
// once withFishingDefaults() has mapped it, which is the form ALL_ITEMS carries
// and therefore the form these invariants apply to.
// BLACKMARKET_CATALOG joins them for the same reason FISHING_CATALOG does: the
// black market's enhancements are authored in their own vocabulary (a `type` of
// "charm"/"bangle"...) and only become real items once withBlackMarketDefaults()
// has mapped them, which is the form ALL_ITEMS carries.
const ITEM_CATALOGS = { ITEMS, TREASURE_ITEMS, MYTHIC_ITEMS, UNIQUE_ITEMS, MAGIC_ITEMS, MINING_RESOURCES, MAGIC_RESOURCES, TOOLBELTS, FISHING_CATALOG, BLACKMARKET_CATALOG };

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

test("every tool's subtype is declared in TOOL_CATEGORIES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "tool" && item.subtype && !TOOL_CATEGORIES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every kit's subtype is declared in KIT_CATEGORIES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "kit" && item.subtype && !KIT_CATEGORIES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every set's subtype is declared in SET_CATEGORIES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "set" && item.subtype && !SET_CATEGORIES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every food's subtype is declared in FOOD_CATEGORIES or FOOD_SUBTYPES", () => {
  const allowed = new Set([...FOOD_CATEGORIES, ...FOOD_SUBTYPES]);
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "food" && item.subtype && !allowed.has(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every potion's subtype is declared in POTION_CATEGORIES", () => {
  const offenders = entries(ITEMS)
    .filter(([, item]) => item.type === "potion" && item.subtype && !POTION_CATEGORIES.includes(item.subtype))
    .map(([id, item]) => `ITEMS.${id}: "${item.subtype}"`);
  assert.deepEqual(offenders, []);
});

test("every magic item's subtype is declared in MAGIC_CATEGORIES", () => {
  const offenders = entries(MAGIC_ITEMS)
    .filter(([, item]) => item.subtype && !MAGIC_CATEGORIES.includes(item.subtype))
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

test("every recipe ingredient/result resolves to a real item (SMITHING/CRAFTING/COOKING/POTION/FISHING_RECIPES)", () => {
  const offenders = [];
  for (const [name, recipes] of Object.entries({ SMITHING_RECIPES, CRAFTING_RECIPES, COOKING_RECIPES, POTION_RECIPES, FISHING_RECIPES })) {
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

// The fishing catalog reaches ALL_ITEMS through withFishingDefaults() rather
// than a `global` tag, so its own mapping needs the same proof TOOLBELTS gets
// below: rods equip, bait/nets/hooks deliberately don't (they'd fight the rod
// for the single tool slot), and every catch is edible food.
test("ALL_ITEMS resolves the fishing catalog into canonical items", () => {
  assert.equal(ALL_ITEMS.fishing_rod?.type, "tool");
  assert.equal(ALL_ITEMS.fishing_rod?.subtype, "fishing rod");
  assert.equal(equipSlotOf("fishing_rod"), "tool");

  assert.equal(ALL_ITEMS.fishing_bait?.type, "crafting");
  assert.equal(equipSlotOf("fishing_bait"), null, "bait must not compete with the rod for the tool slot");
  assert.equal(equipSlotOf("fishing_net"), null);

  assert.equal(ALL_ITEMS.raw_pike?.subtype, "raw_fish");
  assert.ok(ALL_ITEMS.smoked_tuna?.health_boost > 0, "cooked catches have to be edible");

  // Body parts (leviathan_scale, tarvus_bone...) are materials, not food.
  assert.equal(ALL_ITEMS.leviathan_scale?.type, "crafting");
  assert.equal(ALL_ITEMS.leviathan_scale?.health_boost, undefined);

  // The authored vocabulary survives the mapping - data/fishing.js gates on it.
  assert.equal(ALL_ITEMS.fishing_net?.fishingType, "net");
  assert.equal(ALL_ITEMS.godlike_fishing_rod?.fishingTier, "godlike");
});

test("every FISH species is catchable: a required level, a rod that reaches it, and something to put in the pack", () => {
  const rodTiers = Object.values(SKILL_BLOCKS.fishing.tools);
  const offenders = [];
  for (const [id, fish] of Object.entries(FISH)) {
    const level = SKILL_BLOCKS.fishing.catches[fish.difficulty];
    if (level == null) offenders.push(`FISH.${id}: difficulty ${fish.difficulty} has no catches level`);
    else if (!rodTiers.some((tier) => tier >= level)) offenders.push(`FISH.${id}: no rod reaches level ${level}`);
    if (catchItemsFor(id).length === 0) offenders.push(`FISH.${id}: no catch item`);
  }
  assert.deepEqual(offenders, []);
});

// --- Pricing -----------------------------------------------------------------
// Every item used to fall through data/shops.js's rarity fallback, which made a
// stone, a loaf of bread and a wooden sword all worth exactly 10. They carry a
// literal `value` now, and these two tests are what stop a new item slipping in
// unpriced or wildly mispriced.

// Types whose price is structurally outside its rarity's band, each for a
// reason that can't be designed away:
//  - "set"/"kit" are COMPOSITES. A set is 0.9x the sum of its pieces (so
//    selling the set can never beat selling the pieces), and five legendary
//    pieces cannot fit inside one legendary band.
//  - "enhancement" is the black market's hand-set 1k-500k ladder, which IS
//    that shop's gate - it has no barter gate (see ui/screens/blackMarket.js).
//  - "mining"/"smithing"/"metal" ride the material ladder instead: they're
//    priced off the mining level that gates them, because adamantite_ore is
//    legendary while the chestplate eating four bars' worth is ALSO legendary,
//    and no in-band assignment makes that recipe non-destructive.
const UNBANDED_TYPES = new Set(["set", "kit", "enhancement", "mining", "smithing", "metal"]);

// Outputs whose craft-invariant ceiling (test/unit/economy.test.js) bites below
// their rarity's floor - all of them cheap-input/higher-rarity-output cooking
// recipes, which is an authoring oddity in the recipe rather than the price.
const CRAFT_CAPPED = new Set([
  "firewood", "herbal_tea", "green_tea", "black_tea", "white_tea",
  "mixed_herb_brew", "vibrant_herb_brew", "poison_potion",
]);

// Bait is spent per catch attempt (data/fishing.js's spendBait, charged even on
// a miss), so a band built for durable gear would put one forged bait at the
// rare floor of 100 against a rare fish that sells for 60. It is ammunition.
//
// The backpacks are exempt for the same reason the enhancements are: their
// hand-set 100-to-1,000,000 ladder is the gate. What a backpack is worth is its
// carrying capacity, which is 100 slots at one end and 2000 at the other - a
// twentyfold span that no band reaches, since the highest (godlike) tops out at
// 6000. Banding them would flatten the ladder into near-identical prices and
// delete the progression the collection exists to provide.
const UNBANDED_IDS = new Set([
  "fishing_bait", "crafted_fishing_bait", "forged_fishing_bait",
  "enchanted_fishing_bait", "mythic_fishing_bait", "godlike_fishing_bait",
  ...Object.keys(BACKPACKS).filter((key) => key !== "global"),
]);

test("every item carries a positive integer `value` in base units", () => {
  const offenders = Object.entries(ALL_ITEMS)
    .filter(([, item]) => !Number.isInteger(item.value) || item.value < 1)
    .map(([id, item]) => `${id}: ${JSON.stringify(item.value)}`);
  assert.deepEqual(offenders, []);
});

test("every priced item sits inside its rarity's band", () => {
  const offenders = [];
  for (const [id, item] of Object.entries(ALL_ITEMS)) {
    if (UNBANDED_TYPES.has(item.type) || CRAFT_CAPPED.has(id) || UNBANDED_IDS.has(id)) continue;
    const band = RARITY_BANDS[item.rarity];
    if (!band) {
      offenders.push(`${id}: rarity "${item.rarity}" has no band`);
      continue;
    }
    if (item.value < band[0] || item.value > band[1]) {
      offenders.push(`${id} (${item.type}/${item.rarity}) = ${item.value}, band ${band[0]}-${band[1]}`);
    }
  }
  assert.deepEqual(offenders, []);
});

// STATIONS and PROPERTY are priced through getBuyPrice like anything else but
// are deliberately NOT in ALL_ITEMS - neither ever enters the inventory - so
// the two tests above can't reach them.
test("stations and property are priced too", () => {
  const offenders = [];
  for (const [name, catalog] of Object.entries({ STATIONS, PROPERTY })) {
    for (const [id, entry] of entries(catalog)) {
      if (!Number.isInteger(entry.value) || entry.value < 1) offenders.push(`${name}.${id}: ${JSON.stringify(entry.value)}`);
    }
  }
  assert.deepEqual(offenders, []);
});

// The house deed used to be `const HOUSE_PRICE = 1000` inside
// ui/screens/shopHousing.js - the one priced good defined outside this file.
test("the house deed is a catalog entry, not a hardcoded price in a screen", () => {
  assert.equal(PROPERTY.house_deed.value, 1000);
  assert.doesNotMatch(
    readFileSync(new URL("../../ui/screens/shopHousing.js", import.meta.url), "utf8"),
    /^\s*const\s+HOUSE_PRICE\s*=/m,
    "shopHousing.js should read the deed's price from PROPERTY, not redeclare it"
  );
});

test("ALL_ITEMS actually resolves belts (TOOLBELTS' global-tag inheritance)", () => {
  for (const [id] of entries(TOOLBELTS)) {
    assert.ok(id in ALL_ITEMS, `TOOLBELTS.${id} should be resolvable via ALL_ITEMS`);
    assert.equal(ALL_ITEMS[id].type, "armor", `TOOLBELTS.${id} should inherit type "armor" from its global tag`);
    assert.equal(ALL_ITEMS[id].slot, "belt", `TOOLBELTS.${id} should inherit slot "belt" from its global tag`);
  }
});
