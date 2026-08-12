import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../../state/gameState.js";
import { beginTravel, tickTravel, travelSecondsFor } from "../../data/travel.js";
import { buildTravelTrack } from "../../ui/screens/traveling.js";
import { DIGITS, orderedExits } from "../../ui/screens/travel.js";
import { LOCATIONS } from "../../data/locations.js";

test("beginTravel() sets up currentTravel from an exit", () => {
  const state = createInitialState();
  state.currentLocationId = "town_square";
  beginTravel(state, { to: "wilderness", category: "path", time: 15 });
  assert.deepEqual(state.currentTravel, {
    fromLocationId: "town_square",
    toLocationId: "wilderness",
    category: "path",
    // Both are kept: totalSeconds is how long the walk actually takes at this
    // speed level, baseSeconds is what the route is authored at. At speed 1
    // they agree, which is the point of the curve starting at 1.0.
    baseSeconds: 15,
    totalSeconds: 15,
    elapsedSeconds: 0,
  });
});

// The speed skill shortens a trip. Gently, and from a base of exactly the
// authored time, because the timed integration tests drive a real game with a
// level 1-5 character and would start failing on drift they can't see.
test("travelSecondsFor(): level 1 is the authored time exactly", () => {
  const state = createInitialState();
  assert.equal(state.skills.speed.level, 1);
  for (const seconds of [5, 10, 15, 20, 30]) {
    assert.equal(travelSecondsFor(state, seconds), seconds);
  }
});

test("travelSecondsFor(): a fresh proficient character (speed 5) still walks the authored time", () => {
  const state = createInitialState();
  state.skills.speed.level = 5;
  assert.equal(travelSecondsFor(state, 15), 15);
  assert.equal(travelSecondsFor(state, 30), 30);
});

test("travelSecondsFor(): higher speed shortens the trip, monotonically", () => {
  const state = createInitialState();
  const at = (level) => {
    state.skills.speed.level = level;
    return travelSecondsFor(state, 30);
  };
  assert.equal(at(1), 30);
  assert.equal(at(25), 28);
  assert.equal(at(50), 25);
  assert.equal(at(100), 19);

  let previous = Infinity;
  for (let level = 1; level <= 200; level++) {
    const seconds = at(level);
    assert.ok(seconds <= previous, `speed ${level} took longer than ${level - 1}`);
    previous = seconds;
  }
});

test("travelSecondsFor(): the floor holds at 40% off, however high speed climbs", () => {
  const state = createInitialState();
  for (const level of [101, 200, 500]) {
    state.skills.speed.level = level;
    assert.equal(travelSecondsFor(state, 30), 18, `speed ${level}`);
  }
  // Never below a second, whatever the multiplication says.
  state.skills.speed.level = 500;
  assert.equal(travelSecondsFor(state, 1), 1);
});

// Travel is a thing a level SCALES, so it reads the effective level - the same
// number gather odds and the ore gates read. Haste is pointedly not part of it:
// it's a combat buff on state.currentCombat, and there is no fight to hold one
// while you're on a road.
test("travelSecondsFor(): reads the effective speed level, not the trained one", () => {
  const state = createInitialState();
  assert.equal(travelSecondsFor(state, 30), 30);

  state.skills.speed.level = 100;
  assert.equal(travelSecondsFor(state, 30), 19, "trained level counts");

  state.skills.speed.level = 1;
  state.currentCombat = { buffs: { speed: 99 } };
  assert.equal(travelSecondsFor(state, 30), 30, "a combat haste does not shorten a road");
});

// Paying on the shortened figure would make every level of speed cut the xp
// that speed earns - a skill that taxes its own training.
test("tickTravel() pays speed xp on the route's authored length, not the shortened one", () => {
  const state = createInitialState();
  state.currentLocationId = "town_square";
  state.skills.speed.level = 100;

  beginTravel(state, { to: "wilderness", category: "path", time: 30 });
  assert.equal(state.currentTravel.totalSeconds, 19, "the walk is shorter");

  const before = state.skills.speed.xp;
  for (let i = 0; i < 19; i++) tickTravel(state);
  assert.equal(state.currentTravel, null, "the trip finished in 19 ticks");
  assert.equal(state.skills.speed.xp - before, 30, "but it paid the full 30");
});

test("tickTravel() is a no-op when currentTravel is null", () => {
  const state = createInitialState();
  assert.equal(tickTravel(state), false);
  assert.equal(state.currentTravel, null);
});

test("tickTravel() increments elapsedSeconds without completing before totalSeconds", () => {
  const state = createInitialState();
  beginTravel(state, { to: "wilderness", category: "path", time: 3 });
  assert.equal(tickTravel(state), false);
  assert.equal(state.currentTravel.elapsedSeconds, 1);
  assert.equal(tickTravel(state), false);
  assert.equal(state.currentTravel.elapsedSeconds, 2);
  assert.equal(state.currentLocationId, "town_square");
});

test("tickTravel() completes on the tick elapsedSeconds reaches totalSeconds: grants speed xp, moves location, clears currentTravel", () => {
  const state = createInitialState();
  state.currentLocationId = "town_square";
  beginTravel(state, { to: "wilderness", category: "path", time: 3 });

  assert.equal(tickTravel(state), false);
  assert.equal(tickTravel(state), false);
  assert.equal(tickTravel(state), true); // 3rd tick completes it

  assert.equal(state.currentLocationId, "wilderness");
  assert.equal(state.currentTravel, null);
  assert.equal(state.skills.speed.xp, 3);
});

test("tickTravel() returns true only on the completing tick, not before or after", () => {
  const state = createInitialState();
  beginTravel(state, { to: "wilderness", category: "path", time: 2 });
  assert.equal(tickTravel(state), false);
  assert.equal(tickTravel(state), true);
  assert.equal(tickTravel(state), false); // currentTravel is null now, no-op
});

test("buildTravelTrack(): path category, marker moves from start to end as progress increases", () => {
  assert.equal(buildTravelTrack(0, 0, "path"), "+[]-------------------------------------");
  assert.equal(buildTravelTrack(0, 1, "path"), "-------------------------------------+[]");
});

test("buildTravelTrack(): path marker alternates frames by elapsedSeconds parity", () => {
  const even = buildTravelTrack(4, 0.5, "path");
  const odd = buildTravelTrack(5, 0.5, "path");
  assert.match(even, /\+\[\]/);
  assert.match(odd, /\[\]\+\+\+/);
});

test("buildTravelTrack(): airboat category uses a distinct track fill and marker from path", () => {
  const airboat = buildTravelTrack(0, 0, "airboat");
  const path = buildTravelTrack(0, 0, "path");
  assert.equal(airboat, ">[@@@]->~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  assert.notEqual(airboat, path);
  assert.match(airboat, /~/);
  assert.doesNotMatch(path, /~/);
});

test("buildTravelTrack(): airboat marker alternates thrust frames by elapsedSeconds parity", () => {
  const even = buildTravelTrack(0, 0.5, "airboat");
  const odd = buildTravelTrack(1, 0.5, "airboat");
  assert.match(even, />\[@@@\]->/);
  assert.match(odd, />\[@@@\]-->/);
});

// The cave network's own animation. in_cave shares it deliberately - it's the
// inside-the-cave hops, and without the shared branch they drew the surface
// road while the two `cave` entrances drew a tunnel.
test("buildTravelTrack(): cave and in_cave share a tunnel animation, distinct from a path", () => {
  const cave = buildTravelTrack(0, 0, "cave");
  assert.equal(cave, buildTravelTrack(0, 0, "in_cave"));
  assert.notEqual(cave, buildTravelTrack(0, 0, "path"));
  assert.match(cave, /\(\[o\]\(/);
  assert.match(buildTravelTrack(1, 0, "cave"), /\)\[o\]\)/);
});

test("buildTravelTrack(): teleport category has its own marker and fill", () => {
  assert.match(buildTravelTrack(0, 0, "teleport"), /^0o0\*+$/);
  assert.match(buildTravelTrack(1, 0, "teleport"), /^o0o\*+$/);
});

// The clamp used to be a hardcoded TRACK_WIDTH - 3, sized for the original
// 3-character marker. The longer ones wrote past the end of the array and
// returned a track up to 45 wide, stretching the row as a trip finished.
test("buildTravelTrack(): every category stays exactly one track wide, even at the end", () => {
  for (const category of ["path", "airboat", "teleport", "cave", "in_cave", "shop", undefined]) {
    for (const elapsed of [0, 1]) {
      for (const progress of [0, 0.5, 1]) {
        assert.equal(
          buildTravelTrack(elapsed, progress, category).length,
          40,
          `${category} at progress ${progress}, second ${elapsed}`
        );
      }
    }
  }
});

// This carried a KNOWN_DANGLING carve-out for vetron_city/vetron_docks/
// kooz_city/kooz_docks, which vetron_station and kooz_station had always
// exited to without either ever being defined. The carve-out was an active
// assertion rather than a skip, precisely so that building one of them out
// would fail here and prompt its own removal - which is what happened. Both
// regions are real now and nothing dangles, so the test is a plain one again.
test("every location exit resolves to a real location id", () => {
  const ids = new Set(Object.keys(LOCATIONS));

  const dangling = [];
  for (const [id, loc] of Object.entries(LOCATIONS)) {
    for (const exit of loc.exits ?? []) {
      if (!ids.has(exit.to)) dangling.push(`${exit.to} (from ${id})`);
    }
  }
  assert.deepEqual(dangling, []);
});

// The travel screen numbers exits and binds one key per number, so a location
// with more exits than DIGITS has destinations that are listed-but-unreachable
// - or, before renderBody was made to share this list, not even listed. That is
// exactly what happened to town_square's portal room when a magic shop was
// added and pushed it to a tenth slot nothing could press.
test("no location has more exits than the travel screen has keys", () => {
  const tooMany = Object.entries(LOCATIONS)
    .filter(([, location]) => (location.exits ?? []).length > DIGITS.length)
    .map(([id, location]) => `${id}: ${location.exits.length} exits, ${DIGITS.length} keys`);
  assert.deepEqual(tooMany, []);
});

test("every exit the travel screen renders is a key it also binds", () => {
  for (const location of Object.values(LOCATIONS)) {
    for (const [index] of orderedExits(location).entries()) {
      assert.ok(DIGITS[index], `${location.id} exit ${index + 1} has no key`);
    }
  }
});
