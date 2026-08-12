import { ALL_ITEMS, ITEM_TYPES, ARMOR_SLOTS } from "../../item_backbone.js";
import { getBuyPrice, isPurchasable, getBarterXp, canAfford, chargeGold } from "../../data/shops.js";
import { indoorTimeLine, openLine } from "../../data/flavor.js";
import { addItem, grantSkillXp, effectiveSkillLevel } from "../../state/gameState.js";
import { formatBase, formatCurrency } from "../../currency_backbone.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import { cycleTab, formatTabStrip } from "../tabs.js";
import { buildTabList, pushSections, rowBuilder } from "../listScreen.js";

function capitalize(word) {
  return String(word).replace(/_/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// The vocabularies that give a tab strip a sensible order. `subtype` has no one
// vocabulary - it spans WEAPON_TYPES, MAGIC_CATEGORIES, SCRAP_TYPES and more
// depending on the shop - so it sorts alphabetically.
const TAB_ORDER = { type: ITEM_TYPES, slot: ARMOR_SLOTS };

// Everything this shop stocks that your barter level will let you buy.
function stockOf(state) {
  const shop = state.shopContext;
  const barterLevel = effectiveSkillLevel(state, "barter");
  return Object.entries(ALL_ITEMS).filter(
    ([, item]) => shop.types.includes(item.type) && isPurchasable(item, barterLevel)
  );
}

// The shop's own axis (data/shops.js's `tabBy`), or no tabs at all.
export function buyTabs(state) {
  const field = state.shopContext?.tabBy;
  if (!field) return [];
  return buildTabList(stockOf(state), { field, order: TAB_ORDER[field] });
}

// Exported so the row building can be exercised without blessed - the same
// reason blackMarket.js's buildBlackMarketRows, spellbook.js's buildSpellRows
// and achievements.js's buildRows are. test/helpers/rows.js uses it to derive
// how far down a row sits rather than hardcoding a position that the barter
// gate or a catalog addition would shift.
export function buildBuyRows(state, tabIndex = 0) {
  const shop = state.shopContext;
  const tabs = buyTabs(state);
  const activeTab = tabs[tabIndex];

  let entries = stockOf(state);
  if (activeTab && activeTab !== "All") {
    entries = entries.filter(([, item]) => item[shop.tabBy] === activeTab);
  }

  const { lines, ids, push } = rowBuilder();

  // Sections are the next axis DOWN from the tabs. Where the tabs already cut
  // by subtype there is nothing finer to head rows with, so they come out as
  // one sorted list rather than one heading per row.
  // "other" rather than "" for the handful of items with no subtype at all
  // (Helm of Valor, the aegis shield): an empty key means "no heading", which
  // would float them above the first one looking like a rendering slip.
  const sectionOf = shop.tabBy === "subtype" ? () => null : ([, item]) => item.subtype || "other";

  pushSections(push, entries, {
    sectionOf,
    label: (key, group) => `${capitalize(key)} (${group.length})`,
    row: ([id, item]) => [
      `  - ${item.name} - ${formatBase(getBuyPrice(item), { short: true })}`,
      id,
    ],
  });

  if (!lines.length) {
    push("Nothing in stock at your barter level yet.");
  }

  return { lines, itemIds: ids };
}

function selectedItemId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

function switchTab(state, ui, direction) {
  const tabs = buyTabs(state);
  if (tabs.length < 2) return; // a shop with no strip has nothing to cycle
  cycleTab(ui, "_tabIndex", direction, tabs.length);
  ui.inventoryList._resetSelection = true;
}

export const shopBuyScreen = {
  // Shared by every buying shop, so the lines stay generic and openLine does
  // the location-specific work off the current location's openHours.
  subHeader: [
    "Everything here has been owned before, and most of it shows it.",
    "Prices are chalked on a board and rubbed out often.",
    openLine,
    indoorTimeLine,
  ],

  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    P: (state, ui) => {
      const itemId = selectedItemId(ui);
      if (!itemId) {
        state.lastMessage = "Select an item first.";
        return;
      }
      const item = ALL_ITEMS[itemId];
      const price = getBuyPrice(item);
      if (!canAfford(state, price)) {
        state.lastMessage = `You can't afford ${item.name} (${formatBase(price, { short: true })}).`;
        return;
      }
      chargeGold(state, price);
      addItem(state, itemId, 1);
      grantSkillXp(state, "barter", getBarterXp(item, 1));
      state.lastMessage = `Bought ${item.name} for ${formatBase(price, { short: true })}.`;
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.inventoryList._tabIndex = 0;
    ui.inventoryList._resetSelection = true;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.inventoryList.setLabel(""); // clear the strip so other screens don't inherit it
    ui.mainContent.show();
  },

  render(state, ui) {
    const tabs = buyTabs(state);
    const tabIndex = tabs.length ? Math.min(ui.inventoryList._tabIndex ?? 0, tabs.length - 1) : 0;
    ui.inventoryList._tabIndex = tabIndex;

    const { lines, itemIds } = buildBuyRows(state, tabIndex);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = itemIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }
    // A shop with no `tabBy` gets no strip at all - an empty label, not an
    // empty-looking one-entry strip.
    ui.inventoryList.setLabel(tabs.length ? ` ${formatTabStrip(tabs, tabIndex)} ` : "");

    ui.promptRow.setContent(
      state.lastMessage || `What would you like to buy? (${formatCurrency(state.cur, { short: true })})`
    );
    ui.commandList.setContent(
      formatCommandRow(
        buyTabs(state).length > 1
          ? [
              { label: "Back", hotkey: "B" },
              { label: "Switch tab", hotkey: "<>" },
              { label: "Purchase", hotkey: "P" },
            ]
          : [
              { label: "Back", hotkey: "B" },
              { label: "Purchase", hotkey: "P" },
            ],
        { columns: 2 }
      )
    );
  },
};
