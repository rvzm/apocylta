// The player-level calibration itself. Player level used to run on the same
// curve as a single skill while being fed by all seventeen, so it outran the
// skills feeding it by an order of magnitude - seventeen skills at 75 came out
// as player level 1295. These tests pin the shape that replaced it: the level
// should read like an average of your skills without being computed from them.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SKILLS,
  skillLevelCost,
  playerLevelCost,
  playerLevelFromXp,
  playerXpFromSkillLevels,
  playerXpScale,
  MAX_SKILL_LEVEL,
  MAX_PLAYER_LEVEL,
} from "../../skill_backbone.js";
import { createInitialState, grantSkillXp, grantPlayerXp, grantRewardXp } from "../../state/gameState.js";

const SKILL_COUNT = Object.keys(SKILLS).length;

// The player level `n` skills each taken to `level` is worth.
function levelFor(skillCount, skillLevel) {
  return playerLevelFromXp(skillCount * playerXpFromSkillLevels(skillLevel));
}

// ------------------------------------------------------------- calibration

// The two routes the design is pitched around: broad competence, or a handful
// of specialities driven well past everyone else. Both should land near 100.
test("player level ~100 comes from either 75 across the board or a few skills past 100", () => {
  const broad = levelFor(SKILL_COUNT, 75);
  assert.ok(broad >= 95 && broad <= 105, `17 skills at 75 should land near 100, got ${broad}`);

  const specialist = levelFor(5, 100);
  assert.ok(specialist >= 75 && specialist <= 100, `5 skills at 100 should land in the 75-100 band, got ${specialist}`);

  // Pushing those five further closes the gap, which is what "4 or 5 skills
  // at 100+" means in practice.
  assert.ok(levelFor(5, 120) > specialist);
});

test("player level trails the skills feeding it", () => {
  for (const skillLevel of [25, 50, 75, 100, 200]) {
    const player = levelFor(SKILL_COUNT, skillLevel);
    assert.ok(
      player < skillLevel * 1.5,
      `every skill at ${skillLevel} gave player ${player} - the level is supposed to lag, not lead`
    );
  }
});

test("one maxed skill is worth something, but not a whole character", () => {
  const single = levelFor(1, 100);
  assert.ok(single > 1, "a skill at 100 has to be worth real player levels");
  assert.ok(single < levelFor(SKILL_COUNT, 75) / 2, "and far less than broad competence");
});

// ------------------------------------------------------------------- caps

test("MAX_PLAYER_LEVEL is exactly what every skill at MAX_SKILL_LEVEL is worth", () => {
  assert.equal(levelFor(SKILL_COUNT, MAX_SKILL_LEVEL), MAX_PLAYER_LEVEL);
});

test("skills stop at MAX_SKILL_LEVEL, though xp keeps accruing", () => {
  const state = createInitialState();
  state.skills.mining.level = MAX_SKILL_LEVEL - 1;
  state.skills.mining.xp = skillLevelCost(MAX_SKILL_LEVEL);

  grantSkillXp(state, "mining", skillLevelCost(MAX_SKILL_LEVEL) * 10);
  assert.equal(state.skills.mining.level, MAX_SKILL_LEVEL);
  assert.ok(state.skills.mining.xp > skillLevelCost(MAX_SKILL_LEVEL), "xp still accumulates past the cap");
});

test("the player level stops at MAX_PLAYER_LEVEL no matter how much xp arrives", () => {
  const state = createInitialState();
  grantPlayerXp(state, playerLevelCost(MAX_PLAYER_LEVEL) * 100);
  assert.equal(state.level, MAX_PLAYER_LEVEL);
});

// ------------------------------------------------------------ the curve

test("playerLevelFromXp() inverts playerLevelCost() exactly, including at thresholds", () => {
  for (const level of [1, 2, 3, 10, 57, 100, 250, MAX_PLAYER_LEVEL]) {
    assert.equal(playerLevelFromXp(playerLevelCost(level)), level, `round-trip failed at ${level}`);
    // One xp short of the threshold is still the level below.
    if (level > 1) assert.equal(playerLevelFromXp(playerLevelCost(level) - 1), level - 1);
  }
  assert.equal(playerLevelFromXp(0), 1);
  assert.equal(playerLevelFromXp(-5), 1);
});

test("the player curve is steeper than the skill curve at every level that matters", () => {
  for (const level of [10, 50, 100, 500]) {
    assert.ok(
      playerLevelCost(level) > skillLevelCost(level),
      `player level ${level} should cost more than skill level ${level}`
    );
  }
});

// -------------------------------------------------------- reward scaling

// Combat/quest/achievement xp is flat in the catalogs. Against an L^2.6 curve
// that would fade to nothing, so grantRewardXp scales it by level - a quest
// hand-in should be worth about the same slice of a level late as it is early.
test("grantRewardXp() keeps a flat reward worth a comparable slice of a level as you climb", () => {
  const fractionAt = (level) => {
    const state = createInitialState();
    state.level = level;
    state.experience = playerLevelCost(level);
    const toNextLevel = playerLevelCost(level + 1) - playerLevelCost(level);
    const before = state.experience;
    grantRewardXp(state, 1000);
    return (state.experience - before) / toNextLevel;
  };

  const early = fractionAt(10);
  const late = fractionAt(100);
  assert.ok(early > 0 && late > 0);
  const ratio = late / early;
  assert.ok(ratio > 0.5 && ratio < 2, `a reward should hold its value across levels, ratio was ${ratio.toFixed(2)}`);
});

test("playerXpScale() leaves the early game alone", () => {
  assert.equal(playerXpScale(1), 1);
  assert.ok(playerXpScale(10) > 1);

  const state = createInitialState();
  grantRewardXp(state, 500);
  assert.equal(state.experience, 500, "at level 1 a reward is granted exactly as written");
});

// grantSkillXp feeds grantPlayerXp directly, NOT grantRewardXp - scaling that
// too would compound the curve against itself and undo the whole rescaling.
test("skill level-ups feed the player pool unscaled", () => {
  const state = createInitialState();
  state.level = 100;
  state.experience = playerLevelCost(100);
  const before = state.experience;

  state.skills.mining.xp = skillLevelCost(2);
  grantSkillXp(state, "mining", 0);

  const granted = state.experience - before;
  assert.ok(granted > 0 && granted < 100, `expected a small unscaled grant, got ${granted}`);
});
