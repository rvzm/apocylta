// logger.js - leveled, rotating file logger. Writes only to LOG_PATH, never
// to stdout: once main.js hands the terminal to blessed's alt-screen buffer,
// stray console output corrupts the render, so there's no echo mode here.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { file_config, game_config } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Put the log somewhere persistent on your VPS, same convention as db_backbone.js's DB_PATH.
export const LOG_PATH = process.env.LOG_PATH || path.join(__dirname, "data", file_config.logFile || "server.log");

const LEVELS = ["FULL", "INFO", "WARN", "ERROR", "FATAL"];
// DEBUG_LEVEL overrides game_config.debugLevel, same convention as
// LOG_PATH/DB_PATH - lets tests exercise level filtering without editing
// config.js.
const configuredLevel = process.env.DEBUG_LEVEL || game_config.debugLevel;
const threshold = LEVELS.includes(configuredLevel) ? LEVELS.indexOf(configuredLevel) : LEVELS.indexOf("ERROR");

// Single-generation rotation (server.log -> server.old.log) once logMaxMB is
// crossed, matching config.js's own doc comment for file_config.logMaxMB.
function rotateIfNeeded() {
  const maxBytes = (file_config.logMaxMB ?? 3) * 1024 * 1024;
  try {
    if (fs.statSync(LOG_PATH).size >= maxBytes) {
      fs.renameSync(LOG_PATH, LOG_PATH.replace(/\.log$/, ".old.log"));
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

function write(level, tag, message) {
  if (LEVELS.indexOf(level) < threshold) return;
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  rotateIfNeeded();
  fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] [${level}] [${tag}] ${message}\n`);
}

export const logger = {
  full: (tag, message) => write("FULL", tag, message),
  info: (tag, message) => write("INFO", tag, message),
  warn: (tag, message) => write("WARN", tag, message),
  error: (tag, message) => write("ERROR", tag, message),
  fatal: (tag, message) => write("FATAL", tag, message),
};
