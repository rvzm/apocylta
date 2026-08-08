// state/settings.js - the database half of the game settings.
//
// game_settings is a single row at id = 1, unlike the player table's numbered
// save slots: settings belong to the install, not to a character. The row is
// created on first read rather than by a migration, so an existing database
// needs no special handling.
//
// Reads for the render path do NOT come through here - state/displaySettings.js
// holds the live copy and this module pushes into it. See that file for why.

import { db } from "../db_backbone.js";
import { setDisplay } from "./displaySettings.js";
import { logger } from "../logger.js";

const ROW_ID = 1;

// Only the columns anything actually uses. The rest of the table
// (terminal_*, dev_*, account_id) is deliberately untouched for now - reading
// it into the app would imply it does something.
const DEFAULTS = {
  colorize: 1,
  action_key: "B",
  first_run: 0,
  last_run: 0,
  last_autosave: 0,
};

function bootstrap() {
  db.prepare(
    `INSERT INTO game_settings (id, colorize, action_key, first_run, last_run, last_autosave)
     VALUES (@id, @colorize, @action_key, @first_run, @last_run, @last_autosave)
     ON CONFLICT(id) DO NOTHING`
  ).run({ id: ROW_ID, ...DEFAULTS });
}

// The raw row, creating it if this is the first ever read.
export function readSettings() {
  let row = db.prepare(`SELECT * FROM game_settings WHERE id = ?`).get(ROW_ID);
  if (!row) {
    bootstrap();
    row = db.prepare(`SELECT * FROM game_settings WHERE id = ?`).get(ROW_ID);
  }
  return row;
}

// Pushes the stored display settings into the in-memory copy every render
// reads from. Called once at boot; after that, updateSetting keeps them in
// step. Returns the row so callers can also read the timestamps.
export function loadSettings() {
  const row = readSettings();
  setDisplay({ colorize: row.colorize === 1, actionKey: row.action_key || "B" });
  return row;
}

// `column` is a real game_settings column name - interpolated rather than
// bound because SQLite can't parameterise an identifier. Callers are internal
// and pass literals, but the allowlist keeps it that way.
const WRITABLE = new Set(["colorize", "action_key", "first_run", "last_run", "last_autosave"]);

export function updateSetting(column, value) {
  if (!WRITABLE.has(column)) throw new Error(`Not a writable setting: ${column}`);
  readSettings(); // ensure the row exists before updating it
  db.prepare(`UPDATE game_settings SET ${column} = ? WHERE id = ?`).run(value, ROW_ID);
  if (column === "colorize") setDisplay({ colorize: value === 1 });
  if (column === "action_key") setDisplay({ actionKey: value });
}

// Stamps this session. first_run is only ever written once, so "has this
// install run before" stays answerable - the title screen's welcome line asks
// exactly that, and has to ask it before this stamp lands.
export function stampRun() {
  const row = readSettings();
  const now = Date.now();
  if (!row.first_run) updateSetting("first_run", now);
  updateSetting("last_run", now);
  logger.info("settings", row.first_run ? "Returning player." : "First run.");
  return row;
}

export function stampAutosave() {
  updateSetting("last_autosave", Date.now());
}
