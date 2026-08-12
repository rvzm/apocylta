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
import { purseFromBase } from "../currency_backbone.js";

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
    cur: state.cur,
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
    // Remaining minutes, not the absolute deadline - the clock isn't captured
    // here either (createInitialState reseeds it to 7:38pm), so an untilMinutes
    // would be measured against a different origin on read. Same reasoning and
    // same shape as the DB save's `buffs` rows.
    aidBuffs: (state.aidBuffs ?? [])
      .map((buff) => ({ spellId: buff.spellId, remainingMinutes: buff.untilMinutes - state.clock.totalMinutes }))
      .filter((buff) => buff.remainingMinutes > 0),
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
    // Rebuilt against the fresh state's clock, mirroring the write above. An
    // autosave written before blessings existed has no key at all, and
    // Object.assign would otherwise write undefined over the array that
    // effectiveSkillLevel() walks on every skill read.
    aidBuffs: (snapshot.aidBuffs ?? []).map((buff) => ({
      spellId: buff.spellId,
      untilMinutes: state.clock.totalMinutes + buff.remainingMinutes,
    })),
    // An autosave written before the purse existed carries a flat `gold` total
    // instead. It was always in base units, so it decomposes straight down the
    // coin ladder - the same conversion db_backbone.js does for the DB.
    cur: snapshot.cur ?? purseFromBase(snapshot.gold ?? 0),
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
