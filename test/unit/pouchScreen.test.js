// The Pouch screen's row builder, driven with no blessed anywhere - the same
// shape spellbookScreen.test.js uses for buildSpellRows().
//
// What's worth pinning here is the partition (only belt items, never pack ones)
// and the sectioning, since both are invisible to every other test: the screen
// is the only place `storeIn` decides what a player can SEE rather than what a
// budget charges.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../../state/gameState.js";
import { buildPouchRows, buildTabs, sectionOf } from "../../ui/screens/pouch.js";
import { ALL_ITEMS, ITEM_TYPES, storeInOf, weightOf } from "../../item_backbone.js";
import { stripMarkup } from "../../markup.js";

// A belt with something in every section this test cares about, plus two pack
// items that must never show up.
function loaded() {
  const state = createInitialState();
  state.inventory = {
    hammer: 1,
    iron_pickaxe: 2,
    copper_axe: 1,
    scrap_metal: 12,
    sandstone: 4,
    fishing_bait: 5,
    fishing_hook: 3,
    iron_ore: 9, // pack
    bread: 2, // pack
  };
  return state;
}

const plain = (lines) => lines.map(stripMarkup);

test("only belt items are listed - pack items never appear", () => {
  const { lines } = buildPouchRows(loaded(), "All");
  const text = plain(lines).join("\n");

  assert.match(text, /Hammer/);
  assert.match(text, /Scrap Metal/);
  assert.doesNotMatch(text, /Iron Ore/, "iron ore rides the pack, not the belt");
  assert.doesNotMatch(text, /Bread/);
});

test("every listed id really is a belt item", () => {
  const { itemIds } = buildPouchRows(loaded(), "All");
  for (const id of itemIds.filter(Boolean)) {
    assert.equal(storeInOf(id), "toolbelt", `${id} should not be on this screen`);
  }
});

test("tabs are All plus the types actually present, in ITEM_TYPES order", () => {
  const tabs = buildTabs(loaded());
  assert.equal(tabs[0], "All");

  const rest = tabs.slice(1);
  assert.deepEqual(rest, ITEM_TYPES.filter((t) => rest.includes(t)), "declared order, not insertion order");
  assert.ok(rest.includes("tool") && rest.includes("scrap") && rest.includes("crafting"));
  assert.ok(!rest.includes("food"), "a type with nothing on the belt gets no tab");
});

test("a type tab shows only that type", () => {
  const { lines } = buildPouchRows(loaded(), "tool");
  const text = plain(lines).join("\n");
  assert.match(text, /Hammer/);
  assert.doesNotMatch(text, /Scrap Metal/, "scrap is not a tool");
  assert.doesNotMatch(text, /Fishing Bait/);
});

test("rows sit under a subtype header carrying the section's count and weight", () => {
  const { lines, itemIds } = buildPouchRows(loaded(), "tool");
  const text = plain(lines);

  const header = text.findIndex((l) => /^\s*Pickaxe \(1\)/.test(l));
  assert.ok(header >= 0, `expected a Pickaxe header, got:\n${text.join("\n")}`);
  assert.equal(itemIds[header], null, "a header must not be actionable");

  // 2 iron pickaxes at 3 each.
  assert.match(text[header], new RegExp(`${weightOf("iron_pickaxe") * 2}\\s*$`));
  assert.match(text[header + 1], /- \[2\] Iron Pickaxe/);
  assert.equal(itemIds[header + 1], "iron_pickaxe");
});

test("sections are alphabetical and their rows sorted by name", () => {
  const state = createInitialState();
  state.inventory = { steel_pickaxe: 1, copper_pickaxe: 1, iron_pickaxe: 1, copper_axe: 1 };
  const { lines } = buildPouchRows(state, "tool");
  const text = plain(lines).filter((l) => l.trim());

  const headers = text.filter((l) => /^\s{2}\w/.test(l)).map((l) => l.trim().split(" (")[0]);
  assert.deepEqual(headers, ["Axe", "Pickaxe"], "sections in alphabetical order");

  const picks = text.filter((l) => /Pickaxe$|Pickaxe\s/.test(l) && l.includes("- ["));
  const names = picks.map((l) => l.match(/- \[\d+\] (.+?)\s{2}/)[1]);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)), "rows sorted by name");
});

// Bait and hooks share the canonical subtype "fishing" (mapped that way so
// equipSlotOf can't make them fight the rod for the single tool slot), so
// sectioning on subtype alone would lump twelve items under one "Fishing".
test("bait and hooks get their own sections, not one lumped Fishing", () => {
  assert.equal(sectionOf("fishing_bait"), "bait");
  assert.equal(sectionOf("fishing_hook"), "hook");
  assert.equal(ALL_ITEMS.fishing_bait.subtype, ALL_ITEMS.fishing_hook.subtype, "and they do share a subtype");

  const text = plain(buildPouchRows(loaded(), "crafting").lines).join("\n");
  assert.match(text, /Bait \(1\)/);
  assert.match(text, /Hook \(1\)/);
  assert.doesNotMatch(text, /Fishing \(/, "the shared subtype must not become a section");
});

// Header, blank and placeholder rows all carry a null id, which is what makes
// withSelection()'s "select an item first" cover landing on one.
test("only item rows are actionable", () => {
  const { lines, itemIds } = buildPouchRows(loaded(), "All");
  lines.forEach((line, i) => {
    const isItemRow = /- \[\d+\]/.test(stripMarkup(line));
    assert.equal(Boolean(itemIds[i]), isItemRow, `row ${i} (${stripMarkup(line)}) has the wrong id`);
  });
});

test("an empty belt says so, and says something different from an empty tab", () => {
  const empty = createInitialState();
  empty.inventory = {};
  const { lines, itemIds } = buildPouchRows(empty, "All");
  assert.match(lines[0], /belt is empty/i);
  assert.deepEqual(itemIds, [null], "the placeholder is not actionable");

  // A belt with things on it, filtered to a type none of them are.
  const { lines: none } = buildPouchRows(loaded(), "food");
  assert.match(none[0], /Nothing of that kind/i);
});

test("a stack's weight is quantity times unit weight, rounded to 2dp", () => {
  const state = createInitialState();
  state.inventory = { fishing_hook: 3 }; // 0.02 each
  const text = plain(buildPouchRows(state, "All").lines);
  const row = text.find((l) => l.includes("Fishing Hook"));
  assert.match(row, /0\.06\s*$/);
});
