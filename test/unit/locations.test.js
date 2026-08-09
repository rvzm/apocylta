// Shape invariants for data/locations.js. Location consistency has lived in
// enemyBackboneConsistency.test.js (spawn pools, boss lists, digit hotkeys) and
// travel.test.js (exit ids); this file covers the flavour text, which is the
// one field that can now hold arbitrary functions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCATIONS, resolveFlavorText } from "../../data/locations.js";
import { createInitialState } from "../../state/gameState.js";

// Renders the body the way ui/screens/location.js does. Two states, because a
// conditional line appears in one and not the other - a location that only
// fits while you're healthy isn't fitting.
function sampleStates() {
  const fresh = createInitialState();

  const rough = createInitialState();
  rough.hp = 1; // healthLine at its loudest
  rough.clock.totalMinutes = 3 * 60; // small hours: a different time bucket
  rough.locationsVisited = new Set(); // firstVisitLine everywhere

  return [fresh, rough];
}

test("every flavorText is a string, or an array of strings and functions", () => {
  const bad = [];
  for (const [id, location] of Object.entries(LOCATIONS)) {
    const flavor = location.flavorText;
    if (typeof flavor === "string") continue;
    if (!Array.isArray(flavor)) {
      bad.push(`${id}: flavorText is ${typeof flavor}, expected a string or an array`);
      continue;
    }
    for (const [i, entry] of flavor.entries()) {
      if (typeof entry === "string" || typeof entry === "function") continue;
      bad.push(`${id}: flavorText[${i}] is ${typeof entry}, expected a string or a function`);
    }
  }
  assert.deepEqual(bad, []);
});

// Guards a helper that returns a number, an object, or forgets to return -
// resolveFlavorText drops null but would happily pass anything else through to
// setContent.
test("every location resolves to plain strings", () => {
  const bad = [];
  for (const state of sampleStates()) {
    for (const [id, location] of Object.entries(LOCATIONS)) {
      for (const [i, line] of resolveFlavorText(location, state).entries()) {
        if (typeof line !== "string") bad.push(`${id}: resolved line ${i} is ${typeof line}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

// mainContent has no keyboard scroll bindings - only inventoryList does (see
// achievements.js's comment) - so anything past the bottom of the pane is
// simply unreachable. At 120x40 the pane holds 21 rows; description plus a
// blank plus the flavour has to fit inside that with room for a lastMessage.
const MAX_BODY_LINES = 18;

// Rows, not lines: blessed wraps rather than truncating, and the flavour is
// indented by 4 inside a 118-wide pane, so a long sentence costs two rows
// instead of vanishing. Long prose is fine - it just has to be counted.
const USABLE_WIDTH = 114;

function renderedRows(location, state) {
  const flavor = resolveFlavorText(location, state);
  const wrapped = flavor.reduce((rows, line) => rows + Math.max(1, Math.ceil(line.length / USABLE_WIDTH)), 0);
  return 2 + wrapped; // description + spacer
}

test("no location renders a body taller than the pane", () => {
  const tooLong = [];
  for (const state of sampleStates()) {
    for (const [id, location] of Object.entries(LOCATIONS)) {
      const rows = renderedRows(location, state);
      if (rows > MAX_BODY_LINES) tooLong.push(`${id}: ${rows} rows once wrapped`);
    }
  }
  assert.deepEqual(tooLong, []);
});
