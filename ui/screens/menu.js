import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import { SKILLS } from "../../skill_backbone.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { RACES, CLASSES, DIFFICULTY_LEVELS } from "../../player_backbone.js";
import { adminEnabled } from "./admin/shared.js";

const SLOT_LABELS = {
  weapon: "Weapon",
  tool: "Tool",
  slingshot: "Slingshot",
  belt: "Belt",
  head: "Head",
  torso: "Torso",
  legs: "Legs",
  boots: "Boots",
  hands: "Hands",
  shield: "Shield",
};

export const menuScreen = {
  keymap: {
    B: (state, ui) => {
      state.returnScreen = "menu";
      switchScreen(state, ui, "backpack");
    },
    S: (state, ui) => {
      state.saveSlotsContext = { mode: "save", returnScreen: "menu" };
      switchScreen(state, ui, "saveSlots");
    },
    L: (state, ui) => {
      state.saveSlotsContext = { mode: "load", returnScreen: "menu" };
      switchScreen(state, ui, "saveSlots");
    },
    A: (state, ui) => switchScreen(state, ui, "achievements"),
    T: (state, ui) => switchScreen(state, ui, "settings"),
    // Gated in both directions: the legend below hides the entry, and this
    // handler no-ops, so the key does nothing at all when admin is off.
    V: (state, ui) => {
      if (adminEnabled()) switchScreen(state, ui, "adminHub");
    },
    E: (state, ui) => {
      ui.screen.destroy();
      process.exit(0);
    },
    ESCAPE: (state, ui) => switchScreen(state, ui, state.menuOrigin || "location"),
  },

  onEnter(state) {
    state.lastMessage = null;
  },

  render(state, ui) {
    const raceName = RACES[state.race]?.name ?? "-";
    const className = CLASSES[state.class]?.name ?? "-";
    const difficultyName = DIFFICULTY_LEVELS[state.difficulty]?.name ?? "-";
    const bodyLines = [
      `Name:       ${state.name ?? "-"}`,
      `Race/Class: ${raceName} ${className}`,
      `Difficulty: ${difficultyName}`,
      `Level:      ${state.level}`,
      `Experience: ${state.experience} XP`,
    ];

    bodyLines.push("", "Equipment:");
    for (const [slot, label] of Object.entries(SLOT_LABELS)) {
      const itemId = state.equipment[slot];
      bodyLines.push(`  ${label.padEnd(7)}: ${itemId ? ALL_ITEMS[itemId]?.name ?? itemId : "empty"}`);
    }

    bodyLines.push("", "Skills:");
    const skillCells = Object.entries(SKILLS).map(([key, def]) => {
      const s = state.skills[key];
      return `${def.name} Lv.${s.level} (${s.xp}xp)`.padEnd(26);
    });
    for (let i = 0; i < skillCells.length; i += 2) {
      bodyLines.push("  " + skillCells.slice(i, i + 2).join("| ").trimEnd());
    }

    if (state.lastMessage) bodyLines.push("", `    ${state.lastMessage}`);
    ui.mainContent.setContent(bodyLines.join("\n"));

    ui.promptRow.setContent("What would you like to do?");
    const commands = [
      { label: "Backpack", hotkey: "B" },
      { label: "Achievements", hotkey: "A" },
      { label: "Save", hotkey: "S" },
      { label: "Load", hotkey: "L" },
      { label: "Settings", hotkey: "T" },
      { label: "Exit", hotkey: "E" },
    ];
    if (adminEnabled()) commands.push({ label: "Admin", hotkey: "V" });
    ui.commandList.setContent(formatCommandRow(commands, { columns: 3 }));
  },
};
