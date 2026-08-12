import { ALL_ITEMS, ITEM_TYPES, equipSlotOf, weightOf, storeInOf } from "../../item_backbone.js";
import { formatCommandRow } from "../format.js";
import { removeItem, equipItem } from "../../state/gameState.js";
import { useItem } from "../../data/items.js";
import { pushScreen, popScreen } from "../router.js";
import { cycleTab, formatTabStrip } from "../tabs.js";

// The PACK's contents only - what's on the belt belongs to ui/screens/pouch.js.
//
// Tools were excluded here once before on the grounds that they "live in the
// Toolbelt", and that was a bug: this was the only screen with Drop, Use and
// Equip, so hiding them made every tool impossible to get rid of. They were
// brought back for exactly that reason, and they leave again now for exactly
// the reason they couldn't then - the Pouch drops and equips them itself. Each
// thing you carry now appears in exactly one screen.
//
// Keep that history in mind before filtering anything else out of here: hiding
// a row is only safe once somewhere else can act on it.
function carriedEntries(state) {
  return Object.entries(state.inventory).filter(([id, qty]) => qty > 0 && storeInOf(id) === "backpack");
}

// "All" first, then whatever item types are actually present, in
// ITEM_TYPES's declared order - dynamic, not a fixed category list.
function buildTabs(state) {
  const present = new Set(carriedEntries(state).map(([id]) => ALL_ITEMS[id]?.type).filter(Boolean));
  return ["All", ...ITEM_TYPES.filter((type) => present.has(type))];
}

function buildInventoryRows(state, activeTab) {
  const entries = carriedEntries(state);
  const filtered = activeTab === "All" ? entries : entries.filter(([id]) => ALL_ITEMS[id]?.type === activeTab);

  const lines = [];
  const itemIds = [];
  for (const [id, qty] of filtered) {
    // The stack's weight - what this row costs against the pack's budget. No
    // "(belt)" marker any more: every row here is a pack row, so it said nothing.
    const stack = Math.round(weightOf(id) * qty * 100) / 100;
    lines.push(`  - [${qty}] ${ALL_ITEMS[id]?.name ?? id}  ${stack}`);
    itemIds.push(id);
  }

  if (!lines.length) {
    lines.push("Nothing here.");
    itemIds.push(null);
  }

  return { lines, itemIds };
}

function selectedItemId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

function switchTab(state, ui, direction) {
  cycleTab(ui, "_tabIndex", direction, buildTabs(state).length);
  ui.inventoryList._resetSelection = true;
}

export const backpackScreen = {
  subHeader: ["Your Backpack"],
  keymap: {
    B: (state, ui) => popScreen(state, ui, "location"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    D: (state, ui) => {
      const itemId = selectedItemId(ui);
      if (!itemId) {
        state.lastMessage = "Select an item first.";
        return;
      }
      // Forced: dropping is the player asking for it gone, so godmode and the
      // admin infinite flag shouldn't quietly refuse it.
      removeItem(state, itemId, 1, { force: true });
      state.lastMessage = `Dropped 1 ${ALL_ITEMS[itemId]?.name ?? itemId}.`;
    },
    C: (state, ui) => pushScreen(state, ui, "spellbook"),
    U: (state, ui) => {
      const itemId = selectedItemId(ui);
      if (!itemId) {
        state.lastMessage = "Select an item first.";
        return;
      }
      // useItem() always hands back a reason, so there's nothing to infer here.
      state.lastMessage = useItem(state, itemId).message;
    },
    E: (state, ui) => {
      const itemId = selectedItemId(ui);
      if (!itemId) {
        state.lastMessage = "Select an item first.";
        return;
      }
      const item = ALL_ITEMS[itemId];
      const slot = equipSlotOf(itemId);
      if (!slot) {
        state.lastMessage = `${item?.name ?? itemId} cannot be equipped.`;
        return;
      }
      const previous = equipItem(state, itemId, slot);
      state.lastMessage = previous
        ? `Equipped ${item.name}, returned ${ALL_ITEMS[previous]?.name ?? previous} to backpack.`
        : `Equipped ${item.name}.`;
    },
    M: (state, ui) => pushScreen(state, ui, "menu"),
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
    ui.inventoryList.setLabel(""); // clear the tab strip so other screens don't inherit it
    ui.mainContent.show();
  },

  render(state, ui) {
    const tabs = buildTabs(state);
    const tabIndex = Math.min(ui.inventoryList._tabIndex ?? 0, tabs.length - 1);
    ui.inventoryList._tabIndex = tabIndex;
    const activeTab = tabs[tabIndex];

    const { lines, itemIds } = buildInventoryRows(state, activeTab);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = itemIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }
    ui.inventoryList.setLabel(` ${formatTabStrip(tabs, tabIndex)} `);

    ui.promptRow.setContent(state.lastMessage || "What would you like to do?");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Switch tab", hotkey: "<>" },
          { label: "Drop", hotkey: "D" },
          { label: "Equip", hotkey: "E" },
          { label: "Spellbook", hotkey: "C" },
          { label: "Use", hotkey: "U" },
        ],
        { columns: 2 }
      )
    );
  },
};
