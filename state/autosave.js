// state/autosave.js - a single JSON snapshot, separate from the numbered
// SQLite save slots (state/persistence.js). Captures the same logical
// fields the DB save does; ownedStations/spells (Sets) are the fields that
// need converting for JSON. currentAction/currentCombat are intentionally
// excluded, matching the DB-based save/load (which never persists them
// either) - loading from either system always starts idle and out of combat.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { game_config } from "../config.js";
import { createInitialState } from "./gameState.js";
import { playerLevelFromXp } from "../skill_backbone.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const AUTOSAVE_PATH =
  process.env.AUTOSAVE_PATH || path.join(__dirname, "..", "data", game_config.autoSaveFile || "autosave.json");

export function writeAutosave(state) {
  const snapshot = {
    name: state.name,
    race: state.race,
    class: state.class,
    difficulty: state.difficulty,
    level: state.level,
    experience: state.experience,
    gold: state.gold,
    currentLocationId: state.currentLocationId,
    hp: state.hp,
    hpMax: state.hpMax,
    mp: state.mp,
    mpMax: state.mpMax,
    house: state.house,
    ownedStations: [...state.ownedStations],
    spells: [...state.spells],
    equipment: state.equipment,
    enhancements: state.enhancements,
    toolbelt: state.toolbelt,
    skills: state.skills,
    inventory: state.inventory,
    quests: state.quests,
    enemiesDefeated: state.enemiesDefeated,
    achievements: state.achievements,
    locationsVisited: [...state.locationsVisited],
    lifetime: state.lifetime,
    savedAt: Date.now(),
  };
  fs.mkdirSync(path.dirname(AUTOSAVE_PATH), { recursive: true });
  fs.writeFileSync(AUTOSAVE_PATH, JSON.stringify(snapshot));
}

export function readAutosave() {
  if (!fs.existsSync(AUTOSAVE_PATH)) return null;
  const snapshot = JSON.parse(fs.readFileSync(AUTOSAVE_PATH, "utf8"));
  const state = createInitialState();
  Object.assign(state, snapshot, {
    ownedStations: new Set(snapshot.ownedStations),
    spells: new Set(snapshot.spells),
    // Falls back to the fresh state's seed for autosaves written before
    // achievements existed, so a tick can't hit an undefined Set.
    locationsVisited: new Set(snapshot.locationsVisited ?? [...state.locationsVisited]),
    // Same reason: an autosave written before enhancements existed has no such
    // key, and Object.assign would otherwise write undefined over the five slots
    // that effectiveSkillLevel() iterates every combat round.
    enhancements: snapshot.enhancements ?? state.enhancements,
    // Same migration persistence.js does: the level is read back off the banked
    // xp, so an autosave written against the old (much shallower) player curve
    // lands on the level that xp is actually worth now.
    level: playerLevelFromXp(snapshot.experience ?? 0),
  });
  return state;
}

// Lightweight summary for the save-slot picker - same shape as
// persistence.js's listSaveSlots() entries, minus slotId (the autosave
// isn't a numbered slot).
export function autosaveSummary() {
  const state = readAutosave();
  if (!state) return { empty: true };
  return {
    empty: false,
    name: state.name,
    level: state.level,
    race: state.race,
    class: state.class,
    currentLocationId: state.currentLocationId,
    savedAt: state.savedAt,
  };
}
