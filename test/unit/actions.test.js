import { test } from "node:test";
import assert from "node:assert/strict";
import { rollLootByType, beginAction } from "../../data/actions.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { createInitialState } from "../../state/gameState.js";

test("rollLootByType() picks from the matching type+subtype pool", () => {
  const loot = rollLootByType("mining", "tin");
  assert.ok(loot, "expected a loot roll");
  assert.equal(loot.itemId, "tin_ore");
  assert.equal(ALL_ITEMS[loot.itemId].type, "mining");
  assert.equal(ALL_ITEMS[loot.itemId].subtype, "tin");
  assert.ok(loot.qty >= 1);
});

test("rollLootByType() accepts an array of acceptable subtypes", () => {
  const loot = rollLootByType("food", ["raw_fungi", "raw_herbs", "raw_vegetables"]);
  assert.ok(loot);
  assert.ok(["raw_fungi", "raw_herbs", "raw_vegetables"].includes(ALL_ITEMS[loot.itemId].subtype));
});

test("rollLootByType() returns null when nothing matches the filter", () => {
  assert.equal(rollLootByType("not_a_real_type"), null);
});

test("beginAction() snapshots the action's skill level/xp at the moment it starts", () => {
  const state = createInitialState();
  state.skills.mining.level = 3;
  state.skills.mining.xp = 250;

  beginAction(state, "mine", { lootSubtype: "tin" });

  assert.equal(state.currentAction.id, "mine");
  assert.equal(state.currentAction.elapsedSeconds, 0);
  assert.deepEqual(state.currentAction.gatheredThisSession, {});
  assert.equal(state.currentAction.lootSubtype, "tin"); // extra fields pass through
  assert.equal(state.currentAction.skillLevelAtStart, 3);
  assert.equal(state.currentAction.skillXpAtStart, 250);
});

test("beginAction() falls back to 0/0 for an action with no skill", () => {
  const state = createInitialState();
  beginAction(state, "not_a_real_action");
  assert.equal(state.currentAction.skillLevelAtStart, 0);
  assert.equal(state.currentAction.skillXpAtStart, 0);
});
