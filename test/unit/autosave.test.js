// AUTOSAVE_PATH is resolved at import time from process.env.AUTOSAVE_PATH, so
// (matching persistence.test.js's convention) the env var is set before any
// static import of state/autosave.js, and the module itself is pulled in via
// dynamic import() inside the test body.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-autosave-test-"));
process.env.AUTOSAVE_PATH = path.join(scratchDir, "autosave.json");

after(() => fs.rmSync(scratchDir, { recursive: true, force: true }));

test("readAutosave() returns null and autosaveSummary() reports empty before any write", async () => {
  const { readAutosave, autosaveSummary } = await import("../../state/autosave.js");
  assert.equal(readAutosave(), null);
  assert.deepEqual(autosaveSummary(), { empty: true });
});

test("writeAutosave()/readAutosave() round-trips state, including ownedStations as a real Set", async () => {
  const { writeAutosave, readAutosave } = await import("../../state/autosave.js");
  const { createInitialState } = await import("../../state/gameState.js");

  const state = createInitialState();
  state.name = "Autosaved Tester";
  state.race = "human";
  state.class = "warrior";
  state.difficulty = "normal";
  state.level = 5;
  state.gold = 777;
  state.currentLocationId = "wilderness";
  state.hp = 30;
  state.mp = 4;
  state.house = true;
  state.ownedStations = new Set(["forge", "crafting_table"]);
  state.spells = new Set(["cure", "wilderness_teleport"]);
  state.inventory = { wood: 5, tin_ore: 2 };

  writeAutosave(state);
  const loaded = readAutosave();

  assert.ok(loaded, "expected the autosave to load back");
  assert.equal(loaded.name, "Autosaved Tester");
  assert.equal(loaded.level, 5);
  assert.equal(loaded.gold, 777);
  assert.equal(loaded.currentLocationId, "wilderness");
  assert.equal(loaded.hp, 30);
  assert.equal(loaded.mp, 4);
  assert.equal(loaded.house, true);
  assert.ok(loaded.ownedStations instanceof Set, "ownedStations should be restored as a Set instance");
  assert.deepEqual([...loaded.ownedStations].sort(), ["crafting_table", "forge"]);
  assert.ok(loaded.spells instanceof Set, "spells should be restored as a Set instance");
  assert.deepEqual([...loaded.spells].sort(), ["cure", "wilderness_teleport"]);
  assert.equal(loaded.inventory.wood, 5);
  assert.equal(loaded.inventory.tin_ore, 2);
  assert.ok(loaded.savedAt > 0);
});

test("autosaveSummary() reflects the most recently written autosave", async () => {
  const { writeAutosave, autosaveSummary } = await import("../../state/autosave.js");
  const { createInitialState } = await import("../../state/gameState.js");

  const state = createInitialState();
  state.name = "Summary Tester";
  state.race = "elf";
  state.class = "ranger";
  state.difficulty = "hard";
  state.level = 9;
  state.currentLocationId = "wilderness";

  const before = Date.now();
  writeAutosave(state);
  const summary = autosaveSummary();

  assert.equal(summary.empty, false);
  assert.equal(summary.name, "Summary Tester");
  assert.equal(summary.level, 9);
  assert.equal(summary.race, "elf");
  assert.equal(summary.class, "ranger");
  assert.equal(summary.currentLocationId, "wilderness");
  assert.ok(summary.savedAt >= before, "savedAt should reflect this write's timestamp");
});

test("writeAutosave() overwrites the previous snapshot rather than accumulating", async () => {
  const { writeAutosave, readAutosave } = await import("../../state/autosave.js");
  const { createInitialState } = await import("../../state/gameState.js");

  const first = createInitialState();
  first.name = "First";
  writeAutosave(first);

  const second = createInitialState();
  second.name = "Second";
  writeAutosave(second);

  assert.equal(readAutosave().name, "Second");
});
