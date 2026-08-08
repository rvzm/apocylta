// Same import-time gotcha as persistence.test.js: db_backbone.js opens its
// SQLite handle at import from process.env.DB_PATH, and ES static imports are
// fully evaluated before this file's own top-level code runs - so everything
// DB-touching is pulled in via dynamic import() inside the test bodies.
//
// game_settings is a SINGLE row (id = 1) rather than per-slot, so unlike the
// persistence tests these can't isolate by id. Each one resets the row first.
import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
process.env.DB_PATH = path.join(scratchDir, "test.sqlite");
process.env.LOG_PATH = path.join(scratchDir, "test.log");

after(() => fs.rmSync(scratchDir, { recursive: true, force: true }));

beforeEach(async () => {
  const { db } = await import("../../db_backbone.js");
  db.prepare(`DELETE FROM game_settings`).run();
  const { setDisplay } = await import("../../state/displaySettings.js");
  setDisplay({ colorize: true, actionKey: "B" });
});

test("readSettings() creates the singleton row on first read, with the shipped defaults", async () => {
  const { readSettings } = await import("../../state/settings.js");
  const { db } = await import("../../db_backbone.js");

  const row = readSettings();
  assert.equal(row.id, 1);
  assert.equal(row.colorize, 1);
  assert.equal(row.action_key, "B");
  assert.equal(row.first_run, 0);

  // Reading again must not add a second row.
  readSettings();
  assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM game_settings`).get().n, 1);
});

test("loadSettings() pushes the stored values into the in-memory display copy", async () => {
  const { loadSettings, updateSetting } = await import("../../state/settings.js");
  const { getDisplay, setDisplay } = await import("../../state/displaySettings.js");

  updateSetting("colorize", 0);
  updateSetting("action_key", "S");

  // Wipe the cache to prove loadSettings is what repopulates it.
  setDisplay({ colorize: true, actionKey: "B" });
  loadSettings();

  assert.equal(getDisplay().colorize, false);
  assert.equal(getDisplay().actionKey, "S");
});

test("updateSetting() writes the row and the cache together", async () => {
  const { updateSetting, readSettings } = await import("../../state/settings.js");
  const { getDisplay } = await import("../../state/displaySettings.js");

  updateSetting("colorize", 0);
  assert.equal(readSettings().colorize, 0, "persisted");
  assert.equal(getDisplay().colorize, false, "and live immediately, without a reload");

  updateSetting("action_key", "R");
  assert.equal(readSettings().action_key, "R");
  assert.equal(getDisplay().actionKey, "R");
});

test("updateSetting() refuses a column that isn't a setting", async () => {
  const { updateSetting } = await import("../../state/settings.js");
  // The column name is interpolated (SQLite can't bind an identifier), so the
  // allowlist is what keeps that safe.
  assert.throws(() => updateSetting("id; DROP TABLE game_settings", 1), /Not a writable setting/);
});

test("stampRun() sets first_run once and last_run every time", async () => {
  const { stampRun, readSettings } = await import("../../state/settings.js");

  // Returns the row as it was BEFORE stamping, which is how the title screen
  // tells a genuine first launch from a return visit.
  const before = stampRun();
  assert.equal(before.first_run, 0, "no previous run recorded yet");

  const first = readSettings();
  assert.ok(first.first_run > 0);
  assert.ok(first.last_run > 0);

  const second = stampRun();
  assert.equal(second.first_run, first.first_run, "the previous row still carries the original first_run");

  const after2 = readSettings();
  assert.equal(after2.first_run, first.first_run, "first_run never moves again");
  assert.ok(after2.last_run >= first.last_run, "last_run does");
});

test("stampAutosave() touches only its own column", async () => {
  const { stampRun, stampAutosave, readSettings } = await import("../../state/settings.js");

  stampRun();
  const before = readSettings();
  assert.equal(before.last_autosave, 0);

  stampAutosave();
  const after3 = readSettings();
  assert.ok(after3.last_autosave > 0);
  assert.equal(after3.first_run, before.first_run);
  assert.equal(after3.last_run, before.last_run);
});
