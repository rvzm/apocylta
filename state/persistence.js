import { db } from "../db_backbone.js";
import { createInitialState } from "./gameState.js";
import { LOCATIONS } from "../data/locations.js";
import { SKILLS, playerLevelFromXp } from "../skill_backbone.js";
import { isGroup } from "../enemy_backbone.js";
import { game_config } from "../config.js";

const SKILL_KEYS = Object.keys(SKILLS);
// Every armor-ish equipment slot, matching item_backbone.js's ARMOR_SLOTS.
// shield/cloak/ring/necklace were long excluded behind a "no such items exist
// yet" comment that had gone stale - 13 shields and 10 cloak/ring/necklace
// items are in the catalog, and leaving them out meant equipping one looked
// like it worked and then vanished on load.
const ARMOR_SLOTS = ["head", "torso", "legs", "boots", "hands", "belt", "shield", "cloak", "ring", "necklace"];
const SKILL_COLUMNS = SKILL_KEYS.flatMap((k) => [`s_${k}_lvl`, `s_${k}_xp`]);

const UPSERT_COLUMNS = [
  "id", "name", "race", "class", "difficulty", "level", "experience", "gold", "current_location_id",
  "health", "health_max", "mana", "mana_max",
  "has_house",
  "saved_at",
  "equip_weapon",
  "t_equipped_tool",
  "t_equipped_slingshot",
  "t_water_bottle",
  "t_slingshot_ammo",
  "t_quiver",
  ...ARMOR_SLOTS.map((slot) => `a_${slot}`),
  ...SKILL_COLUMNS,
];

// quest_objectives_json used to hold objectiveProgress bare. It now holds an
// envelope so the admin screens' per-objective overrides ride along in the same
// column instead of needing their own migration. Saves written before the
// envelope have no `progress` key, so the whole object is the legacy progress
// map - which is also why "progress" must never be a real objective label.
function questObjectivesPayload(record) {
  const payload = { progress: record.objectiveProgress ?? {} };
  if (record.adminForced && Object.keys(record.adminForced).length) payload.adminForced = record.adminForced;
  return payload;
}

function parseQuestObjectives(json) {
  if (!json) return { objectiveProgress: {}, adminForced: {} };
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") return { objectiveProgress: {}, adminForced: {} };
  if (!("progress" in parsed)) return { objectiveProgress: parsed, adminForced: {} };
  return { objectiveProgress: parsed.progress ?? {}, adminForced: parsed.adminForced ?? {} };
}

const upsertSql = `
  INSERT INTO player (${UPSERT_COLUMNS.join(", ")})
  VALUES (${UPSERT_COLUMNS.map((c) => "@" + c).join(", ")})
  ON CONFLICT(id) DO UPDATE SET
    ${UPSERT_COLUMNS.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(",\n    ")}
`;

// slotId is the player table's `id` - 1..game_config.saveSlots for numbered
// slots. The autosave (state/autosave.js) is a separate JSON file, not a slot.
export function saveGame(state, slotId) {
  const upsert = db.prepare(upsertSql);
  const deleteInventory = db.prepare(`DELETE FROM inventory WHERE player_id = ?`);
  const insertItem = db.prepare(`INSERT INTO inventory (player_id, item_id, quantity) VALUES (?, ?, ?)`);
  const deleteProficiencies = db.prepare(`DELETE FROM proficiencies WHERE player_id = ?`);
  const insertProficiency = db.prepare(`INSERT INTO proficiencies (player_id, skill_id) VALUES (?, ?)`);
  const deleteStations = db.prepare(`DELETE FROM stations WHERE player_id = ?`);
  const insertStation = db.prepare(`INSERT INTO stations (player_id, station_id) VALUES (?, ?)`);
  const deleteSpells = db.prepare(`DELETE FROM spells WHERE player_id = ?`);
  const insertSpell = db.prepare(`INSERT INTO spells (player_id, spell_id) VALUES (?, ?)`);
  const deleteKills = db.prepare(`DELETE FROM enemies_defeated WHERE player_id = ?`);
  const insertKill = db.prepare(
    `INSERT INTO enemies_defeated (player_id, enemy_id, quantity) VALUES (?, ?, ?)`
  );
  const deleteAchievements = db.prepare(`DELETE FROM achievements WHERE player_id = ?`);
  const insertAchievement = db.prepare(
    `INSERT INTO achievements (player_id, achievement_id, achievement_state, achievement_completed) VALUES (?, ?, ?, ?)`
  );
  const deleteVisited = db.prepare(`DELETE FROM locations_visited WHERE player_id = ?`);
  const insertVisited = db.prepare(`INSERT INTO locations_visited (player_id, location_id) VALUES (?, ?)`);
  const deleteCounters = db.prepare(`DELETE FROM lifetime_counters WHERE player_id = ?`);
  const insertCounter = db.prepare(
    `INSERT INTO lifetime_counters (player_id, kind, counter_key, quantity) VALUES (?, ?, ?, ?)`
  );
  const deleteQuests = db.prepare(`DELETE FROM quests WHERE player_id = ?`);
  const insertQuest = db.prepare(
    `INSERT INTO quests (player_id, quest_id, quest_state, quest_completed, quest_objectives_json) VALUES (?, ?, ?, ?, ?)`
  );

  const run = db.transaction((s) => {
    const params = {
      id: slotId,
      name: s.name,
      race: s.race,
      class: s.class,
      difficulty: s.difficulty,
      level: s.level,
      experience: s.experience,
      gold: s.gold,
      current_location_id: s.currentLocationId,
      health: s.hp,
      health_max: s.hpMax,
      mana: s.mp,
      mana_max: s.mpMax,
      has_house: s.house ? 1 : 0,
      saved_at: Date.now(),
      equip_weapon: s.equipment.weapon ?? null,
      t_equipped_tool: s.equipment.tool ?? "",
      t_equipped_slingshot: s.equipment.slingshot ?? "",
      t_water_bottle: s.toolbelt.waterBottle,
      t_slingshot_ammo: s.toolbelt.slingshotAmmo,
      t_quiver: s.toolbelt.quiver,
    };
    for (const slot of ARMOR_SLOTS) {
      params[`a_${slot}`] = s.equipment[slot] ?? "";
    }
    for (const key of SKILL_KEYS) {
      params[`s_${key}_lvl`] = s.skills[key].level;
      params[`s_${key}_xp`] = s.skills[key].xp;
    }
    upsert.run(params);

    deleteInventory.run(slotId);
    for (const [itemId, qty] of Object.entries(s.inventory)) {
      if (qty > 0) insertItem.run(slotId, itemId, qty);
    }

    deleteProficiencies.run(slotId);
    for (const key of SKILL_KEYS) {
      if (s.skills[key].proficient) insertProficiency.run(slotId, key);
    }

    deleteStations.run(slotId);
    for (const stationId of s.ownedStations) insertStation.run(slotId, stationId);

    deleteSpells.run(slotId);
    for (const spellId of s.spells) insertSpell.run(slotId, spellId);

    // state.currentCombat is deliberately never persisted, matching
    // currentAction/currentTravel - loading always resumes out of combat. The
    // lifetime kill tally behind defeatEnemy quest objectives does persist.
    deleteKills.run(slotId);
    for (const [enemyId, qty] of Object.entries(s.enemiesDefeated ?? {})) {
      if (qty > 0) insertKill.run(slotId, enemyId, qty);
    }

    // Unlocking is binary, so the achievements table's existing columns are
    // enough - no achievement_progress_json migration of the sort the quests
    // table needed, since progress is always recomputed from live state.
    deleteAchievements.run(slotId);
    for (const [achievementId, record] of Object.entries(s.achievements ?? {})) {
      insertAchievement.run(slotId, achievementId, "unlocked", record.unlockedAt ?? 0);
    }

    deleteVisited.run(slotId);
    for (const locationId of s.locationsVisited ?? []) insertVisited.run(slotId, locationId);

    deleteCounters.run(slotId);
    for (const [kind, ledger] of Object.entries(s.lifetime ?? {})) {
      for (const [key, qty] of Object.entries(ledger)) {
        if (qty > 0) insertCounter.run(slotId, kind, key, qty);
      }
    }

    deleteQuests.run(slotId);
    for (const [questId, record] of Object.entries(s.quests)) {
      insertQuest.run(
        slotId,
        questId,
        record.status,
        record.completedAt ?? 0,
        JSON.stringify(questObjectivesPayload(record))
      );
    }
  });
  run(state);
  return true;
}

export function loadGame(slotId) {
  const playerRow = db.prepare(`SELECT * FROM player WHERE id = ?`).get(slotId);
  if (!playerRow) return null;

  const inventoryRows = db.prepare(`SELECT item_id, quantity FROM inventory WHERE player_id = ?`).all(slotId);
  const proficiencyRows = db.prepare(`SELECT skill_id FROM proficiencies WHERE player_id = ?`).all(slotId);
  const proficientSet = new Set(proficiencyRows.map((r) => r.skill_id));
  const stationRows = db.prepare(`SELECT station_id FROM stations WHERE player_id = ?`).all(slotId);
  const spellRows = db.prepare(`SELECT spell_id FROM spells WHERE player_id = ?`).all(slotId);
  const killRows = db
    .prepare(`SELECT enemy_id, quantity FROM enemies_defeated WHERE player_id = ?`)
    .all(slotId);
  const achievementRows = db
    .prepare(`SELECT achievement_id, achievement_completed FROM achievements WHERE player_id = ?`)
    .all(slotId);
  const visitedRows = db.prepare(`SELECT location_id FROM locations_visited WHERE player_id = ?`).all(slotId);
  const counterRows = db
    .prepare(`SELECT kind, counter_key, quantity FROM lifetime_counters WHERE player_id = ?`)
    .all(slotId);
  const questRows = db
    .prepare(`SELECT quest_id, quest_state, quest_completed, quest_objectives_json FROM quests WHERE player_id = ?`)
    .all(slotId);

  const state = createInitialState();
  state.name = playerRow.name;
  state.race = playerRow.race;
  state.class = playerRow.class;
  state.difficulty = playerRow.difficulty;
  state.experience = playerRow.experience;
  // Derived from the banked xp rather than trusted from the row: saves written
  // before the player curve was rescaled carry a level from the old, far
  // shallower one (a level-783 character with mid-double-digit skills). Nothing
  // is discarded - the same xp simply buys fewer levels now.
  state.level = playerLevelFromXp(state.experience);
  state.gold = playerRow.gold;
  state.currentLocationId = LOCATIONS[playerRow.current_location_id]
    ? playerRow.current_location_id
    : state.currentLocationId;
  state.hp = playerRow.health;
  // Saves written before these columns existed read back null - fall through to
  // createInitialState()'s defaults rather than writing null into a stat.
  state.hpMax = playerRow.health_max || state.hpMax;
  state.mp = playerRow.mana;
  state.mpMax = playerRow.mana_max || state.mpMax;
  state.house = !!playerRow.has_house;
  state.ownedStations = new Set(stationRows.map((r) => r.station_id));
  state.spells = new Set(spellRows.map((r) => r.spell_id));
  // Groups are headers, not enemies - only members are ever recorded as kills.
  // Saves written before that rule existed contain group ids (they used to be
  // fought as single stat-blobs), so drop them here rather than carry rows the
  // design says shouldn't exist - they'd also silently under-count type-matched
  // quest and achievement progress, since a group has no `type`.
  state.enemiesDefeated = Object.fromEntries(
    killRows.filter((r) => !isGroup(r.enemy_id)).map((r) => [r.enemy_id, r.quantity])
  );
  state.achievements = Object.fromEntries(
    achievementRows.map((r) => [r.achievement_id, { unlockedAt: r.achievement_completed || null }])
  );
  // Always include wherever they are now, so a save written before this table
  // existed still counts the current location as visited.
  state.locationsVisited = new Set([...visitedRows.map((r) => r.location_id), state.currentLocationId]);
  // Keys must be listed here or the loop below drops their rows on load - the
  // write side (saveGame) iterates state.lifetime generically, so a ledger
  // added without a line here saves fine and silently vanishes on load.
  state.lifetime = { sold: {}, crafted: {}, cast: {}, used: {} };
  for (const row of counterRows) {
    if (state.lifetime[row.kind]) state.lifetime[row.kind][row.counter_key] = row.quantity;
  }
  state.quests = {};
  for (const row of questRows) {
    state.quests[row.quest_id] = {
      status: row.quest_state,
      ...parseQuestObjectives(row.quest_objectives_json),
      completedAt: row.quest_completed || null,
    };
  }

  state.equipment.weapon = playerRow.equip_weapon || null;
  state.equipment.tool = playerRow.t_equipped_tool || null;
  state.equipment.slingshot = playerRow.t_equipped_slingshot || null;
  state.toolbelt = {
    waterBottle: playerRow.t_water_bottle,
    slingshotAmmo: playerRow.t_slingshot_ammo,
    quiver: playerRow.t_quiver,
  };
  for (const slot of ARMOR_SLOTS) {
    state.equipment[slot] = playerRow[`a_${slot}`] || null;
  }

  for (const key of SKILL_KEYS) {
    state.skills[key] = {
      level: playerRow[`s_${key}_lvl`],
      xp: playerRow[`s_${key}_xp`],
      proficient: proficientSet.has(key),
    };
  }

  state.inventory = {};
  for (const row of inventoryRows) {
    state.inventory[row.item_id] = row.quantity;
  }
  return state;
}

export function deleteSave(slotId) {
  const run = db.transaction((id) => {
    db.prepare(`DELETE FROM inventory WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM proficiencies WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM stations WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM spells WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM enemies_defeated WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM achievements WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM locations_visited WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM lifetime_counters WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM quests WHERE player_id = ?`).run(id);
    db.prepare(`DELETE FROM player WHERE id = ?`).run(id);
  });
  run(slotId);
}

// Lightweight summary for the save-slot picker - just the columns needed to
// render a row, not the full state (inventory/proficiencies/stations).
export function listSaveSlots() {
  const slotCount = game_config.saveSlots ?? 3;
  const slots = [];
  for (let slotId = 1; slotId <= slotCount; slotId++) {
    const row = db
      .prepare(`SELECT name, level, experience, race, class, current_location_id, saved_at FROM player WHERE id = ?`)
      .get(slotId);
    slots.push(
      row
        ? {
            slotId,
            empty: false,
            name: row.name,
            // Derived the same way loadGame() derives it, so the picker
            // advertises the level you'll actually get rather than the one a
            // save written against the old player curve happens to store.
            level: playerLevelFromXp(row.experience),
            race: row.race,
            class: row.class,
            currentLocationId: row.current_location_id,
            savedAt: row.saved_at,
          }
        : { slotId, empty: true }
    );
  }
  return slots;
}
