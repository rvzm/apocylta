import { achievementRows } from "../../data/achievements.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

// Achievement reward xp is polymorphic (number | {player, skill:{...}}),
// unlike quest reward xp which is always a plain number - same shape the
// playercard page formats in public/index.html.
function formatXp(xp) {
  if (xp == null) return "";
  if (typeof xp === "number") return `${xp}xp`;
  const parts = [];
  if (xp.player) parts.push(`${xp.player}xp`);
  for (const [skill, amount] of Object.entries(xp.skill ?? {})) parts.push(`${amount} ${skill}xp`);
  return parts.join(", ");
}

function formatReward(reward = {}) {
  const parts = [];
  if (reward.gold) parts.push(`${reward.gold}gp`);
  const xp = formatXp(reward.xp);
  if (xp) parts.push(xp);
  return parts.join(", ") || "none";
}

// combatEnd is a single all-or-nothing condition evaluated at the moment a
// fight is won, so a "0/1" counter would be misleading noise - the
// description already says what it wants.
function requirementLine(requirement) {
  const { key, current, target, complete } = requirement;
  const box = complete ? "[x]" : "[ ]";
  return key === "combatEnd" ? `      ${box} ${key}` : `      ${box} ${key} (${current}/${target})`;
}

export function buildRows(state) {
  const rows = achievementRows(state);
  const unlocked = rows.filter((r) => r.unlocked);
  const locked = rows.filter((r) => !r.unlocked);

  const lines = [];
  const ids = [];
  const push = (line, id = null) => {
    lines.push(line);
    ids.push(id);
  };

  if (unlocked.length) {
    push(`Unlocked (${unlocked.length}/${rows.length}):`);
    for (const row of unlocked) {
      push(`  [x] ${row.name} - claimed ${formatReward(row.reward)}`, row.id);
    }
    push("");
  }

  push(`Locked (${locked.length}):`);
  if (!locked.length) {
    push("  Everything's done. Nothing left to earn.");
  }
  for (const row of locked) {
    push(`  [ ] ${row.name} - ${formatReward(row.reward)}`, row.id);
    push(`      ${row.desc}`);
    for (const requirement of row.requirements) push(requirementLine(requirement));
  }

  return { lines, ids };
}

export const achievementsScreen = {
  keymap: {
    // Only ever reached from the Menu, so ESC can go straight back without an
    // origin-tracking field - same as journal.js's route to the toolbelt.
    ESCAPE: (state, ui) => switchScreen(state, ui, "menu"),
    B: (state, ui) => switchScreen(state, ui, "menu"),
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
    ui.inventoryList._resetSelection = true;
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    // inventoryList rather than mainContent purely for the scrolling: the
    // full catalog with descriptions and per-requirement lines overflows the
    // pane, and this is the only widget with keyboard/vi scroll bindings.
    // Nothing here is actionable, so every _itemIds entry may be null.
    const { lines, ids } = buildRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = ids;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }

    const earned = Object.keys(state.achievements ?? {}).length;
    ui.promptRow.setContent(
      state.lastMessage || `Achievements - ${earned} unlocked. They award themselves as you play.`
    );
    ui.commandList.setContent(formatCommandRow([{ label: "Back", hotkey: "B" }], { columns: 1 }));
  },
};
