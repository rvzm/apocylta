import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../../state/gameState.js";
import {
  visibleQuests,
  startedQuests,
  objectiveStatus,
  isQuestComplete,
  acceptQuest,
  completeQuest,
  claimCompletedQuests,
  recordItemSold,
  recordItemCrafted,
  recordSpellCast,
} from "../../data/quests.js";
import { learnSpell } from "../../data/magic.js";

test("visibleQuests() excludes locked quests unconditionally", () => {
  const state = createInitialState();
  const ids = visibleQuests(state).map((q) => q.id);
  assert.ok(!ids.includes("home_decked"), "home_decked is locked:true and has no unlock path this round");
});

test("visibleQuests() excludes quests above the player's level", () => {
  const state = createInitialState();
  state.level = 1;
  const ids = visibleQuests(state).map((q) => q.id);
  assert.ok(ids.includes("getting_started"));
  assert.ok(ids.includes("mine_mine_mine"));
});

test("visibleQuests() excludes quests already accepted or completed", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started");
  const ids = visibleQuests(state).map((q) => q.id);
  assert.ok(!ids.includes("getting_started"));
});

test("acceptQuest() succeeds once, fails on repeat/locked/under-level", () => {
  const state = createInitialState();
  assert.equal(acceptQuest(state, "getting_started"), true);
  assert.equal(acceptQuest(state, "getting_started"), false, "already accepted");
  assert.equal(acceptQuest(state, "home_decked"), false, "locked");

  const underLeveled = createInitialState();
  underLeveled.level = 1;
  assert.equal(acceptQuest(underLeveled, "home_decked"), false, "locked AND under-level (locked checked first)");
});

test("startedQuests() reflects only accepted quests, with their live record", () => {
  const state = createInitialState();
  assert.deepEqual(startedQuests(state), []);
  acceptQuest(state, "getting_started");
  const started = startedQuests(state);
  assert.equal(started.length, 1);
  assert.equal(started[0].id, "getting_started");
  assert.equal(started[0].record.status, "in_progress");
});

test("objectiveStatus(): acquireItem, bare string form (qty 1)", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started");
  let status = objectiveStatus(state, "getting_started", "Chop some wood");
  assert.deepEqual(status, { current: 0, target: 1, complete: false });

  state.inventory.wood = 1;
  status = objectiveStatus(state, "getting_started", "Chop some wood");
  assert.equal(status.complete, true);
});

test("objectiveStatus(): acquireItem, {id: qty} map form", () => {
  const state = createInitialState();
  acceptQuest(state, "mine_mine_mine");
  state.inventory.tin_ore = 3;
  let status = objectiveStatus(state, "mine_mine_mine", "Acquire 5 Tin Ore");
  assert.deepEqual(status, { current: 3, target: 5, complete: false });

  state.inventory.tin_ore = 5;
  status = objectiveStatus(state, "mine_mine_mine", "Acquire 5 Tin Ore");
  assert.equal(status.complete, true);
});

test("objectiveStatus(): sellItem defaults quantity to 1, driven by objectiveProgress not inventory", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started");
  let status = objectiveStatus(state, "getting_started", "Sell Some scrap");
  assert.deepEqual(status, { current: 0, target: 1, complete: false });

  state.quests.getting_started.objectiveProgress["Sell Some scrap"] = 1;
  status = objectiveStatus(state, "getting_started", "Sell Some scrap");
  assert.equal(status.complete, true);
});

test("objectiveStatus(): acquireHouse is live off state.house", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started");
  assert.equal(objectiveStatus(state, "getting_started", "Buy a House").complete, false);
  state.house = true;
  assert.equal(objectiveStatus(state, "getting_started", "Buy a House").complete, true);
});

// The four tests below need objective types quest_backbone.js's real seed
// quests don't exercise (craftItem/reachLocation/learnSkill/deferred types),
// so they temporarily monkey-patch the shared QUESTS singleton with a
// throwaway entry under a unique id (so a failed assertion in one test can't
// leave stale state a later test collides with) and always clean up via
// try/finally (so a failed assertion doesn't leak the entry to later tests
// either).
async function withFakeQuest(id, questDef, fn) {
  const { QUESTS } = await import("../../quest_backbone.js");
  QUESTS[id] = questDef;
  try {
    await fn(QUESTS);
  } finally {
    delete QUESTS[id];
  }
}

test("objectiveStatus(): craftItem matches the item id directly, not ALL_ITEMS[id].type", async () => {
  const state = createInitialState();
  state.quests.fake_craft = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_craft",
    { name: "Fake", locked: false, level: 1, reward: { gold: 0, xp: 0 }, objectives: { "Craft a sword": { craftItem: { type: "iron_sword" } } } },
    () => {
      assert.equal(objectiveStatus(state, "fake_craft", "Craft a sword").complete, false);

      recordItemCrafted(state, "wood", 1); // a "crafting"-type item, not a matching id - must not increment
      assert.equal(objectiveStatus(state, "fake_craft", "Craft a sword").complete, false);

      recordItemCrafted(state, "iron_sword", 1);
      assert.equal(objectiveStatus(state, "fake_craft", "Craft a sword").complete, true);
    }
  );
});

test("objectiveStatus(): reachLocation is live off state.currentLocationId", async () => {
  const state = createInitialState();
  state.quests.fake_location = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_location",
    { name: "Fake", locked: false, level: 1, reward: { gold: 0, xp: 0 }, objectives: { "Go there": { reachLocation: "wilderness" } } },
    () => {
      assert.equal(objectiveStatus(state, "fake_location", "Go there").complete, false);
      state.currentLocationId = "wilderness";
      assert.equal(objectiveStatus(state, "fake_location", "Go there").complete, true);
    }
  );
});

test("objectiveStatus(): learnSkill is live off the target skill's level", async () => {
  const state = createInitialState();
  state.quests.fake_skill = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_skill",
    { name: "Fake", locked: false, level: 1, reward: { gold: 0, xp: 0 }, objectives: { "Learn smithing": { learnSkill: { type: "smithing", level: 2 } } } },
    () => {
      assert.deepEqual(objectiveStatus(state, "fake_skill", "Learn smithing"), { current: 1, target: 2, complete: false });
      state.skills.smithing.level = 2;
      assert.equal(objectiveStatus(state, "fake_skill", "Learn smithing").complete, true);
    }
  );
});

// defeatEnemy comes in two shapes. { type, quantity } counts every kill of
// that enemy type; a bare id array requires each named enemy specifically.
test("objectiveStatus(): defeatEnemy {type, quantity} counts kills of that enemy type", async () => {
  const state = createInitialState();
  state.quests.fake_kills = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_kills",
    {
      name: "Fake",
      locked: false,
      level: 1,
      reward: { gold: 0, xp: 0 },
      objectives: { "Defeat goblins": { defeatEnemy: { type: "goblin", quantity: 5 } } },
    },
    () => {
      assert.deepEqual(objectiveStatus(state, "fake_kills", "Defeat goblins"), {
        current: 0,
        target: 5,
        complete: false,
      });

      // Different goblin ids all count toward the same type total...
      state.enemiesDefeated = { weak_goblin: 2, bow_goblin: 1 };
      assert.deepEqual(objectiveStatus(state, "fake_kills", "Defeat goblins"), {
        current: 3,
        target: 5,
        complete: false,
      });

      // ...while a non-goblin kill doesn't.
      state.enemiesDefeated.small_dwarf = 40;
      assert.equal(objectiveStatus(state, "fake_kills", "Defeat goblins").current, 3);

      state.enemiesDefeated.rage_goblin = 9;
      const done = objectiveStatus(state, "fake_kills", "Defeat goblins");
      assert.equal(done.complete, true);
      assert.equal(done.current, 5, "current is clamped to the target");
    }
  );
});

test("objectiveStatus(): defeatEnemy id array requires every listed enemy", async () => {
  const state = createInitialState();
  state.quests.fake_named = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_named",
    {
      name: "Fake",
      locked: false,
      level: 1,
      reward: { gold: 0, xp: 0 },
      objectives: { "Defeat both": { defeatEnemy: ["hubert", "gilbert"] } },
    },
    () => {
      assert.equal(objectiveStatus(state, "fake_named", "Defeat both").complete, false);

      state.enemiesDefeated = { hubert: 3 };
      assert.deepEqual(objectiveStatus(state, "fake_named", "Defeat both"), {
        current: 1,
        target: 2,
        complete: false,
      });

      state.enemiesDefeated.gilbert = 1;
      assert.equal(objectiveStatus(state, "fake_named", "Defeat both").complete, true);
    }
  );
});

test("objectiveStatus(): an unrecognised objective type still reports incomplete", async () => {
  const state = createInitialState();
  state.quests.fake_unknown = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_unknown",
    {
      name: "Fake",
      locked: false,
      level: 1,
      reward: { gold: 0, xp: 0 },
      objectives: { "Do something new": { somethingUnimplemented: { quantity: 3 } } },
    },
    () => {
      assert.deepEqual(objectiveStatus(state, "fake_unknown", "Do something new"), {
        current: 0,
        target: 1,
        complete: false,
      });
    }
  );
});

test("objectiveStatus(): learnSpell is live off isSpellKnown(), each listed spell required", async () => {
  const state = createInitialState();
  state.quests.fake_learn_spell = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_learn_spell",
    {
      name: "Fake",
      locked: false,
      level: 1,
      reward: { gold: 0, xp: 0 },
      objectives: { "Learn spells": { learnSpell: ["cure", "wilderness_teleport"] } },
    },
    () => {
      assert.deepEqual(objectiveStatus(state, "fake_learn_spell", "Learn spells"), { current: 0, target: 2, complete: false });

      state.inventory = { ley_crystals: 10, arcane_shard: 10 };
      learnSpell(state, "cure");
      assert.deepEqual(objectiveStatus(state, "fake_learn_spell", "Learn spells"), { current: 1, target: 2, complete: false });

      state.skills.magic.level = 2;
      learnSpell(state, "wilderness_teleport");
      assert.equal(objectiveStatus(state, "fake_learn_spell", "Learn spells").complete, true);
    }
  );
});

test("objectiveStatus(): learnSpell never vacuously completes on an empty array", async () => {
  const state = createInitialState();
  state.quests.fake_empty_learn = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_empty_learn",
    { name: "Fake", locked: false, level: 1, reward: { gold: 0, xp: 0 }, objectives: { "Learn nothing": { learnSpell: [] } } },
    () => {
      assert.equal(objectiveStatus(state, "fake_empty_learn", "Learn nothing").complete, false);
    }
  );
});

test("objectiveStatus()/recordSpellCast(): useSpell tracks which listed spells have been cast, each required", async () => {
  const state = createInitialState();
  state.quests.fake_use_spell = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_use_spell",
    {
      name: "Fake",
      locked: false,
      level: 1,
      reward: { gold: 0, xp: 0 },
      objectives: { "Cast spells": { useSpell: ["magic_missle", "frost_spike"] } },
    },
    () => {
      assert.deepEqual(objectiveStatus(state, "fake_use_spell", "Cast spells"), { current: 0, target: 2, complete: false });

      recordSpellCast(state, "magic_missle");
      assert.deepEqual(objectiveStatus(state, "fake_use_spell", "Cast spells"), { current: 1, target: 2, complete: false });

      recordSpellCast(state, "magic_missle"); // casting the same spell again doesn't double-count
      assert.equal(objectiveStatus(state, "fake_use_spell", "Cast spells").current, 1);

      recordSpellCast(state, "some_other_spell"); // not listed - must not increment
      assert.equal(objectiveStatus(state, "fake_use_spell", "Cast spells").current, 1);

      recordSpellCast(state, "frost_spike");
      assert.equal(objectiveStatus(state, "fake_use_spell", "Cast spells").complete, true);
    }
  );
});

test("objectiveStatus(): useSpell never vacuously completes on an empty array", async () => {
  const state = createInitialState();
  state.quests.fake_empty_use = { status: "in_progress", objectiveProgress: {}, completedAt: null };
  await withFakeQuest(
    "fake_empty_use",
    { name: "Fake", locked: false, level: 1, reward: { gold: 0, xp: 0 }, objectives: { "Cast nothing": { useSpell: [] } } },
    () => {
      assert.equal(objectiveStatus(state, "fake_empty_use", "Cast nothing").complete, false);
    }
  );
});

test("recordItemSold() increments only in-progress quests with a matching sellItem.type, ignores others", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started"); // "Sell Some scrap" -> sellItem: {type: "scrap"}
  recordItemSold(state, "wood", 1); // type "crafting", not "scrap" - must not match
  assert.equal(state.quests.getting_started.objectiveProgress["Sell Some scrap"] ?? 0, 0);

  recordItemSold(state, "stone", 2); // type "scrap" - matches
  assert.equal(state.quests.getting_started.objectiveProgress["Sell Some scrap"], 2);
});

test("recordItemSold()/recordItemCrafted() no-op for quests not in progress", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started");
  state.quests.getting_started.status = "completed";
  recordItemSold(state, "stone", 5);
  assert.equal(state.quests.getting_started.objectiveProgress["Sell Some scrap"] ?? 0, 0);
});

test("isQuestComplete()/completeQuest(): grants reward exactly once, no-ops on incomplete or wrong status", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started");
  assert.equal(isQuestComplete(state, "getting_started"), false);
  assert.equal(completeQuest(state, "getting_started"), false);
  assert.equal(state.quests.getting_started.status, "in_progress");

  state.inventory.wood = 1;
  state.quests.getting_started.objectiveProgress["Sell Some scrap"] = 1;
  state.house = true;
  assert.equal(isQuestComplete(state, "getting_started"), true);

  const goldBefore = state.gold;
  const xpBefore = state.experience;
  assert.equal(completeQuest(state, "getting_started"), true);
  assert.equal(state.quests.getting_started.status, "completed");
  assert.ok(state.quests.getting_started.completedAt > 0);
  assert.equal(state.gold, goldBefore + 100);
  assert.equal(state.experience, xpBefore + 100);

  // Second call is a no-op (already completed).
  assert.equal(completeQuest(state, "getting_started"), false);
  assert.equal(state.gold, goldBefore + 100);
});

test("claimCompletedQuests() claims only the satisfied subset, leaves others untouched", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started");
  acceptQuest(state, "mine_mine_mine");
  state.inventory.wood = 1;
  state.quests.getting_started.objectiveProgress["Sell Some scrap"] = 1;
  state.house = true;
  // mine_mine_mine left unsatisfied.

  const claimed = claimCompletedQuests(state);
  assert.deepEqual(claimed, [{ id: "getting_started", name: "Getting Started" }]);
  assert.equal(state.quests.getting_started.status, "completed");
  assert.equal(state.quests.mine_mine_mine.status, "in_progress");
});

// The record* hooks gained lifetime ledgers alongside their per-quest
// counters, because the per-quest ones only fire for in_progress quests - with
// no matching quest accepted the event was previously recorded nowhere, which
// is no basis for an achievement.
test("record hooks bump lifetime ledgers even with no quest accepted", async () => {
  const state = createInitialState();
  assert.deepEqual(state.quests, {}, "no quests at all");

  recordItemSold(state, "stone", 4);
  recordItemCrafted(state, "iron_sword", 2);
  recordSpellCast(state, "fireball");
  recordSpellCast(state, "fireball");

  assert.deepEqual(state.lifetime.sold, { stone: 4 });
  assert.deepEqual(state.lifetime.crafted, { iron_sword: 2 });
  assert.deepEqual(state.lifetime.cast, { fireball: 2 });
});

test("lifetime ledgers accumulate across calls without disturbing quest progress", async () => {
  const state = createInitialState();
  recordItemSold(state, "stone", 3);
  recordItemSold(state, "stone", 5);
  recordItemSold(state, "bone", 1);

  assert.deepEqual(state.lifetime.sold, { stone: 8, bone: 1 });
  assert.deepEqual(state.quests, {}, "quest records are untouched");
});

// Regression: recordSpellCast used to be called only from the spellbook
// screen, so every spell cast during a fight went unrecorded and useSpell
// objectives silently missed every attack spell. The hook now lives in
// castSpell() itself, so both paths record.
test("casting in combat records the spell, not just casting from the spellbook", async () => {
  const { castSpell } = await import("../../data/magic.js");
  const state = createInitialState();
  state.skills.magic.level = 10;
  state.spells = new Set(["fireball"]);

  const target = { id: "weak_goblin", name: "Weak Goblin", hp: 90, hpMax: 90 };
  const result = castSpell(state, "fireball", target);

  assert.ok(result, "the cast succeeded");
  assert.equal(state.lifetime.cast.fireball, 1);
});

test("a failed cast records nothing", async () => {
  const { castSpell } = await import("../../data/magic.js");
  const state = createInitialState();
  state.mp = 0; // can't afford magic_missle

  assert.equal(castSpell(state, "magic_missle", { name: "X", hp: 10 }), null);
  assert.deepEqual(state.lifetime.cast, {});
});
