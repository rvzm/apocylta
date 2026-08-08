import { ALL_ITEMS } from "../../item_backbone.js";
import { getBuyPrice, isPurchasable, getBarterXp, canAfford, chargeGold } from "../../data/shops.js";
import { addItem, grantSkillXp } from "../../state/gameState.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildBuyRows(state) {
  const shop = state.shopContext;
  const barterLevel = state.skills.barter.level;

  const entries = Object.entries(ALL_ITEMS).filter(
    ([, item]) => shop.types.includes(item.type) && isPurchasable(item, barterLevel)
  );

  const byType = {};
  for (const [id, item] of entries) {
    (byType[item.type] ??= []).push([id, item]);
  }

  const lines = [];
  const itemIds = [];
  for (const type of Object.keys(byType).sort()) {
    lines.push(`${capitalize(type)}:`);
    itemIds.push(null);
    const sorted = byType[type].sort((a, b) => a[1].name.localeCompare(b[1].name));
    for (const [id, item] of sorted) {
      lines.push(`  - ${item.name} - ${getBuyPrice(item)}gp`);
      itemIds.push(id);
    }
  }

  if (!lines.length) {
    lines.push("Nothing in stock at your barter level yet.");
    itemIds.push(null);
  }

  return { lines, itemIds };
}

function selectedItemId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const shopBuyScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    P: (state, ui) => {
      const itemId = selectedItemId(ui);
      if (!itemId) {
        state.lastMessage = "Select an item first.";
        return;
      }
      const item = ALL_ITEMS[itemId];
      const price = getBuyPrice(item);
      if (!canAfford(state, price)) {
        state.lastMessage = `You can't afford ${item.name} (${price}gp).`;
        return;
      }
      chargeGold(state, price);
      addItem(state, itemId, 1);
      grantSkillXp(state, "barter", getBarterXp(item, 1));
      state.lastMessage = `Bought ${item.name} for ${price}gp.`;
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const { lines, itemIds } = buildBuyRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = itemIds;

    ui.promptRow.setContent(state.lastMessage || `What would you like to buy? (gp: ${state.gold})`);
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Purchase", hotkey: "P" },
        ],
        { columns: 2 }
      )
    );
  },
};
