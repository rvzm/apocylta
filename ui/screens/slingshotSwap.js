import { ALL_ITEMS } from "../../item_backbone.js";
import { equipItem } from "../../state/gameState.js";
import { formatCommandRow } from "../format.js";
import { switchScreen, popScreen } from "../router.js";

// No tabs here (unlike toolSwap) - slingshot is a single weapon subtype, so
// there's only ever one category to browse.
function ownedSlingshots(state) {
  return Object.entries(state.inventory).filter(([id]) => {
    const item = ALL_ITEMS[id];
    return item?.type === "weapon" && item.subtype === "slingshot";
  });
}

function buildRows(state) {
  const slingshots = ownedSlingshots(state);
  const lines = [];
  const itemIds = [];
  for (const [id, qty] of slingshots) {
    lines.push(`  - [${qty}] ${ALL_ITEMS[id]?.name ?? id}`);
    itemIds.push(id);
  }

  if (!lines.length) {
    lines.push("No slingshots in your backpack.");
    itemIds.push(null);
  }

  return { lines, itemIds };
}

function selectedSlingshotId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const slingshotSwapScreen = {
  keymap: {
    B: (state, ui) => popScreen(state, ui, "toolbelt"),
    C: (state, ui) => {
      const slingshotId = selectedSlingshotId(ui);
      if (!slingshotId) {
        state.lastMessage = "Select a slingshot first.";
        return;
      }
      const item = ALL_ITEMS[slingshotId];
      const previous = equipItem(state, slingshotId, "slingshot");
      state.lastMessage = previous
        ? `Equipped ${item.name}, returned ${ALL_ITEMS[previous]?.name ?? previous} to backpack.`
        : `Equipped ${item.name}.`;
      switchScreen(state, ui, "toolbelt");
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
    const { lines, itemIds } = buildRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = itemIds;
    ui.inventoryList.select(0);

    ui.promptRow.setContent(state.lastMessage || "Which slingshot would you like to equip?");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Choose", hotkey: "C" },
        ],
        { columns: 2 }
      )
    );
  },
};
