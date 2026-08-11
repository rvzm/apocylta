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
import { buildBuyRows } from "../../ui/screens/shopBuy.js";
import { buildSellRows } from "../../ui/screens/shopSell.js";
import { ALL_ITEMS } from "../../item_backbone.js";

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

// Where `itemId` sits in a buying shop's list. Group headers occupy rows too
// (their itemId is null), which is exactly why this counts rather than guesses.
export function shopBuyRow(shopId, types, itemId, state = bootstrappedState()) {
  state.shopContext = { id: shopId, mode: "buy", types };
  const { itemIds } = buildBuyRows(state);
  const rowIndex = itemIds.indexOf(itemId);
  assert.ok(rowIndex >= 0, `${itemId} is not stocked by ${shopId} at this barter level`);
  return rowIndex;
}

// Where `itemId` sits on the sell screen, given the inventory `state` carries.
export function shopSellRow(state, itemId) {
  const { itemIds } = buildSellRows(state, new Set());
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
