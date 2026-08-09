import { QUESTS } from "../quest_backbone.js";
import { ALL_ITEMS } from "../item_backbone.js";
import { ALL_ENEMIES } from "../enemy_backbone.js";
import { grantRewardXp } from "../state/gameState.js";
import { SPELLS } from "../magic_backbone.js";
import { isSpellKnown } from "./magic.js";

// Level+locked gated, excluding anything already accepted (in-progress or
// completed) - state.quests' key presence is the "ever accepted" signal.
export function visibleQuests(state) {
  return Object.entries(QUESTS)
    .filter(([id, q]) => !q.locked && state.level >= q.level && !state.quests[id])
    .map(([id, q]) => ({ id, ...q }));
}

// Every quest the player has ever accepted, for the Journal.
export function startedQuests(state) {
  return Object.entries(state.quests).map(([id, record]) => ({ id, quest: QUESTS[id], record }));
}

// {current, target, complete} for one objective label. acquireItem/
// acquireHouse/learnSkill/reachLocation/learnSpell are computed live off
// existing state (no separate tracking needed); sellItem/craftItem/useSpell
// can't be answered from current state alone (once sold/consumed/cast,
// nothing else remembers it happened), so they read from
// state.quests[questId].objectiveProgress, populated by
// recordItemSold()/recordItemCrafted()/recordSpellCast() below. defeatEnemy
// reads the lifetime state.enemiesDefeated tally, so like acquireItem it's a
// live check - kills made before accepting the quest do count toward it.
// An objective this evaluator can't read - an unknown type, or a known type
// written in a shape it doesn't implement (`learnSpell: { rarity: "legendary" }`
// where a spell-id array is expected). Reported as incomplete rather than
// thrown: every quest screen renders EVERY objective of every quest, so one
// malformed entry used to take the whole Journal/Quest Board/admin editor down
// with it. It stays visibly stuck at 0/1, which is the signal to go fix the data.
const UNSUPPORTED = { current: 0, target: 1, complete: false };

// An objective is addressed by a `::`-joined path, so a child of a
// subObjectives group is "Defeat The Mad Bert Brothers::Defeat Hubert". The
// separator is the one ui/screens/admin/adminQuests.js already uses between
// questId and label, and its parse() splits once and rejoins the rest - so a
// multi-segment path travels through that screen's row ids unchanged.
// objectiveProgress and adminForced key off the same path string; both persist
// as arbitrary-keyed JSON in quest_objectives_json, so nesting needed no save
// migration.
export const OBJECTIVE_PATH_SEP = "::";

// "gold" is currency, not an item: it lives on state.gold and there is no
// ALL_ITEMS entry for it, so an objective asking for 10000 of it read an
// inventory slot nothing ever writes. STARTER_PACKS already treats the id this
// way (test/unit/itemBackboneConsistency.test.js skips it for the same reason).
function ownedCount(state, itemId) {
  return itemId === "gold" ? state.gold ?? 0 : state.inventory[itemId] || 0;
}

export function resolveObjective(quest, path) {
  let objectives = quest?.objectives;
  let def = null;
  for (const segment of String(path).split(OBJECTIVE_PATH_SEP)) {
    def = objectives?.[segment];
    if (!def) return null;
    objectives = def.subObjectives;
  }
  return def;
}

// Every objective in a quest, parents included, depth-first and in declaration
// order. The record hooks and the quest screens iterate this rather than
// Object.keys(quest.objectives) - a craftItem/sellItem/useSpell objective
// nested inside a subObjectives group is invisible to anything that doesn't.
export function* walkObjectives(quest, objectives = quest?.objectives, prefix = "", depth = 0) {
  for (const [label, def] of Object.entries(objectives ?? {})) {
    const path = prefix ? `${prefix}${OBJECTIVE_PATH_SEP}${label}` : label;
    yield { path, label, def, depth, optional: !!def.optional, group: !!def.subObjectives };
    if (def.subObjectives) yield* walkObjectives(quest, def.subObjectives, path, depth + 1);
  }
}

export function objectiveStatus(state, questId, path) {
  const def = resolveObjective(QUESTS[questId], path);
  if (!def) return { current: 0, target: 1, complete: false };
  // Anything that isn't an object can't carry a `<type>: <spec>` pair, and the
  // `in` checks below throw outright on a primitive. An objectives map written
  // one level too flat ({ acquireHouse: true } instead of
  // { "Buy a House": { acquireHouse: true } }) lands here, and every quest
  // screen renders every objective - so it has to be a stuck row, not a crash.
  if (typeof def !== "object") return UNSUPPORTED;

  // Admin override (ui/screens/admin/adminQuests.js), ahead of the type switch:
  // only 3 of the 10 objective types keep a counter anyone could write to, so
  // forcing the other 7 has to happen here rather than by faking their source.
  if (state.quests[questId]?.adminForced?.[path]) return { current: 1, target: 1, complete: true };

  // A group completes when its required children do. `optional: true` children
  // still evaluate and still render - they just don't hold the parent open. A
  // group of nothing but optional children has nothing left to require, so it
  // reads as complete rather than as permanently 0/0.
  if (def.subObjectives) {
    const required = Object.keys(def.subObjectives).filter((child) => !def.subObjectives[child].optional);
    const done = required.filter(
      (child) => objectiveStatus(state, questId, `${path}${OBJECTIVE_PATH_SEP}${child}`).complete
    ).length;
    return {
      current: required.length ? done : 1,
      target: required.length || 1,
      complete: done >= required.length,
    };
  }

  if ("acquireItem" in def) {
    const spec = def.acquireItem;
    if (typeof spec === "string") {
      const current = Math.min(ownedCount(state, spec), 1);
      return { current, target: 1, complete: current >= 1 };
    }

    // "Any item of this rarity" - and of this `type` when given, so a mythic
    // raw fish doesn't finish "Acquire a Mythic Weapon". Told apart from an
    // {id: qty} map by carrying a rarity/type key, since no item id is either.
    if ("rarity" in spec || "type" in spec) {
      const wanted = spec.quantity ?? 1;
      const owned = Object.entries(state.inventory).reduce((sum, [id, qty]) => {
        const item = ALL_ITEMS[id];
        if (!item || qty <= 0) return sum;
        if (spec.rarity && item.rarity !== spec.rarity) return sum;
        if (spec.type && item.type !== spec.type) return sum;
        return sum + qty;
      }, 0);
      const current = Math.min(owned, wanted);
      return { current, target: wanted, complete: current >= wanted };
    }

    const entries = Object.entries(spec);
    // A single-item objective reports its own count ("3/5 Tin Ore"), which is
    // the granularity worth showing. A multi-item one can't - the entries have
    // different targets - so it counts entries satisfied instead. That form
    // used to read Object.entries(spec)[0] and quietly ignore every stack after
    // the first, making "Acquire a bunch of stuff" a single gold bar.
    if (entries.length === 1) {
      const [itemId, qty] = entries[0];
      if (typeof qty !== "number") return UNSUPPORTED;
      const current = Math.min(ownedCount(state, itemId), qty);
      return { current, target: qty, complete: current >= qty };
    }
    if (entries.some(([, qty]) => typeof qty !== "number")) return UNSUPPORTED;
    const satisfied = entries.filter(([itemId, qty]) => ownedCount(state, itemId) >= qty).length;
    return { current: satisfied, target: entries.length, complete: satisfied >= entries.length };
  }
  if ("sellItem" in def || "craftItem" in def) {
    const qty = (def.sellItem ?? def.craftItem).quantity ?? 1;
    const current = Math.min(state.quests[questId]?.objectiveProgress?.[path] ?? 0, qty);
    return { current, target: qty, complete: current >= qty };
  }
  if ("acquireHouse" in def) {
    return { current: state.house ? 1 : 0, target: 1, complete: !!state.house };
  }
  // Stations you've bought for your own house (ui/screens/shopHousing.js writes
  // state.ownedStations); the ones standing in a safehouse or a town don't
  // count, since the objective is about kitting out a home. Same
  // count-the-list shape as the defeatEnemy id-array form.
  if ("acquireStation" in def) {
    const listed = Array.isArray(def.acquireStation) ? def.acquireStation : [def.acquireStation];
    const owned = listed.filter((id) => state.ownedStations?.has(id)).length;
    return { current: owned, target: listed.length || 1, complete: listed.length > 0 && owned >= listed.length };
  }
  if ("reachLocation" in def) {
    const complete = state.currentLocationId === def.reachLocation;
    return { current: complete ? 1 : 0, target: 1, complete };
  }
  if ("learnSkill" in def) {
    const { type: skillId, level } = def.learnSkill;
    const current = Math.min(state.skills[skillId]?.level ?? 0, level);
    return { current, target: level, complete: current >= level };
  }
  if ("learnSpell" in def) {
    // Two forms: a list of specific spells, or "any N spells of this rarity"
    // (magic_backbone.js gives every spell a rarity, starter -> godlike).
    if (!Array.isArray(def.learnSpell)) {
      if (!def.learnSpell?.rarity) return UNSUPPORTED;
      const wanted = def.learnSpell.quantity ?? 1;
      const known = Object.keys(SPELLS).filter(
        (id) => SPELLS[id].rarity === def.learnSpell.rarity && isSpellKnown(state, id)
      ).length;
      const current = Math.min(known, wanted);
      return { current, target: wanted, complete: current >= wanted };
    }
    const listed = def.learnSpell;
    const current = listed.filter((id) => isSpellKnown(state, id)).length;
    return { current, target: listed.length || 1, complete: listed.length > 0 && current >= listed.length };
  }
  if ("useSpell" in def) {
    if (!Array.isArray(def.useSpell)) return UNSUPPORTED;
    const listed = def.useSpell;
    const cast = state.quests[questId]?.objectiveProgress?.[path] ?? {};
    const current = listed.filter((id) => cast[id]).length;
    return { current, target: listed.length || 1, complete: listed.length > 0 && current >= listed.length };
  }
  if ("defeatEnemy" in def) {
    const kills = state.enemiesDefeated ?? {};
    // Two shapes in the wild: { type, quantity } counts every kill of that
    // enemy type, while a bare id array requires each named enemy specifically.
    if (Array.isArray(def.defeatEnemy)) {
      const listed = def.defeatEnemy;
      const current = listed.filter((id) => (kills[id] ?? 0) > 0).length;
      return { current, target: listed.length || 1, complete: listed.length > 0 && current >= listed.length };
    }
    const { type, quantity = 1 } = def.defeatEnemy;
    const killed = Object.entries(kills)
      .filter(([id]) => !type || ALL_ENEMIES[id]?.type === type)
      .reduce((sum, [, qty]) => sum + qty, 0);
    const current = Math.min(killed, quantity);
    return { current, target: quantity, complete: current >= quantity };
  }

  // Unrecognised objective type - report incomplete rather than letting a
  // naive current>=target check satisfy it by accident.
  return { current: 0, target: 1, complete: false };
}

// Only the top-level objectives, and only the ones that gate: an
// `optional: true` objective tracks and renders like any other but never holds
// a quest open. Children are covered by their parent's own aggregate status.
export function isQuestComplete(state, questId) {
  const quest = QUESTS[questId];
  if (!quest) return false;
  return Object.entries(quest.objectives)
    .filter(([, def]) => !def.optional)
    .every(([label]) => objectiveStatus(state, questId, label).complete);
}

export function acceptQuest(state, questId) {
  const quest = QUESTS[questId];
  if (!quest || quest.locked || state.level < quest.level || state.quests[questId]) return false;
  state.quests[questId] = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  return true;
}

export function completeQuest(state, questId) {
  const record = state.quests[questId];
  const quest = QUESTS[questId];
  if (!record || record.status !== "in_progress" || !quest || !isQuestComplete(state, questId)) return false;
  state.gold += quest.reward.gold ?? 0;
  grantRewardXp(state, quest.reward.xp ?? 0);
  record.status = "completed";
  record.completedAt = Date.now();
  return true;
}

// Batch-claims every in-progress quest that's fully satisfied right now.
export function claimCompletedQuests(state) {
  const claimed = [];
  for (const questId of Object.keys(state.quests)) {
    if (state.quests[questId].status === "in_progress" && completeQuest(state, questId)) {
      claimed.push({ id: questId, name: QUESTS[questId].name });
    }
  }
  return claimed;
}

// Bumps one of the lifetime id-keyed tallies in state.lifetime. These exist
// because the per-quest counters below only fire for quests that are
// currently in_progress - with no matching quest accepted, the event is
// recorded nowhere, which is no basis for an achievement. Keyed by id so
// achievements' by-type/by-subtype shapes derive via ALL_ITEMS/SPELLS.
function bumpLifetime(state, kind, key, qty = 1) {
  const ledger = (state.lifetime ??= { sold: {}, crafted: {}, cast: {}, used: {} });
  ledger[kind] ??= {}; // a save written before this ledger key existed
  ledger[kind][key] = (ledger[kind][key] ?? 0) + qty;
}

// Event hooks - the objective types that can't be answered by a live state
// check. sellItem matches ALL_ITEMS[itemId].type (a real ITEM_TYPES
// category, e.g. "scrap"); craftItem matches the item id directly - despite
// reusing the key name "type", quest_backbone.js's own example ("iron_sword")
// isn't a member of ITEM_TYPES, so it means something different than
// sellItem's "type" does.
// Every hook below iterates walkObjectives() rather than the top-level
// objectives map: an objective nested inside a subObjectives group would
// otherwise never be handed its progress, and would sit at 0 forever with no
// sign of why. Progress is keyed by the objective's full path.
function* inProgressObjectives(state) {
  for (const [questId, record] of Object.entries(state.quests)) {
    if (record.status !== "in_progress") continue;
    for (const node of walkObjectives(QUESTS[questId])) yield { record, ...node };
  }
}

export function recordItemSold(state, itemId, qty) {
  const itemType = ALL_ITEMS[itemId]?.type;
  bumpLifetime(state, "sold", itemId, qty);
  for (const { record, path, def } of inProgressObjectives(state)) {
    if (def.sellItem?.type === itemType) record.objectiveProgress[path] = (record.objectiveProgress[path] || 0) + qty;
  }
}

// Ledger-only, unlike its siblings: no quest objective type reads `used` yet.
// It lives here anyway so every lifetime write stays in one module, and so
// adding a useItem objective later is a loop like the ones above rather than a
// save migration. Called from data/items.js's useItem() - the single point a
// consumable is actually consumed, in or out of combat.
export function recordItemUsed(state, itemId, qty) {
  bumpLifetime(state, "used", itemId, qty);
}

export function recordItemCrafted(state, itemId, qty) {
  bumpLifetime(state, "crafted", itemId, qty);
  for (const { record, path, def } of inProgressObjectives(state)) {
    if (def.craftItem?.type === itemId) record.objectiveProgress[path] = (record.objectiveProgress[path] || 0) + qty;
  }
}

// Unlike sellItem/craftItem's plain counters, useSpell needs to remember
// WHICH of its listed spell ids have been cast at least once (a quest like
// useSpell: ["fireball"] needs that specific spell, not any two casts) - so
// objectiveProgress[label] here is a { spellId: true } map, not a number.
// Unlike the hooks above, defeatEnemy's objectiveStatus reads the lifetime
// state.enemiesDefeated tally rather than objectiveProgress, so this doesn't
// need to bump a per-quest counter to make objectives work. It records the
// kill against in-progress quests anyway, so a future per-quest rule ("kills
// since you accepted this") has the data it needs without a save migration.
export function recordEnemyDefeated(state, enemyId) {
  for (const { record, path, def } of inProgressObjectives(state)) {
    const target = def.defeatEnemy;
    if (!target) continue;
    const matches = Array.isArray(target)
      ? target.includes(enemyId)
      : !target.type || ALL_ENEMIES[enemyId]?.type === target.type;
    if (matches) record.objectiveProgress[path] = (record.objectiveProgress[path] || 0) + 1;
  }
}

export function recordSpellCast(state, spellId) {
  bumpLifetime(state, "cast", spellId, 1);
  for (const { record, path, def } of inProgressObjectives(state)) {
    if (def.useSpell?.includes(spellId)) {
      record.objectiveProgress[path] = { ...(record.objectiveProgress[path] || {}), [spellId]: true };
    }
  }
}
