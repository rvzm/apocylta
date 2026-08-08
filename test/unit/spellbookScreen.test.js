import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../../state/gameState.js";
import { SPELLS } from "../../magic_backbone.js";
import { buildSpellRows } from "../../ui/screens/spellbook.js";

// Finds the rendered row for a spell id via the parallel spellIds array, so
// the assertions don't depend on how deeply the row happens to be indented.
function rowFor({ lines, spellIds }, spellId) {
  const index = spellIds.indexOf(spellId);
  return index === -1 ? null : lines[index];
}

// Which "[Learnable]"/"[Unlearnable]" header a spell's row falls under.
function groupOf(rows, spellId) {
  const index = rows.spellIds.indexOf(spellId);
  assert.notEqual(index, -1, `${spellId} is missing from the Unlearned tab`);
  for (let i = index; i >= 0; i--) {
    if (rows.lines[i].includes("[Learnable]")) return "Learnable";
    if (rows.lines[i].includes("[Unlearnable]")) return "Unlearnable";
  }
  return null;
}

test("Learned tab: a fresh character has only the starter spell", () => {
  const state = createInitialState();
  const rows = buildSpellRows(state, "Learned");

  assert.deepEqual(
    rows.spellIds.filter(Boolean),
    ["magic_missle"],
    "only the starter spell is known at character creation"
  );
  assert.ok(rows.lines.some((line) => line.includes("Attack:")), "grouped under its type header");
  assert.match(rowFor(rows, "magic_missle"), /known \| cast: 6 mp/);
});

test("Learned tab: rows are green and a spell moves tabs once learned", () => {
  const state = createInitialState();
  state.inventory = { ley_crystals: 1, arcane_shard: 1 };

  assert.equal(rowFor(buildSpellRows(state, "Learned"), "cure"), null, "not known yet");

  state.spells.add("cure");
  const learned = buildSpellRows(state, "Learned");
  assert.ok(rowFor(learned, "cure").includes("{green-fg}"));
  assert.equal(rowFor(buildSpellRows(state, "Unlearned"), "cure"), null, "gone from Unlearned");
});

test("Unlearned tab: reagent counts show owned over required, and drive the Learnable split", () => {
  const state = createInitialState();

  const broke = buildSpellRows(state, "Unlearned");
  assert.match(rowFor(broke, "cure"), /learn: Ley Crystals \(0\/1\), Arcane Shard \(0\/1\)/);
  assert.equal(groupOf(broke, "cure"), "Unlearnable");
  assert.ok(rowFor(broke, "cure").includes("{red-fg}"));

  state.inventory = { ley_crystals: 1, arcane_shard: 1 };
  const stocked = buildSpellRows(state, "Unlearned");
  assert.match(rowFor(stocked, "cure"), /learn: Ley Crystals \(1\/1\), Arcane Shard \(1\/1\)/);
  assert.equal(groupOf(stocked, "cure"), "Learnable");
  assert.ok(rowFor(stocked, "cure").includes("{green-fg}"));
});

test("Unlearned tab: partial stock still counts up toward the requirement", () => {
  const state = createInitialState();
  state.skills.magic.level = 5;
  state.inventory = { ley_crystals: 2, green_herbs: 1 };

  const rows = buildSpellRows(state, "Unlearned");
  assert.match(
    rowFor(rows, "town_teleport"),
    /learn: Ley Crystals \(2\/3\), Green Herbs \(1\/3\), Arcane Shard \(0\/2\)/
  );
  assert.equal(groupOf(rows, "town_teleport"), "Unlearnable");
});

test("Unlearned tab: level-locked spells are listed with their requirement, not hidden", () => {
  const state = createInitialState();
  assert.equal(state.skills.magic.level, 1);

  const rows = buildSpellRows(state, "Unlearned");
  assert.match(rowFor(rows, "haste"), /req: magic lv 3 \| no cost \| cast: 14 mp/);
  assert.equal(groupOf(rows, "haste"), "Unlearnable");

  // A free-to-learn spell becomes Learnable the moment the level gate opens.
  state.skills.magic.level = 3;
  const leveled = buildSpellRows(state, "Unlearned");
  assert.equal(groupOf(leveled, "haste"), "Learnable");
  assert.doesNotMatch(rowFor(leveled, "haste"), /req: magic lv/);
});

test("both tabs together cover every spell exactly once, with null ids on headers", () => {
  const state = createInitialState();
  const learned = buildSpellRows(state, "Learned");
  const unlearned = buildSpellRows(state, "Unlearned");

  const listed = [...learned.spellIds, ...unlearned.spellIds].filter(Boolean);
  assert.deepEqual(listed.sort(), Object.keys(SPELLS).sort());

  for (const rows of [learned, unlearned]) {
    assert.equal(rows.lines.length, rows.spellIds.length, "parallel arrays stay in lockstep");
    for (const [i, id] of rows.spellIds.entries()) {
      if (id === null) continue;
      assert.ok(SPELLS[id], `${id} is a real spell`);
      assert.ok(rows.lines[i].includes(SPELLS[id].name), "the row names its spell");
    }
  }
  // Headers and blank separators are non-selectable.
  assert.ok(unlearned.spellIds.some((id) => id === null));
});
