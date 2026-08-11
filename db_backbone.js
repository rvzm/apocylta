// db_backbone.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { file_config, game_config } from "./config.js";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Put the DB somewhere persistent on your VPS.
// This makes a ./data folder beside your app.
export const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", file_config.databaseFile || "apocylta.sqlite");
const DB_BASENAME = path.basename(DB_PATH);

let db;
try {
  db = new Database(DB_PATH);
  logger.info("db_backbone", `Database opened at ${DB_PATH}`);
} catch (err) {
  logger.fatal("db_backbone", `Failed to open database at ${DB_PATH}: ${err.message}`);
  throw err;
}

db.exec(`
CREATE TABLE IF NOT EXISTS game_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    terminal_width INTEGER NOT NULL DEFAULT 130,
    terminal_height INTEGER NOT NULL DEFAULT 40,
    independent_terminal INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
    colorize INTEGER NOT NULL DEFAULT 1, -- 0 = false, 1 = true
    dev_unlocked INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
    dev_admin_unlocked INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
    account_id TEXT NOT NULL DEFAULT '', -- account id from dev unlock.
    first_run INTEGER NOT NULL DEFAULT 0, -- epoch ms of the first run (0 = not set yet)
    last_run INTEGER NOT NULL DEFAULT 0, -- epoch ms of the last run
    last_autosave INTEGER NOT NULL DEFAULT 0, -- epoch ms of the last autosave
    action_key TEXT NOT NULL DEFAULT 'B' -- Key for what display style Action pane uses (B: Boxed Key, P: Prefix, R: Bolded, S: Boxed Action)
    -- No FOREIGN KEY on account_id. It used to declare REFERENCES player(id),
    -- but account_id is TEXT defaulting to the empty string while player.id is
    -- an INTEGER - so it matched no player and, because better-sqlite3 enables
    -- PRAGMA foreign_keys by default, EVERY insert failed with
    -- "FOREIGN KEY constraint failed". That is why this table sat empty:
    -- nothing could ever be written to it. See the rebuild migration at the
    -- bottom of this file for existing databases.
);
CREATE TABLE IF NOT EXISTS player (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    class TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'normal',
    saved_at INTEGER, -- epoch ms of the last save - drives the save-slot picker's "saved Xm ago" display
    -- - Playercard Stats
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0, -- LEGACY: the pre-denomination purse. No longer written; see cur_* below and the migration at the bottom of this file.
    -- The purse: one coin count per metal (currency_backbone.js). NOT the same
    -- thing as the gold column above - cur_gold is a count of GOLD COINS, while
    -- the old gold column was a single undenominated total. The migration at the
    -- bottom of this file converts one into the other exactly once.
    -- (No backticks in here: this whole schema is a JS template literal.)
    cur_copper INTEGER NOT NULL DEFAULT 0,
    cur_silver INTEGER NOT NULL DEFAULT 0,
    cur_gold INTEGER NOT NULL DEFAULT 0,
    cur_syllic INTEGER NOT NULL DEFAULT 0,
    current_location_id TEXT,
    health INTEGER DEFAULT 100,
    health_max INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 50,
    mana_max INTEGER DEFAULT 100,
    has_house INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true - gates buying/using stations at playerhome
    equip_weapon TEXT,
    equip_weapon_ammo INTEGER DEFAULT 0,
    -- - Playercard Armor — one equipped item name per paperdoll slot ('' = empty).
  ac_level INTEGER NOT NULL DEFAULT 1, -- level of the player's armor class
  a_head TEXT NOT NULL DEFAULT '',
  a_torso TEXT NOT NULL DEFAULT '',
  a_legs TEXT NOT NULL DEFAULT '',
  a_boots TEXT NOT NULL DEFAULT '',
  a_hands TEXT NOT NULL DEFAULT '',
  a_cloak TEXT NOT NULL DEFAULT '',
  a_ring TEXT NOT NULL DEFAULT '',
  a_necklace TEXT NOT NULL DEFAULT '',
  a_belt TEXT NOT NULL DEFAULT '',
  a_shield TEXT NOT NULL DEFAULT '',

  -- - Playercard Toolbelt
  t_equipped_tool TEXT NOT NULL DEFAULT '',
  t_equipped_slingshot TEXT NOT NULL DEFAULT '',
  t_water_bottle INTEGER NOT NULL DEFAULT 0,
  t_slingshot_ammo INTEGER NOT NULL DEFAULT 0,
  t_quiver INTEGER NOT NULL DEFAULT 0,
  t_magic_item TEXT NOT NULL DEFAULT '',
  t_lockpicks INTEGER NOT NULL DEFAULT 0,
  
  -- - Playercard Skills
  s_magic_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's magic skill
  s_magic_xp INTEGER NOT NULL DEFAULT 0, -- spendable magic XP (spent on skill levels)

  s_defense_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's defense skill
  s_defense_xp INTEGER NOT NULL DEFAULT 0, -- spendable defense XP (spent on skill levels)
  
  s_fighting_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's fighting skill
  s_fighting_xp INTEGER NOT NULL DEFAULT 0, -- spendable fighting XP (spent on skill levels)

  s_strength_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's strength skill
  s_strength_xp INTEGER NOT NULL DEFAULT 0, -- spendable strength XP (spent on skill levels)

  s_speed_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's speed skill
  s_speed_xp INTEGER NOT NULL DEFAULT 0, -- spendable speed XP (spent on skill levels)

  s_survival_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's survival skill
  s_survival_xp INTEGER NOT NULL DEFAULT 0, -- spendable survival XP (spent on skill levels)

  s_woodcutting_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's woodcutting skill
  s_woodcutting_xp INTEGER NOT NULL DEFAULT 0, -- spendable woodcutting XP (spent on skill levels)
  
  s_fishing_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's fishing skill
  s_fishing_xp INTEGER NOT NULL DEFAULT 0, -- spendable fishing XP (spent on skill levels)
  
  s_mining_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's mining skill
  s_mining_xp INTEGER NOT NULL DEFAULT 0, -- spendable mining XP (spent on skill levels)
  
  s_smithing_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's smithing skill
  s_smithing_xp INTEGER NOT NULL DEFAULT 0, -- spendable smithing XP (spent on skill levels)
  
  s_crafting_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's crafting skill
  s_crafting_xp INTEGER NOT NULL DEFAULT 0, -- spendable crafting XP (spent on skill levels)
  
  s_alchemy_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's alchemy skill
  s_alchemy_xp INTEGER NOT NULL DEFAULT 0, -- spendable alchemy XP (spent on skill levels)
  
  s_trapping_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's trapping skill
  s_trapping_xp INTEGER NOT NULL DEFAULT 0, -- spendable trapping XP (spent on skill levels)
  
  s_foraging_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's foraging skill
  s_foraging_xp INTEGER NOT NULL DEFAULT 0, -- spendable foraging XP (spent on skill levels)
  
  s_cooking_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's cooking skill
  s_cooking_xp INTEGER NOT NULL DEFAULT 0, -- spendable cooking XP (spent on skill levels)

  s_barter_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's barter skill
  s_barter_xp INTEGER NOT NULL DEFAULT 0, -- spendable barter XP (spent on skill levels)

  s_luck_lvl INTEGER NOT NULL DEFAULT 1, -- level of the player's luck skill
  s_luck_xp INTEGER NOT NULL DEFAULT 0, -- spendable luck XP (spent on skill levels)


  -- Playercard NewGame+ (NGP) — if the player has completed the game and started a new game plus, this will be true
  ngp INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
  gamecompleted INTEGER NOT NULL DEFAULT 0 -- ENOCH timestamp of when the player completed the game (0 = not completed)
);
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS spells (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    spell_id TEXT NOT NULL,
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS proficiencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    skill_id TEXT NOT NULL,
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    station_id TEXT NOT NULL,
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    quest_id TEXT NOT NULL,                         -- the unique identifier for the quest
    quest_state TEXT NOT NULL,                      -- the current state of the quest (e.g., "not started", "in progress", "completed")
    quest_progress INTEGER NOT NULL DEFAULT 0,      -- JSON array of the current progress of the quest (e.g., objectives progress/completed)
    quest_completed INTEGER NOT NULL DEFAULT 0,     -- timestamp of when the quest was completed (0 = not completed)
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS buffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    buff_id TEXT NOT NULL,
    duration INTEGER NOT NULL,                      -- duration of the buff in seconds
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS debuffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    debuff_id TEXT NOT NULL,
    duration INTEGER NOT NULL,                      -- duration of the debuff in seconds
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS poisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    poison_id TEXT NOT NULL,
    duration INTEGER NOT NULL,                      -- duration of the poison in seconds
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS traps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    trap_id TEXT NOT NULL,
    trap_state TEXT NOT NULL,                      -- the current state of the trap (e.g., "set", "triggered")
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    achievement_id TEXT NOT NULL,
    achievement_state TEXT NOT NULL,               -- the current state of the achievement (e.g., "locked", "unlocked")
    achievement_progress INTEGER NOT NULL DEFAULT 0, -- the current progress of the achievement (e.g., number of objectives completed)
    achievement_completed INTEGER NOT NULL DEFAULT 0, -- timestamp of when the achievement was completed (0 = not completed)
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS encounter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    encounter_id TEXT NOT NULL,
    encounter_state TEXT NOT NULL,                 -- the current state of the encounter (e.g., "not started", "in progress", "completed")
    encounter_progress INTEGER NOT NULL DEFAULT 0, -- the current progress of the encounter (e.g., number of objectives completed)
    encounter_completed INTEGER NOT NULL DEFAULT 0, -- timestamp of when the encounter was completed (0 = not completed)
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS enemies_defeated (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    enemy_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,           -- number of this enemy type defeated by the player
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS locations_visited (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    location_id TEXT NOT NULL,                     -- every location the player has ever stood in
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS enhancements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    enhancement_id TEXT NOT NULL,                  -- every enhancement the player has ever acquired
    enhancement_level INTEGER NOT NULL DEFAULT 1,              -- level of the enhancement (if applicable)
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS skilltree (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    skilltree_id TEXT NOT NULL,                    -- every skill tree the player has ever unlocked
    tree1_skill1_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 1, Skill 1 id
    tree1_skill1_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 1, Skill 1 level
    tree1_skill2_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 1, Skill 2 id
    tree1_skill2_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 1, Skill 2 level
    tree1_skill3_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 1, Skill 3 id
    tree1_skill3_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 1, Skill 3 level
    tree1_skill4_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 1, Skill 4 id
    tree1_skill4_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 1, Skill 4 level
    tree1_skill5_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 1, Skill 5 id
    tree1_skill5_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 1, Skill 5 level
    tree2_skill1_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 2, Skill 1 id
    tree2_skill1_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 2, Skill 1 level
    tree2_skill2_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 2, Skill 2 id
    tree2_skill2_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 2, Skill 2 level
    tree2_skill3_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 2, Skill 3 id
    tree2_skill3_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 2, Skill 3 level
    tree2_skill4_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 2, Skill 4 id
    tree2_skill4_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 2, Skill 4 level
    tree2_skill5_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 2, Skill 5 id
    tree2_skill5_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 2, Skill 5 level
    tree3_skill1_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 3, Skill 1 id
    tree3_skill1_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 3, Skill 1 level
    tree3_skill2_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 3, Skill 2 id
    tree3_skill2_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 3, Skill 2 level
    tree3_skill3_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 3, Skill 3 id
    tree3_skill3_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 3, Skill 3 level
    tree3_skill4_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 3, Skill 4 id
    tree3_skill4_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 3, Skill 4 level
    tree3_skill5_id TEXT NOT NULL DEFAULT 0,       -- Skill Tree 3, Skill 5 id
    tree3_skill5_level INTEGER NOT NULL DEFAULT 0,            -- Skill Tree 3, Skill 5 level
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS skill_modifiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    modifier_key TEXT NOT NULL,                     -- e.g., "strength_boost" | "agility_boost"
    value INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(player_id) REFERENCES player(id)
);
CREATE TABLE IF NOT EXISTS lifetime_counters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    kind TEXT NOT NULL,                            -- "sold" | "crafted" | "cast"
    counter_key TEXT NOT NULL,                     -- item id or spell id, per kind
    quantity INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(player_id) REFERENCES player(id)
);
`);

// CREATE TABLE IF NOT EXISTS is a no-op on a database that already has a
// `player` table - it does not retroactively add columns introduced later,
// so an existing save file (like a real player's data/apocylta.sqlite)
// never picks up new columns on its own. saved_at was added after this
// table already existed for real users, so it needs an explicit migration.
const playerColumns = db.prepare(`PRAGMA table_info(player)`).all().map((c) => c.name);
if (!playerColumns.includes("saved_at")) {
  db.exec(`ALTER TABLE player ADD COLUMN saved_at INTEGER`);
  logger.info("db_backbone", "Migrated player table: added saved_at column.");
}

// health/mana were saved from the start but their maxes never were, so an
// edited max silently reverted to 100 on load. Same explicit-migration
// treatment as saved_at above.
for (const column of ["health_max", "mana_max"]) {
  if (playerColumns.includes(column)) continue;
  db.exec(`ALTER TABLE player ADD COLUMN ${column} INTEGER DEFAULT 100`);
  logger.info("db_backbone", `Migrated player table: added ${column} column.`);
}

// The purse replaced the single `gold` total. Four new columns, plus a one-off
// conversion of whatever the old column held so an existing save keeps its
// money instead of waking up broke.
//
// Old `gold` was undenominated and is read as BASE UNITS, which are copper
// coins - so the conversion is a straight decomposition down the coin ladder,
// and a player's purchasing power is unchanged. It runs only when the columns
// are absent, so it can never fire twice and re-convert an already-split purse.
// The old column is deliberately left in place rather than dropped: SQLite
// cannot drop one without rebuilding the table, and nothing reads it any more.
if (!playerColumns.includes("cur_copper")) {
  for (const metal of ["copper", "silver", "gold", "syllic"]) {
    db.exec(`ALTER TABLE player ADD COLUMN cur_${metal} INTEGER NOT NULL DEFAULT 0`);
  }
  // Inlined rather than imported from currency_backbone.js: this file runs at
  // import time before anything else is wired up, and a migration that silently
  // changes meaning when the rate table is retuned is worse than a duplicated
  // literal. If the rates move, this stays pinned to what they were here.
  const LADDER = [["syllic", 100], ["gold", 20], ["silver", 10], ["copper", 1]];
  // A database old enough to predate the `gold` column has nothing to convert -
  // its rows simply start empty. Guarded rather than assumed, because SELECTing
  // a missing column throws and would take the whole import down with it.
  const rows = playerColumns.includes("gold")
    ? db.prepare(`SELECT id, gold FROM player`).all()
    : [];
  const update = db.prepare(
    `UPDATE player SET cur_copper = ?, cur_silver = ?, cur_gold = ?, cur_syllic = ? WHERE id = ?`
  );
  for (const row of rows) {
    let remainder = row.gold ?? 0;
    const purse = {};
    for (const [metal, rate] of LADDER) {
      purse[metal] = Math.floor(remainder / rate);
      remainder -= purse[metal] * rate;
    }
    update.run(purse.copper, purse.silver, purse.gold, purse.syllic, row.id);
  }
  logger.info("db_backbone", `Migrated player table: added cur_* columns, converted ${rows.length} purse(s).`);
}

// Same CREATE-TABLE-IF-NOT-EXISTS caveat as above - the quests table already
// existed (unused) before quest_objectives_json was added, so it needs the
// same explicit migration treatment. quest_progress stays unused (its single
// INTEGER can't hold per-objective progress); the sparse per-objective map
// lives in this JSON column instead.
// game_settings shipped with `FOREIGN KEY(account_id) REFERENCES player(id)`,
// which made the table impossible to write to: account_id is TEXT defaulting
// to '', player.id is an INTEGER, and better-sqlite3 turns PRAGMA foreign_keys
// ON by default - so every insert died with "FOREIGN KEY constraint failed".
// SQLite can't drop a constraint in place, so the table has to be rebuilt.
// Guarded on the constraint actually being present, and written to preserve
// rows even though in practice there can't be any (nothing could insert one).
if (db.prepare(`PRAGMA foreign_key_list(game_settings)`).all().length > 0) {
  const carried = db
    .prepare(`PRAGMA table_info(game_settings)`)
    .all()
    .map((c) => c.name)
    .filter((name) => name !== "action_key"); // may not exist on the old table

  db.pragma("foreign_keys = OFF");
  db.exec(`
    CREATE TABLE game_settings_rebuilt (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      terminal_width INTEGER NOT NULL DEFAULT 130,
      terminal_height INTEGER NOT NULL DEFAULT 40,
      independent_terminal INTEGER NOT NULL DEFAULT 0,
      colorize INTEGER NOT NULL DEFAULT 1,
      dev_unlocked INTEGER NOT NULL DEFAULT 0,
      dev_admin_unlocked INTEGER NOT NULL DEFAULT 0,
      account_id TEXT NOT NULL DEFAULT '',
      first_run INTEGER NOT NULL DEFAULT 0,
      last_run INTEGER NOT NULL DEFAULT 0,
      last_autosave INTEGER NOT NULL DEFAULT 0,
      action_key TEXT NOT NULL DEFAULT 'B'
    );
    INSERT INTO game_settings_rebuilt (${carried.join(", ")})
      SELECT ${carried.join(", ")} FROM game_settings;
    DROP TABLE game_settings;
    ALTER TABLE game_settings_rebuilt RENAME TO game_settings;
  `);
  db.pragma("foreign_keys = ON");
  logger.info("db_backbone", "Migrated game_settings table: dropped the unsatisfiable account_id foreign key.");
}

// Separate from the rebuild above, which already produces the column: this
// covers a database whose game_settings has no foreign key but predates
// action_key. CREATE TABLE IF NOT EXISTS never backfills a column, so without
// this the Settings screen works on every fresh test database and throws
// "no such column: action_key" on an actual player's.
const settingsColumns = db.prepare(`PRAGMA table_info(game_settings)`).all().map((c) => c.name);
if (!settingsColumns.includes("action_key")) {
  db.exec(`ALTER TABLE game_settings ADD COLUMN action_key TEXT NOT NULL DEFAULT 'B'`);
  logger.info("db_backbone", "Migrated game_settings table: added action_key column.");
}

const questColumns = db.prepare(`PRAGMA table_info(quests)`).all().map((c) => c.name);
if (!questColumns.includes("quest_objectives_json")) {
  db.exec(`ALTER TABLE quests ADD COLUMN quest_objectives_json TEXT NOT NULL DEFAULT '{}'`);
  logger.info("db_backbone", "Migrated quests table: added quest_objectives_json column.");
}

export { db };
