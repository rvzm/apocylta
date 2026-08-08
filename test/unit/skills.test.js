import { test } from "node:test";
import assert from "node:assert/strict";
import { skillLevelCost } from "../../skill_backbone.js";
import { createInitialState, grantSkillXp, grantPlayerXp } from "../../state/gameState.js";

test("skillLevelCost() follows the 50 * level^1.4 formula", () => {
  assert.equal(skillLevelCost(1), Math.round(50 * Math.pow(1, 1.4)));
  assert.equal(skillLevelCost(10), Math.round(50 * Math.pow(10, 1.4)));
  assert.ok(skillLevelCost(10) > skillLevelCost(5), "cost should increase with level");
});

test("grantSkillXp() accumulates xp and levels up once the cost threshold is crossed", () => {
  const state = createInitialState();
  assert.equal(state.skills.mining.level, 1);
  grantSkillXp(state, "mining", skillLevelCost(2));
  assert.equal(state.skills.mining.level, 2);
});

test("grantSkillXp() applies the proficiency multiplier", () => {
  const proficient = createInitialState();
  proficient.skills.mining.proficient = true;
  grantSkillXp(proficient, "mining", 10);

  const nonProficient = createInitialState();
  grantSkillXp(nonProficient, "mining", 10);

  assert.ok(proficient.skills.mining.xp > nonProficient.skills.mining.xp);
});

test("grantSkillXp() is a no-op for an unknown skill id", () => {
  const state = createInitialState();
  assert.doesNotThrow(() => grantSkillXp(state, "not_a_skill", 100));
});

test("grantSkillXp() proficiency multiplier is difficulty-dependent", () => {
  // casual/easy/normal/hard don't define modifiers.proficiency - they fall
  // back to the flat 1.5x default (PROFICIENCY_XP_MULTIPLIER). normal's
  // playerXp modifier is 1, so this isolates the proficiency fallback:
  // 10 * 1.5 * 1 = 15.
  const normal = createInitialState();
  normal.difficulty = "normal";
  normal.skills.mining.proficient = true;
  grantSkillXp(normal, "mining", 10);
  assert.equal(normal.skills.mining.xp, 15);

  // survival explicitly sets proficiency: 0.5 (and playerXp: 0.5):
  // round(10 * 0.5 * 0.5) = round(2.5) = 3.
  const survival = createInitialState();
  survival.difficulty = "survival";
  survival.skills.mining.proficient = true;
  grantSkillXp(survival, "mining", 10);
  assert.equal(survival.skills.mining.xp, 3);

  // nightmare explicitly sets proficiency: 0 - the proficiency multiplier
  // zeroes out xpGain entirely *before* playerXp scaling is applied, so a
  // proficient skill actually gains LESS than a non-proficient one here
  // (0 vs round(10 * 0.25) = 3) - a direct, faithful consequence of the
  // existing multiplicative formula (unchanged by this difficulty-aware
  // wiring), not something new introduced by it.
  const nightmareProficient = createInitialState();
  nightmareProficient.difficulty = "nightmare";
  nightmareProficient.skills.mining.proficient = true;
  grantSkillXp(nightmareProficient, "mining", 10);
  assert.equal(nightmareProficient.skills.mining.xp, 0);

  const nightmareNonProficient = createInitialState();
  nightmareNonProficient.difficulty = "nightmare";
  grantSkillXp(nightmareNonProficient, "mining", 10);
  assert.equal(nightmareNonProficient.skills.mining.xp, 3);
});

test("grantSkillXp() grants player xp per skill level gained, scaled to skillLevelCost(newLevel)/10", () => {
  const state = createInitialState();
  grantSkillXp(state, "mining", skillLevelCost(2));
  assert.equal(state.skills.mining.level, 2);
  assert.equal(state.experience, Math.round(skillLevelCost(2) / 10));
});

test("grantSkillXp()'s player-xp grant sums per-level amounts on a multi-level jump, not top-level times count", () => {
  const state = createInitialState();
  grantSkillXp(state, "mining", skillLevelCost(3));
  assert.equal(state.skills.mining.level, 3);
  const expected = Math.round(skillLevelCost(2) / 10) + Math.round(skillLevelCost(3) / 10);
  assert.equal(state.experience, expected);
});

test("grantPlayerXp() accumulates player xp and levels up once the cost threshold is crossed", () => {
  const state = createInitialState();
  assert.equal(state.level, 1);
  grantPlayerXp(state, skillLevelCost(2));
  assert.equal(state.level, 2);
  assert.equal(state.experience, skillLevelCost(2));
});

test("grantPlayerXp() handles a multi-level jump in one call", () => {
  const state = createInitialState();
  grantPlayerXp(state, skillLevelCost(3));
  assert.equal(state.level, 3);
});

test("grantPlayerXp() rounds the granted amount", () => {
  const state = createInitialState();
  grantPlayerXp(state, 13.2);
  assert.equal(state.experience, 13);
});
