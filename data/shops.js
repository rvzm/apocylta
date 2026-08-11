// apocylta world data - shops (buy/sell)

import { SHOP_RARITY_DISPLAY } from "../item_backbone.js";

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
  shop_illegal: { id: "shop_illegal", mode: "buy", types: ["treasure"] },
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
export function getBuyPrice(item) {
  return item.value ?? BASE_BUY_PRICE * rarityLevel(item);
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

// The two halves of paying, kept here with the rest of the pricing logic
// rather than inline in the screens - both have to know about godmode, because
// leaving the affordability guard behind would refuse the purchase before the
// free spend ever ran. Also the only form of these that a unit test can reach
// without driving a screen keymap through a fake ui.
export function canAfford(state, price) {
  return state.godmode === true || state.gold >= price;
}

export function chargeGold(state, price) {
  if (!state.godmode) state.gold -= price;
}
