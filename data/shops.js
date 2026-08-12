// apocylta world data - shops (buy/sell)

import { SHOP_RARITY_DISPLAY } from "../item_backbone.js";
import { canAffordCurrency, spendCurrency } from "../state/gameState.js";
import { toBase } from "../currency_backbone.js";

// `tabBy` names the ITEM FIELD a shop's tab strip is cut by - "type", "subtype"
// or "slot". Omit it and the shop gets no tab row at all, just sections.
//
// The choice per shop is "the finest axis whose strip actually fits". That
// ceiling is real: the strip lives in inventoryList's border LABEL, and past
// roughly a dozen entries it wraps onto a second line and silently eats the
// list's first row - the same trap compactTabLabel exists for on the admin
// editors. So shop_crafting (21 subtypes) and shop_food (16) get no strip and
// lean on sections instead, while shop_weapons (7) and shop_magic (8) tab by
// subtype comfortably.
//
// `slot` exists as an option because of armour specifically: its `subtype` is
// the MATERIAL, and 23 of those don't fit, while the 11 slots do - and someone
// walking into an armoury wants a helmet rather than something tin.
export const SHOPS = {
  shop_weapons: { id: "shop_weapons", mode: "buy", types: ["weapon"], tabBy: "subtype" },
  shop_armor: { id: "shop_armor", mode: "buy", types: ["armor"], tabBy: "slot" },
  shop_magic: { id: "shop_magic", mode: "buy", types: ["magic"], tabBy: "subtype" },
  // "aid" rides along with potions rather than getting its own shop: bandages,
  // antidotes and revives are apothecary stock, and no other shop's `types`
  // listed them - which left every aid item, and with it the pre-death revive
  // in data/combat.js, unobtainable in a real run.
  shop_potions: { id: "shop_potions", mode: "buy", types: ["potion", "aid"], tabBy: "type" },
  shop_general: { id: "shop_general", mode: "buy", types: ["tool", "kit"], tabBy: "type" },
  // 21 subtypes and 16 - too many for a strip, so these two are sectioned only.
  shop_crafting: { id: "shop_crafting", mode: "buy", types: ["crafting"] },
  shop_food: { id: "shop_food", mode: "buy", types: ["food"] },
  shop_scrap: { id: "shop_scrap", mode: "buy", types: ["scrap"], tabBy: "subtype" },
  // The two black-market shops sell out of BLACKMARKET rather than ALL_ITEMS,
  // so they carry a `blackMarket` collection key instead of `types` and use the
  // same `screen` override shop_housing already does - which is what lets
  // ui/screens/location.js route them with no change of its own.
  shop_illegal: { id: "shop_illegal", mode: "buy", screen: "blackMarket", blackMarket: "illicit_goods" },
  shop_enhancements: { id: "shop_enhancements", mode: "buy", screen: "blackMarket", blackMarket: "enhancements" },
  // Sells whatever you happen to be carrying, which spans types.
  shop_sell: { id: "shop_sell", mode: "sell", tabBy: "type" },
  // `screen` overrides the default buy/sell routing - housing sells a house
  // and stations, not ALL_ITEMS entries, so it needs its own screen.
  shop_housing: { id: "shop_housing", mode: "buy", screen: "shopHousing" },
};

export function getShop(id) {
  return SHOPS[id];
}

const BASE_BUY_PRICE = 10;
// Exported so test/unit/economy.test.js derives its craft ceiling (1 /
// SELL_FRACTION) from the real number rather than hardcoding 2.5 - re-pitching
// the sell fraction should re-pitch the invariant, not silently void it.
export const SELL_FRACTION = 0.4;
const BASE_XP_PER_ITEM = 1;

function rarityLevel(item) {
  return SHOP_RARITY_DISPLAY[item.rarity]?.level ?? 1;
}

// EVERY item in ALL_ITEMS now carries a literal `value`, so the rarity fallback
// below is unreachable for a real catalog entry - it survives only for the bare
// shapes callers construct by hand (and is still what STATIONS/PROPERTY would
// fall back to if one were added unpriced). It is no longer the pricing model:
// rarity sets the BAND (item_backbone.js's RARITY_BANDS) and the item's own
// power sets where in that band it sits. test/unit/itemBackboneConsistency.js
// enforces both halves.
//
// Prices are in BASE UNITS (copper coins). An item may quote its `value` in
// another denomination with `curType` (and optionally `curSubtype`), which
// toBase resolves - `{ value: 3, curType: "gold" }` is 60. Both default to
// copper coins, and no catalog entry uses them: the whole catalog is authored
// in bare copper so two prices can be compared by eye.
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
