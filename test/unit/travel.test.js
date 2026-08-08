import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../../state/gameState.js";
import { beginTravel, tickTravel } from "../../data/travel.js";
import { buildTravelTrack } from "../../ui/screens/traveling.js";
import { LOCATIONS } from "../../data/locations.js";

test("beginTravel() sets up currentTravel from an exit", () => {
  const state = createInitialState();
  state.currentLocationId = "town_square";
  beginTravel(state, { to: "wilderness", category: "path", time: 15 });
  assert.deepEqual(state.currentTravel, {
    fromLocationId: "town_square",
    toLocationId: "wilderness",
    category: "path",
    totalSeconds: 15,
    elapsedSeconds: 0,
  });
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

// Documents a pre-existing, feature-unrelated data gap found while building
// timed travel (data/locations.js's vetron_station/kooz_station exits point
// at location ids that were never defined) - kept as an active assertion
// (not silently skipped) so a NEW dangling reference still fails loudly,
// while the known ones are explicitly carved out. If one of the known-bad
// ids ever gets built out, the second loop below will fail, prompting its
// removal from KNOWN_DANGLING rather than this test going silently stale.
test("every location exit resolves to a real location id, except the known unfinished ones", () => {
  const KNOWN_DANGLING = new Set(["vetron_city", "vetron_docks", "kooz_city", "kooz_docks"]);
  const ids = new Set(Object.keys(LOCATIONS));

  const dangling = [];
  for (const [id, loc] of Object.entries(LOCATIONS)) {
    for (const exit of loc.exits ?? []) {
      if (!ids.has(exit.to) && !KNOWN_DANGLING.has(exit.to)) dangling.push(`${exit.to} (from ${id})`);
    }
  }
  assert.deepEqual(dangling, [], "unexpected dangling exit references beyond the known unfinished ones");

  for (const badId of KNOWN_DANGLING) {
    assert.ok(!ids.has(badId), `${badId} now exists in LOCATIONS - remove it from KNOWN_DANGLING`);
  }
});
