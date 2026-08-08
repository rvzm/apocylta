// The one thing a fresh-schema test can never catch: CREATE TABLE IF NOT
// EXISTS is a no-op on a database that already has the table, so a column
// added later only reaches a real player's save file through db_backbone.js's
// explicit ALTER TABLE migrations. This file seeds a database in the *old*
// shape, then opens it through db_backbone and checks the migration ran.
//
// Same import-time gotcha as persistence.test.js: db_backbone opens its
// singleton from process.env.DB_PATH at import, so the seeding has to happen
// before any static import that reaches it - hence the dynamic import below.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
const dbPath = path.join(scratchDir, "legacy.sqlite");
process.env.DB_PATH = dbPath;
process.env.LOG_PATH = path.join(scratchDir, "test.log");

// A player table as it stood before health_max/mana_max existed. Only the
// columns the migration cares about matter; the rest of the schema is created
// normally by db_backbone on import.
const legacy = new Database(dbPath);
legacy.exec(`
  CREATE TABLE player (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    class TEXT NOT NULL,
    health INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 50
  );
`);
legacy.prepare(`INSERT INTO player (id, name, race, class, health, mana) VALUES (?, ?, ?, ?, ?, ?)`).run(
  1,
  "Old Save",
  "human",
  "warrior",
  73,
  21
);

// game_settings as it shipped: no action_key, and an account_id foreign key
// that no row could ever satisfy (TEXT defaulting to '' against an INTEGER
// player.id). better-sqlite3 enables PRAGMA foreign_keys by default, so that
// constraint made the whole table unwritable - which is why it sat empty.
legacy.exec(`
  CREATE TABLE game_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    colorize INTEGER NOT NULL DEFAULT 1,
    account_id TEXT NOT NULL DEFAULT '',
    first_run INTEGER NOT NULL DEFAULT 0,
    last_run INTEGER NOT NULL DEFAULT 0,
    last_autosave INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(account_id) REFERENCES player(id)
  );
`);
legacy.close();

after(() => fs.rmSync(scratchDir, { recursive: true, force: true }));

test("opening a pre-max-columns database migrates it instead of leaving it broken", async () => {
  const { db } = await import("../../db_backbone.js");
  const columns = db.prepare(`PRAGMA table_info(player)`).all().map((c) => c.name);

  assert.ok(columns.includes("health_max"), "ALTER TABLE must add health_max");
  assert.ok(columns.includes("mana_max"), "ALTER TABLE must add mana_max");

  // The existing row survives, with the new columns defaulted rather than null.
  const row = db.prepare(`SELECT * FROM player WHERE id = 1`).get();
  assert.equal(row.name, "Old Save");
  assert.equal(row.health, 73);
  assert.equal(row.health_max, 100);
  assert.equal(row.mana_max, 100);
});

test("loadGame() on a migrated legacy row falls back to the default maxes", async () => {
  const { loadGame } = await import("../../state/persistence.js");
  const loaded = loadGame(1);

  assert.ok(loaded, "the legacy row should still load");
  assert.equal(loaded.hp, 73);
  assert.equal(loaded.hpMax, 100, "a save with no max recorded keeps the starting max");
  assert.equal(loaded.mpMax, 100);
});

// The game_settings table shipped with a foreign key nothing could satisfy, so
// it was never written to and the bug stayed invisible. Both halves of the fix
// only ever run against a pre-existing database, which is exactly what a
// fresh-schema test can't reach.
test("a legacy game_settings is rebuilt without its unsatisfiable foreign key", async () => {
  const { db } = await import("../../db_backbone.js");

  assert.deepEqual(
    db.prepare(`PRAGMA foreign_key_list(game_settings)`).all(),
    [],
    "the account_id foreign key must be gone, or nothing can be inserted"
  );

  const columns = db.prepare(`PRAGMA table_info(game_settings)`).all().map((c) => c.name);
  assert.ok(columns.includes("action_key"), "and the later action_key column backfilled");
});

test("the rebuilt game_settings actually accepts the settings row", async () => {
  const { readSettings, updateSetting } = await import("../../state/settings.js");

  // This is the assertion that would have caught the original bug: before the
  // rebuild it threw "FOREIGN KEY constraint failed" on a real save file while
  // passing against every fresh test database.
  const row = readSettings();
  assert.equal(row.id, 1);
  assert.equal(row.action_key, "B", "defaulted by the migration, not by the insert");

  updateSetting("action_key", "P");
  assert.equal(readSettings().action_key, "P");
});
