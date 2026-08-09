import { test } from "node:test";
import assert from "node:assert/strict";
import { getBuyPrice, getSellPrice, getBarterXp, isPurchasable } from "../../data/shops.js";
import { ALL_ITEMS, SHOP_RARITY_DISPLAY } from "../../item_backbone.js";

test("getBuyPrice() derives from rarity when no explicit value is set", () => {
  const item = ALL_ITEMS["tin_ore"]; // common rarity, no explicit `value`
  assert.equal(item.value, undefined);
  assert.equal(getBuyPrice(item), 10); // BASE_BUY_PRICE(10) * common level(1)
});

test("getBuyPrice() prefers an explicit value when present", () => {
  const item = { rarity: "common", value: 999 };
  assert.equal(getBuyPrice(item), 999);
});

test("getSellPrice() is 40% of buy price, rounded, minimum 1", () => {
  const item = { rarity: "common", value: 10 };
  assert.equal(getSellPrice(item), 4);
  const cheapItem = { rarity: "common", value: 1 };
  assert.equal(getSellPrice(cheapItem), 1);
});

test("getBarterXp() scales with rarity level and quantity", () => {
  const common = { rarity: "common" };
  const legendary = { rarity: "legendary" };
  assert.equal(getBarterXp(common, 2), 2); // 1 * level(1) * 2
  assert.ok(getBarterXp(legendary, 2) > getBarterXp(common, 2));
});

// Read off SHOP_RARITY_DISPLAY rather than hardcoded: the rarity ladder is
// tuning data and has been re-pitched once already (legendary moved 15 -> 35
// when mythic/godlike were added), which broke this test for no real reason.
test("isPurchasable() gates on barter level vs item rarity level", () => {
  const legendary = { rarity: "legendary" };
  const required = SHOP_RARITY_DISPLAY.legendary.level;

  assert.equal(isPurchasable(legendary, 1), false);
  assert.equal(isPurchasable(legendary, required - 1), false);
  assert.equal(isPurchasable(legendary, required), true);

  // A common item is buyable from the very first barter level, whatever the
  // ladder above it looks like.
  assert.equal(isPurchasable({ rarity: "common" }, 1), true);
});
