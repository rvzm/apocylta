import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSubHeader, applySubHeader } from "../../ui/subHeader.js";
import { CONTENT_TOP, SUB_BAR_HEIGHT } from "../../ui/layout.js";
import { createInitialState } from "../../state/gameState.js";
import { questBoardScreen } from "../../ui/screens/questBoard.js";
import { mineSelectScreen } from "../../ui/screens/mineSelect.js";

function at(hour) {
  const state = createInitialState();
  state.clock.totalMinutes = hour * 60;
  return state;
}

// applySubHeader only touches show/hide/setContent and top/height, so a plain
// stub is enough - same approach layout.test.js takes for renderChrome.
function stubUi() {
  const widget = () => ({
    hidden: true,
    content: "",
    top: CONTENT_TOP,
    height: `100%-${CONTENT_TOP}`,
    show() {
      this.hidden = false;
    },
    hide() {
      this.hidden = true;
    },
    setContent(text) {
      this.content = text;
    },
  });
  return { subHeaderBar: widget(), mainContent: widget(), inventoryList: widget() };
}

// ------------------------------------------------------------- resolution

test("resolveSubHeader(): a screen without one resolves to null", () => {
  assert.equal(resolveSubHeader({}, createInitialState()), null);
  assert.equal(resolveSubHeader(undefined, createInitialState()), null);
});

test("resolveSubHeader(): accepts a string, a function, or an array", () => {
  const state = createInitialState();
  assert.equal(resolveSubHeader({ subHeader: "just this" }, state), "just this");
  assert.equal(resolveSubHeader({ subHeader: () => "computed" }, state), "computed");
  assert.equal(resolveSubHeader({ subHeader: ["only one"] }, state), "only one");
});

test("resolveSubHeader(): entries are called with (state, location)", () => {
  const state = createInitialState();
  const seen = [];
  resolveSubHeader({ subHeader: [(s, l) => seen.push([s, l?.id]) && "x"] }, state);
  assert.equal(seen[0][0], state);
  assert.equal(seen[0][1], state.currentLocationId, "the current location, so data/flavor.js helpers work");
});

test("resolveSubHeader(): null entries drop out, and all-null resolves to null", () => {
  const state = at(9);
  const only = resolveSubHeader({ subHeader: [() => null, "survivor", () => null] }, state);
  assert.equal(only, "survivor");
  assert.equal(resolveSubHeader({ subHeader: [() => null, () => null] }, state), null);
});

// The anti-flicker property: these screens re-render on every keypress, so a
// random pick would reshuffle the bar as you moved the cursor.
test("resolveSubHeader(): the same state always yields the same line", () => {
  const screen = { subHeader: ["a", "b", "c", "d"] };
  const state = at(14);
  const first = resolveSubHeader(screen, state);
  for (let i = 0; i < 20; i++) assert.equal(resolveSubHeader(screen, state), first);
});

test("resolveSubHeader(): the line turns over as the hours pass", () => {
  const screen = { subHeader: ["a", "b", "c", "d"] };
  const seen = new Set();
  for (let hour = 0; hour < 24; hour++) seen.add(resolveSubHeader(screen, at(hour)));
  assert.deepEqual([...seen].sort(), ["a", "b", "c", "d"], "every line should come up over a day");
});

// ---------------------------------------------------------------- geometry

test("applySubHeader(): showing the bar moves both content widgets down", () => {
  const ui = stubUi();
  applySubHeader(ui, "some flavour");

  assert.equal(ui.subHeaderBar.hidden, false);
  assert.match(ui.subHeaderBar.content, /some flavour/);

  const expected = CONTENT_TOP + SUB_BAR_HEIGHT;
  // Both, not just the visible one - they're siblings pinned together, and
  // moving one would leave a gap or an overlap depending which screen it is.
  for (const widget of [ui.mainContent, ui.inventoryList]) {
    assert.equal(widget.top, expected);
    assert.equal(widget.height, `100%-${expected}`);
  }
});

test("applySubHeader(): hiding it restores the full-height pane", () => {
  const ui = stubUi();
  applySubHeader(ui, "shown");
  applySubHeader(ui, null);

  assert.equal(ui.subHeaderBar.hidden, true);
  for (const widget of [ui.mainContent, ui.inventoryList]) {
    assert.equal(widget.top, CONTENT_TOP);
    assert.equal(widget.height, `100%-${CONTENT_TOP}`);
  }
});

// blessed clears cached positions on every geometry write, so re-rendering a
// screen shouldn't keep re-setting a value that hasn't changed.
test("applySubHeader(): re-applying the same visibility doesn't rewrite geometry", () => {
  const ui = stubUi();
  let writes = 0;
  let top = ui.mainContent.top;
  Object.defineProperty(ui.mainContent, "top", {
    get: () => top,
    set: (value) => {
      writes += 1;
      top = value;
    },
  });

  applySubHeader(ui, "shown");
  assert.equal(writes, 1, "the first show moves it");

  applySubHeader(ui, "a different line, same bar");
  assert.equal(writes, 1, "still showing - nothing to move");

  applySubHeader(ui, null);
  assert.equal(writes, 2, "hiding moves it back");
});

// ------------------------------------------------------- the real screens

test("the opt-in screens resolve to a real line at every hour", () => {
  const screens = { questBoard: questBoardScreen, mineSelect: mineSelectScreen };
  for (const [name, screen] of Object.entries(screens)) {
    for (let hour = 0; hour < 24; hour++) {
      const line = resolveSubHeader(screen, at(hour));
      assert.equal(typeof line, "string", `${name} resolved to ${line} at ${hour}:00`);
      // The bar's interior is one row; blessed wraps, so a long line is cut.
      assert.ok(line.length <= 116, `${name} line is ${line.length} cols at ${hour}:00`);
    }
  }
});
