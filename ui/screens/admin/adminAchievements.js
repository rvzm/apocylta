import { ACHIEVEMENTS } from "../../../achievements_backbone.js";
import { achievementRows, evaluateAchievements } from "../../../data/achievements.js";
import { colorTag, formatCommandRow } from "../../format.js";
import { switchScreen } from "../../router.js";
import { enterList, exitList, paint, requireAdmin, rowBuilder, selectedId } from "./shared.js";

// Key presence in state.achievements IS the unlocked flag, so a toggle is a
// write or a delete. Deliberately not routed through evaluateAchievements(),
// which would also pay the reward.
function toggle(state, ui) {
  const id = selectedId(ui);
  if (!id || !ACHIEVEMENTS[id]) return;

  if (state.achievements[id]) {
    delete state.achievements[id];
    state.lastMessage = state.adminAutoAchievements
      ? `Locked ${ACHIEVEMENTS[id].name} - auto-evaluate is ON, so it may unlock straight back.`
      : `Locked ${ACHIEVEMENTS[id].name}.`;
    return;
  }
  state.achievements[id] = { unlockedAt: Date.now() };
  state.lastMessage = `Unlocked ${ACHIEVEMENTS[id].name} (no reward paid).`;
}

// Unlocking is monotonic and state/gameLoop.js re-evaluates every second, so a
// re-locked achievement whose requirements still hold comes straight back - and
// pays its gold/xp again each time. Switching evaluation off is what makes a
// re-lock stick.
function toggleAuto(state) {
  state.adminAutoAchievements = !state.adminAutoAchievements;
  state.lastMessage = `Auto-evaluate ${state.adminAutoAchievements ? "ON" : "OFF"}.`;
}

function buildRows(state) {
  const rows = rowBuilder();
  rows.push(`  auto-evaluate: ${state.adminAutoAchievements ? "[ON]" : "[OFF]"}   (session-only)`);
  rows.push("");

  for (const row of achievementRows(state)) {
    const header = `  [${row.unlocked ? "x" : " "}] ${row.name.padEnd(24)} ${row.desc}`;
    rows.push(row.unlocked ? colorTag(header, "green") : header, row.id);
    for (const req of row.requirements) {
      const detail = req.key === "combatEnd" ? req.key : `${req.key} (${req.current}/${req.target})`;
      rows.push(`      [${req.complete ? "x" : " "}] ${detail}`);
    }
  }
  return rows;
}

export const adminAchievementsScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "adminHub"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "adminHub"),
    T: toggle,
    A: toggleAuto,
    E: (state) => {
      // An explicit run, so evaluation is still reachable with auto off. Bypasses
      // the pause the same way the tick would if it were on.
      const paused = state.adminAutoAchievements;
      state.adminAutoAchievements = true;
      const unlocked = evaluateAchievements(state);
      state.adminAutoAchievements = paused;
      state.lastMessage = unlocked.length ? `Unlocked ${unlocked.length}.` : "Nothing newly earned.";
    },
  },

  onEnter(state, ui) {
    if (requireAdmin(state, ui)) return;
    enterList(state, ui);
    ui.inventoryList.select(0);
  },

  onExit: exitList,

  render(state, ui) {
    paint(ui, buildRows(state), " Achievements ");
    ui.promptRow.setContent(state.lastMessage || "Admin / Achievements");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Toggle", hotkey: "T" },
          { label: "Auto-evaluate", hotkey: "A" },
          { label: "Evaluate now", hotkey: "E" },
        ],
        { columns: 2 }
      )
    );
  },
};
