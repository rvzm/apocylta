// db_backbone.js opens a singleton Database at import time from
// process.env.DB_PATH, and ES module imports fully evaluate before this
// file's own top-level code runs - so DB_PATH must be set BEFORE any static
// import of a module that transitively imports db_backbone.js. Everything
// that touches persistence is therefore pulled in via dynamic import() below,
// inside the test body, after the env vars are set. Tests run in declaration
// order (node:test's default) and share the one db_backbone.js singleton for
// this whole file/process - each test below uses its own slot id(s) to stay
// isolated from the others, rather than needing separate databases. The
// "round-trip" test below uses slot 1, so later tests that inspect
// listSaveSlots()'s full 1..saveSlots range have to account for slot 1
// already being occupied by the time they run.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
process.env.DB_PATH = path.join(scratchDir, "test.sqlite");
process.env.LOG_PATH = path.join(scratchDir, "test.log");

after(() => fs.rmSync(scratchDir, { recursive: true, force: true }));

test("loadGame() returns null for an empty slot", async () => {
  const { loadGame } = await import("../../state/persistence.js");
  assert.equal(loadGame(999), null);
});

test("saveGame()/loadGame() round-trips a fully-populated state (slot 1)", async () => {
  const { saveGame, loadGame, listSaveSlots } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");

  const state = createInitialState();
  state.name = "Persisted Tester";
  state.race = "human";
  state.class = "warrior";
  state.difficulty = "normal";
  state.gold = 1234;
  state.currentLocationId = "wilderness";
  state.hp = 42;
  state.hpMax = 250;
  state.mp = 7;
  state.mpMax = 180;
  state.house = true;
  state.ownedStations = new Set(["forge", "crafting_table"]);
  state.spells = new Set(["cure", "wilderness_teleport"]);
  state.equipment.weapon = "iron_sword";
  state.equipment.tool = "copper_pickaxe";
  state.equipment.slingshot = "wooden_slingshot";
  state.equipment.belt = "chainmail_belt";
  state.equipment.head = "leather_cowl";
  // Slots that used to be dropped on save: a_shield was hardcoded to "" behind
  // a stale "no shield items exist yet" comment, and cloak/ring/necklace were
  // never in the ARMOR_SLOTS list at all.
  state.equipment.shield = "wooden_shield";
  state.equipment.cloak = "leather_cloak";
  state.inventory = { wood: 5, tin_ore: 2 };
  state.toolbelt = { waterBottle: 55, slingshotAmmo: 3, quiver: 12 };
  state.skills.mining.level = 7;
  state.skills.mining.xp = 999;
  state.skills.mining.proficient = true;
  // Regression coverage for the luck-column bug fixed alongside this suite
  // (skill_backbone.js's SKILLS includes "luck", but db_backbone.js's player
  // table previously had no matching columns, so saveGame() threw for every
  // player).
  state.skills.luck.level = 3;
  state.skills.luck.xp = 42;
  state.quests = {
    getting_started: {
      status: "in_progress",
      objectiveProgress: { "Sell Some scrap": 2 },
      // Admin overrides ride the same quest_objectives_json column.
      adminForced: { "Buy a House": true },
      completedAt: null,
    },
    mine_mine_mine: { status: "completed", objectiveProgress: {}, completedAt: 1700000000000 },
  };

  const before = Date.now();
  saveGame(state, 1);
  const loaded = loadGame(1);

  assert.ok(loaded, "expected a saved game to load back");
  assert.equal(loaded.name, "Persisted Tester");
  assert.equal(loaded.gold, 1234);
  assert.equal(loaded.currentLocationId, "wilderness");
  assert.equal(loaded.hp, 42);
  assert.equal(loaded.hpMax, 250, "maxes had no columns at all until the admin editors needed them");
  assert.equal(loaded.mp, 7);
  assert.equal(loaded.mpMax, 180);
  assert.equal(loaded.house, true);
  assert.deepEqual([...loaded.ownedStations].sort(), ["crafting_table", "forge"]);
  assert.deepEqual([...loaded.spells].sort(), ["cure", "wilderness_teleport"]);
  assert.equal(loaded.equipment.weapon, "iron_sword");
  assert.equal(loaded.equipment.tool, "copper_pickaxe");
  assert.equal(loaded.equipment.slingshot, "wooden_slingshot");
  assert.equal(loaded.equipment.belt, "chainmail_belt");
  assert.equal(loaded.equipment.head, "leather_cowl");
  assert.equal(loaded.equipment.shield, "wooden_shield");
  assert.equal(loaded.equipment.cloak, "leather_cloak");
  assert.deepEqual(loaded.toolbelt, { waterBottle: 55, slingshotAmmo: 3, quiver: 12 });
  assert.equal(loaded.inventory.wood, 5);
  assert.equal(loaded.inventory.tin_ore, 2);
  assert.equal(loaded.skills.mining.level, 7);
  assert.equal(loaded.skills.mining.xp, 999);
  assert.equal(loaded.skills.mining.proficient, true);
  assert.equal(loaded.skills.luck.level, 3);
  assert.equal(loaded.skills.luck.xp, 42);
  assert.equal(loaded.quests.getting_started.status, "in_progress");
  assert.deepEqual(loaded.quests.getting_started.objectiveProgress, { "Sell Some scrap": 2 });
  assert.deepEqual(loaded.quests.getting_started.adminForced, { "Buy a House": true });
  assert.equal(loaded.quests.getting_started.completedAt, null);
  assert.equal(loaded.quests.mine_mine_mine.status, "completed");
  assert.equal(loaded.quests.mine_mine_mine.completedAt, 1700000000000);

  const slot1 = listSaveSlots().find((s) => s.slotId === 1);
  assert.ok(slot1.savedAt >= before, "saved_at should reflect this save's timestamp");
});

// quest_objectives_json used to hold objectiveProgress bare; it now holds a
// { progress, adminForced } envelope. Every save written before that change
// has the old shape, so the load side has to recognise both.
test("loadGame() reads a legacy bare objectiveProgress payload (slot 4)", async () => {
  const { saveGame, loadGame } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");
  const { db } = await import("../../db_backbone.js");

  const state = createInitialState();
  state.name = "Legacy";
  state.race = "human";
  state.class = "warrior";
  state.difficulty = "normal";
  state.quests = { getting_started: { status: "in_progress", objectiveProgress: {}, completedAt: null } };
  saveGame(state, 4);

  // Rewrite the column to the pre-envelope shape, behind saveGame's back.
  db.prepare(`UPDATE quests SET quest_objectives_json = ? WHERE player_id = ? AND quest_id = ?`).run(
    JSON.stringify({ "Sell Some scrap": 3 }),
    4,
    "getting_started"
  );

  const loaded = loadGame(4);
  assert.deepEqual(loaded.quests.getting_started.objectiveProgress, { "Sell Some scrap": 3 });
  assert.deepEqual(loaded.quests.getting_started.adminForced, {});
});

// Fresh-schema check only - it passes off CREATE TABLE alone. The migration
// path onto a database that predates these columns is covered separately in
// test/unit/dbMigration.test.js, which is where the ALTER TABLE actually runs.
test("the player table carries every column saveGame's upsert names", async () => {
  const { db } = await import("../../db_backbone.js");
  const columns = db.prepare(`PRAGMA table_info(player)`).all().map((c) => c.name);

  for (const column of ["health_max", "mana_max", "a_shield", "a_cloak", "a_ring", "a_necklace"]) {
    assert.ok(columns.includes(column), `player.${column} must exist for saveGame's upsert`);
  }
});

test("save slots are isolated from each other", async () => {
  const { saveGame, loadGame } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");

  const a = createInitialState();
  a.name = "Slot A";
  a.race = "human";
  a.class = "warrior";
  a.difficulty = "normal";
  saveGame(a, 10);

  const b = createInitialState();
  b.name = "Slot B";
  b.race = "dwarf";
  b.class = "tank";
  b.difficulty = "hard";
  saveGame(b, 11);

  assert.equal(loadGame(10).name, "Slot A");
  assert.equal(loadGame(11).name, "Slot B");
  assert.equal(loadGame(1).name, "Persisted Tester"); // unaffected by slots 10/11
});

test("deleteSave() clears a slot's player row and child-table rows", async () => {
  const { saveGame, loadGame, deleteSave } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");

  const state = createInitialState();
  state.name = "To Delete";
  state.race = "human";
  state.class = "warrior";
  state.difficulty = "normal";
  state.inventory = { wood: 3 };
  state.ownedStations = new Set(["forge"]);
  state.quests = { getting_started: { status: "in_progress", objectiveProgress: {}, completedAt: null } };
  saveGame(state, 20);
  assert.ok(loadGame(20));

  deleteSave(20);
  assert.equal(loadGame(20), null);
});

test("listSaveSlots() reports empty vs. populated slots with a summary", async () => {
  const { saveGame, listSaveSlots } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");
  const { game_config } = await import("../../config.js");

  const state = createInitialState();
  state.name = "Slotted";
  state.race = "elf";
  state.class = "ranger";
  state.difficulty = "normal";
  state.level = 4;
  state.currentLocationId = "wilderness";
  saveGame(state, 2);

  const slots = listSaveSlots();
  assert.equal(slots.length, game_config.saveSlots);

  const slot2 = slots.find((s) => s.slotId === 2);
  assert.equal(slot2.empty, false);
  assert.equal(slot2.name, "Slotted");
  assert.equal(slot2.level, 4);
  assert.equal(slot2.race, "elf");
  assert.equal(slot2.class, "ranger");
  assert.equal(slot2.currentLocationId, "wilderness");
  assert.ok(slot2.savedAt > 0);

  // Slot 3 is never touched by any test in this file, so it stays empty -
  // slot 1 is deliberately not asserted on here (occupied by an earlier test).
  const slot3 = slots.find((s) => s.slotId === 3);
  assert.equal(slot3.empty, true);
});

// The enemies_defeated table has existed (unused) in db_backbone.js since
// before combat did, so this needs no ALTER TABLE migration - but the tally
// behind defeatEnemy quest objectives has to survive a save/load like the
// other child tables do.
test("saveGame()/loadGame() round-trips the lifetime enemy kill tally (slot 3)", async () => {
  const { saveGame, loadGame } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");

  const state = createInitialState();
  state.name = "Slayer";
  state.race = "orc";
  state.class = "warrior";
  state.difficulty = "normal";
  state.enemiesDefeated = { weak_goblin: 12, hubert: 1 };

  saveGame(state, 3);
  assert.deepEqual(loadGame(3).enemiesDefeated, { weak_goblin: 12, hubert: 1 });
});

test("saveGame() rewrites the kill tally wholesale rather than accumulating (slot 3)", async () => {
  const { saveGame, loadGame } = await import("../../state/persistence.js");

  const reloaded = loadGame(3);
  reloaded.enemiesDefeated = { weak_goblin: 20 }; // hubert dropped, goblins up
  saveGame(reloaded, 3);

  assert.deepEqual(loadGame(3).enemiesDefeated, { weak_goblin: 20 });
});

test("loadGame() always resumes out of combat (slot 3)", async () => {
  const { loadGame } = await import("../../state/persistence.js");
  const loaded = loadGame(3);
  assert.equal(loaded.currentCombat, null);
  assert.equal(loaded.currentAction, null);
  assert.equal(loaded.currentTravel, null);
});

test("deleteSave() clears the kill tally with the rest of the slot (slot 3)", async () => {
  const { saveGame, loadGame, deleteSave } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");

  deleteSave(3);
  assert.equal(loadGame(3), null);

  // A fresh character reusing the slot must not inherit the old kills.
  const fresh = createInitialState();
  fresh.name = "Newcomer";
  fresh.race = "human";
  fresh.class = "mage";
  fresh.difficulty = "normal";
  saveGame(fresh, 3);
  assert.deepEqual(loadGame(3).enemiesDefeated, {});
});

// Achievements: unlocking is binary, so the long-unused achievements table's
// existing columns are enough - no achievement_progress_json migration of the
// sort the quests table needed, since progress is recomputed from live state.
test("saveGame()/loadGame() round-trips achievements, visited locations and lifetime counters (slot 2)", async () => {
  const { saveGame, loadGame } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");

  const state = createInitialState();
  state.name = "Achiever";
  state.race = "elf";
  state.class = "mage";
  state.difficulty = "normal";
  state.achievements = { welcome_to_apocylta: { unlockedAt: 1700000000000 } };
  state.locationsVisited = new Set(["town_square", "wilderness", "north_path"]);
  // `used` is listed explicitly because loadGame() rebuilds state.lifetime from
  // a hardcoded key list and drops rows whose kind isn't in it - the write side
  // is generic, so a ledger missing from that list saves fine and vanishes here.
  state.lifetime = {
    sold: { stone: 6 },
    crafted: { iron_sword: 3 },
    cast: { fireball: 2 },
    used: { healing_potion: 4, bread: 1 },
  };

  saveGame(state, 2);
  const loaded = loadGame(2);

  assert.deepEqual(loaded.achievements, { welcome_to_apocylta: { unlockedAt: 1700000000000 } });
  assert.ok(loaded.locationsVisited instanceof Set, "must rehydrate as a Set, not an array");
  assert.deepEqual([...loaded.locationsVisited].sort(), ["north_path", "town_square", "wilderness"]);
  assert.deepEqual(loaded.lifetime, {
    sold: { stone: 6 },
    crafted: { iron_sword: 3 },
    cast: { fireball: 2 },
    used: { healing_potion: 4, bread: 1 },
  });
});

test("loadGame() always counts the current location as visited (slot 2)", async () => {
  const { saveGame, loadGame } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");

  // A save predating the locations_visited table has no rows at all; the
  // player is still standing somewhere, and that should count.
  const state = createInitialState();
  state.name = "Wanderer";
  state.race = "orc";
  state.class = "tank";
  state.difficulty = "normal";
  state.currentLocationId = "wilderness";
  state.locationsVisited = new Set();

  saveGame(state, 2);
  assert.ok(loadGame(2).locationsVisited.has("wilderness"));
});

test("deleteSave() clears achievements, visited locations and counters (slot 2)", async () => {
  const { saveGame, loadGame, deleteSave } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");

  deleteSave(2);
  assert.equal(loadGame(2), null);

  // A fresh character reusing the slot must not inherit the old progress.
  const fresh = createInitialState();
  fresh.name = "Newcomer";
  fresh.race = "human";
  fresh.class = "warrior";
  fresh.difficulty = "normal";
  saveGame(fresh, 2);

  const reloaded = loadGame(2);
  assert.deepEqual(reloaded.achievements, {});
  assert.deepEqual(reloaded.lifetime, { sold: {}, crafted: {}, cast: {}, used: {} });
  assert.deepEqual([...reloaded.locationsVisited], ["town_square"]);
});

// Groups became headers rather than enemies, so a group id in the kill tally
// is an artifact of the old stat-blob behaviour, not history. Saves written
// before that change contain them and must not carry them forward - they'd
// also silently under-count type-matched quest progress, since a group has no
// `type` to match on.
test("loadGame() drops legacy group ids from the kill tally (slot 1)", async () => {
  const { saveGame, loadGame } = await import("../../state/persistence.js");
  const { createInitialState } = await import("../../state/gameState.js");
  const { db } = await import("../../db_backbone.js");

  const state = createInitialState();
  state.name = "Veteran";
  state.race = "dwarf";
  state.class = "tank";
  state.difficulty = "normal";
  state.enemiesDefeated = { weak_goblin: 5 };
  saveGame(state, 1);

  // Write a group row directly - saveGame can no longer produce one, which is
  // the point: this simulates a save made before the rule existed.
  db.prepare(`INSERT INTO enemies_defeated (player_id, enemy_id, quantity) VALUES (?, ?, ?)`).run(
    1,
    "goblin_group",
    3
  );

  const loaded = loadGame(1);
  assert.deepEqual(loaded.enemiesDefeated, { weak_goblin: 5 }, "the group row is dropped, the member row kept");
});
