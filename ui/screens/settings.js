import { updateSetting, readSettings } from "../../state/settings.js";
import { getDisplay } from "../../state/displaySettings.js";
import {
  ACTION_STYLE_KEYS,
  ACTION_STYLE_LABELS,
  formatCommandCell,
  formatCommandRow,
  formatRelativeTime,
} from "../format.js";
import { enterList, exitList, paint, rowBuilder, selectedId } from "../listScreen.js";
import { switchScreen } from "../router.js";

function formatDate(ms) {
  if (!ms) return "never";
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function toggle(state, ui) {
  const field = selectedId(ui);
  if (field === "colorize") {
    const next = getDisplay().colorize ? 0 : 1;
    updateSetting("colorize", next);
    state.lastMessage = `Colorize ${next ? "ON" : "OFF"}.`;
    return;
  }
  if (field === "action_key") {
    const keys = ACTION_STYLE_KEYS;
    const next = keys[(keys.indexOf(getDisplay().actionKey) + 1) % keys.length];
    updateSetting("action_key", next);
    state.lastMessage = `Action style: ${ACTION_STYLE_LABELS[next]}.`;
  }
}

function buildRows(state) {
  const rows = rowBuilder();
  const display = getDisplay();
  const styleKey = display.actionKey;

  rows.push(
    `  ${"Colorize".padEnd(16)}[${display.colorize ? "ON " : "OFF"}]   colour on/off; bold and highlighting stay`,
    "colorize"
  );
  // The preview is the setting rendered through itself - the point is seeing
  // the style before leaving the screen.
  rows.push(
    `  ${"Action style".padEnd(16)}[${styleKey}] ${ACTION_STYLE_LABELS[styleKey].padEnd(13)} e.g. ${formatCommandCell("Travel", "T", styleKey)}`,
    "action_key"
  );

  rows.push("");
  const settings = state.settingsRow ?? {};
  rows.push(`  ${"Playing since".padEnd(16)}${formatDate(settings.first_run)}`);
  rows.push(`  ${"Last session".padEnd(16)}${formatRelativeTime(settings.last_run || null)}`);
  rows.push(`  ${"Last autosave".padEnd(16)}${formatRelativeTime(settings.last_autosave || null)}`);
  return rows;
}

export const settingsScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "menu"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "menu"),
    T: toggle,
  },

  onEnter(state, ui) {
    enterList(state, ui);
    // Re-read rather than trusting a cached copy: the autosave timer stamps
    // last_autosave behind this screen's back.
    state.settingsRow = readSettings();
    ui.inventoryList.select(0);
  },

  onExit: exitList,

  render(state, ui) {
    paint(ui, buildRows(state), " Settings ");
    ui.promptRow.setContent(state.lastMessage || "Settings - changes save immediately.");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Toggle", hotkey: "T" },
        ],
        { columns: 2 }
      )
    );
  },
};
