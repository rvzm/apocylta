import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCommandRow, formatCommandCell, colorTag } from "../../ui/format.js";
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
