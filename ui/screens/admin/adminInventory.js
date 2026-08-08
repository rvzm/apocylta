import { ALL_ITEMS, ITEM_TYPES } from "../../../item_backbone.js";
import { colorTag, formatCommandRow } from "../../format.js";
import { cycleTab } from "../../tabs.js";
import { switchScreen } from "../../router.js";
import {
  adjust,
  compactTabLabel,
  enterList,
  exitList,
  paint,
  requireAdmin,
  resetStep,
  rowBuilder,
  selectedId,
  STEP_COMMANDS,
  stepFooter,
  stepFor,
  stepKeys,
} from "./shared.js";

// Every item in the game, not just what's held - the point of this screen is
// to hand out things you don't have. Types with no items (ITEM_TYPES declares
// "recipe" and "metal", which nothing uses) are dropped so the tab strip
// doesn't carry two dead entries.
const PRESENT_TYPES = ITEM_TYPES.filter((type) => Object.values(ALL_ITEMS).some((item) => item.type === type));
const TABS = ["All", ...PRESENT_TYPES];

// Note the absence of backpack.js's `type !== "tool"` exclusion: tools live on
// the toolbelt in normal play, but an admin browser that hid 68 equippables
// would be missing a chunk of the catalog.
function entriesFor(activeTab) {
  return Object.entries(ALL_ITEMS)
    .filter(([, item]) => activeTab === "All" || item.type === activeTab)
    .sort((a, b) => (a[1].name ?? a[0]).localeCompare(b[1].name ?? b[0]));
}

function held(state, itemId) {
  return state.inventory[itemId] || 0;
}

// Writes state.inventory directly rather than going through addItem/removeItem:
// addItem refuses a new item id once the backpack or potion slot cap is
// reached, which is exactly the gate an admin give exists to sidestep.
function give(state, ui) {
  const itemId = selectedId(ui);
  if (!itemId) return;
  state.inventory[itemId] = held(state, itemId) + stepFor(ui);
  state.lastMessage = `Gave ${stepFor(ui)}x ${ALL_ITEMS[itemId].name}.`;
}

function take(state, ui) {
  const itemId = selectedId(ui);
  if (!itemId) return;
  const next = adjust(held(state, itemId), -stepFor(ui));
  if (next > 0) state.inventory[itemId] = next;
  else delete state.inventory[itemId];
  state.lastMessage = `Took ${stepFor(ui)}x ${ALL_ITEMS[itemId].name}.`;
}

// "Infinite" is a real never-decrements flag (state/gameState.js's removeItem
// skips these ids), not a big number. Session-only by design - it's a live
// cheat switch, not progression.
function toggleInfinite(state, ui) {
  const itemId = selectedId(ui);
  if (!itemId) return;
  if (state.adminInfinite.has(itemId)) {
    state.adminInfinite.delete(itemId);
    state.lastMessage = `${ALL_ITEMS[itemId].name} is finite again.`;
    return;
  }
  state.adminInfinite.add(itemId);
  if (!held(state, itemId)) state.inventory[itemId] = 1; // infinite of nothing is still nothing
  state.lastMessage = `${ALL_ITEMS[itemId].name} is now infinite (this session).`;
}

function buildRows(state, activeTab) {
  const rows = rowBuilder();
  for (const [itemId, item] of entriesFor(activeTab)) {
    const qty = held(state, itemId);
    const count = state.adminInfinite.has(itemId) ? colorTag("  ∞", "yellow", true) : String(qty).padStart(3);
    const line = `  [${count}] ${(item.name ?? itemId).padEnd(28)} ${item.type}/${item.subtype ?? "-"}`;
    rows.push(qty > 0 ? colorTag(line, "green") : line, itemId);
  }
  return rows;
}

function switchTab(state, ui, direction) {
  cycleTab(ui, "_tabIndex", direction, TABS.length);
  ui.inventoryList.select(0); // a new tab is a new list; the no-reset rule is about mutation re-renders
}

export const adminInventoryScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "adminHub"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "adminHub"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    G: give,
    T: take,
    I: toggleInfinite,
    ...stepKeys(),
  },

  onEnter(state, ui) {
    if (requireAdmin(state, ui)) return;
    enterList(state, ui);
    resetStep(ui);
    ui.inventoryList._tabIndex = 0;
    ui.inventoryList.select(0);
  },

  onExit: exitList,

  render(state, ui) {
    const tabIndex = Math.min(ui.inventoryList._tabIndex ?? 0, TABS.length - 1);
    ui.inventoryList._tabIndex = tabIndex;

    paint(ui, buildRows(state, TABS[tabIndex]), compactTabLabel(TABS, tabIndex));
    ui.promptRow.setContent(state.lastMessage || `Admin / Inventory - ${stepFooter(ui)}`);
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Switch tab", hotkey: "<>" },
          { label: "Give", hotkey: "G" },
          { label: "Take", hotkey: "T" },
          { label: "Infinite", hotkey: "I" },
          ...STEP_COMMANDS,
        ],
        { columns: 3 }
      )
    );
  },
};
