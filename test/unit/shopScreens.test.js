// The shop screens' tabs and sections, driven with no blessed - the same shape
// pouchScreen.test.js and spellbookScreen.test.js use.
//
// Both screens take their tab axis from data/shops.js's `tabBy`, which exists
// because the shops differ enormously: the food shop stocks 386 items across 16
// subtypes (too many for a strip), the armoury 132 across 23 materials but only
// 11 slots, the weapon shop 73 across 7 kinds. One fixed axis served none of
// them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../../state/gameState.js";
import { SHOPS } from "../../data/shops.js";
import { ALL_ITEMS, ARMOR_SLOTS, ITEM_TYPES } from "../../item_backbone.js";
import { buildBuyRows, buyTabs } from "../../ui/screens/shopBuy.js";
import { buildSellRows, sellTabs } from "../../ui/screens/shopSell.js";
import { stripMarkup } from "../../markup.js";

// Barter gates what a shop shows at all, so these shop at the top of the ladder
// and let the gate have its own test below.
function shopper(shopId) {
  const state = createInitialState();
  state.skills.barter.level = 100;
  state.shopContext = SHOPS[shopId];
  return state;
}

const plain = (lines) => lines.map(stripMarkup);
const isHeading = (line) => /^\S/.test(line) && !line.startsWith("  ");

test("a shop's tabs come from its own tabBy", () => {
  assert.deepEqual(buyTabs(shopper("shop_weapons"))[0], "All");
  // subtype: the seven weapon kinds
  assert.ok(buyTabs(shopper("shop_weapons")).includes("sword"));
  assert.ok(buyTabs(shopper("shop_magic")).includes("scroll"));
  // type: two of them
  assert.deepEqual(buyTabs(shopper("shop_potions")), ["All", "potion", "aid"]);
});

test("a shop with no tabBy gets no tab row at all", () => {
  assert.deepEqual(buyTabs(shopper("shop_food")), [], "16 subtypes would wrap the strip");
  assert.deepEqual(buyTabs(shopper("shop_crafting")), [], "and 21 certainly would");
});

// The reason `slot` is a tabBy value at all.
test("the armoury tabs by slot, in ARMOR_SLOTS order rather than alphabetically", () => {
  const tabs = buyTabs(shopper("shop_armor"));
  assert.equal(tabs[0], "All");

  const slots = tabs.slice(1);
  assert.ok(slots.includes("head") && slots.includes("torso"));
  assert.deepEqual(
    slots,
    ARMOR_SLOTS.filter((s) => slots.includes(s)),
    "head-to-toe, not 'boots, cloak, hands'"
  );
  assert.ok(slots.indexOf("head") < slots.indexOf("boots"), "and head comes before boots");
});

test("every tab strip stays inside the width that makes it wrap", () => {
  // Past roughly a dozen entries the strip wraps out of inventoryList's border
  // label and silently eats the list's first row.
  for (const id of Object.keys(SHOPS)) {
    if (!SHOPS[id].types) continue;
    const tabs = buyTabs(shopper(id));
    assert.ok(tabs.length <= 13, `${id} has ${tabs.length} tabs, which would wrap`);
  }
});

test("a tab shows only its own stock", () => {
  const state = shopper("shop_armor");
  const tabs = buyTabs(state);
  const { itemIds } = buildBuyRows(state, tabs.indexOf("head"));
  for (const id of itemIds.filter(Boolean)) {
    assert.equal(ALL_ITEMS[id].slot, "head", `${id} is not headgear`);
  }
});

test("the All tab shows everything, so nothing is reachable only by tabbing", () => {
  const state = shopper("shop_weapons");
  const all = new Set(buildBuyRows(state, 0).itemIds.filter(Boolean));
  const tabs = buyTabs(state);

  for (let i = 1; i < tabs.length; i++) {
    for (const id of buildBuyRows(state, i).itemIds.filter(Boolean)) {
      assert.ok(all.has(id), `${id} is on the ${tabs[i]} tab but not on All`);
    }
  }
});

// Sections are the next axis DOWN from the tabs, so a subtype-tabbed shop
// mustn't repeat its own strip as a heading over every row.
test("a subtype-tabbed shop has no redundant section headings", () => {
  const lines = plain(buildBuyRows(shopper("shop_weapons"), 0).lines);
  assert.ok(lines.length > 0);
  assert.deepEqual(lines.filter(isHeading), [], "the tabs already say what the headings would");
});

test("a slot-tabbed shop sections by material underneath", () => {
  const state = shopper("shop_armor");
  const lines = plain(buildBuyRows(state, buyTabs(state).indexOf("torso")).lines);
  const headings = lines.filter(isHeading);
  assert.ok(headings.length > 1, `expected material headings, got ${JSON.stringify(headings)}`);
  assert.ok(headings.some((h) => /^Iron \(\d+\)/.test(h)), `expected an Iron heading, got ${headings.join(" | ")}`);
});

test("an untabbed shop still sections, so 386 food items aren't one wall", () => {
  const lines = plain(buildBuyRows(shopper("shop_food"), 0).lines);
  const headings = lines.filter(isHeading);
  assert.ok(headings.length >= 10, `expected many sections, got ${headings.length}`);
  assert.ok(headings.every((h) => /\(\d+\)$/.test(h)), "each carries its count");
});

test("headings and blanks are never actionable", () => {
  const state = shopper("shop_armor");
  const { lines, itemIds } = buildBuyRows(state, buyTabs(state).indexOf("head"));
  lines.forEach((line, i) => {
    const isRow = stripMarkup(line).startsWith("  - ");
    assert.equal(Boolean(itemIds[i]), isRow, `row ${i} (${stripMarkup(line)}) has the wrong id`);
  });
});

test("the barter gate still filters inside a tab", () => {
  const rich = shopper("shop_weapons");
  const poor = shopper("shop_weapons");
  poor.skills.barter.level = 1;

  // Resolved per state: a novice's shop stocks fewer subtypes, so the strip is
  // shorter and the same INDEX would point at a different tab.
  const richIds = buildBuyRows(rich, buyTabs(rich).indexOf("sword")).itemIds.filter(Boolean);
  const poorIds = buildBuyRows(poor, buyTabs(poor).indexOf("sword")).itemIds.filter(Boolean);
  assert.ok(poorIds.length < richIds.length, "a novice sees fewer swords");
  assert.ok(poorIds.every((id) => richIds.includes(id)));
});

test("a shop with nothing on a tab says so rather than rendering blank", () => {
  const state = shopper("shop_weapons");
  state.skills.barter.level = 1;
  const { lines, itemIds } = buildBuyRows(state, buyTabs(state).length - 1);
  assert.ok(lines.length > 0, "never an empty pane");
  if (!itemIds.some(Boolean)) assert.match(plain(lines)[0], /Nothing in stock/);
});

// ----- the sell side -----

function seller(inventory) {
  const state = createInitialState();
  state.shopContext = SHOPS.shop_sell;
  state.inventory = inventory;
  return state;
}

test("the sell screen tabs by type, in ITEM_TYPES order", () => {
  const state = seller({ iron_ore: 5, bread: 2, iron_sword: 1 });
  const tabs = sellTabs(state);
  assert.equal(tabs[0], "All");
  const rest = tabs.slice(1);
  assert.deepEqual(rest, ITEM_TYPES.filter((t) => rest.includes(t)));
});

test("a sell tab shows only that type, and All shows the lot", () => {
  const state = seller({ iron_ore: 5, bread: 2, iron_sword: 1 });
  const tabs = sellTabs(state);

  const food = buildSellRows(state, new Set(), tabs.indexOf("food")).itemIds.filter(Boolean);
  assert.deepEqual(food, ["bread"]);

  const all = buildSellRows(state, new Set(), 0).itemIds.filter(Boolean);
  assert.deepEqual(all.sort(), ["bread", "iron_ore", "iron_sword"]);
});

// The ticks are keyed by item id and deliberately outlive a tab switch, so you
// can tick ore on one tab and bread on another and sell the lot in one press.
test("tick marks render on whichever tab the item is on", () => {
  const state = seller({ iron_ore: 5, bread: 2 });
  const ticked = new Set(["iron_ore", "bread"]);
  const tabs = sellTabs(state);

  for (const tab of ["food", "mining"]) {
    const index = tabs.indexOf(tab);
    if (index < 0) continue;
    const rows = plain(buildSellRows(state, ticked, index).lines).filter((l) => l.includes("["));
    assert.ok(
      rows.some((l) => l.includes("[x]")),
      `expected a tick on the ${tab} tab, got ${rows.join(" | ")}`
    );
  }
});

test("an empty inventory says so", () => {
  const state = seller({});
  assert.match(plain(buildSellRows(state, new Set(), 0).lines)[0], /nothing to sell/i);
});
