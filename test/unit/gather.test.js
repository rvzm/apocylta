// Pacing: how often a gather attempt fires, how often it lands, and what it
// pays. The game loop itself has no unit coverage (it's a setInterval), so the
// logic lives in exported functions and is tested here rather than by waiting
// on real seconds.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getAction, gatherSuccessChance, rollGatherAttempt, beginAction } from "../../data/actions.js";
import { resolveGatherAttempt } from "../../state/gameLoop.js";
import { gatherTimeFor, encounterTicFor, groupSpawnFor } from "../../player_backbone.js";
import { createInitialState } from "../../state/gameState.js";
import { toolbeltWeightCap } from "../../data/toolbelt.js";
import { ALL_ITEMS, weightOf } from "../../item_backbone.js";

const ALWAYS = () => 0; // always under the success chance
const NEVER = () => 0.999; // never under it

function gatherer({ difficulty = "normal", skill = "foraging", level = 1 } = {}) {
  const state = createInitialState();
  state.difficulty = difficulty;
  state.skills[skill].level = level;
  return state;
}

// ------------------------------------------------------------- difficulty

test("gatherTimeFor() reads logic.gatherTime, with a floor and a fallback", () => {
  assert.equal(gatherTimeFor("casual"), 1);
  assert.equal(gatherTimeFor("normal"), 10);
  assert.equal(gatherTimeFor("nightmare"), 30);
  // An unknown difficulty falls back rather than returning undefined, which as
  // a modulo divisor would fire the attempt every single tick.
  assert.equal(gatherTimeFor("no_such_difficulty"), 3);
  assert.ok(gatherTimeFor(undefined) >= 1);
});

test("encounterTicFor() is independent of gatherTime, and harder means more often", () => {
  assert.equal(encounterTicFor("normal"), 3);
  assert.ok(
    encounterTicFor("nightmare") < encounterTicFor("casual"),
    "the ambush cadence must not invert with difficulty the way it did when it rode the gather"
  );
  assert.equal(encounterTicFor("no_such_difficulty"), 3);
});

test("groupSpawnFor() defaults to the neutral 1 for an unknown difficulty", () => {
  assert.equal(groupSpawnFor("normal"), 1);
  assert.ok(groupSpawnFor("nightmare") > groupSpawnFor("casual"));
  assert.equal(groupSpawnFor("no_such_difficulty"), 1);
});

// ---------------------------------------------------------- success chance

test("gatherSuccessChance() starts at the action's own base rate", () => {
  const state = gatherer({ level: 1 });
  // level 1 against targetLevel 1 = no adjustment either way.
  assert.equal(gatherSuccessChance(state, getAction("gather_scraps"), 1), 0.6);
  assert.equal(gatherSuccessChance(state, getAction("chop"), 1), 0.55);
});

test("gatherSuccessChance() rises with the acting skill and falls with the target's level", () => {
  const low = gatherSuccessChance(gatherer({ level: 1 }), getAction("gather_scraps"), 1);
  const high = gatherSuccessChance(gatherer({ level: 10 }), getAction("gather_scraps"), 1);
  assert.ok(high > low, "levelling the skill has to pay");

  // The same skill level against a harder target is worse odds - this is what
  // makes a mithril seam or a leviathan feel different from tin and pike.
  const easyTarget = gatherSuccessChance(gatherer({ skill: "fishing", level: 20 }), getAction("fish"), 1);
  const hardTarget = gatherSuccessChance(gatherer({ skill: "fishing", level: 20 }), getAction("fish"), 40);
  assert.ok(hardTarget < easyTarget);
});

test("gatherSuccessChance() clamps at both ends - never hopeless, never free", () => {
  const maxed = gatherSuccessChance(gatherer({ level: 999 }), getAction("gather_scraps"), 1);
  assert.equal(maxed, 0.95);

  const outclassed = gatherSuccessChance(gatherer({ level: 1 }), getAction("gather_scraps"), 999);
  assert.equal(outclassed, 0.15);
});

test("gatherSuccessChance() falls back for an action with no declared rate", () => {
  const state = gatherer();
  assert.equal(gatherSuccessChance(state, { skill: "foraging" }, 1), 0.6);
});

test("rollGatherAttempt() compares the injected roll against the chance", () => {
  const state = gatherer();
  assert.equal(rollGatherAttempt(state, getAction("gather_scraps"), 1, ALWAYS), true);
  assert.equal(rollGatherAttempt(state, getAction("gather_scraps"), 1, NEVER), false);
  // Exactly at the boundary is a miss - the comparison is strictly less-than.
  assert.equal(rollGatherAttempt(state, getAction("gather_scraps"), 1, () => 0.6), false);
});

// ------------------------------------------------------- resolving an attempt

test("a successful attempt takes loot, pays skill xp and logs what it took", () => {
  const state = gatherer();
  beginAction(state, "gather_scraps");
  const xpBefore = state.skills.foraging.xp;

  resolveGatherAttempt(state, ALWAYS);

  assert.ok(Object.keys(state.currentAction.gatheredThisSession).length > 0, "something was gathered");
  assert.ok(state.skills.foraging.xp > xpBefore, "a success pays xp");
  assert.equal(state.currentAction.attempts.length, 1);
  assert.match(state.currentAction.attempts[0], /^You found \d+ /);
});

test("a missed attempt takes nothing and pays NO xp", () => {
  const state = gatherer();
  beginAction(state, "gather_scraps");
  const xpBefore = state.skills.foraging.xp;

  resolveGatherAttempt(state, NEVER);

  assert.deepEqual(state.currentAction.gatheredThisSession, {});
  assert.equal(state.skills.foraging.xp, xpBefore, "a miss must not pay xp");
  assert.deepEqual(state.currentAction.attempts, [getAction("gather_scraps").missLine]);
});

test("the attempt log keeps only the most recent few", () => {
  const state = gatherer();
  beginAction(state, "gather_scraps");
  for (let i = 0; i < 12; i++) resolveGatherAttempt(state, NEVER);
  assert.equal(state.currentAction.attempts.length, 5);
});

// Bait is charged per attempt, hit or miss - and running out is what ends the
// trip, which the loop reads as currentAction going null.
test("fishing without bait ends the action rather than resolving an attempt", () => {
  const state = gatherer({ skill: "fishing" });
  state.currentLocationId = "riverbank";
  beginAction(state, "fish", { lootIds: ["raw_pike"], species: "pike", targetLevel: 1 });

  resolveGatherAttempt(state, ALWAYS);

  assert.equal(state.currentAction, null);
  assert.ok(state.toasts.some((t) => /out of bait/i.test(t.text)));
});

test("a miss still costs bait", () => {
  const state = gatherer({ skill: "fishing" });
  state.currentLocationId = "riverbank";
  state.inventory.fishing_bait = 2;
  beginAction(state, "fish", { lootIds: ["raw_pike"], species: "pike", targetLevel: 1 });

  resolveGatherAttempt(state, NEVER);

  assert.equal(state.inventory.fishing_bait, 1);
  assert.equal(state.currentAction.attempts[0], getAction("fish").missLine);
});

// ------------------------------------------------------- no room for the haul

// addItem() takes what fits and reports how much, so the attempt line has to
// say what you actually got - claiming ore you never carried is worse than
// saying you left some behind.
test("an attempt with no room at all reads as a miss you can do something about", () => {
  const state = gatherer();
  // Scrap rides the belt, so filling the belt is what blocks a scrap gather.
  state.inventory.scrap_metal = 10_000;
  beginAction(state, "gather_scraps");

  resolveGatherAttempt(state, ALWAYS);

  assert.deepEqual(state.currentAction.gatheredThisSession, {}, "nothing was taken");
  assert.match(state.currentAction.attempts[0], /no room/i);
  assert.notEqual(
    state.currentAction.attempts[0],
    getAction("gather_scraps").missLine,
    "and it does not read as an ordinary empty-handed miss"
  );
});

test("a partly-fitting haul reports what was actually taken", () => {
  const state = gatherer();
  beginAction(state, "gather_scraps");

  // Leave room for exactly one of the lightest thing a scrap gather can turn
  // up, so at least one roll of 1-2 has to come up short.
  const cap = toolbeltWeightCap(state);
  const lightest = Math.min(
    ...Object.entries(ALL_ITEMS)
      .filter(([, item]) => item.type === "scrap")
      .map(([, item]) => item.weight)
  );
  state.inventory.scrap_metal = Math.floor((cap - lightest) / weightOf("scrap_metal"));

  // Roll until one attempt comes up short of its full stack.
  let sawShortfall = false;
  for (let i = 0; i < 40 && !sawShortfall; i++) {
    state.currentAction.attempts = [];
    resolveGatherAttempt(state, ALWAYS);
    sawShortfall = state.currentAction.attempts.some((line) => /no room|leave/i.test(line));
  }
  assert.ok(sawShortfall, "a nearly-full belt should eventually report leaving something behind");
});
