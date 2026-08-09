import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_ENEMIES,
  BASIC_ENEMIES,
  GROUP_ENEMIES,
  NAMED_ENEMIES,
  ENEMY_TYPES,
  ENEMY_SUBTYPES,
  expandEnemy,
  isGroup,
} from "../../enemy_backbone.js";
import { SPELLS } from "../../magic_backbone.js";
import { QUESTS } from "../../quest_backbone.js";
import { walkObjectives } from "../../data/quests.js";
import { LOCATIONS } from "../../data/locations.js";
import { enemyStrike, buildEncounter } from "../../data/combat.js";
import { createInitialState } from "../../state/gameState.js";

// Nothing read enemy_backbone.js before combat existed, so these are the
// guards that keep its ids resolvable now that four separate systems
// (location pools, boss lists, quest objectives, the combat engine) look
// enemies up by bare id.

// `members` is either a plain list or a { id: count } map, so anything walking
// it has to handle both. Returns [id, count] pairs.
function memberPairs(group) {
  if (!group.members) return [];
  return Array.isArray(group.members)
    ? group.members.map((id) => [id, 1])
    : Object.entries(group.members);
}

test("every GROUP_ENEMIES member id resolves to a real enemy", () => {
  const dangling = [];
  for (const [groupId, group] of Object.entries(GROUP_ENEMIES)) {
    for (const [memberId] of memberPairs(group)) {
      if (!ALL_ENEMIES[memberId]) dangling.push(`${memberId} (in ${groupId})`);
    }
  }
  assert.deepEqual(dangling, []);
});

test("a group declares only members/name/xp - never stats of its own", () => {
  // A group is a header, not a combatant: hp/dps/type/subtype belong to its
  // members. A group carrying its own hp would get queued as a fighter.
  const offenders = [];
  for (const [groupId, group] of Object.entries(GROUP_ENEMIES)) {
    for (const field of ["hp", "dps", "type", "subtype", "spells"]) {
      if (group[field] !== undefined) offenders.push(`${groupId}: ${field}`);
    }
    if (!memberPairs(group).length) offenders.push(`${groupId}: no members`);
    if (!group.name) offenders.push(`${groupId}: no name`);
    if (!(group.xp > 0)) offenders.push(`${groupId}: no xp bonus`);
  }
  assert.deepEqual(offenders, []);
});

test("expandEnemy(): a lone enemy is itself, a group is its members", () => {
  assert.deepEqual(expandEnemy("weak_goblin"), ["weak_goblin"]);
  assert.deepEqual(expandEnemy("mixed_group"), ["weak_goblin", "small_dwarf", "weak_human"]);
  assert.deepEqual(expandEnemy("does_not_exist"), []);
});

test("expandEnemy(): the { id: count } form repeats each member, in declared order", () => {
  assert.deepEqual(expandEnemy("large_mixed_group"), [
    "weak_goblin",
    "weak_goblin",
    "small_dwarf",
    "small_dwarf",
    "weak_human",
    "weak_human",
  ]);
});

test("expandEnemy(): a group with no usable members yields an empty queue, not itself", () => {
  // The critical case. Falling back to [id] would queue the group as a
  // fighter, and a group has no hp - buildEncounter would hand it
  // Math.max(1, NaN) = NaN hp, an enemy that can never die and a fight that
  // can never end. An empty queue makes the spawn simply not happen.
  GROUP_ENEMIES.__test_empty_group = { members: [], name: "Empty", xp: 1 };
  GROUP_ENEMIES.__test_bogus_group = { members: ["no_such_enemy"], name: "Bogus", xp: 1 };
  try {
    assert.deepEqual(expandEnemy("__test_empty_group"), []);
    assert.deepEqual(expandEnemy("__test_bogus_group"), []);
  } finally {
    delete GROUP_ENEMIES.__test_empty_group;
    delete GROUP_ENEMIES.__test_bogus_group;
  }
});

test("no pack contains a boss-subtype enemy", () => {
  // orc_chieftain lives in BASIC_ENEMIES but is subtype "boss", and
  // data/combat.js's combatEnd check would grant boss_down for an ordinary
  // fight if it ever showed up in a routine pack.
  const offenders = [];
  for (const groupId of Object.keys(GROUP_ENEMIES)) {
    for (const memberId of expandEnemy(groupId)) {
      if (ALL_ENEMIES[memberId]?.subtype === "boss") offenders.push(`${groupId} contains ${memberId}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("every enemy spell id resolves to a real spell", () => {
  const dangling = [];
  for (const [enemyId, enemy] of Object.entries(ALL_ENEMIES)) {
    for (const spellId of enemy.spells ?? []) {
      if (!SPELLS[spellId]) dangling.push(`${spellId} (on ${enemyId})`);
    }
  }
  assert.deepEqual(dangling, []);
});

test("every fightable enemy can produce a strike, including the mage entries with no dps", () => {
  // Scoped to non-groups on purpose: enemyStrike falls back to power 1 for
  // anything with neither dps nor damaging spells, so including groups here
  // would make this pass without asserting anything about them.
  const broken = [];
  for (const [enemyId, enemy] of Object.entries(ALL_ENEMIES)) {
    if (isGroup(enemyId)) continue;
    const { power } = enemyStrike(enemy);
    if (!Number.isFinite(power) || power <= 0) broken.push(`${enemyId} -> ${power}`);
    // A real combatant should derive its power from its own stats, never the
    // bare fallback - that would mean it has no dps and no damaging spell.
    if (enemy.dps === undefined && !enemy.spells?.length) broken.push(`${enemyId}: no dps and no spells`);
  }
  assert.deepEqual(broken, [], "every fightable enemy needs a usable attack power");
});

test("enemy ids are lowercase snake_case, so boss lists and quest objectives resolve", () => {
  const offenders = Object.keys(ALL_ENEMIES).filter((id) => id !== id.toLowerCase());
  assert.deepEqual(offenders, []);
});

test("merging the three catalogs into ALL_ENEMIES loses nothing to key collisions", () => {
  const total = Object.keys(BASIC_ENEMIES).length + Object.keys(GROUP_ENEMIES).length + Object.keys(NAMED_ENEMIES).length;
  assert.equal(Object.keys(ALL_ENEMIES).length, total);
});

// Scoped to actual combatants - groups are headers and carry no stats at all,
// which the dedicated group-shape test above asserts separately.
test("every fightable enemy declares hp/xp, a known type and a known subtype", () => {
  const bad = [];
  for (const [enemyId, enemy] of Object.entries(ALL_ENEMIES)) {
    if (isGroup(enemyId)) continue;
    if (!(enemy.hp > 0)) bad.push(`${enemyId}: hp`);
    if (!(enemy.xp > 0)) bad.push(`${enemyId}: xp`);
    if (!ENEMY_TYPES.includes(enemy.type)) bad.push(`${enemyId}: type ${enemy.type}`);
    if (!ENEMY_SUBTYPES.includes(enemy.subtype)) bad.push(`${enemyId}: subtype ${enemy.subtype}`);
  }
  assert.deepEqual(bad, []);
});

// The end-to-end guard against the failure this whole shape change prevents:
// a pool entry that produces an empty queue (nothing spawns) or an enemy with
// NaN hp (a fight that can never be won or lost). Both are silent at runtime.
test("every spawn pool entry builds a real, winnable encounter", () => {
  const state = createInitialState();
  state.difficulty = "normal";

  const broken = [];
  for (const [locationId, location] of Object.entries(LOCATIONS)) {
    const ids = [...(location.enemies ?? []), ...(Array.isArray(location.boss) ? location.boss : [])];
    for (const id of ids) {
      const encounter = buildEncounter(state, id);
      if (!encounter?.enemies?.length) {
        broken.push(`${id} (${locationId}): no encounter`);
        continue;
      }
      for (const enemy of encounter.enemies) {
        if (!Number.isFinite(enemy.hp) || enemy.hp <= 0) broken.push(`${id} (${locationId}): ${enemy.id} hp=${enemy.hp}`);
        if (!enemy.name) broken.push(`${id} (${locationId}): ${enemy.id} unnamed`);
      }
    }
  }
  assert.deepEqual(broken, []);
});

test("every location spawn pool and boss list resolves to real enemies", () => {
  const dangling = [];
  for (const [locationId, location] of Object.entries(LOCATIONS)) {
    for (const enemyId of location.enemies ?? []) {
      if (!ALL_ENEMIES[enemyId]) dangling.push(`${enemyId} (pool of ${locationId})`);
    }
    if (Array.isArray(location.boss)) {
      for (const enemyId of location.boss) {
        if (!ALL_ENEMIES[enemyId]) dangling.push(`${enemyId} (boss of ${locationId})`);
      }
    }
  }
  assert.deepEqual(dangling, []);
});

// The two black markets are `safe: false` for flavour but are shop interiors
// with no interactiveActions at all - you shouldn't be ambushed indoors.
test("unsafe locations that support actions have both a spawn pool and the Fight action", () => {
  const KNOWN_POOLLESS = new Set(["black_market", "zenthal_black_market"]);
  const missing = [];

  for (const [locationId, location] of Object.entries(LOCATIONS)) {
    if (location.safe !== false || KNOWN_POOLLESS.has(locationId)) continue;
    if (!location.enemies?.length) missing.push(`${locationId}: no enemies`);
    if (!location.interactiveActions?.includes("fight")) missing.push(`${locationId}: no fight action`);
  }
  assert.deepEqual(missing, []);

  for (const locationId of KNOWN_POOLLESS) {
    assert.equal(
      LOCATIONS[locationId]?.interactiveActions?.length,
      0,
      `${locationId} gained actions - it now needs a spawn pool, so drop it from KNOWN_POOLLESS`
    );
  }
});

test("the boss challenge action appears exactly where a boss list does", () => {
  for (const [locationId, location] of Object.entries(LOCATIONS)) {
    const hasBossList = Array.isArray(location.boss) && location.boss.length > 0;
    const offersChallenge = !!location.interactiveActions?.includes("challenge_boss");
    assert.equal(offersChallenge, hasBossList, `${locationId} disagrees about having a boss`);
  }
});

test("no location lists more actions than the digit hotkeys can address", () => {
  for (const [locationId, location] of Object.entries(LOCATIONS)) {
    assert.ok(
      (location.interactiveActions?.length ?? 0) <= 9,
      `${locationId} has more than 9 actions - ui/screens/location.js only binds digits 1-9`
    );
  }
});

// walkObjectives() rather than the top-level map: the Bert Brothers moved into
// a subObjectives group, and iterating only the top level would quietly stop
// checking every enemy id nested inside one.
test("every defeatEnemy quest objective names resolvable enemies", () => {
  const dangling = [];
  for (const [questId, quest] of Object.entries(QUESTS)) {
    for (const { path, def } of walkObjectives(quest)) {
      const target = def.defeatEnemy;
      if (!target) continue;
      if (Array.isArray(target)) {
        for (const enemyId of target) {
          if (!ALL_ENEMIES[enemyId]) dangling.push(`${enemyId} (${questId} / ${path})`);
        }
      } else if (target.type && !ENEMY_TYPES.includes(target.type)) {
        dangling.push(`type ${target.type} (${questId} / ${path})`);
      }
    }
  }
  assert.deepEqual(dangling, []);
});
