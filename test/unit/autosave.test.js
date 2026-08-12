// AUTOSAVE_PATH is resolved at import time from process.env.AUTOSAVE_PATH, so
// (matching persistence.test.js's convention) the env var is set before any
// static import of state/autosave.js, and the module itself is pulled in via
// dynamic import() inside the test body.
import { test, after } from "node:test";
import assert from "node:assert/strict";
// Safe to import statically: currency_backbone.js imports nothing, so it can't
// drag in the modules that resolve DB_PATH/LOG_PATH at import time.
import { purseFromBase, purseTotal } from "../../currency_backbone.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
// Safe to import statically: skill_backbone.js is a leaf with no imports of its
// own, so it can't drag in one of the env-var-at-import-time modules above.
import { playerLevelCost } from "../../skill_backbone.js";

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
  // Level and xp have to agree: readAutosave() derives the level from the
  // banked xp rather than trusting the stored number, which is what migrates
  // saves written against the old (far shallower) player curve.
  state.level = 5;
  state.experience = playerLevelCost(5);
  state.cur = purseFromBase(777);
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
  assert.equal(purseTotal(loaded.cur), 777);
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
  state.experience = playerLevelCost(9);
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

// The autosave captures the same logical fields the DB save does, blessings
// included - and for the same reason it stores remaining minutes rather than an
// absolute deadline: readAutosave() builds on createInitialState(), whose clock
// is reseeded to 7:38pm every time.
test("writeAutosave()/readAutosave() round-trips a live blessing against a reseeded clock", async () => {
  const { writeAutosave, readAutosave } = await import("../../state/autosave.js");
  const { createInitialState, effectiveSkillLevel } = await import("../../state/gameState.js");
  const { SPELLS } = await import("../../magic_backbone.js");

  const state = createInitialState();
  state.clock.totalMinutes = 9000;
  state.aidBuffs = [
    { spellId: "blessed pickaxe", untilMinutes: 9000 + 250 },
    { spellId: "blessed hammer", untilMinutes: 8999 }, // already expired
  ];
  writeAutosave(state);

  const loaded = readAutosave();
  assert.equal(loaded.aidBuffs.length, 1, "the expired one is swept on write");
  assert.equal(loaded.aidBuffs[0].untilMinutes - loaded.clock.totalMinutes, 250);
  assert.equal(
    effectiveSkillLevel(loaded, "mining"),
    loaded.skills.mining.level + SPELLS["blessed pickaxe"].buff.mining
  );
});

// Object.assign would otherwise write undefined over the array effectiveSkillLevel
// walks on every skill read - the same trap enhancements and locationsVisited hit.
test("readAutosave(): a snapshot written before blessings existed loads an empty list, not undefined", async () => {
  const { readAutosave, AUTOSAVE_PATH } = await import("../../state/autosave.js");
  const raw = JSON.parse(fs.readFileSync(AUTOSAVE_PATH, "utf8"));
  delete raw.aidBuffs;
  fs.writeFileSync(AUTOSAVE_PATH, JSON.stringify(raw));

  const loaded = readAutosave();
  assert.deepEqual(loaded.aidBuffs, []);
});
