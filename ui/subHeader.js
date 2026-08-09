// ui/subHeader.js - the optional second header bar.
//
// A screen opts in by declaring a `subHeader` field; ui/router.js resolves and
// applies it on every render, so no screen has to touch the widget itself.
// The field takes the same shapes as a location's `flavorText`:
//
//   subHeader: "one fixed line"
//   subHeader: (state, location) => string | null
//   subHeader: ["a line", anotherLine, timeLine]
//
// Entries are (state, location) exactly like flavorText's, so every helper in
// data/flavor.js drops straight in.

import { getCurrentLocation } from "../state/gameState.js";
import { hourOfDay } from "../state/clock.js";
import { colorTag } from "./format.js";
import { CONTENT_TOP, SUB_BAR_HEIGHT } from "./layout.js";

// Picks by the hour rather than at random. These screens re-render on every
// keypress, so a random pick would make the bar flicker as you moved the
// cursor; keyed to the clock it holds still and turns over on its own.
export function resolveSubHeader(screen, state) {
  const raw = screen?.subHeader;
  if (raw == null) return null;

  const location = getCurrentLocation(state);
  const entries = Array.isArray(raw) ? raw : [raw];
  const lines = entries
    .map((entry) => (typeof entry === "function" ? entry(state, location) : entry))
    .filter((line) => line != null && line !== "");

  if (!lines.length) return null;
  return lines[hourOfDay(state) % lines.length];
}

// Shows or hides the bar, moving the content widgets to match. This is the one
// place in the codebase that changes widget geometry at runtime - mainContent
// and inventoryList are siblings pinned at the same top/height, so both have to
// move together or the visible one leaves a gap or overlaps the bar.
export function applySubHeader(ui, text) {
  const showing = !!text;
  const top = CONTENT_TOP + (showing ? SUB_BAR_HEIGHT : 0);

  if (showing) {
    ui.subHeaderBar.setContent(` ${colorTag(text, "white", false)}`);
    ui.subHeaderBar.show();
  } else {
    ui.subHeaderBar.hide();
  }

  for (const widget of [ui.mainContent, ui.inventoryList]) {
    if (widget.top === top) continue; // blessed clears cached positions on write; don't churn
    widget.top = top;
    widget.height = `100%-${top}`;
  }
}
