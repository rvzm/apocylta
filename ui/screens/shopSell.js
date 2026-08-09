import { ALL_ITEMS } from "../../item_backbone.js";
import { getSellPrice, getBarterXp } from "../../data/shops.js";
import { removeItem, grantSkillXp } from "../../state/gameState.js";
import { recordItemSold } from "../../data/quests.js";
import { openLine, packLine } from "../../data/flavor.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildSellRows(state, selectedIds) {
  const entries = Object.entries(state.inventory).filter(([, qty]) => qty > 0);

  const byType = {};
  for (const [id, qty] of entries) {
    const item = ALL_ITEMS[id];
    const type = item?.type ?? "unknown";
    (byType[type] ??= []).push([id, qty, item]);
  }

  const lines = [];
  const itemIds = [];
  for (const type of Object.keys(byType).sort()) {
    lines.push(`${capitalize(type)}:`);
    itemIds.push(null);
    const sorted = byType[type].sort((a, b) => (a[2]?.name ?? a[0]).localeCompare(b[2]?.name ?? b[0]));
    for (const [id, qty, item] of sorted) {
      const mark = selectedIds.has(id) ? "[x]" : "[ ]";
      const price = item ? getSellPrice(item) : 0;
      lines.push(`  ${mark} [${qty}] ${item?.name ?? id} - ${price}gp ea`);
      itemIds.push(id);
    }
  }

  if (!lines.length) {
    lines.push("You have nothing to sell.");
    itemIds.push(null);
  }

  return { lines, itemIds };
}

function selectedItemId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
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
      state.gold += totalGold;
      grantSkillXp(state, "barter", totalXp);
      selected.clear();
      state.lastMessage = `Sold ${count} item${count === 1 ? "" : "s"} for ${totalGold}gp (+${totalXp} barter xp).`;
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.inventoryList._selectedIds = new Set();
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const selected = ui.inventoryList._selectedIds ?? new Set();
    const { lines, itemIds } = buildSellRows(state, selected);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = itemIds;

    ui.promptRow.setContent(state.lastMessage || "Select items to sell, then confirm.");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Toggle", hotkey: "T" },
          { label: "Sell", hotkey: "S" },
        ],
        { columns: 2 }
      )
    );
  },
};
