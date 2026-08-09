// public/apocylta_player.html is the reader for the [Export JSON] half of the
// playercard export: paste a payload in, get the same card back, statically.
//
// It is a self-contained file rather than one linking shared assets, because
// the point is that it can be dropped on a static host on its own - so it
// carries verbatim copies of index.html's styles, card markup and render code,
// delimited by sentinel comments in both files. That duplication is only safe
// while something checks it, and this is that something: the drift test below
// fails the moment one page is edited inside a shared region and the other
// isn't.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../public");
const live = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
const reader = fs.readFileSync(path.join(publicDir, "apocylta_player.html"), "utf8");

const REGIONS = [
  { name: "style", start: "/* shared:style start", end: "/* shared:style end */" },
  { name: "card", start: "<!-- shared:card start", end: "<!-- shared:card end -->" },
  { name: "render", start: "// shared:render start", end: "// shared:render end" },
];

function occurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function region(html, { start, end }) {
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  return html.slice(from, to + end.length);
}

// Extraction is index-based, so a duplicated marker would silently widen or
// truncate the compared span and let real drift through.
test("each shared marker appears exactly once in each page", () => {
  for (const [label, html] of [
    ["index.html", live],
    ["apocylta_player.html", reader],
  ]) {
    for (const { name, start, end } of REGIONS) {
      assert.equal(occurrences(html, start), 1, `${label} should have one ${name} start marker`);
      assert.equal(occurrences(html, end), 1, `${label} should have one ${name} end marker`);
    }
  }
});

test("the shared regions are identical in both pages", () => {
  for (const spec of REGIONS) {
    const a = region(live, spec);
    const b = region(reader, spec);
    assert.ok(a.length > 0, `the ${spec.name} region should not be empty`);
    assert.equal(
      b,
      a,
      `the ${spec.name} region has drifted between index.html and apocylta_player.html - ` +
        `copy it across, or move whatever changed outside the markers if it is page-local`
    );
  }
});

test("the reader ships the import controls", () => {
  assert.match(reader, /<textarea id="import-input"/);
  assert.match(reader, /id="import-btn"/);
  assert.match(reader, /id="import-file"[^>]*type="file"/);
  assert.match(reader, /<div id="pc-body" hidden>/, "the card stays hidden until an import succeeds");
});

// Same trap as index.html's export buttons: showTab() queries .tab-btn
// document-wide and reads btn.dataset.tab, so a control carrying that class
// would call showTab(undefined) on click and hide every panel at once.
test("the reader's own buttons are not tab buttons", () => {
  for (const id of ["import-btn", "reset-btn"]) {
    const button = reader.match(new RegExp(`<button id="${id}"[^>]*>`))[0];
    assert.doesNotMatch(button, /tab-btn/, `#${id} must not be a .tab-btn`);
  }
  assert.match(reader.match(/<button id="reset-btn"[^>]*>/)[0], /hidden/, "nothing to reset before an import");
});

// The whole reason this page can be hosted anywhere: it has no server to talk
// to. A stray fetch or poll copied over from index.html's bootstrap would fail
// silently in the browser rather than loudly here.
test("the reader never polls or fetches", () => {
  assert.doesNotMatch(reader, /fetch\(/, "the reader has no server to fetch from");
  assert.doesNotMatch(reader, /setInterval\(/, "an imported card is static - nothing to refresh");
  assert.doesNotMatch(reader, /api\/playercard/);
});

// render() is shared, and the reader has neither export button - so the
// visibility line has to look them up rather than assume them, or it throws
// before a single field is drawn.
test("the shared render code tolerates missing export buttons", () => {
  const render = region(live, REGIONS[2]);
  assert.doesNotMatch(
    render,
    /getElementById\("export-(json-)?btn"\)\.hidden/,
    "guard the export buttons with a lookup - the reader page has neither"
  );
});
