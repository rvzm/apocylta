// markup.js is the one place blessed's {tag} syntax is built, and it is now
// reached from data/ as well as ui/ - so its output is load-bearing for the
// location body, every sub-header, the command legend and renderChrome alike.
import { test } from "node:test";
import assert from "node:assert/strict";
import { styled, bold, underline, colorTag, visibleLength, stripMarkup, COLOR, pickBand, HP_BANDS } from "../../markup.js";
import { getDisplay, setDisplay } from "../../state/displaySettings.js";

function withDisplay(patch, fn) {
  const before = { ...getDisplay() };
  try {
    setDisplay(patch);
    fn();
  } finally {
    setDisplay(before);
  }
}

// ------------------------------------------------------------------ styled

test("styled(): colour, bold and underline nest outside-in", () => {
  withDisplay({ colorize: true }, () => {
    assert.equal(styled("x", {}), "x");
    assert.equal(styled("x", { bold: true }), "{bold}x{/bold}");
    assert.equal(styled("x", { underline: true }), "{underline}x{/underline}");
    assert.equal(styled("x", { color: "green" }), "{green-fg}x{/green-fg}");
    assert.equal(
      styled("x", { color: "green", bold: true, underline: true }),
      "{green-fg}{bold}{underline}x{/underline}{/bold}{/green-fg}"
    );
  });
});

// Both bold (SGR 1) and underline (SGR 4) are video attributes that render on a
// terminal with no colour, so both survive the gate - only colour is dropped.
test("styled(): colorize off drops colour, keeps bold AND underline", () => {
  withDisplay({ colorize: false }, () => {
    assert.equal(styled("x", { color: "green" }), "x");
    assert.equal(styled("x", { color: "green", bold: true }), "{bold}x{/bold}");
    assert.equal(styled("x", { color: "green", underline: true }), "{underline}x{/underline}");
    assert.equal(bold("x"), "{bold}x{/bold}");
    assert.equal(underline("x"), "{underline}x{/underline}");
  });
});

test("styled(): a nested span closes back into its parent", () => {
  withDisplay({ colorize: true }, () => {
    const line = `left ${styled("mid", { color: "red" })} right`;
    // neo-blessed's _parseTags keeps separate fg/bg/flag stacks and re-emits the
    // enclosing entry on a closing tag, so wrapping this whole line again (which
    // ui/subHeader.js does) restores the outer colour after {/red-fg}.
    assert.equal(
      styled(line, { color: "white" }),
      "{white-fg}left {red-fg}mid{/red-fg} right{/white-fg}"
    );
  });
});

// -------------------------------------------------- backwards compatibility

// colorTag kept its three-argument signature through the move out of
// ui/format.js. renderChrome has eight call sites and ~39 screens import it;
// these are the exact strings it produced before the refactor.
test("colorTag(): output is unchanged by the move to markup.js", () => {
  withDisplay({ colorize: true }, () => {
    assert.equal(colorTag("Cure", "green", false), "{green-fg}Cure{/green-fg}");
    assert.equal(colorTag("Cure", "green", true), "{green-fg}{bold}Cure{/bold}{/green-fg}");
  });
  withDisplay({ colorize: false }, () => {
    assert.equal(colorTag("Cure", "green", false), "Cure");
    assert.equal(colorTag("Cure", "green", true), "{bold}Cure{/bold}");
  });
});

// ----------------------------------------------------------------- measuring

test("visibleLength()/stripMarkup() count only what reaches the screen", () => {
  const line = "{green-fg}{bold}four{/bold}{/green-fg} five";
  assert.equal(stripMarkup(line), "four five");
  assert.equal(visibleLength(line), 9);
  assert.equal(visibleLength("plain"), 5);
  assert.equal(visibleLength(""), 0);
});

// ------------------------------------------------------------------ palette

// COLOR entries must be 256-palette INDICES, never hex. A hex tag is resolved by
// neo-blessed's colors.match(), whose nearest-colour search is lossy in a way
// that fails silently: "#ffd700" (gold) landed on index 3, a dull (205,205,0)
// olive, and every grey and amber tried did the same. An index skips that
// search and renders exactly what it names.
test("every COLOR is a 256-palette index, not a hex string", () => {
  const offenders = Object.entries(COLOR).filter(
    ([, value]) => !Number.isInteger(value) || value < 0 || value > 255
  );
  assert.deepEqual(offenders, []);
});

test("styled() builds an indexed tag blessed reads as a colour", () => {
  withDisplay({ colorize: true }, () => {
    // "245-fg" -> param "245 fg" -> _attr's /^(-?\d+) (fg|bg)$/ branch.
    assert.equal(styled("x", { color: COLOR.grey }), "{245-fg}x{/245-fg}");
  });
});

// ------------------------------------------------------------------- bands

test("pickBand() takes the first band at or under the value, high to low", () => {
  assert.equal(pickBand(1, HP_BANDS).color, "green");
  assert.equal(pickBand(0.7, HP_BANDS).color, "white");
  assert.equal(pickBand(0.5, HP_BANDS).color, "blue");
  assert.equal(pickBand(0.3, HP_BANDS).color, COLOR.orange);
  assert.equal(pickBand(0, HP_BANDS).color, "red");
  // Below every threshold still resolves rather than returning undefined.
  assert.equal(pickBand(-1, HP_BANDS).color, "red");
});
