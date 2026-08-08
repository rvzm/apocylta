import { getDisplay } from "../state/displaySettings.js";

const DEFAULT_COLUMNS = 3;
const DEFAULT_COLUMN_WIDTH = 20;

// Wraps text in neo-blessed markup tags. Only renders as color on widgets
// built with `tags: true` (ui/layout.js's mainContent and inventoryList).
// `color` is either a named blessed color ("green") or a hex string
// ("#ffd700") - see the COLOR note in ui/layout.js.
//
// With colorize off this drops the colour but KEEPS {bold}: bold is a video
// attribute (SGR 1) rather than a colour, and renders fine on a terminal with
// no colour support. The same reasoning exempts inventoryList's
// `inverse: true` selection highlight, which isn't routed through here at all.
export function colorTag(text, color, bold) {
  if (!getDisplay().colorize) return bold ? `{bold}${text}{/bold}` : String(text);
  return bold ? `{${color}-fg}{bold}${text}{/bold}{/${color}-fg}` : `{${color}-fg}${text}{/${color}-fg}`;
}

// Blessed markup doesn't occupy columns, so anything that pads has to measure
// the text the user actually sees - style "R" below emits {bold} tags inside a
// padded cell and would otherwise throw the legend's alignment out by 13
// characters per cell.
function visibleLength(text) {
  return text.replace(/\{[^}]*\}/g, "").length;
}

function padVisible(text, width) {
  return text + " ".repeat(Math.max(0, width - visibleLength(text)));
}

// How a { label, hotkey } pair is drawn, chosen by the action_key setting
// (game_settings.action_key, mirrored into state/displaySettings.js).
//
// Only "R" needs the `matches` distinction to mean anything: with the hotkey
// nowhere in the label there is no letter to embolden, so it falls back to the
// prefix form. That case is not rare - "<>" for Switch tab, "123" for step
// size, and every digit-keyed row on the location and travel screens.
const ACTION_STYLES = {
  B: (label, hotkey, matches) => (matches ? `[${hotkey}]${label.slice(hotkey.length)}` : `[${hotkey}] ${label}`),
  P: (label, hotkey) => `[${hotkey}] ${label}`,
  R: (label, hotkey, matches) =>
    matches ? `{bold}${label.slice(0, hotkey.length)}{/bold}${label.slice(hotkey.length)}` : `[${hotkey}] ${label}`,
  S: (label, hotkey) => `${hotkey}: [${label}]`,
};

export const ACTION_STYLE_LABELS = {
  B: "Boxed Key",
  P: "Prefix",
  R: "Bolded",
  S: "Boxed Action",
};

export const ACTION_STYLE_KEYS = Object.keys(ACTION_STYLES);

// One formatted cell, for the Settings screen's live preview as much as for
// the legend itself.
export function formatCommandCell(label, hotkey, styleKey = getDisplay().actionKey) {
  const style = ACTION_STYLES[styleKey] ?? ACTION_STYLES.B;
  const matches = label.slice(0, hotkey.length).toUpperCase() === hotkey.toUpperCase();
  return style(label, hotkey, matches);
}

// "4 minutes ago" for a timestamp. Lived in ui/screens/saveSlots.js until the
// Settings screen needed it too - a screen importing another screen is the
// wrong shape.
export function formatRelativeTime(ms) {
  if (ms == null) return "never";
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Formats a list of { label, hotkey } commands into the bracketed,
// column-aligned legend used by the bottom command pane, e.g.:
//   [T]ravel    | [L]ook for food    | [C]heck the quest board
//   [S]afehouse | [G]ather scraps    | [M]enu
export function formatCommandRow(commands, { columns = DEFAULT_COLUMNS, columnWidth = DEFAULT_COLUMN_WIDTH } = {}) {
  const cells = commands.map(({ label, hotkey }) => formatCommandCell(label, hotkey));

  const rows = [];
  for (let i = 0; i < cells.length; i += columns) {
    const rowCells = cells.slice(i, i + columns);
    const isLastRow = i + columns >= cells.length;
    const padded = rowCells.map((cell, idx) => {
      const isLastCell = isLastRow ? idx === rowCells.length - 1 : false;
      return isLastCell ? cell : padVisible(cell, columnWidth);
    });
    rows.push(padded.join("| "));
  }
  return rows.join("\n");
}

const GRID_MIN_COLUMN_WIDTH = 14;
const GRID_MAX_COLUMN_WIDTH = 24;
const GRID_CELL_PADDING = 2;

// Formats { header, rows }[] (one column per travel option, rows = the
// destinations reachable one hop further) into a header/separator/data grid,
// e.g. the travel screen's "what's beyond each destination" preview. Columns
// share one width (derived from the longest cell anywhere in the grid) and
// wrap into stacked groups when there isn't enough `screenWidth` to fit them
// all on one line, rather than producing one unreadably-wide row.
export function formatLocationGrid(columns, { screenWidth = 80 } = {}) {
  if (!columns.length) return "";

  const longestCell = Math.max(
    ...columns.map((col) => Math.max(col.header.length, ...col.rows.map((r) => r.length), 0))
  );
  const columnWidth = Math.min(GRID_MAX_COLUMN_WIDTH, Math.max(GRID_MIN_COLUMN_WIDTH, longestCell + GRID_CELL_PADDING));
  const columnsPerGroup = Math.max(1, Math.floor(screenWidth / (columnWidth + 1)));

  const groups = [];
  for (let i = 0; i < columns.length; i += columnsPerGroup) {
    const group = columns.slice(i, i + columnsPerGroup);
    const rowCount = Math.max(...group.map((col) => col.rows.length), 0);

    const lines = [];
    lines.push(group.map((col) => col.header.padEnd(columnWidth)).join("| "));
    lines.push(group.map(() => "-".repeat(columnWidth)).join("|-"));
    for (let r = 0; r < rowCount; r++) {
      lines.push(group.map((col) => (col.rows[r] ?? "").padEnd(columnWidth)).join("| "));
    }
    groups.push(lines.join("\n"));
  }

  return groups.join("\n\n");
}
