import { ALL_ITEMS, ITEM_TYPES } from "../../item_backbone.js";
import { getSellPrice, getBarterXp } from "../../data/shops.js";
import { removeItem, grantSkillXp, addCurrency } from "../../state/gameState.js";
import { formatBase } from "../../currency_backbone.js";
import { recordItemSold } from "../../data/quests.js";
import { openLine, packLine } from "../../data/flavor.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import { cycleTab, formatTabStrip } from "../tabs.js";
import { buildTabList, pushSections, rowBuilder } from "../listScreen.js";

function capitalize(word) {
  return String(word).replace(/_/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// Whatever you're carrying, paired with its catalog entry. An id the catalog no
// longer knows still sells (for nothing), so it can be got rid of rather than
// being stuck in the inventory for ever.
function carried(state) {
  return Object.entries(state.inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => [id, { ...(ALL_ITEMS[id] ?? { name: id, type: "unknown" }), qty }]);
}

export function sellTabs(state) {
  const field = state.shopContext?.tabBy;
  if (!field) return [];
  return buildTabList(carried(state), { field, order: field === "type" ? ITEM_TYPES : null });
}

// Exported for the same reason as shopBuy.js's buildBuyRows - see the note
// there. `selectedIds` is only the tick marks, so a caller that just wants the
// row order can pass an empty Set.
export function buildSellRows(state, selectedIds, tabIndex = 0) {
  const field = state.shopContext?.tabBy;
  const tabs = sellTabs(state);
  const activeTab = tabs[tabIndex];

  let entries = carried(state);
  if (activeTab && activeTab !== "All") {
    entries = entries.filter(([, item]) => item[field] === activeTab);
  }

  const { lines, ids, push } = rowBuilder();

  pushSections(push, entries, {
    sectionOf: field === "subtype" ? () => null : ([, item]) => item.subtype || "other",
    label: (key, group) => `${capitalize(key)} (${group.length})`,
    row: ([id, item]) => [
      `  ${selectedIds.has(id) ? "[x]" : "[ ]"} [${item.qty}] ${item.name ?? id} - ` +
        `${formatBase(ALL_ITEMS[id] ? getSellPrice(ALL_ITEMS[id]) : 0, { short: true })} ea`,
      id,
    ],
  });

  if (!lines.length) {
    push(entries.length ? "Nothing of that kind to sell." : "You have nothing to sell.");
  }

  return { lines, itemIds: ids };
}

function selectedItemId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

// Moves the cursor's tab, NOT the tick marks. _selectedIds is keyed by item id
// and deliberately survives this, so you can tick ore on one tab and bread on
// another and sell the lot in one press of [S].
function switchTab(state, ui, direction) {
  const tabs = sellTabs(state);
  if (tabs.length < 2) return;
  cycleTab(ui, "_tabIndex", direction, tabs.length);
  ui.inventoryList._resetSelection = true;
}

export const shopSellScreen = {
  subHeader: [
    "The buyer looks over everything twice and offers less the second time.",
    "A crate by the counter is already full of things someone else gave up on.",
    "Nothing you brought is worth what you think it is.",
    packLine,
    openLine,
  ],

  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    T: (state, ui) => {
      const itemId = selectedItemId(ui);
      if (!itemId) {
        state.lastMessage = "Select an item first.";
        return;
      }
      const selected = ui.inventoryList._selectedIds;
      if (selected.has(itemId)) {
        selected.delete(itemId);
      } else {
        selected.add(itemId);
      }
    },
    S: (state, ui) => {
      const selected = ui.inventoryList._selectedIds;
      if (!selected.size) {
        state.lastMessage = "No items selected.";
        return;
      }
      let totalGold = 0;
      let totalXp = 0;
      let count = 0;
      for (const itemId of selected) {
        const qty = state.inventory[itemId];
        const item = ALL_ITEMS[itemId];
        if (!qty || !item) continue;
        const price = getSellPrice(item);
        totalGold += price * qty;
        totalXp += getBarterXp(item, qty);
        // Forced: unforced, godmode would pay for goods it never handed over.
        removeItem(state, itemId, qty, { force: true });
        recordItemSold(state, itemId, qty);
        count++;
      }
      // Paid in loose copper - a fence counts out small change, and the purse
      // holds what it was given rather than tidying itself.
      addCurrency(state, totalGold);
      grantSkillXp(state, "barter", totalXp);
      selected.clear();
      const paid = formatBase(totalGold, { short: true });
      state.lastMessage = `Sold ${count} item${count === 1 ? "" : "s"} for ${paid} (+${totalXp} barter xp).`;
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.inventoryList._selectedIds = new Set();
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
    const selected = ui.inventoryList._selectedIds ?? new Set();
    const tabs = sellTabs(state);
    const tabIndex = tabs.length ? Math.min(ui.inventoryList._tabIndex ?? 0, tabs.length - 1) : 0;
    ui.inventoryList._tabIndex = tabIndex;

    const { lines, itemIds } = buildSellRows(state, selected, tabIndex);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = itemIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }
    ui.inventoryList.setLabel(tabs.length ? ` ${formatTabStrip(tabs, tabIndex)} ` : "");

    // Counts across every tab, not just the visible one - the tick marks span
    // them, so the prompt has to as well or [S] looks like it will sell less
    // than it is about to.
    const ticked = selected.size ? ` (${selected.size} ticked)` : "";
    ui.promptRow.setContent(state.lastMessage || `Select items to sell, then confirm.${ticked}`);
    ui.commandList.setContent(
      formatCommandRow(
        tabs.length > 1
          ? [
              { label: "Back", hotkey: "B" },
              { label: "Switch tab", hotkey: "<>" },
              { label: "Toggle", hotkey: "T" },
              { label: "Sell", hotkey: "S" },
            ]
          : [
              { label: "Back", hotkey: "B" },
              { label: "Toggle", hotkey: "T" },
              { label: "Sell", hotkey: "S" },
            ],
        { columns: 2 }
      )
    );
  },
};
