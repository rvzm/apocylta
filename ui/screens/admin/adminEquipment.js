import { ALL_ITEMS, equipSlotOf } from "../../../item_backbone.js";
import { colorTag, formatCommandRow } from "../../format.js";
import { cycleTab } from "../../tabs.js";
import { switchScreen } from "../../router.js";
import { compactTabLabel, enterList, exitList, paint, requireAdmin, rowBuilder, selectedId } from "./shared.js";

// The full paperdoll, in the order createInitialState() declares it.
const SLOTS = ["weapon", "tool", "slingshot", "belt", "head", "torso", "legs", "boots", "hands", "shield", "cloak", "ring", "necklace"];

// Tabs come from what's actually holdable right now - every slot the player has
// an item for, plus every slot already filled (so you can always unequip).
function buildTabs(state) {
  const present = new Set(Object.keys(state.inventory).map((id) => equipSlotOf(id)).filter(Boolean));
  for (const [slot, itemId] of Object.entries(state.equipment)) if (itemId) present.add(slot);
  const tabs = SLOTS.filter((slot) => present.has(slot));
  return tabs.length ? tabs : ["weapon"];
}

function itemsForSlot(state, slot) {
  const inBackpack = Object.keys(state.inventory).filter((id) => equipSlotOf(id) === slot);
  const equipped = state.equipment[slot];
  // The equipped item isn't in the inventory (equipItem removed it), so it has
  // to be added back into the listing explicitly or you couldn't select it.
  const ids = equipped && !inBackpack.includes(equipped) ? [equipped, ...inBackpack] : inBackpack;
  return ids.sort((a, b) => (ALL_ITEMS[a]?.name ?? a).localeCompare(ALL_ITEMS[b]?.name ?? b));
}

// Deliberately not gameState.js's equipItem(): that ignores addItem's return
// value, so swapping out into a full backpack silently destroys the item that
// came off. Doing both sides here keeps the old item no matter what.
function equip(state, ui) {
  const itemId = selectedId(ui);
  if (!itemId) return;
  const slot = equipSlotOf(itemId);
  if (!slot) return;
  if (state.equipment[slot] === itemId) {
    state.lastMessage = `${ALL_ITEMS[itemId].name} is already equipped.`;
    return;
  }

  const previous = state.equipment[slot];
  if (previous) state.inventory[previous] = (state.inventory[previous] || 0) + 1;
  state.equipment[slot] = itemId;

  const held = state.inventory[itemId] || 0;
  if (held > 1) state.inventory[itemId] = held - 1;
  else delete state.inventory[itemId];

  state.lastMessage = previous
    ? `Equipped ${ALL_ITEMS[itemId].name}, returned ${ALL_ITEMS[previous]?.name ?? previous}.`
    : `Equipped ${ALL_ITEMS[itemId].name}.`;
}

// There is no unequip anywhere else in the codebase - every other caller only
// ever swaps one item for another.
function unequip(state, ui, slot) {
  const itemId = state.equipment[slot];
  if (!itemId) {
    state.lastMessage = `Nothing equipped in ${slot}.`;
    return;
  }
  state.equipment[slot] = null;
  state.inventory[itemId] = (state.inventory[itemId] || 0) + 1;
  state.lastMessage = `Unequipped ${ALL_ITEMS[itemId]?.name ?? itemId}.`;
}

function buildRows(state, slot) {
  const rows = rowBuilder();
  const equipped = state.equipment[slot];
  rows.push(`  ${slot}: ${equipped ? ALL_ITEMS[equipped]?.name ?? equipped : "empty"}`);
  rows.push("");

  const ids = itemsForSlot(state, slot);
  if (!ids.length) rows.push("  Nothing for this slot in the backpack.");
  for (const id of ids) {
    const item = ALL_ITEMS[id];
    const stats = [item?.damage != null ? `dmg ${item.damage}` : null, item?.defense != null ? `def ${item.defense}` : null]
      .filter(Boolean)
      .join(" ");
    const line = `  ${(item?.name ?? id).padEnd(28)} ${stats.padEnd(14)} ${item?.rarity ?? ""}`;
    rows.push(id === equipped ? colorTag(`${line} [EQUIPPED]`, "green", true) : line, id);
  }
  return rows;
}

function switchTab(state, ui, direction) {
  cycleTab(ui, "_tabIndex", direction, buildTabs(state).length);
  ui.inventoryList.select(0);
}

export const adminEquipmentScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "adminHub"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "adminHub"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    E: equip,
    U: (state, ui) => {
      const tabs = buildTabs(state);
      unequip(state, ui, tabs[Math.min(ui.inventoryList._tabIndex ?? 0, tabs.length - 1)]);
    },
  },

  onEnter(state, ui) {
    if (requireAdmin(state, ui)) return;
    enterList(state, ui);
    ui.inventoryList._tabIndex = 0;
    ui.inventoryList.select(0);
  },

  onExit: exitList,

  render(state, ui) {
    const tabs = buildTabs(state);
    const tabIndex = Math.min(ui.inventoryList._tabIndex ?? 0, tabs.length - 1);
    ui.inventoryList._tabIndex = tabIndex;

    paint(ui, buildRows(state, tabs[tabIndex]), compactTabLabel(tabs, tabIndex));
    ui.promptRow.setContent(state.lastMessage || "Admin / Equipment");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Switch slot", hotkey: "<>" },
          { label: "Equip", hotkey: "E" },
          { label: "Unequip", hotkey: "U" },
        ],
        { columns: 2 }
      )
    );
  },
};
