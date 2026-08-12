// ui/screens/pouch.js - what's actually on your belt.
//
// The Toolbelt screen shows what you're WEARING and how full you are; this is
// the contents. Only `storeIn: "toolbelt"` items appear (item_backbone.js's
// storeInOf) - scrap, tools, bait and hooks - because those are the ones
// charged against the belt's own weight budget rather than the pack's.
//
// Same shape as the backpack: tabs across the top by item type, Drop/Equip/Use
// on the selection. What it adds is SECTIONS - a tab like "tool" holds nine
// pickaxes, nine axes and five bombs, and a flat list of thirty rows buries
// what you're looking for.
import { ALL_ITEMS, ITEM_TYPES, equipSlotOf, weightOf, storeInOf } from "../../item_backbone.js";
import { toolbeltWeightCap, toolbeltWeightUsed } from "../../data/toolbelt.js";
import { removeItem, equipItem } from "../../state/gameState.js";
import { useItem } from "../../data/items.js";
import { colorTag, formatCommandRow, COLOR } from "../format.js";
import { cycleTab, formatTabStrip } from "../tabs.js";
import { switchScreen } from "../router.js";

// Everything on the belt, in inventory order.
function pouchEntries(state) {
  return Object.entries(state.inventory).filter(([id, qty]) => qty > 0 && storeInOf(id) === "toolbelt");
}

// Which section a row belongs to. `subtype` almost always says it - except for
// bait and hooks, which share the canonical subtype "fishing" (they're mapped
// that way so equipSlotOf can't make them fight the rod for the tool slot, see
// item_backbone.js). There, the authored fishing vocabulary is what actually
// distinguishes them, so it wins.
export function sectionOf(itemId) {
  const item = ALL_ITEMS[itemId];
  if (!item) return "other";
  if (item.subtype === "fishing" && item.fishingType) return item.fishingType;
  return item.subtype ?? "other";
}

// "combat_bait" -> "Combat Bait", "fishing rod" -> "Fishing Rod"
function sectionTitle(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// "All" first, then whatever types are actually on the belt, in ITEM_TYPES's
// declared order - dynamic, so a tab never appears empty.
export function buildTabs(state) {
  const present = new Set(pouchEntries(state).map(([id]) => ALL_ITEMS[id]?.type).filter(Boolean));
  return ["All", ...ITEM_TYPES.filter((type) => present.has(type))];
}

// Exported for unit testing without blessed, the same way spellbook.js's
// buildSpellRows() and achievements.js's buildRows() are. Returns parallel
// arrays: lines[i] is display text, itemIds[i] is the item id, or null for a
// header/blank/placeholder row that must not be actionable.
export function buildPouchRows(state, activeTab) {
  const lines = [];
  const itemIds = [];
  const push = (line, id = null) => {
    lines.push(line);
    itemIds.push(id);
  };

  const entries = pouchEntries(state);
  const filtered = activeTab === "All" ? entries : entries.filter(([id]) => ALL_ITEMS[id]?.type === activeTab);

  if (!filtered.length) {
    push(entries.length ? "Nothing of that kind on your belt." : "Your belt is empty.");
    return { lines, itemIds };
  }

  const bySection = {};
  for (const entry of filtered) (bySection[sectionOf(entry[0])] ??= []).push(entry);

  // Sections alphabetically, and rows by name inside them - the inventory's own
  // insertion order is the order things happened to be picked up, which is no
  // order at all once you're looking for one particular pickaxe.
  const sections = Object.keys(bySection).sort();
  sections.forEach((section, index) => {
    if (index > 0) push("");
    const rows = bySection[section].sort(([a], [b]) =>
      (ALL_ITEMS[a]?.name ?? a).localeCompare(ALL_ITEMS[b]?.name ?? b)
    );
    const weight = rows.reduce((sum, [id, qty]) => sum + weightOf(id) * qty, 0);
    push(`  ${colorTag(`${sectionTitle(section)} (${rows.length})`, COLOR.amber, true)}  ${round(weight)}`);

    for (const [id, qty] of rows) {
      push(`    - [${qty}] ${ALL_ITEMS[id]?.name ?? id}  ${round(weightOf(id) * qty)}`, id);
    }
  });

  return { lines, itemIds };
}

function round(weight) {
  return Math.round(weight * 100) / 100;
}

function selectedItemId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

// Header and blank rows carry a null id, so "select an item first" covers
// landing on one as well as an empty belt.
function withSelection(state, ui, action) {
  const itemId = selectedItemId(ui);
  if (!itemId) {
    state.lastMessage = "Select an item first.";
    return;
  }
  action(itemId, ALL_ITEMS[itemId]);
}

function switchTab(state, ui, direction) {
  cycleTab(ui, "_tabIndex", direction, buildTabs(state).length);
  ui.inventoryList._resetSelection = true;
}

export const pouchScreen = {
  subHeader: [
    (state) => `On your belt: ${round(toolbeltWeightUsed(state))} of ${round(toolbeltWeightCap(state))}.`,
  ],

  keymap: {
    B: (state, ui) => switchScreen(state, ui, "toolbelt"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "toolbelt"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),

    D: (state, ui) =>
      withSelection(state, ui, (itemId, item) => {
        // Forced: dropping is the player asking for it gone, so godmode and the
        // admin infinite flag shouldn't quietly refuse it - same carve-out the
        // backpack's Drop uses.
        removeItem(state, itemId, 1, { force: true });
        state.lastMessage = `Dropped 1 ${item?.name ?? itemId}.`;
      }),

    E: (state, ui) =>
      withSelection(state, ui, (itemId, item) => {
        const slot = equipSlotOf(itemId);
        if (!slot) {
          state.lastMessage = `${item?.name ?? itemId} cannot be equipped.`;
          return;
        }
        const previous = equipItem(state, itemId, slot);
        state.lastMessage = previous
          ? `Equipped ${item.name}, returned ${ALL_ITEMS[previous]?.name ?? previous} to your belt.`
          : `Equipped ${item.name}.`;
      }),

    U: (state, ui) =>
      withSelection(state, ui, (itemId) => {
        // useItem() always hands back a reason, so there's nothing to infer.
        // Most of what's on the belt isn't consumable and will say so.
        state.lastMessage = useItem(state, itemId).message;
      }),

    M: (state, ui) => {
      state.menuOrigin = state.currentScreen;
      switchScreen(state, ui, "menu");
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
    ui.inventoryList.setLabel(""); // clear the tab strip so other screens don't inherit it
    ui.mainContent.show();
  },

  render(state, ui) {
    const tabs = buildTabs(state);
    const tabIndex = Math.min(ui.inventoryList._tabIndex ?? 0, tabs.length - 1);
    ui.inventoryList._tabIndex = tabIndex;

    const { lines, itemIds } = buildPouchRows(state, tabs[tabIndex]);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = itemIds;
    // Never select() from render - a mutation re-render would snap the cursor
    // back to row 0 on every drop (the trap saveSlots.js and the admin screens
    // both document).
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
          { label: "Use", hotkey: "U" },
          { label: "Menu", hotkey: "M" },
        ],
        { columns: 2 }
      )
    );
  },
};
