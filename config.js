// apocylta configuration file

export const app_version = "0.0.1"; // Current version of the application

export const file_config = {
  logFile: "apocylta.log", // Default log file name
  logMaxMB: 3, // Log file size cap (MB) — when reached, the log rotates to <name>.old.log
  databaseFile: "apocylta.sqlite", // Default database file name
}

export const game_config = {
  verbose: false, // Set to true for detailed logging
  dev: false, // Set to true for development mode, false for production mode
  debugLevel: 'INFO', // Set to 'FULL', 'INFO', 'WARN', 'ERROR', or 'FATAL' for logging levels
  timeout: 10, // Session timeout in seconds
  autosaveInterval: 600, // Interval in seconds for autosaving game state
  saveSlots: 3, // Number of save slots available to players
  autoSaveFile: "autosave.json", // Default autosave file name
  // Unlocks the Admin editors (Menu -> [V]). Off by default: they edit state
  // directly and bypass every gate the game has. ALLOW_ADMIN in the environment
  // overrides this in both directions - "true" unlocks them, anything else
  // locks them out, and only an unset/empty value falls through to this flag.
  // Same convention as DEBUG_LEVEL/DB_PATH; see adminEnabled() in
  // ui/screens/admin/shared.js for why the override has to close as well as open.
  allow_admin: true,
};

export const server_config = {
  port: 4000, // Server port
  host: "localhost", // Server host
  // Gates both of the playercard page's export buttons; they stay hidden until
  // this is true. [Export HTML] downloads a standalone apocylta_pc_<player>.html
  // - the whole page with its data baked in, for hosting or sending in.
  // [Export JSON] downloads apocylta_pc_<player>.json, the raw payload, which
  // public/apocylta_player.html reads back into the same card.
  export: true, // Allow the "Export Playerpage" feature to export player data as a standalone page or as a JSON file, readable at https://rvzm.me/#/projects/apocylta/playercard
};

export const player_config = {
  startingLocation: "town_square", // Starting location for new players
  startingGold: 100, // Starting gold for new players
  // Seeds state.godmode for every new character rather than being read
  // directly - the live flag is per-character and toggleable from the Admin
  // stats screen (Menu -> [V] -> 1 -> [G]), which needs game_config.allow_admin.
  // Set true here to start every character invincible and paying for nothing.
  godmode: false,
};

export const combat_config = {
    // Probability of an ambush per `logic.actionTic` seconds of gathering in an
    // unsafe zone - see shouldAmbush() in state/gameLoop.js. That cadence is
    // deliberately NOT the gather cadence: when the two were shared, slowing
    // gathering down made the game safer, and made the hardest difficulties the
    // safest of all. Scaled per difficulty by DIFFICULTY_LEVELS' logic.enemySpawn.
    // At 0.03 with normal's 3s tic, that's roughly one ambush per 100s.
    enemySpawnRate: 0.03,
    enemySpawnLimit: 5, // Maximum number of enemies that can spawn at once
    enemyRespawnTime: 30, // Time in seconds for enemies to respawn after being defeated
    enemyDifficulty: 1, // Difficulty multiplier for enemies
    criticalHitChance: 0.1, // Chance of a critical hit
    criticalHitMultiplier: 2, // Damage multiplier for critical hits
    dodgeChance: 0.05, // Chance to dodge an attack
    blockChance: 0.1, // Chance to block an attack
    blockReduction: 0.5, // Damage reduction when blocking
};

export const newgameplus_config = {
    enabled: false, // Set to true to enable New Game Plus mode for saves with all quests completed.
    carryover: true, // Set to true to carry over player stats, skills, and items to New Game Plus
};