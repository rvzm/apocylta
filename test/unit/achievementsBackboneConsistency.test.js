import { test } from "node:test";
import assert from "node:assert/strict";
import { ACHIEVEMENTS } from "../../achievements_backbone.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { ALL_ENEMIES, ENEMY_TYPES, ENEMY_SUBTYPES } from "../../enemy_backbone.js";
import { SPELLS } from "../../magic_backbone.js";
import { SKILLS } from "../../skill_backbone.js";
import { LOCATIONS } from "../../data/locations.js";
import { STATIONS } from "../../item_backbone.js";
import { requirementStatus } from "../../data/achievements.js";
import { createInitialState } from "../../state/gameState.js";

// Nothing read achievements_backbone.js before the evaluator existed, so its
// ids were never checked against anything. That is exactly how
// welcome_to_apocylta shipped requiring "north_pass"/"east_pass"/"west_pass"/
// "south_pass" - four location ids that have never existed (they're "_path").
// These tests are what stop the next one.

// Walks every req value in the catalog, calling visit(reqKey, req) once each.
function forEachReq(visit) {
  for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
    for (const [reqKey, req] of Object.entries(achievement.req ?? {})) {
      visit(reqKey, req, achievementId);
    }
  }
}

test("every location id referenced by an achievement exists", () => {
  const dangling = [];
  forEachReq((key, req, achievementId) => {
    const ids = key === "locationsVisited" ? req : key === "reachLocation" ? [req] : [];
    for (const id of ids) {
      if (!LOCATIONS[id]) dangling.push(`${id} (${achievementId} / ${key})`);
    }
  });
  assert.deepEqual(dangling, []);
});

test("every item id referenced by an achievement exists", () => {
  const dangling = [];
  forEachReq((key, req, achievementId) => {
    if (!["acquireItem", "sellItem", "craftItem"].includes(key)) return;

    const ids = [];
    if (typeof req === "string") ids.push(req);
    else if (Array.isArray(req)) ids.push(...req);
    else if (req.type && key === "craftItem") ids.push(req.type); // craftItem's "type" is an item id
    else if (!req.type) ids.push(...Object.keys(req).filter((k) => k !== "quantity"));

    for (const id of ids) {
      if (!ALL_ITEMS[id]) dangling.push(`${id} (${achievementId} / ${key})`);
    }
  });
  assert.deepEqual(dangling, []);
});

test("every item type/subtype referenced by a sellItem requirement is real", () => {
  const bad = [];
  forEachReq((key, req, achievementId) => {
    if (key !== "sellItem" || Array.isArray(req) || !req.type) return;
    const matches = Object.values(ALL_ITEMS).filter(
      (item) => item.type === req.type && (!req.subtype || item.subtype === req.subtype)
    );
    if (!matches.length) bad.push(`${req.type}/${req.subtype ?? "*"} (${achievementId} / ${key})`);
  });
  assert.deepEqual(bad, []);
});

test("every spell id referenced by an achievement exists", () => {
  const dangling = [];
  forEachReq((key, req, achievementId) => {
    if (!["learnSpell", "useSpell"].includes(key) || !Array.isArray(req)) return;
    for (const id of req) {
      if (!SPELLS[id]) dangling.push(`${id} (${achievementId} / ${key})`);
    }
  });
  assert.deepEqual(dangling, []);
});

test("every skill id referenced by an achievement exists", () => {
  const dangling = [];
  forEachReq((key, req, achievementId) => {
    if (key === "learnSkill" && !SKILLS[req.type]) dangling.push(`${req.type} (${achievementId})`);
    // Reward xp can name skills too: xp: { skill: { fighting: 50 } }
  });
  for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
    for (const skillId of Object.keys(achievement.reward?.xp?.skill ?? {})) {
      if (!SKILLS[skillId]) dangling.push(`${skillId} (${achievementId} reward)`);
    }
  }
  assert.deepEqual(dangling, []);
});

test("every station id referenced by an achievement exists", () => {
  const dangling = [];
  forEachReq((key, req, achievementId) => {
    if (key !== "acquireStation") return;
    for (const id of Array.isArray(req) ? req : [req]) {
      if (!STATIONS[id]) dangling.push(`${id} (${achievementId})`);
    }
  });
  assert.deepEqual(dangling, []);
});

test("every enemy id/type/subtype referenced by an achievement is real", () => {
  const dangling = [];
  forEachReq((key, req, achievementId) => {
    if (!["totalEnemies", "defeatEnemy"].includes(key)) return;
    if (typeof req === "number") return;
    if (Array.isArray(req)) {
      for (const type of req) {
        if (!ENEMY_TYPES.includes(type)) dangling.push(`type ${type} (${achievementId} / ${key})`);
      }
      return;
    }
    if (req.type && !ENEMY_TYPES.includes(req.type)) dangling.push(`type ${req.type} (${achievementId} / ${key})`);
    if (req.subtype && !ENEMY_SUBTYPES.includes(req.subtype)) {
      dangling.push(`subtype ${req.subtype} (${achievementId} / ${key})`);
    }
  });
  assert.deepEqual(dangling, []);
});

test("every requirement type in the catalog is one the evaluator implements", () => {
  // requirementStatus() returns complete:false for anything it doesn't
  // recognise, so an unimplemented type would silently never unlock - the
  // exact trap defeatEnemy quest objectives were in before combat landed.
  const IMPLEMENTED = new Set([
    "locationsVisited",
    "reachLocation",
    "acquireHouse",
    "acquireStation",
    "learnSkill",
    "learnSpell",
    "useSpell",
    "acquireItem",
    "craftItem",
    "sellItem",
    "defeatEnemy",
    "totalEnemies",
    "combatEnd",
  ]);

  const unimplemented = [];
  forEachReq((key, _req, achievementId) => {
    if (!IMPLEMENTED.has(key)) unimplemented.push(`${key} (${achievementId})`);
  });
  assert.deepEqual(unimplemented, []);
});

test("every achievement declares a name, desc, reward and at least one requirement", () => {
  const bad = [];
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (!achievement.name) bad.push(`${id}: name`);
    if (!achievement.desc) bad.push(`${id}: desc`);
    if (!achievement.reward) bad.push(`${id}: reward`);
    if (!Object.keys(achievement.req ?? {}).length) bad.push(`${id}: req`);
  }
  assert.deepEqual(bad, []);
});

test("no achievement is satisfied by a brand-new character", () => {
  // A fresh save must start with everything locked - catches a requirement
  // whose "empty" case accidentally reads as complete.
  const state = createInitialState();
  state.difficulty = "normal";

  const freebies = [];
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    const keys = Object.keys(achievement.req ?? {});
    if (keys.every((key) => requirementStatus(state, id, key).complete)) freebies.push(id);
  }
  assert.deepEqual(freebies, []);
});
