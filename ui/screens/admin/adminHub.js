import { formatCommandRow } from "../../format.js";
import { switchScreen } from "../../router.js";
import { enterList, exitList, requireAdmin, resetStep, selectedId, rowBuilder, paint } from "./shared.js";

// Digit hotkeys, so a screen can be reached in one press without hunting for a
// free letter - the same positional-digit idea location.js and travel.js use,
// but fixed here rather than derived.
const EDITORS = [
  ["adminStats", "Player stats", "hp / mana and their maxes, gold, level, xp"],
  ["adminSkills", "Skills", "level and xp per skill"],
  ["adminInventory", "Inventory", "every item in the game - give, take, infinite"],
  ["adminEquipment", "Equipment", "armour by slot, equip and unequip"],
  ["adminToolbelt", "Toolbelt", "water, ammo, quiver, and the belt that caps them"],
  ["adminQuests", "Quests", "accept, force objectives, complete"],
  ["adminAchievements", "Achievements", "lock and unlock, pause auto-evaluation"],
];

function buildRows() {
  const rows = rowBuilder();
  rows.push("What would you like to edit?");
  rows.push("");
  for (const [i, [screen, label, blurb]] of EDITORS.entries()) {
    rows.push(`  [${i + 1}] ${label.padEnd(14)} ${blurb}`, screen);
  }
  return rows;
}

function open(state, ui, index) {
  const entry = EDITORS[index];
  if (entry) switchScreen(state, ui, entry[0]);
}

export const adminHubScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "menu"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "menu"),
    C: (state, ui) => {
      const screen = selectedId(ui);
      if (screen) switchScreen(state, ui, screen);
    },
    ...Object.fromEntries(EDITORS.map((_, i) => [String(i + 1), (state, ui) => open(state, ui, i)])),
  },

  onEnter(state, ui) {
    if (requireAdmin(state, ui)) return;
    enterList(state, ui);
    resetStep(ui);
    ui.inventoryList.select(0);
  },

  onExit: exitList,

  render(state, ui) {
    paint(ui, buildRows(), " Admin ");
    ui.promptRow.setContent(state.lastMessage || "Admin - editing state directly, no gates apply.");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Choose", hotkey: "C" },
          { label: "Jump to editor", hotkey: "1-7" },
        ],
        { columns: 3 }
      )
    );
  },
};
