import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCommandRow, formatCommandCell, colorTag, wrapIndented, visibleLength, stripMarkup } from "../../ui/format.js";
import { getDisplay, setDisplay } from "../../state/displaySettings.js";

// The three tests below assert the shipped default (action_key "B"), which is
// what formatCommandRow did before styles existed. Keeping "B" as the default
// is deliberate: 13 integration tests waitFor strings like "[S]ave", and they
// time out rather than fail fast if the legend format changes under them.
function withDisplay(patch, fn) {
  const before = { ...getDisplay() };
  try {
    setDisplay(patch);
    fn();
  } finally {
    setDisplay(before);
  }
}

// The plain text a cell occupies on screen - blessed markup takes no columns.
function visible(text) {
  return text.replace(/\{[^}]*\}/g, "");
}

test("formatCommandRow() folds a matching hotkey into the label's start", () => {
  const output = formatCommandRow([{ label: "Travel", hotkey: "T" }], { columns: 1 });
  assert.equal(output, "[T]ravel");
});

test("formatCommandRow() shows a non-matching hotkey as its own bracketed prefix", () => {
  const output = formatCommandRow([{ label: "Mine", hotkey: "N" }], { columns: 1 });
  assert.equal(output, "[N] Mine");
});

test("formatCommandRow() wraps into rows once the column count is exceeded", () => {
  const commands = [
    { label: "Travel", hotkey: "T" },
    { label: "Stations", hotkey: "K" },
    { label: "Menu", hotkey: "M" },
  ];
  const output = formatCommandRow(commands, { columns: 2, columnWidth: 12 });
  const rows = output.split("\n");
  assert.equal(rows.length, 2);
  assert.match(rows[0], /\[T\]ravel/);
  assert.match(rows[0], /\[K\] Stations/);
  assert.match(rows[1], /\[M\]enu/);
});

// ------------------------------------------------------------ action styles

test("formatCommandCell(): each style renders a matching hotkey its own way", () => {
  assert.equal(formatCommandCell("Travel", "T", "B"), "[T]ravel");
  assert.equal(formatCommandCell("Travel", "T", "P"), "[T] Travel");
  assert.equal(formatCommandCell("Travel", "T", "R"), "{bold}T{/bold}ravel");
  assert.equal(formatCommandCell("Travel", "T", "S"), "T: [Travel]");
});

// "R" is the only style that needs a fallback: with the hotkey nowhere in the
// label there is no letter to embolden. Not a rare case - "<>" for Switch tab,
// "123" for step size, and every digit-keyed row on location and travel.
test("formatCommandCell(): a non-matching hotkey falls back sensibly in every style", () => {
  assert.equal(formatCommandCell("Mine", "N", "B"), "[N] Mine");
  assert.equal(formatCommandCell("Mine", "N", "P"), "[N] Mine");
  assert.equal(formatCommandCell("Mine", "N", "R"), "[N] Mine", "bold has nothing to bold - use the prefix form");
  assert.equal(formatCommandCell("Mine", "N", "S"), "N: [Mine]");

  // Multi-character hotkeys behave the same way.
  assert.equal(formatCommandCell("Switch tab", "<>", "R"), "[<>] Switch tab");
  assert.equal(formatCommandCell("Gather scraps", "1", "R"), "[1] Gather scraps");
});

test("formatCommandCell(): an unknown style key falls back to the default", () => {
  assert.equal(formatCommandCell("Travel", "T", "nonsense"), "[T]ravel");
});

// The trap in style R: {bold} tags are characters in the string but occupy no
// columns, so padding on raw length throws the legend's alignment out by 13
// characters per cell.
test("formatCommandRow(): columns stay aligned under the bold style's markup", () => {
  withDisplay({ actionKey: "R" }, () => {
    const output = formatCommandRow(
      [
        { label: "Travel", hotkey: "T" },
        { label: "Menu", hotkey: "M" },
        { label: "Mine", hotkey: "N" },
        { label: "Stations", hotkey: "K" },
      ],
      { columns: 2, columnWidth: 20 }
    );
    const rows = output.split("\n");
    assert.equal(rows.length, 2);
    for (const row of rows) {
      // The separator has to land in the same column on every row.
      assert.equal(visible(row).indexOf("|"), 20, `misaligned: ${JSON.stringify(visible(row))}`);
    }
    assert.match(rows[0], /\{bold\}T\{\/bold\}ravel/);
  });
});

test("formatCommandRow(): the active style comes from the display setting", () => {
  withDisplay({ actionKey: "S" }, () => {
    assert.equal(formatCommandRow([{ label: "Back", hotkey: "B" }], { columns: 1 }), "B: [Back]");
  });
});

// ---------------------------------------------------------------- colorize

test("colorTag(): colorize off drops the colour but keeps bold", () => {
  withDisplay({ colorize: false }, () => {
    assert.equal(colorTag("Cure", "green", false), "Cure");
    // Bold is a video attribute, not a colour - it renders on a monochrome
    // terminal, so it survives. Same reasoning exempts inverse-video
    // selection, which never routes through here.
    assert.equal(colorTag("Cure", "green", true), "{bold}Cure{/bold}");
  });
});

test("colorTag(): colorize on is unchanged", () => {
  withDisplay({ colorize: true }, () => {
    assert.equal(colorTag("Cure", "green", false), "{green-fg}Cure{/green-fg}");
    assert.equal(colorTag("Cure", "green", true), "{green-fg}{bold}Cure{/bold}{/green-fg}");
  });
});

// ------------------------------------------------------------ wrapIndented

// The location body indents its flavour four spaces, but blessed's own wrapping
// only ever returns to column zero - so a long sentence used to drop its tail
// flush against the pane border. wrapIndented pre-wraps narrower than the pane
// so blessed leaves the rows alone, and hangs the continuations.
test("wrapIndented(): short text is one row at the given indent", () => {
  assert.deepEqual(wrapIndented("a short line", { width: 40, indent: 4 }), ["    a short line"]);
});

test("wrapIndented(): continuations hang past the first row's indent", () => {
  const rows = wrapIndented("one two three four five six", { width: 20, indent: 4 });
  assert.deepEqual(rows, ["    one two three", "      four five six"]);
  for (const row of rows) assert.ok(row.length <= 20, `"${row}" is wider than the pane`);
});

test("wrapIndented(): an empty line stays one empty row, so spacers survive", () => {
  assert.deepEqual(wrapIndented("", { width: 40, indent: 4 }), [""]);
  assert.deepEqual(wrapIndented(null, { width: 40, indent: 4 }), [""]);
});

function tagsBalance(row) {
  const opens = (row.match(/\{[^/][^}]*\}/g) ?? []).length;
  const closes = (row.match(/\{\/[^}]*\}/g) ?? []).length;
  return opens === closes;
}

// Splitting on whitespace can't cut a tag in half - no tag contains a space -
// so a styled word travels as one atom.
test("wrapIndented(): never splits a markup tag", () => {
  const text = `plain ${colorTag("styled", "green", true)} words here now`;
  for (const row of wrapIndented(text, { width: 24, indent: 0 })) {
    assert.ok(tagsBalance(row), `unbalanced tags in "${row}"`);
  }
});

// A span covering SEVERAL words can still land across a break - openLine styles
// "8am - 8pm" as one three-token span. Every row closes what it opened and the
// next row re-opens it, so no row depends on its neighbour to be valid markup.
test("wrapIndented(): closes and re-opens a span broken across rows", () => {
  const text = `The shutters are down here today. Open ${colorTag("8am - 8pm", "red", true)}.`;
  for (let width = 30; width <= 60; width++) {
    const rows = wrapIndented(text, { width, indent: 4 });
    for (const row of rows) {
      assert.ok(tagsBalance(row), `unbalanced at width ${width}: "${row}"`);
      // Re-opened tags cost no columns, so they can't push a row over.
      assert.ok(visibleLength(row) <= width, `width ${width} overflowed: "${row}"`);
    }
    assert.equal(
      rows.map(stripMarkup).join(" ").replace(/\s+/g, " ").trim(),
      stripMarkup(text),
      `text lost at width ${width}`
    );
  }
});

// The whole point: a styled word costs only the columns its text occupies, so a
// line full of markup must not wrap earlier than the same line without it.
test("wrapIndented(): measures visible width, not tag length", () => {
  const plain = "alpha bravo charlie delta";
  const styledText = `${colorTag("alpha", "green", true)} bravo ${colorTag("charlie", "red", false)} delta`;
  assert.equal(
    wrapIndented(styledText, { width: 30, indent: 0 }).length,
    wrapIndented(plain, { width: 30, indent: 0 }).length
  );
});
