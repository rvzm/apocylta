import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, removeItem, walletTotal } from "../../state/gameState.js";
import { objectiveStatus } from "../../data/quests.js";
import { evaluateAchievements } from "../../data/achievements.js";
import { adjust, adminEnabled } from "../../ui/screens/admin/shared.js";
import { game_config } from "../../config.js";

// ------------------------------------------------------------------- gate

test("adminEnabled(): follows the config flag when no env override is set", (t) => {
  const original = game_config.allow_admin;
  t.after(() => {
    game_config.allow_admin = original;
    delete process.env.ALLOW_ADMIN;
  });
  delete process.env.ALLOW_ADMIN;

  game_config.allow_admin = false;
  assert.equal(adminEnabled(), false);

  game_config.allow_admin = true;
  assert.equal(adminEnabled(), true);
});

// The env override is what lets a test drive (or lock out) these screens without
// editing config.js, matching DEBUG_LEVEL/DB_PATH. It has to work in BOTH
// directions: as an OR against the config it could only ever open the gate, so
// the closed-gate integration case had to lean on config.js's shipped value and
// broke whenever someone flipped it.
test("adminEnabled(): ALLOW_ADMIN overrides the config flag in both directions", (t) => {
  const original = game_config.allow_admin;
  t.after(() => {
    game_config.allow_admin = original;
    delete process.env.ALLOW_ADMIN;
  });

  game_config.allow_admin = false;
  process.env.ALLOW_ADMIN = "true";
  assert.equal(adminEnabled(), true, "opens a gate the config leaves shut");

  game_config.allow_admin = true;
  process.env.ALLOW_ADMIN = "false";
  assert.equal(adminEnabled(), false, "and closes one the config leaves open");

  // Anything that isn't "true" is off - no truthiness games with "0"/"no".
  for (const value of ["0", "no", "TRUE", "1"]) {
    process.env.ALLOW_ADMIN = value;
    assert.equal(adminEnabled(), false, `ALLOW_ADMIN=${value} should not open the gate`);
  }

  // An empty value is treated as unset, so `env ALLOW_ADMIN= ...` falls through
  // to the config rather than silently locking the editors out.
  process.env.ALLOW_ADMIN = "";
  assert.equal(adminEnabled(), true, "empty means unset, so the config decides");
});

// --------------------------------------------------------------- stepping

test("adjust(): clamps to min and max, and tolerates a non-numeric start", () => {
  assert.equal(adjust(50, 10), 60);
  assert.equal(adjust(5, -10), 0, "floors at 0 by default");
  assert.equal(adjust(5, -10, { min: 1 }), 1);
  assert.equal(adjust(95, 10, { max: 100 }), 100);
  assert.equal(adjust(undefined, 10), 10);
  assert.equal(adjust(50, 10, { max: Infinity }), 60);
});

// --------------------------------------------------------------- infinite

test("removeItem(): leaves an adminInfinite item alone, and is unaffected otherwise", () => {
  const state = createInitialState();
  state.inventory = { wood: 5, stone: 5 };
  state.adminInfinite.add("wood");

  removeItem(state, "wood", 3);
  assert.equal(state.inventory.wood, 5, "infinite items never run down");

  removeItem(state, "stone", 3);
  assert.equal(state.inventory.stone, 2, "everything else is untouched");

  state.adminInfinite.delete("wood");
  removeItem(state, "wood", 3);
  assert.equal(state.inventory.wood, 2, "clearing the flag restores normal behaviour");
});

// ----------------------------------------------------------------- quests

// "Buy a House" reads state.house and "Chop some wood" reads the inventory -
// neither keeps a counter anyone could write to, which is the whole reason the
// override exists. Only sellItem/craftItem/useSpell are directly writable.
const LIVE_OBJECTIVE = "Buy a House";
const STORED_OBJECTIVE = "Sell Some scrap";

test("objectiveStatus(): adminForced completes a live-derived objective", () => {
  const state = createInitialState();
  state.quests.getting_started = { status: "in_progress", objectiveProgress: {}, adminForced: {}, completedAt: null };

  assert.equal(objectiveStatus(state, "getting_started", LIVE_OBJECTIVE).complete, false);

  state.quests.getting_started.adminForced[LIVE_OBJECTIVE] = true;
  const forced = objectiveStatus(state, "getting_started", LIVE_OBJECTIVE);
  assert.equal(forced.complete, true);
  assert.equal(forced.current, forced.target, "a forced objective reads as fully met");
  assert.equal(state.house, false, "without having actually bought a house");
});

test("objectiveStatus(): adminForced also overrides a stored-counter objective", () => {
  const state = createInitialState();
  state.quests.getting_started = { status: "in_progress", objectiveProgress: {}, adminForced: {}, completedAt: null };

  assert.equal(objectiveStatus(state, "getting_started", STORED_OBJECTIVE).complete, false);
  state.quests.getting_started.adminForced[STORED_OBJECTIVE] = true;
  assert.equal(objectiveStatus(state, "getting_started", STORED_OBJECTIVE).complete, true);
});

test("objectiveStatus(): a record with no adminForced key behaves exactly as before", () => {
  const state = createInitialState();
  // The shape of every save ever written before the override existed.
  state.quests.getting_started = { status: "in_progress", objectiveProgress: {}, completedAt: null };

  assert.equal(objectiveStatus(state, "getting_started", LIVE_OBJECTIVE).complete, false);
  state.house = true;
  assert.equal(objectiveStatus(state, "getting_started", LIVE_OBJECTIVE).complete, true);
});

// ----------------------------------------------------------- achievements

test("evaluateAchievements(): paused by adminAutoAchievements, so a re-lock sticks", () => {
  const state = createInitialState();
  state.locationsVisited = new Set(["town_square", "wilderness", "north_path", "east_path", "west_path", "south_path"]);

  // Earn it normally first.
  const unlocked = evaluateAchievements(state);
  assert.ok(unlocked.length > 0, "the visited-locations achievement should fire");
  const earnedId = unlocked[0].id;
  const goldAfterEarning = walletTotal(state);

  // With evaluation live, re-locking bounces straight back AND re-pays - the
  // duplication bug the switch exists to prevent.
  delete state.achievements[earnedId];
  evaluateAchievements(state);
  assert.ok(state.achievements[earnedId], "re-unlocks immediately while auto-evaluate is on");
  assert.ok(walletTotal(state) > goldAfterEarning, "and pays the reward a second time");

  // With it paused, the re-lock holds and no gold moves.
  state.adminAutoAchievements = false;
  delete state.achievements[earnedId];
  const goldWhilePaused = walletTotal(state);
  for (let i = 0; i < 5; i++) evaluateAchievements(state);

  assert.equal(state.achievements[earnedId], undefined, "stays locked across many ticks");
  assert.equal(walletTotal(state), goldWhilePaused, "and no reward is re-paid");
});

test("evaluateAchievements(): unpausing resumes normally", () => {
  const state = createInitialState();
  state.adminAutoAchievements = false;
  state.locationsVisited = new Set(["town_square", "wilderness", "north_path", "east_path", "west_path", "south_path"]);

  assert.deepEqual(evaluateAchievements(state), []);
  state.adminAutoAchievements = true;
  assert.ok(evaluateAchievements(state).length > 0);
});
