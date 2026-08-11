import { getDisplay } from "../state/displaySettings.js";
import { visibleLength } from "../markup.js";

const DEFAULT_COLUMNS = 3;
const DEFAULT_COLUMN_WIDTH = 20;

// Markup building moved to the top-level markup.js so data/flavor.js can style
// its lines without data/ having to import ui/. Re-exported here because ~39
// screen files and renderChrome already import colorTag from this module, and
// the whole point of the move was to change nothing for them.
export { colorTag, styled, bold, underline, visibleLength, stripMarkup, COLOR } from "../markup.js";

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

// Word-wraps one line into rows, indenting the continuations past the first so
// a long sentence reads as one paragraph instead of dropping its tail against
// the border. blessed wraps by itself, but only ever back to column zero - and
// once a caller emits rows narrower than the pane, blessed leaves them alone,
// which is the whole trick. Emit anything WIDER than the pane and blessed
// re-wraps it and undoes the indent, so `width` must be the pane's real inner
// width (its box width minus its border).
//
// Measures on visibleLength, not .length: a styled span costs columns only for
// the text inside its tags. Splitting on whitespace can't cut a tag in half
// either, since no tag contains a space - a whole `{green-fg}word{/green-fg}`
// travels as one atom.
//
// An empty string yields a single empty row, so blank spacers survive a
// flatMap over this untouched.
export function wrapIndented(text, { width = 80, indent = 0, hangingIndent = 2 } = {}) {
  const words = text == null ? [] : String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const head = " ".repeat(indent);
  const continuation = " ".repeat(indent + hangingIndent);

  const rows = [];
  let row = [];
  let used = indent;

  for (const word of words) {
    const wordWidth = visibleLength(word);
    const space = row.length ? 1 : 0;
    if (row.length && used + space + wordWidth > width) {
      rows.push((rows.length ? continuation : head) + row.join(" "));
      row = [word];
      used = indent + hangingIndent + wordWidth;
      continue;
    }
    row.push(word);
    used += space + wordWidth;
  }
  rows.push((rows.length ? continuation : head) + row.join(" "));
  return balanceRows(rows);
}

// Closes any span still open at the end of a row and re-opens it on the next,
// so every row is valid markup on its own.
//
// A single word can't be split (no tag contains a space), but a span covering
// SEVERAL words can - data/flavor.js's openLine styles "8am - 8pm" as one span,
// which is three tokens. Left alone, one row would end mid-span and the next
// would carry an orphaned closer. blessed parses tags across the whole content
// and would very likely cope, but rows that don't depend on that are cheaper
// than finding out they don't - and it keeps the "tags balance per row"
// invariant true for anything measuring or slicing a single row later.
//
// Tags cost no columns, so the re-opened prefix can't push a row over `width`.
function balanceRows(rows) {
  const open = [];
  return rows.map((row) => {
    const reopened = open.join("");
    for (const tag of row.match(/\{[^}]*\}/g) ?? []) {
      if (tag.startsWith("{/")) open.pop();
      else open.push(tag);
    }
    const closed = [...open].reverse().map((tag) => `{/${tag.slice(1)}`).join("");
    // After the indent, not before it - leading spaces stay outside the span.
    return row.replace(/^(\s*)/, `$1${reopened}`) + closed;
  });
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
