// apocylta markup - the one place neo-blessed's `{tag}` syntax is built.
//
// Lives at the top level rather than under ui/ because data/ needs it:
// data/flavor.js styles its lines, and nothing in data/ or state/ imports from
// ui/ anywhere in this repo. Top-level leaves are already the shared layer
// (logger.js, config.js, item_backbone.js are all imported from data/ this way).
//
// Imports ONLY state/displaySettings.js, which itself imports nothing - the
// same constraint that keeps ui/format.js out of db_backbone.js's import-time
// SQLite open, and what lets flavor.test.js/locations.test.js stay cheap.
//
// Tags only render on widgets built with `tags: true` (ui/layout.js's
// mainContent, subHeaderBar, inventoryList and the bars).

import { getDisplay } from "./state/displaySettings.js";

// Shades neo-blessed's named 8/16-color tags don't cover. Moved down from
// ui/layout.js so data/flavor.js can name the same shades without importing
// blessed, and switched from hex to **256-palette indices** on the way.
//
// Hex tags go through colors.match() (lib/colors.js), whose nearest-colour
// search is unreliable: it resolved `#ffd700` gold to index 3 - a dull
// (205,205,0) olive - and did the same to every grey and amber tried here,
// while resolving `#ffa500` correctly. An index skips the match entirely and
// takes the identical code path after it, so what you write is what renders.
// The first three are the exact indices their old hex values resolved to, so
// they look unchanged; `gold` is the one that visibly changes, to the colour it
// always asked for. test/unit/markup.test.js pins every entry.
export const COLOR = {
  orange: 214, // was "#ffa500"
  yellowOrange: 215, // was "#ffae42"
  darkBlue: 18, // was "#00008b"
  gold: 220, // was "#ffd700", which rendered olive
  grey: 245,
  amber: 179,
};

// The general form, and the single gate every styled string passes through.
//
// With colorize off this drops the colour but KEEPS bold and underline: both
// are video attributes (SGR 1 and SGR 4) that render fine on a terminal with no
// colour support. The same reasoning exempts inventoryList's `inverse: true`
// selection highlight, which isn't routed through here at all.
//
// Attribute order matters for nesting: colour outermost, then bold, then
// underline, closed in reverse. neo-blessed keeps separate fg/bg/flag stacks
// and pops back to the enclosing entry on a closing tag
// (lib/widgets/element.js's _parseTags), so styled spans nest correctly inside
// one another - which is what lets a flavour line style one word of itself and
// still sit inside ui/subHeader.js's white wrap.
export function styled(text, { color, bold, underline } = {}) {
  let out = String(text);
  if (underline) out = `{underline}${out}{/underline}`;
  if (bold) out = `{bold}${out}{/bold}`;
  if (color && getDisplay().colorize) out = `{${color}-fg}${out}{/${color}-fg}`;
  return out;
}

export function bold(text) {
  return styled(text, { bold: true });
}

export function underline(text) {
  return styled(text, { underline: true });
}

// The original three-argument form, kept exactly as it was: ~39 screen files
// and renderChrome's eight call sites import it, and its output is asserted
// byte-for-byte in test/unit/format.test.js and layout.test.js.
export function colorTag(text, color, bold) {
  return styled(text, { color, bold });
}

// Blessed markup doesn't occupy columns, so anything that pads, wraps or
// measures has to count the text the user actually sees. ui/format.js's "R"
// action style emits {bold} inside a padded cell and would otherwise throw the
// command legend out by 13 characters per cell; the same applies to
// wrapIndented and to the pane-overflow guard in test/unit/locations.test.js.
export function visibleLength(text) {
  return stripMarkup(text).length;
}

export function stripMarkup(text) {
  return String(text).replace(/\{[^}]*\}/g, "");
}

// Ordered high -> low threshold; first match wins. Moved down from ui/layout.js
// alongside HP_BANDS so data/flavor.js's healthLine can band itself with the
// exact table the status bar's HP number uses, rather than a second copy that
// would drift the moment either was re-pitched.
export function pickBand(pct, bands) {
  for (const band of bands) if (pct >= band.min) return band;
  return bands[bands.length - 1];
}

export const HP_BANDS = [
  { min: 0.8, color: "green" },
  { min: 0.6, color: "white" },
  { min: 0.4, color: "blue" },
  { min: 0.2, color: COLOR.orange },
  { min: 0, color: "red" },
];
