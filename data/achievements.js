// apocylta world data - achievements
//
// Mirrors data/quests.js: requirementStatus() is the direct analogue of
// objectiveStatus(), returning {current, target, complete} per requirement.
// Unlike quests there is no accept/claim step - evaluateAchievements() unlocks
// and grants the moment a requirement is satisfied.
//
// Requirement types are polymorphic (achievements_backbone.js's header comment
// is the spec). Shapes are disambiguated the same way throughout:
//   array           -> "all of these listed ids/types"
//   object w/ type  -> the typed form
//   object w/ only quantity -> a bare lifetime total, any id
//   otherwise       -> an { id: qty } map

import { ACHIEVEMENTS } from "../achievements_backbone.js";
import { ALL_ENEMIES } from "../enemy_backbone.js";
import { ALL_ITEMS } from "../item_backbone.js";
import { SPELLS } from "../magic_backbone.js";
import { isSpellKnown } from "./magic.js";
import { grantPlayerXp, grantSkillXp, pushToast } from "../state/gameState.js";
import { logger } from "../logger.js";

const done = (complete, current = complete ? 1 : 0, target = 1) => ({ current, target, complete });

// Clamps to target so a UI never renders "12/10", matching objectiveStatus().
const counted = (current, target) => ({
  current: Math.min(current, target),
  target,
  complete: current >= target,
});

function allOf(list, predicate) {
  const current = list.filter(predicate).length;
  return { current, target: list.length || 1, complete: list.length > 0 && current >= list.length };
}

function totalOf(ledger) {
  return Object.values(ledger ?? {}).reduce((sum, qty) => sum + qty, 0);
}

// Sums a lifetime ledger, optionally narrowed to entries whose catalog entry
// matches every field in `match` (e.g. {type:"scrap", subtype:"raw_scrap"}).
function totalMatching(ledger, catalog, match) {
  return Object.entries(ledger ?? {})
    .filter(([id]) => {
      const entry = catalog[id];
      if (!entry) return false;
      return Object.entries(match).every(([field, value]) => entry[field] === value);
    })
    .reduce((sum, [, qty]) => sum + qty, 0);
}

// ---------------------------------------------------------------- requirements

// `ctx` carries event-scoped data that no amount of state inspection can
// recover - currently just {combatEnd}. A requirement needing it reports
// incomplete on the ordinary polling passes, which is what keeps combatEnd
// achievements from unlocking retroactively next tick.
export function requirementStatus(state, achievementId, reqKey, ctx = {}) {
  const req = ACHIEVEMENTS[achievementId]?.req?.[reqKey];
  if (req === undefined) return done(false);

  switch (reqKey) {
    case "locationsVisited":
      return allOf(req, (id) => state.locationsVisited.has(id));

    // Deliberately divergent from quests, where reachLocation is instantaneous
    // (true only while standing there). Polling would only catch that if a
    // tick happened to land on arrival - and "reach" as "have reached" is what
    // an achievement means anyway.
    case "reachLocation":
      return done(state.locationsVisited.has(req));

    case "acquireHouse":
      return done(!!state.house === !!req);

    case "acquireStation": {
      const listed = Array.isArray(req) ? req : [req];
      return allOf(listed, (id) => state.ownedStations.has(id));
    }

    case "learnSkill":
      return counted(state.skills[req.type]?.level ?? 0, req.level ?? 1);

    case "learnSpell":
      return Array.isArray(req)
        ? allOf(req, (id) => isSpellKnown(state, id))
        : counted(state.spells.size, req.quantity ?? 1);

    case "useSpell":
      return Array.isArray(req)
        ? allOf(req, (id) => (state.lifetime.cast[id] ?? 0) > 0)
        : counted(totalOf(state.lifetime.cast), req.quantity ?? 1);

    case "acquireItem": {
      // "wood" (any amount) or { wood: 5 } (that many, of every listed id).
      const wanted = typeof req === "string" ? { [req]: 1 } : req;
      const entries = Object.entries(wanted);
      const held = entries.filter(([id, qty]) => (state.inventory[id] ?? 0) >= qty).length;
      return { current: held, target: entries.length || 1, complete: entries.length > 0 && held >= entries.length };
    }

    case "craftItem":
      // quest_backbone.js's "type" here is an item id, not an ITEM_TYPES member
      // - the same quirk data/quests.js documents for craftItem objectives.
      return req.type
        ? counted(state.lifetime.crafted[req.type] ?? 0, req.quantity ?? 1)
        : counted(totalOf(state.lifetime.crafted), req.quantity ?? 1);

    case "sellItem": {
      const sold = state.lifetime.sold;
      if (Array.isArray(req)) return allOf(req, (id) => (sold[id] ?? 0) > 0);
      if (req.type) {
        const match = { type: req.type };
        if (req.subtype) match.subtype = req.subtype;
        return counted(totalMatching(sold, ALL_ITEMS, match), req.quantity ?? 1);
      }
      const ids = Object.keys(req).filter((k) => k !== "quantity");
      if (!ids.length) return counted(totalOf(sold), req.quantity ?? 1);
      return allOf(ids, (id) => (sold[id] ?? 0) >= req[id]);
    }

    case "defeatEnemy":
    case "totalEnemies": {
      const kills = state.enemiesDefeated ?? {};
      if (typeof req === "number") return counted(totalOf(kills), req);
      if (Array.isArray(req)) {
        // A list of enemy TYPES here, not ids - at least one kill of each.
        return allOf(req, (type) =>
          Object.keys(kills).some((id) => ALL_ENEMIES[id]?.type === type && kills[id] > 0)
        );
      }
      const match = {};
      if (req.type) match.type = req.type;
      if (req.subtype) match.subtype = req.subtype;
      return counted(totalMatching(kills, ALL_ENEMIES, match), req.quantity ?? 1);
    }

    // Only answerable from the snapshot taken the moment an encounter is won -
    // see evaluateAchievements()'s caller in data/combat.js. Every listed
    // condition must hold at once.
    case "combatEnd": {
      const end = ctx.combatEnd;
      if (!end) return done(false);
      const checks = [];
      // The *Max* fields are upper bounds, not floors: this_is_combat reads
      // "Win a combat encounter with LESS THAN 50% health remaining".
      if (req.healthMaxP != null) checks.push((end.hp / end.hpMax) * 100 <= req.healthMaxP);
      if (req.healthMax != null) checks.push(end.hp <= req.healthMax);
      if (req.manaMaxP != null) checks.push((end.mp / end.mpMax) * 100 <= req.manaMaxP);
      if (req.manaMax != null) checks.push(end.mp <= req.manaMax);
      if (req.enemies != null) checks.push(end.enemies >= req.enemies);
      if (req.boss != null) checks.push(end.boss === req.boss);
      return done(checks.length > 0 && checks.every(Boolean));
    }

    default:
      // Unknown requirement type - report incomplete rather than letting a
      // naive current>=target check satisfy it by accident.
      return done(false);
  }
}

export function isUnlocked(state, achievementId) {
  return !!state.achievements?.[achievementId];
}

// Every requirement key on an achievement must be satisfied (AND), matching
// how a quest needs all of its objectives.
export function isEarned(state, achievementId, ctx = {}) {
  const req = ACHIEVEMENTS[achievementId]?.req ?? {};
  const keys = Object.keys(req);
  return keys.length > 0 && keys.every((key) => requirementStatus(state, achievementId, key, ctx).complete);
}

// One row per achievement for the achievements screen and the web payload.
export function achievementRows(state, ctx = {}) {
  return Object.entries(ACHIEVEMENTS).map(([id, achievement]) => ({
    id,
    name: achievement.name,
    desc: achievement.desc,
    reward: achievement.reward,
    unlocked: isUnlocked(state, id),
    unlockedAt: state.achievements?.[id]?.unlockedAt ?? null,
    requirements: Object.keys(achievement.req ?? {}).map((key) => ({
      key,
      ...requirementStatus(state, id, key, ctx),
    })),
  }));
}

// Achievement reward xp is polymorphic - a bare number, {player}, {skill:{}},
// or both - where quest reward xp is always a plain number. grantSkillXp
// applies proficiency/difficulty multipliers on the way in; the player-xp
// portion is granted flat, matching how quest rewards behave.
export function grantAchievementReward(state, achievement) {
  const { gold = 0, xp } = achievement.reward ?? {};
  state.gold += gold;
  if (typeof xp === "number") {
    grantPlayerXp(state, xp);
  } else if (xp) {
    if (xp.player) grantPlayerXp(state, xp.player);
    for (const [skillId, amount] of Object.entries(xp.skill ?? {})) {
      grantSkillXp(state, skillId, amount);
    }
  }
}

// Unlocks and pays out everything newly satisfied. Called every game-loop tick
// for the live-derivable requirements, and once more with {combatEnd} at the
// moment an encounter is won. Returns the newly-unlocked entries.
export function evaluateAchievements(state, ctx = {}) {
  // Guards states built before achievements existed (an older autosave loaded
  // via Object.assign) so a tick can't throw on a missing field.
  if (!state.achievements) return [];
  // Admin pause. Unlocking is monotonic and nothing ever re-locks, so without
  // this an admin re-lock would be undone on the next tick - and would re-pay
  // the achievement's gold/xp every time it bounced back.
  if (state.adminAutoAchievements === false) return [];

  const unlocked = [];
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (isUnlocked(state, id) || !isEarned(state, id, ctx)) continue;
    // Recorded before granting so a reward that itself satisfies another
    // achievement can't re-enter and unlock this one twice.
    state.achievements[id] = { unlockedAt: Date.now() };
    grantAchievementReward(state, achievement);
    pushToast(state, `Achievement unlocked: ${achievement.name}`);
    logger.info("achievements", `Unlocked ${id}.`);
    unlocked.push({ id, ...achievement });
  }
  return unlocked;
}
