// test/helpers/rows.js - resolves how far down a list screen a given row sits,
// by asking the very functions the screens render with.
//
// The sibling of hotkeys.js, and for the same reason: these screens order
// themselves from live data (the barter gate decides what a shop stocks, prices
// decide the black market's order, the inventory decides the sell list), so a
// hardcoded "press Down 7 times" is a number that quietly stops pointing at the
// row it was written for. Every helper here returns a count of Down presses,
// derived from a synthetic state built the same way a bootstrapped test
// character is.
import assert from "node:assert/strict";
import { createInitialState, finalizeCharacter, addItem, equipItem } from "../../state/gameState.js";
import { buildBlackMarketRows, tabsFor } from "../../ui/screens/blackMarket.js";
import { buildBuyRows, buyTabs } from "../../ui/screens/shopBuy.js";
import { buildSellRows } from "../../ui/screens/shopSell.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { SHOPS } from "../../data/shops.js";

// The character bootstrapCharacter() actually produces with its defaults:
// human (the first race), warrior (the first class), deep_pockets (starterPack
// 0) and normal difficulty. Worth keeping in step with that helper - the whole
// point is that these indices match what the running game will render.
export function bootstrappedState() {
  const state = createInitialState();
  finalizeCharacter(state, {
    name: "Tester",
    difficultyId: "normal",
    starterPackId: "deep_pockets",
    raceId: "human",
    classId: "warrior",
    proficientSkillIds: [],
  });
  return state;
}

// Where `itemId` sits in one of the black market's tabs.
// `collection` is "enhancements" or "illicit_goods" - the same key data/shops.js
// puts on the shop's `blackMarket` field.
export function blackMarketRow(collection, tabLabel, itemId, state = bootstrappedState()) {
  state.shopContext = { blackMarket: collection };

  const tabs = tabsFor(state);
  const tabIndex = tabs.indexOf(tabLabel);
  assert.ok(tabIndex >= 0, `no "${tabLabel}" tab in ${collection} (have: ${tabs.join(", ")})`);

  const { itemIds } = buildBlackMarketRows(state, tabIndex);
  const rowIndex = itemIds.indexOf(itemId);
  assert.ok(rowIndex >= 0, `${itemId} is not on the ${tabLabel} tab of ${collection}`);

  return { tabIndex, rowIndex, tabs };
}

// Where `itemId` sits in a buying shop's list, on the "All" tab. Section
// headings occupy rows too (their itemId is null), which is exactly why this
// counts rather than guesses.
//
// Shops take their tab axis from data/shops.js's `tabBy`, so the real SHOPS
// entry is used rather than a synthetic one - a hand-built { types } would tab
// differently from the shop the game actually opens.
export function shopBuyRow(shopId, types, itemId, state = bootstrappedState()) {
  state.shopContext = SHOPS[shopId] ?? { id: shopId, mode: "buy", types };
  const { itemIds } = buildBuyRows(state, 0);
  const rowIndex = itemIds.indexOf(itemId);
  assert.ok(rowIndex >= 0, `${itemId} is not stocked by ${shopId} at this barter level`);
  return rowIndex;
}

// The same, but on a named tab - returns the presses needed to get there as
// well as down, the way blackMarketRow does.
export function shopBuyTabRow(shopId, tabLabel, itemId, state = bootstrappedState()) {
  state.shopContext = SHOPS[shopId];
  const tabs = buyTabs(state);
  const tabIndex = tabs.indexOf(tabLabel);
  assert.ok(tabIndex >= 0, `no "${tabLabel}" tab in ${shopId} (have: ${tabs.join(", ")})`);

  const { itemIds } = buildBuyRows(state, tabIndex);
  const rowIndex = itemIds.indexOf(itemId);
  assert.ok(rowIndex >= 0, `${itemId} is not on the ${tabLabel} tab of ${shopId}`);
  return { tabIndex, rowIndex, tabs };
}

// Where `itemId` sits on the sell screen, on the "All" tab.
export function shopSellRow(state, itemId) {
  state.shopContext ??= SHOPS.shop_sell;
  const { itemIds } = buildSellRows(state, new Set(), 0);
  const rowIndex = itemIds.indexOf(itemId);
  assert.ok(rowIndex >= 0, `${itemId} is not in the inventory to sell`);
  return rowIndex;
}

// Mirrors a purchase on the synthetic state, so a later lookup sees the same
// list the game will. Only what these tests need: gold out, item in.
export function buyOnPaper(state, itemId, price, qty = 1) {
  state.gold -= price;
  addItem(state, itemId, qty);
  return state;
}

// Mirrors equipping an enhancement, for looking up rows on a screen whose
// contents depend on effectiveSkillLevel (the buy list, via the barter gate).
export function equipOnPaper(state, itemId) {
  const slot = ALL_ITEMS[itemId]?.enhancementSlot;
  assert.ok(slot, `${itemId} is not an enhancement`);
  equipItem(state, itemId, slot);
  return state;
}
