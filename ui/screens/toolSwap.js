import { ALL_ITEMS, TOOL_CATEGORIES } from "../../item_backbone.js";
import { equipItem } from "../../state/gameState.js";
import { formatCommandRow } from "../format.js";
import { switchScreen, popScreen } from "../router.js";
import { cycleTab, formatTabStrip } from "../tabs.js";

function ownedTools(state) {
  return Object.entries(state.inventory).filter(([id]) => ALL_ITEMS[id]?.type === "tool");
}

// "All" first, then whatever tool categories are actually owned, in
// TOOL_CATEGORIES's declared order.
function buildTabs(state) {
  const present = new Set(ownedTools(state).map(([id]) => ALL_ITEMS[id]?.subtype).filter(Boolean));
  return ["All", ...TOOL_CATEGORIES.filter((category) => present.has(category))];
}

function buildRows(state, activeTab) {
  const tools = ownedTools(state);
  const filtered = activeTab === "All" ? tools : tools.filter(([id]) => ALL_ITEMS[id]?.subtype === activeTab);

  const lines = [];
  const toolIds = [];
  for (const [id, qty] of filtered) {
    lines.push(`  - [${qty}] ${ALL_ITEMS[id]?.name ?? id}`);
    toolIds.push(id);
  }

  if (!lines.length) {
    lines.push("No tools in that category.");
    toolIds.push(null);
  }

  return { lines, toolIds };
}

function selectedToolId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

function switchTab(state, ui, direction) {
  cycleTab(ui, "_tabIndex", direction, buildTabs(state).length);
  ui.inventoryList._resetSelection = true;
}

export const toolSwapScreen = {
  keymap: {
    B: (state, ui) => popScreen(state, ui, "toolbelt"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    C: (state, ui) => {
      const toolId = selectedToolId(ui);
      if (!toolId) {
        state.lastMessage = "Select a tool first.";
        return;
      }
      const item = ALL_ITEMS[toolId];
      const previous = equipItem(state, toolId, "tool");
      state.lastMessage = previous
        ? `Equipped ${item.name}, returned ${ALL_ITEMS[previous]?.name ?? previous} to backpack.`
        : `Equipped ${item.name}.`;
      switchScreen(state, ui, "toolbelt");
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
    ui.inventoryList.setLabel("");
    ui.mainContent.show();
  },

  render(state, ui) {
    const tabs = buildTabs(state);
    const tabIndex = Math.min(ui.inventoryList._tabIndex ?? 0, tabs.length - 1);
    ui.inventoryList._tabIndex = tabIndex;
    const activeTab = tabs[tabIndex];

    const { lines, toolIds } = buildRows(state, activeTab);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = toolIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }
    ui.inventoryList.setLabel(` ${formatTabStrip(tabs, tabIndex)} `);

    ui.promptRow.setContent(state.lastMessage || "Which tool would you like to equip?");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Switch tab", hotkey: "<>" },
          { label: "Choose", hotkey: "C" },
        ],
        { columns: 2 }
      )
    );
  },
};
