import { QUESTS } from "../quest_backbone.js";
import { ALL_ITEMS } from "../item_backbone.js";
import { ALL_ENEMIES } from "../enemy_backbone.js";
import { grantPlayerXp } from "../state/gameState.js";
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
export function objectiveStatus(state, questId, label) {
  const def = QUESTS[questId]?.objectives?.[label];
  if (!def) return { current: 0, target: 1, complete: false };

  // Admin override (ui/screens/admin/adminQuests.js), ahead of the type switch:
  // only 3 of the 10 objective types keep a counter anyone could write to, so
  // forcing the other 7 has to happen here rather than by faking their source.
  if (state.quests[questId]?.adminForced?.[label]) return { current: 1, target: 1, complete: true };

  if ("acquireItem" in def) {
    const [itemId, qty] =
      typeof def.acquireItem === "string" ? [def.acquireItem, 1] : Object.entries(def.acquireItem)[0];
    const current = Math.min(state.inventory[itemId] || 0, qty);
    return { current, target: qty, complete: current >= qty };
  }
  if ("sellItem" in def || "craftItem" in def) {
    const qty = (def.sellItem ?? def.craftItem).quantity ?? 1;
    const current = Math.min(state.quests[questId]?.objectiveProgress?.[label] ?? 0, qty);
    return { current, target: qty, complete: current >= qty };
  }
  if ("acquireHouse" in def) {
    return { current: state.house ? 1 : 0, target: 1, complete: !!state.house };
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
    const listed = def.learnSpell;
    const current = listed.filter((id) => isSpellKnown(state, id)).length;
    return { current, target: listed.length || 1, complete: listed.length > 0 && current >= listed.length };
  }
  if ("useSpell" in def) {
    const listed = def.useSpell;
    const cast = state.quests[questId]?.objectiveProgress?.[label] ?? {};
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

export function isQuestComplete(state, questId) {
  const quest = QUESTS[questId];
  return !!quest && Object.keys(quest.objectives).every((label) => objectiveStatus(state, questId, label).complete);
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
  grantPlayerXp(state, quest.reward.xp ?? 0);
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
export function recordItemSold(state, itemId, qty) {
  const itemType = ALL_ITEMS[itemId]?.type;
  bumpLifetime(state, "sold", itemId, qty);
  for (const [questId, record] of Object.entries(state.quests)) {
    if (record.status !== "in_progress") continue;
    for (const [label, def] of Object.entries(QUESTS[questId]?.objectives ?? {})) {
      if (def.sellItem?.type === itemType) record.objectiveProgress[label] = (record.objectiveProgress[label] || 0) + qty;
    }
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
  for (const [questId, record] of Object.entries(state.quests)) {
    if (record.status !== "in_progress") continue;
    for (const [label, def] of Object.entries(QUESTS[questId]?.objectives ?? {})) {
      if (def.craftItem?.type === itemId) record.objectiveProgress[label] = (record.objectiveProgress[label] || 0) + qty;
    }
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
  for (const [questId, record] of Object.entries(state.quests)) {
    if (record.status !== "in_progress") continue;
    for (const [label, def] of Object.entries(QUESTS[questId]?.objectives ?? {})) {
      const target = def.defeatEnemy;
      if (!target) continue;
      const matches = Array.isArray(target)
        ? target.includes(enemyId)
        : !target.type || ALL_ENEMIES[enemyId]?.type === target.type;
      if (matches) record.objectiveProgress[label] = (record.objectiveProgress[label] || 0) + 1;
    }
  }
}

export function recordSpellCast(state, spellId) {
  bumpLifetime(state, "cast", spellId, 1);
  for (const [questId, record] of Object.entries(state.quests)) {
    if (record.status !== "in_progress") continue;
    for (const [label, def] of Object.entries(QUESTS[questId]?.objectives ?? {})) {
      if (def.useSpell?.includes(spellId)) {
        record.objectiveProgress[label] = { ...(record.objectiveProgress[label] || {}), [spellId]: true };
      }
    }
  }
}
