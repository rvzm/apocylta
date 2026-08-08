import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildToolbeltPayload,
  buildQuestsPayload,
  buildAchievementsPayload,
  buildCombatPayload,
  buildKillsPayload,
  buildInventoryList,
} from "../../server_backbone.js";
import { createInitialState } from "../../state/gameState.js";
import { acceptQuest } from "../../data/quests.js";
import { buildEncounter, beginCombat } from "../../data/combat.js";

test("buildToolbeltPayload() encodes uncapped quiver as null, not Infinity/undefined", () => {
  const state = createInitialState();
  state.equipment.belt = "leather_belt";
  const payload = buildToolbeltPayload(state);
  assert.equal(payload.quiverCap, null);
  assert.ok(JSON.stringify(payload).includes('"quiverCap":null'));
});

test("buildToolbeltPayload() with no belt: quiverCap is a real 0, not null", () => {
  assert.equal(buildToolbeltPayload(createInitialState()).quiverCap, 0);
});

test("buildToolbeltPayload() reflects toolbelt held amounts and caps", () => {
  const state = createInitialState();
  state.equipment.belt = "leather_belt";
  state.toolbelt.waterBottle = 42;
  const payload = buildToolbeltPayload(state);
  assert.equal(payload.waterBottle, 42);
  assert.equal(payload.waterBottleCap, 100);
});

test("buildQuestsPayload() reflects acceptQuest() immediately", () => {
  const state = createInitialState();
  acceptQuest(state, "getting_started");
  const [entry] = buildQuestsPayload(state);
  assert.equal(entry.id, "getting_started");
  assert.equal(entry.status, "in_progress");
  assert.ok(entry.objectives.some((o) => o.label === "Chop some wood"));
});

test("buildQuestsPayload() is empty when no quests have been accepted", () => {
  assert.deepEqual(buildQuestsPayload(createInitialState()), []);
});

test("buildAchievementsPayload() carries the full catalog with per-player unlock state", () => {
  const state = createInitialState();
  const payload = buildAchievementsPayload(state);

  const welcome = payload.find((a) => a.id === "welcome_to_apocylta");
  assert.ok(welcome, "the whole catalog is listed, locked entries included");
  assert.equal(welcome.unlocked, false);
  assert.equal(welcome.unlockedAt, null);
  assert.ok(welcome.reward, "reward stays exposed for display");

  // Progress is live per requirement, the same shape buildQuestsPayload uses
  // for objectives. A fresh character has visited only the starting location.
  assert.deepEqual(welcome.requirements, [
    { key: "locationsVisited", current: 1, target: 6, complete: false },
  ]);
});

test("buildAchievementsPayload() reflects an unlock", () => {
  const state = createInitialState();
  state.achievements.welcome_to_apocylta = { unlockedAt: 1700000000000 };

  const welcome = buildAchievementsPayload(state).find((a) => a.id === "welcome_to_apocylta");
  assert.equal(welcome.unlocked, true);
  assert.equal(welcome.unlockedAt, 1700000000000);
});

test("buildAchievementsPayload() survives JSON encoding - it goes over the wire", () => {
  const payload = buildAchievementsPayload(createInitialState());
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), payload);
});

// Combat panel: null while idle, populated mid-fight - same shape rule
// buildCurrentActionPayload() follows, so the page can just check for null.
test("buildCombatPayload() is null when no encounter is running", () => {
  assert.equal(buildCombatPayload(createInitialState()), null);
});

test("buildCombatPayload() reports the live enemy, round and queue depth", () => {
  const state = createInitialState();
  state.difficulty = "normal";
  state.currentLocationId = "abandoned_cabin";
  beginCombat(state, buildEncounter(state, "mixed_group")); // 3 members

  const payload = buildCombatPayload(state);
  assert.equal(payload.round, 0);
  assert.equal(payload.outcome, null);
  assert.equal(payload.remaining, 3);
  assert.equal(payload.defeatedThisEncounter, 0);
  assert.equal(payload.enemy.id, "weak_goblin");
  assert.equal(payload.enemy.hp, payload.enemy.hpMax);
  assert.ok(Array.isArray(payload.log));

  // Survives JSON encoding intact - it's served over the wire.
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), payload);
});

test("buildKillsPayload() resolves names/types and sorts by count", () => {
  const state = createInitialState();
  assert.deepEqual(buildKillsPayload(state), []);

  state.enemiesDefeated = { weak_goblin: 2, hubert: 7 };
  const payload = buildKillsPayload(state);
  assert.deepEqual(payload, [
    { id: "hubert", name: "Hubert", type: "human", quantity: 7 },
    { id: "weak_goblin", name: "Weak Goblin", type: "goblin", quantity: 2 },
  ]);
});

test("buildKillsPayload() falls back to the raw id for an unknown enemy", () => {
  const state = createInitialState();
  state.enemiesDefeated = { ghost_of_a_removed_enemy: 1 };
  assert.deepEqual(buildKillsPayload(state), [
    { id: "ghost_of_a_removed_enemy", name: "ghost_of_a_removed_enemy", type: null, quantity: 1 },
  ]);
});

// The playercard page groups the backpack into type/subtype tabs, so those two
// fields are a payload contract rather than incidental extras.
test("buildInventoryList() carries type and subtype for tab grouping", () => {
  const payload = buildInventoryList({ iron_sword: 1, stone: 12 });

  assert.deepEqual(
    payload.map(({ id, name, qty, type, subtype }) => ({ id, name, qty, type, subtype })),
    [
      { id: "iron_sword", name: "Iron Sword", qty: 1, type: "weapon", subtype: "sword" },
      { id: "stone", name: "Stone", qty: 12, type: "scrap", subtype: "stone" },
    ]
  );
});

test("buildInventoryList() gives a subtype-less item an explicit null, not undefined", () => {
  // Plenty of catalog entries have no subtype (every treasure item, for one).
  // undefined would be dropped by JSON.stringify and reach the page as a
  // missing key; null survives and groups under the "other" subtype tab.
  const [item] = buildInventoryList({ gold_vase: 1 });

  assert.equal(item.type, "treasure");
  assert.equal(item.subtype, null);
  assert.ok("subtype" in JSON.parse(JSON.stringify(item)), "must survive the wire");
});

test("buildInventoryList() skips zero quantities and sorts by name", () => {
  const payload = buildInventoryList({ stone: 3, bone: 2, iron_sword: 0 });
  assert.deepEqual(payload.map((i) => i.name), ["Bone", "Stone"]);
});
