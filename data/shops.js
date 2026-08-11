// apocylta world data - shops (buy/sell)

import { SHOP_RARITY_DISPLAY } from "../item_backbone.js";
import { canAffordCurrency, spendCurrency } from "../state/gameState.js";
import { toBase } from "../currency_backbone.js";

export const SHOPS = {
  shop_weapons: { id: "shop_weapons", mode: "buy", types: ["weapon"] },
  shop_armor: { id: "shop_armor", mode: "buy", types: ["armor"] },
  shop_magic: { id: "shop_magic", mode: "buy", types: ["magic"] },
  // "aid" rides along with potions rather than getting its own shop: bandages,
  // antidotes and revives are apothecary stock, and no other shop's `types`
  // listed them - which left every aid item, and with it the pre-death revive
  // in data/combat.js, unobtainable in a real run.
  shop_potions: { id: "shop_potions", mode: "buy", types: ["potion", "aid"] },
  shop_general: { id: "shop_general", mode: "buy", types: ["tool", "crafting", "food", "scrap", "kit"] },
  // The two black-market shops sell out of BLACKMARKET rather than ALL_ITEMS,
  // so they carry a `blackMarket` collection key instead of `types` and use the
  // same `screen` override shop_housing already does - which is what lets
  // ui/screens/location.js route them with no change of its own.
  shop_illegal: { id: "shop_illegal", mode: "buy", screen: "blackMarket", blackMarket: "illicit_goods" },
  shop_enhancements: { id: "shop_enhancements", mode: "buy", screen: "blackMarket", blackMarket: "enhancements" },
  shop_sell: { id: "shop_sell", mode: "sell" },
  // `screen` overrides the default buy/sell routing - housing sells a house
  // and stations, not ALL_ITEMS entries, so it needs its own screen.
  shop_housing: { id: "shop_housing", mode: "buy", screen: "shopHousing" },
};

export function getShop(id) {
  return SHOPS[id];
}

const BASE_BUY_PRICE = 10;
const SELL_FRACTION = 0.4;
const BASE_XP_PER_ITEM = 1;

function rarityLevel(item) {
  return SHOP_RARITY_DISPLAY[item.rarity]?.level ?? 1;
}

// TREASURE_ITEMS already has a hand-set `value` - use it when present,
// otherwise derive from rarity so the many unpriced ITEMS entries get a
// consistent price with zero per-item data entry.
//
// Prices are in BASE UNITS (copper coins). An item may quote its `value` in
// another denomination with `curType` (and optionally `curSubtype`), which
// toBase resolves - `{ value: 3, curType: "gold" }` is 60. Both default to
// copper coins, so an entry carrying a bare `value` means exactly what it
// always did and needs no edit.
export function getBuyPrice(item) {
  if (item.value === undefined) return BASE_BUY_PRICE * rarityLevel(item);
  return toBase(item.value, item.curType, item.curSubtype);
}

export function getSellPrice(item) {
  return Math.max(1, Math.round(getBuyPrice(item) * SELL_FRACTION));
}

// Same multiplicative-by-rarity-level shape as pricing, applied to quantity.
export function getBarterXp(item, qty) {
  return BASE_XP_PER_ITEM * rarityLevel(item) * qty;
}

export function isPurchasable(item, barterLevel) {
  return rarityLevel(item) <= barterLevel;
}

// The two halves of paying. Thin wrappers over the purse helpers in
// state/gameState.js, kept here under the names the shop screens already call
// so the pricing vocabulary stays in one module - and because both halves have
// to agree about godmode, since leaving the affordability guard behind would
// refuse the purchase before the free spend ever ran.
//
// `price` is in base units, which is what getBuyPrice returns.
export function canAfford(state, price) {
  return canAffordCurrency(state, price);
}

export function chargeGold(state, price) {
  return spendCurrency(state, price);
}
