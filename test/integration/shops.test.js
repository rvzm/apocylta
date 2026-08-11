// Integration coverage for the shop screens. Until this file, no integration
// test entered a shop at all - shopBuy, shopSell and blackMarket were unit
// tested only, so the purchase path (P -> canAfford -> chargeGold ->
// blackMarketGrants -> addItem -> getBarterXp -> grantSkillXp) had never run
// against a live game.
//
// Two facts make these tests possible, and both are easy to trip over:
//
//   - THE BLACK MARKET KEEPS NIGHT HOURS. Both black markets are
//     `openHours: { open: 23, close: 6 }`, and location.js refuses a closed
//     shop's hub feature. A fresh game starts at 7:38pm, so the market is shut
//     and waiting it out would cost ~3.4 real minutes. The `meditate` action
//     advances the clock 300 minutes instantly and `safehouse` offers it one
//     instant hub-feature hop from town square - see openTheBlackMarket below.
//   - A BOOTSTRAPPED CHARACTER HAS 5500 GOLD. Human's 500 plus deep_pockets'
//     5000 (bootstrapCharacter's default starterPack: 0), which is what makes
//     the 1000-5000 base-unit black-market stock affordable with no admin editor.
//
// Every list position here is derived through test/helpers/rows.js rather than
// hardcoded, for the reason hotkeys.js exists: these screens order themselves
// from live data, so a literal "press Down 7 times" silently stops pointing at
// the row it was written for.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";
import { travelDigit, actionDigit } from "../helpers/hotkeys.js";
import { bootstrappedState, blackMarketRow, shopBuyRow, shopSellRow, buyOnPaper } from "../helpers/rows.js";
import { SHOPS } from "../../data/shops.js";
import { formatBase, purseTotal } from "../../currency_backbone.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// A default character's purse, read rather than assumed so a change to the race
// or pack tables fails the assertion instead of the test's arithmetic.
const START_PURSE = bootstrappedState().cur;
const START_GOLD = purseTotal(START_PURSE);

// Prices and purses are rendered denominated now ("55sy", "1s"), so every
// expectation below is DERIVED through the same formatter the screens use
// rather than spelled out - the same reason rows.js derives list positions.
const money = (base) => formatBase(base, { short: true });
const GENERAL_TYPES = SHOPS.shop_general.types;

function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  return {
    dir,
    env: `DB_PATH=${path.join(dir, "test.sqlite")} LOG_PATH=${path.join(dir, "test.log")}`,
  };
}

// blessed processes keys as it renders, so a burst can overtake the redraw it
// depends on - the same hazard bootstrapCharacter documents for its skill
// toggles. Every multi-key walk here is paced.
const settle = (ms = 90) => new Promise((resolve) => setTimeout(resolve, ms));

async function press(session, key, times = 1) {
  for (let i = 0; i < times; i++) {
    session.sendKeys(key);
    await settle();
  }
}

// Park the cursor on row 0 before counting Downs.
//
// ui.inventoryList is one widget shared by every list screen, and shopBuy and
// shopSell - unlike blackMarket and backpack, which set _resetSelection in
// onEnter - never reset its position. So a shop opens with the cursor wherever
// the last screen left it: bootstrapCharacter ends on charSkills having pressed
// Down once per skill pick, which silently made "one Down" land on the fourth
// row of the shop rather than the first. Walking to the top is independent of
// however many rows the wizard consumed.
async function toTop(session) {
  session.sendKeys(...Array(30).fill("Up"));
  await settle(200);
}

// Every exit used here is instant (category "shop" or a bare path with no
// `time`), so arrival is a single redraw away rather than a countdown screen.
async function travel(session, fromId, toId) {
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(travelDigit(fromId, toId));
  await session.waitFor("What would you like to do?", 10000);
}

// Asserts the header is showing exactly `expectedBase` base units, denominated.
//
// Read off the header rather than the shop's prompt row: both shop screens
// render the purse as `state.lastMessage || "...(N)"`, so the moment a purchase
// succeeds the readout is replaced by the very message proving it did. The
// header is drawn by renderChrome on every screen and survives.
//
// Anchored on the "| " that precedes the purse in headerLeft and the padding
// that follows it, rather than a bare substring match: "5sy" is a substring of
// "55sy", so `includes` would happily pass a purse ten times too large.
//
// The expected string is built with formatBase (the canonical breakdown) while
// the header renders formatCurrency (what the purse actually holds). Those
// agree here because a purse that starts canonical stays canonical - spendFrom
// gives its change back canonically - and every purse in this file starts from
// purseFromBase. A test that earned coins in a named metal could not use this.
function assertPurse(pane, expectedBase, message) {
  const want = money(expectedBase);
  const escaped = want.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(
    pane,
    new RegExp(`\\| ${escaped}\\s`),
    `${message}: expected the header to show ${want} (${expectedBase} base). Pane:\n${pane}`
  );
}

// town square -> safehouse -> meditate (clock +300 minutes) -> back -> the
// black market, which is now inside its 23:00-06:00 window. Leaves the session
// standing in the black market on the location screen.
async function openTheBlackMarket(session) {
  session.sendKeys("s"); // HUB_FEATURES.safehouse, an instant `to:` hop
  await session.waitFor("safehouse");

  session.sendKeys(actionDigit("safehouse", "meditate"));
  await session.waitFor("You meditate and feel your mana restored.");
  assert.match(session.capture(), /\d+:\d+am/, "meditating should have carried the clock past midnight");

  await travel(session, "safehouse", "town_square");
  await travel(session, "town_square", "black_market");
}

test("shops: the general store buys, sells and pays barter xp", async (t) => {
  const { dir, env } = scratch();
  const session = tmuxSession(uniqueSessionName("apocylta-shop"));
  t.after(() => {
    session.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  session.start(`env ${env} node main.js`, { width: 120, height: 40, cwd: PROJECT_ROOT });
  await bootstrapCharacter(session, { name: "Shopper" });

  await travel(session, "town_square", "general_store");

  // --- Buying ---
  session.sendKeys("b"); // HUB_FEATURES.shop_general is "B" for Browse
  await session.waitFor("What would you like to buy?");

  const stock = session.capture();
  assertPurse(stock, START_GOLD, "a fresh character's purse");
  assert.ok(stock.includes(`Axe Starter - ${money(10)}`), "common stock is on the shelf, priced in coins");
  // The barter gate is live: rare stock needs barter 15 and this character has
  // 5. Arcane Essence sorts to the top of the Crafting group, so it is inside
  // the visible pane rather than 300 rows down where a capture can't see it.
  assert.doesNotMatch(stock, /Arcane Essence/, "rare stock is gated at barter 5");

  await toTop(session);
  await press(session, "Down", shopBuyRow("shop_general", GENERAL_TYPES, "axe_starter"));
  session.sendKeys("p");
  await session.waitFor(`Bought Axe Starter for ${money(10)}.`);
  assertPurse(session.capture(), START_GOLD - 10, "the purse paid for it");

  // --- Selling it straight back ---
  session.sendKeys("b"); // Back -> location
  await session.waitFor("What would you like to do?");
  session.sendKeys("o"); // HUB_FEATURES.shop_sell is "O" for Offload
  await session.waitFor("Select items to sell, then confirm.");

  const sellState = buyOnPaper(bootstrappedState(), "axe_starter", 10);
  await toTop(session);
  await press(session, "Down", shopSellRow(sellState, "axe_starter"));
  session.sendKeys("t"); // tick the stack
  await settle();
  assert.match(session.capture(), /\[x\] \[1\] Axe Starter/, "the row ticks");

  session.sendKeys("s");
  // Sells back at 40% of the buy price, and pays barter xp on what changed
  // hands - recordItemSold rides this same path, and has no other end-to-end
  // coverage since it can't be reconstructed from state.
  await session.waitFor(`Sold 1 item for ${money(4)} (+1 barter xp).`);
});

test("black market: a purchase equips into its own slot and moves a real gate", async (t) => {
  const { dir, env } = scratch();
  const session = tmuxSession(uniqueSessionName("apocylta-blackmarket"));
  t.after(() => {
    session.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  session.start(`env ${env} node main.js`, { width: 120, height: 40, cwd: PROJECT_ROOT });
  await bootstrapCharacter(session, { name: "Buyer" });

  // --- What the general store looks like before any enhancement ---
  await travel(session, "town_square", "general_store");
  session.sendKeys("b");
  await session.waitFor("What would you like to buy?");
  assert.doesNotMatch(session.capture(), /Arcane Essence/, "rare stock starts gated");
  session.sendKeys("b");
  await session.waitFor("What would you like to do?");
  await travel(session, "general_store", "town_square");

  // --- The market keeps night hours, and says so ---
  await travel(session, "town_square", "black_market");
  session.sendKeys("e"); // shop_enhancements, at 7:38pm
  await session.waitFor("The black market is closed right now. Come back later.");

  // --- Meditate past midnight and it lets us in ---
  await travel(session, "black_market", "town_square");
  await openTheBlackMarket(session);

  session.sendKeys("e");
  await session.waitFor("What are you after?");
  const stall = session.capture();
  assertPurse(stall, START_GOLD, "nothing spent yet");
  assert.match(stall, /Charms/, "the tab strip names the enhancement sections");
  assert.match(stall, /Talismans/);

  // --- Buy the Barter Talisman ---
  const { rowIndex } = blackMarketRow("enhancements", "Talismans", "barter_talisman");
  await press(session, "Right"); // Charms -> Talismans
  await press(session, "Down", rowIndex);
  session.sendKeys("p");
  await session.waitFor(`Bought Barter Talisman for ${money(5000)}.`);
  assertPurse(session.capture(), START_GOLD - 5000, "the talisman was paid for");

  // --- Equip it. The enhancement tab is last in ITEM_TYPES, so one Left wraps
  // straight onto it, and it holds exactly the one thing we just bought. ---
  session.sendKeys("b");
  await session.waitFor("What would you like to do?");
  session.sendKeys("m");
  await session.waitFor("[S]ave");
  session.sendKeys("b"); // Menu -> Backpack
  await session.waitFor("[E]quip");
  await press(session, "Left");
  assert.match(session.capture(), /Barter Talisman/, "the enhancement tab holds it");

  session.sendKeys("e");
  await session.waitFor("Equipped Barter Talisman");

  // It equips into its own tier, not the armor paperdoll - the Menu lists the
  // worn five on their own line.
  session.sendKeys("b"); // Backpack -> Menu (returnScreen)
  await session.waitFor("[S]ave");
  assert.match(session.capture(), /Enhancements: Barter Talisman/, "the Menu lists it as worn");

  // --- And it moves a gate the trained level never reached ---
  session.sendKeys("Escape");
  await session.waitFor("What would you like to do?");
  await travel(session, "black_market", "town_square");
  await travel(session, "town_square", "general_store");
  session.sendKeys("b");
  await session.waitFor("What would you like to buy?");
  // effectiveSkillLevel took barter from 5 to 15 and shopBuy's isPurchasable
  // gate opened. The trained level did not move - only what it gates.
  assert.match(session.capture(), /Arcane Essence/, "rare stock is on the shelf now");
});

test("black market: both collections route to one screen, and a bundle grants its contents", async (t) => {
  const { dir, env } = scratch();
  const session = tmuxSession(uniqueSessionName("apocylta-bundles"));
  t.after(() => {
    session.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  session.start(`env ${env} node main.js`, { width: 120, height: 40, cwd: PROJECT_ROOT });
  await bootstrapCharacter(session, { name: "Fence" });

  await openTheBlackMarket(session);

  // --- Illicit Goods: a different collection through the same screen ---
  session.sendKeys("i"); // shop_illegal
  await session.waitFor("What are you after?");
  const illicit = session.capture();
  assert.match(illicit, /Magic Focuses/, "illicit_goods has its own sections");
  assert.match(illicit, /Smithing Bundles/);
  assert.doesNotMatch(illicit, /Charms/, "and not the enhancement shop's");

  // --- A bundle says what is actually in it, and hands that over ---
  const { tabIndex, rowIndex } = blackMarketRow("illicit_goods", "Smithing Bundles", "box_of_coal");
  await press(session, "Right", tabIndex);
  await press(session, "Down", rowIndex);
  assert.match(session.capture(), /Box of Coal \(100x Coal\)/, "the row names its contents");

  session.sendKeys("p");
  await session.waitFor(`Bought Box of Coal for ${money(1000)}.`);

  // blackMarketGrants hands over `outputs` rather than an item named by the
  // key: there is no "Box of Coal" item, only the 100 coal it stood for.
  session.sendKeys("b");
  await session.waitFor("What would you like to do?");
  session.sendKeys("m");
  await session.waitFor("[S]ave");
  session.sendKeys("b");
  await session.waitFor("[E]quip");
  const pack = session.capture();
  assert.match(pack, /\[100\] Coal/, "100 coal landed in the backpack");
  assert.doesNotMatch(pack, /Box of Coal/, "and the bundle itself is not an item");

  // --- Same screen, different stock ---
  session.sendKeys("b"); // -> Menu
  await session.waitFor("[S]ave");
  session.sendKeys("Escape");
  await session.waitFor("What would you like to do?");
  session.sendKeys("e"); // shop_enhancements
  await session.waitFor("What are you after?");
  const enhancements = session.capture();
  assert.match(enhancements, /Charms/, "the enhancement sections, on the screen that just showed illicit goods");
  assert.doesNotMatch(enhancements, /Smithing Bundles/);
});
