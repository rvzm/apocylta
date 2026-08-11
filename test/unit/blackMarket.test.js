// The black market sells out of BLACKMARKET rather than ALL_ITEMS, which means
// its two collections are the only shop stock in the game whose ids aren't
// guaranteed to be items by construction. Three of them already weren't when
// this was written: box_of_runite named a "runite_ore" that didn't exist yet,
// and two of the three illicit_goods sections declared a `global.keyRef`
// pointing at the wrong catalog. Nothing was checking, so nothing failed.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_ITEMS, BLACKMARKET, BLACKMARKET_CATALOG, BLACKMARKET_ENHANCEMENT_TYPES,
  BLACKMARKET_ENHANCEMENT_SUBTYPES, ENHANCEMENT_SLOTS, ITEM_TYPES, ITEM_RARITIES,
  blackMarketSections, blackMarketEntry, blackMarketGrants, equipSlotOf,
} from "../../item_backbone.js";
import { SKILLS } from "../../skill_backbone.js";
import { createInitialState, equipItem, addItem, effectiveSkillLevel } from "../../state/gameState.js";
import { purseFromBase } from "../../currency_backbone.js";
import { getShop } from "../../data/shops.js";
import { buildBlackMarketRows, tabsFor } from "../../ui/screens/blackMarket.js";

// ------------------------------------------------------------------ catalog

test("every illicit good resolves to something the player can actually receive", () => {
  const missing = [];
  for (const section of blackMarketSections("illicit_goods")) {
    for (const [id, entry] of section.entries) {
      for (const grantId of Object.keys(blackMarketGrants(id, entry))) {
        if (!ALL_ITEMS[grantId]) missing.push(`${section.key}.${id} -> "${grantId}"`);
      }
    }
  }
  assert.deepEqual(missing, [], "an entry naming a non-item would charge gold and hand over nothing");
});

// A section's `global.keyRef` is documentation - the screen resolves through
// ALL_ITEMS - but documentation that contradicts the data is worse than none.
test("each illicit_goods section's keyRef names the catalog its ids really live in", () => {
  const wrong = [];
  for (const section of blackMarketSections("illicit_goods")) {
    if (!section.global?.keyRef) continue;
    // A section whose contents span catalogs names all of them.
    const catalogs = [section.global.keyRef].flat();
    for (const [id, entry] of section.entries) {
      // A bundle's own id is a name for a pile of something else; its keyRef
      // describes where the OUTPUTS live, which is what `outputsOnly` marks.
      const ids = section.global.outputsOnly ? Object.keys(entry.outputs ?? {}) : [id];
      for (const checkId of ids) {
        if (!catalogs.some((catalog) => checkId in catalog)) {
          wrong.push(`${section.key}: "${checkId}" is in no catalog keyRef points at`);
        }
      }
    }
  }
  assert.deepEqual(wrong, []);
});

// Both collections are two levels deep and may carry a `global` block. Anything
// iterating a section has to strip it or "global" renders as a shop row.
test("no section exposes its `global` block as an entry", () => {
  for (const collection of Object.keys(BLACKMARKET)) {
    for (const section of blackMarketSections(collection)) {
      const keys = section.entries.map(([key]) => key);
      assert.ok(!keys.includes("global"), `${collection}.${section.key} leaked its global block`);
    }
  }
});

test("every enhancement translates into a canonical item", () => {
  const offenders = [];
  for (const [id, item] of Object.entries(BLACKMARKET_CATALOG)) {
    if (!ITEM_TYPES.includes(item.type)) offenders.push(`${id}: type "${item.type}"`);
    if (!ITEM_RARITIES.includes(item.rarity)) offenders.push(`${id}: rarity "${item.rarity}"`);
    if (!ENHANCEMENT_SLOTS.includes(item.enhancementSlot)) offenders.push(`${id}: slot "${item.enhancementSlot}"`);
    if (typeof item.value !== "number") offenders.push(`${id}: no price`);
  }
  assert.deepEqual(offenders, []);
  assert.equal(Object.keys(BLACKMARKET_CATALOG).length, 70);
});

// The whole point of an enhancement is the skill it boosts, and
// effectiveSkillLevel() looks that skill up by `subtype` - a subtype naming no
// real skill is an item that silently does nothing.
test("every enhancement's subtype is a real skill, boosting that same skill", () => {
  const offenders = [];
  for (const [id, item] of Object.entries(BLACKMARKET_CATALOG)) {
    if (!(item.subtype in SKILLS)) {
      offenders.push(`${id}: subtype "${item.subtype}" is not a skill`);
      continue;
    }
    if (item.effect?.[`${item.subtype}Up`] === undefined) {
      offenders.push(`${id}: effect ${JSON.stringify(item.effect)} doesn't boost "${item.subtype}"`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("BLACKMARKET_ENHANCEMENT_SUBTYPES is a list of skill keys, not skill records", () => {
  for (const key of BLACKMARKET_ENHANCEMENT_SUBTYPES) {
    assert.equal(typeof key, "string");
    assert.ok(key in SKILLS, `"${key}" is not a skill`);
  }
});

test("every enhancement is in ALL_ITEMS and equips into its own tier's slot", () => {
  for (const [id, item] of Object.entries(BLACKMARKET_CATALOG)) {
    assert.equal(ALL_ITEMS[id], item, `${id} missing from ALL_ITEMS`);
    assert.equal(equipSlotOf(id), item.enhancementSlot);
  }
  assert.deepEqual(ENHANCEMENT_SLOTS, BLACKMARKET_ENHANCEMENT_TYPES);
});

test("blackMarketEntry() finds entries in both collections, at both depths", () => {
  assert.equal(blackMarketEntry("void_crystal").collection, "illicit_goods");
  assert.equal(blackMarketEntry("luck_charm").collection, "enhancements");
  assert.equal(blackMarketEntry("barter_bangle").section, "bangles");
  assert.equal(blackMarketEntry("global"), null, "the global block is not an entry");
  assert.equal(blackMarketEntry("no_such_thing"), null);
});

// Only illicit_goods entries carry a `key` field; reading entry.key would hand
// the 70 enhancements back a grant of { undefined: 1 }.
test("blackMarketGrants() takes the id separately from the entry", () => {
  assert.deepEqual(blackMarketGrants("box_of_coal", blackMarketEntry("box_of_coal").entry), { coal: 100 });
  assert.deepEqual(blackMarketGrants("luck_charm", blackMarketEntry("luck_charm").entry), { luck_charm: 1 });
  assert.deepEqual(blackMarketGrants("excalibur", blackMarketEntry("excalibur").entry), { excalibur: 1 });
});

// ------------------------------------------------------------------- screen

function shopping(shopId, gold) {
  const state = createInitialState();
  state.shopContext = getShop(shopId);
  state.cur = purseFromBase(gold);
  return state;
}

test("each shop tabs its own collection's sections", () => {
  assert.deepEqual(tabsFor(shopping("shop_illegal", 0)), [
    "Magic Focuses", "Forbidden Artifacts", "Smithing Bundles",
  ]);
  assert.deepEqual(tabsFor(shopping("shop_enhancements", 0)), [
    "Charms", "Talismans", "Beads", "Rings", "Bangles",
  ]);
});

test("every tab of both shops lists its whole section and nothing else", () => {
  for (const shopId of ["shop_illegal", "shop_enhancements"]) {
    const state = shopping(shopId, 0);
    const sections = blackMarketSections(state.shopContext.blackMarket);
    sections.forEach((section, index) => {
      const { itemIds } = buildBlackMarketRows(state, index);
      assert.deepEqual(
        itemIds.filter(Boolean).sort(),
        section.entries.map(([id]) => id).sort(),
        `${shopId} tab ${index}`
      );
    });
  }
});

// mainContent/inventoryList hold ~18 rows with the sub-header showing, and
// nothing here scrolls to a row it can't reach. Grouping every enhancement tier
// by skill produced 14 headers over 14 single rows - 28 rows for 14 items.
test("no tab renders more rows than the pane can show", () => {
  const MAX_ROWS = 18;
  for (const shopId of ["shop_illegal", "shop_enhancements"]) {
    const state = shopping(shopId, 0);
    tabsFor(state).forEach((label, index) => {
      const { lines } = buildBlackMarketRows(state, index);
      assert.ok(lines.length <= MAX_ROWS, `${shopId}/${label} renders ${lines.length} rows`);
    });
  }
});

test("group headers appear only where they collapse something", () => {
  const illegal = shopping("shop_illegal", 0);
  // Magic Focuses splits into crystal/orb/book/focus, two apiece.
  assert.ok(buildBlackMarketRows(illegal, 0).lines.some((line) => line.endsWith(":")));
  // Smithing Bundles is one group - the tab strip already named it.
  assert.ok(!buildBlackMarketRows(illegal, 2).lines.some((line) => line.endsWith(":")));
  // Every enhancement tier is one entry per skill, so grouping collapses nothing.
  const enhancements = shopping("shop_enhancements", 0);
  assert.ok(!buildBlackMarketRows(enhancements, 0).lines.some((line) => line.endsWith(":")));
});

// Green+bold reads as "you can buy this", red as "you can't" - and the bold is
// what carries the distinction under `colorize: 0`, where colour is dropped.
test("rows are marked by whether you can afford them, not by barter level", () => {
  const broke = buildBlackMarketRows(shopping("shop_illegal", 0), 0).lines.join("\n");
  const rich = buildBlackMarketRows(shopping("shop_illegal", 999999), 0).lines.join("\n");

  assert.ok(broke.includes("{red-fg}") && !broke.includes("{green-fg}"));
  assert.ok(rich.includes("{green-fg}") && !rich.includes("{red-fg}"));
  // Barter stays at 1 in both: unlike every other shop, nothing here is gated
  // on it - the mythic/godlike stock would otherwise be invisible until 65+.
  assert.equal(createInitialState().skills.barter.level, 1);
});

test("a bundle's row says what is actually in it", () => {
  const { lines, itemIds } = buildBlackMarketRows(shopping("shop_illegal", 0), 2);
  const row = lines[itemIds.indexOf("box_of_coal")];
  assert.match(row, /Box of Coal/);
  assert.match(row, /100x Coal/);
});

// ------------------------------------------------------- effects, and limits

test("a worn enhancement lifts the effective skill level but not the trained one", () => {
  const state = createInitialState();
  state.skills.mining.level = 5;
  assert.equal(effectiveSkillLevel(state, "mining"), 5);

  addItem(state, "mining_beads", 1);
  equipItem(state, "mining_beads", equipSlotOf("mining_beads"));

  assert.equal(state.enhancements.beads, "mining_beads");
  assert.equal(effectiveSkillLevel(state, "mining"), 25, "beads are +20");
  assert.equal(state.skills.mining.level, 5, "the trained level must not move");
  assert.equal(effectiveSkillLevel(state, "fishing"), 1, "and no other skill moves");
});

test("the five tiers stack, one worn item per slot", () => {
  const state = createInitialState();
  for (const id of ["luck_charm", "luck_talisman", "luck_beads", "luck_ring", "luck_bangle"]) {
    addItem(state, id, 1);
    equipItem(state, id, equipSlotOf(id));
  }
  // 1 trained + 5 + 10 + 20 + 50 + 100
  assert.equal(effectiveSkillLevel(state, "luck"), 186);
});

// The enhancement "ring" tier and the armor "ring" slot are different things.
// Folding them into one map would have a Luck Ring evict ring_of_eternity.
test("an enhancement ring does not occupy the armor ring slot", () => {
  const state = createInitialState();
  addItem(state, "ring_of_eternity", 1);
  addItem(state, "luck_ring", 1);
  equipItem(state, "ring_of_eternity", equipSlotOf("ring_of_eternity"));
  equipItem(state, "luck_ring", equipSlotOf("luck_ring"));

  assert.equal(state.equipment.ring, "ring_of_eternity");
  assert.equal(state.enhancements.ring, "luck_ring");
});

test("swapping a slot returns the displaced enhancement to the backpack", () => {
  const state = createInitialState();
  addItem(state, "luck_charm", 1);
  addItem(state, "mining_charm", 1);
  equipItem(state, "luck_charm", "charm");
  const previous = equipItem(state, "mining_charm", "charm");

  assert.equal(previous, "luck_charm");
  assert.equal(state.enhancements.charm, "mining_charm");
  assert.equal(state.inventory.luck_charm, 1);
  assert.equal(effectiveSkillLevel(state, "luck"), 1, "the removed charm stops counting");
});
