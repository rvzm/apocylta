import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveFlavorText, LOCATIONS } from "../../data/locations.js";
import {
  dangerLine,
  firstVisitLine,
  healthLine,
  openLine,
  packLine,
  timeOfDay,
  timeLine,
  weather,
  weatherLine,
} from "../../data/flavor.js";
import { createInitialState } from "../../state/gameState.js";
import { ALL_ITEMS } from "../../item_backbone.js";

// The clock is minutes since the run started, seeded to 7:38pm.
function at(hour, minute = 0, day = 0) {
  const state = createInitialState();
  state.clock.totalMinutes = day * 24 * 60 + hour * 60 + minute;
  return state;
}

// --------------------------------------------------------- the normalizer

test("resolveFlavorText(): a plain string still yields one line", () => {
  assert.deepEqual(resolveFlavorText({ flavorText: "It's quiet here." }, createInitialState()), [
    "It's quiet here.",
  ]);
});

test("resolveFlavorText(): an array of strings passes straight through", () => {
  const lines = resolveFlavorText({ flavorText: ["one", "", "two"] }, createInitialState());
  assert.deepEqual(lines, ["one", "", "two"]);
});

test("resolveFlavorText(): functions are called with (state, location)", () => {
  const state = createInitialState();
  const location = { id: "somewhere", flavorText: [(s, l) => `${l.id} at ${s.gold}gp`] };
  assert.deepEqual(resolveFlavorText(location, state), ["somewhere at 0gp"]);
});

// A conditional line that has nothing to say returns null - that's how
// healthLine stays quiet while you're healthy.
test("resolveFlavorText(): a null result drops its line without leaving a gap", () => {
  const lines = resolveFlavorText({ flavorText: ["before", "", () => null, "", "after"] }, createInitialState());
  assert.deepEqual(lines, ["before", "", "after"], "one spacer, not two");
});

test("resolveFlavorText(): a dropped trailing line doesn't leave a dangling spacer", () => {
  const lines = resolveFlavorText({ flavorText: ["body", "", () => null] }, createInitialState());
  assert.deepEqual(lines, ["body"]);
});

test("resolveFlavorText(): a location with no flavorText resolves to nothing", () => {
  assert.deepEqual(resolveFlavorText({}, createInitialState()), []);
  assert.deepEqual(resolveFlavorText(undefined, createInitialState()), []);
});

// ---------------------------------------------------------- time of day

test("timeOfDay(): buckets the clock, including the wrap past midnight", () => {
  assert.equal(timeOfDay(at(2)), "night");
  assert.equal(timeOfDay(at(5)), "dawn");
  assert.equal(timeOfDay(at(7, 59)), "dawn");
  assert.equal(timeOfDay(at(8)), "morning");
  assert.equal(timeOfDay(at(12)), "afternoon");
  assert.equal(timeOfDay(at(17)), "dusk");
  assert.equal(timeOfDay(at(21)), "night");
  assert.equal(timeOfDay(at(23, 59)), "night");
});

test("timeLine(): every bucket has something to say", () => {
  for (const hour of [2, 6, 10, 14, 19, 22]) {
    assert.equal(typeof timeLine(at(hour)), "string", `no line at ${hour}:00`);
  }
});

// ------------------------------------------------------------- weather

// The whole claim of a stateless weather: same clock, same answer - so it
// survives a reload with nothing persisted.
test("weather(): deterministic for a given clock", () => {
  assert.equal(weather(at(9, 0)), weather(at(9, 0)));
  assert.equal(weather(at(9, 0)), weather(at(9, 59)), "steady within its block");
});

test("weather(): drifts across blocks and days rather than being fixed", () => {
  const overADay = [0, 4, 8, 12, 16, 20].map((h) => weather(at(h)));
  const overAWeek = [0, 1, 2, 3, 4, 5, 6].map((d) => weather(at(9, 0, d)));
  assert.ok(new Set([...overADay, ...overAWeek]).size > 1, "weather never changes");
});

test("weatherLine(): ordinary weather says nothing", () => {
  // "clear" is deliberately null - a line every single render would be noise.
  const lines = [0, 4, 8, 12, 16, 20].map((h) => weatherLine(at(h)));
  assert.ok(lines.some((l) => l === null), "clear weather should produce no line");
  assert.ok(lines.some((l) => typeof l === "string"), "and other weather should");
});

// ------------------------------------------------------ location state

test("openLine(): null without openHours, and reflects the hours when present", () => {
  assert.equal(openLine(at(12), { id: "park" }), null);

  const shop = { id: "weapons_shop", openHours: { open: 8, close: 20 } };
  assert.match(openLine(at(12), shop), /behind the counter/);
  assert.match(openLine(at(3), shop), /shutters are down/);
  assert.match(openLine(at(3), shop), /8am/, "and says when to come back");
});

// black_market runs 11pm-6am, so its hours wrap past midnight.
test("openLine(): handles hours that wrap past midnight", () => {
  const market = { id: "black_market", openHours: { open: 23, close: 6 } };
  assert.match(openLine(at(2), market), /behind the counter/, "2am is inside 11pm-6am");
  assert.match(openLine(at(23, 30), market), /behind the counter/);
  assert.match(openLine(at(12), market), /shutters are down/, "midday is not");
});

test("firstVisitLine(): only on a location you haven't stood in", () => {
  const state = createInitialState();
  assert.equal(firstVisitLine(state, { id: "town_square" }), null, "seeded as visited");
  assert.match(firstVisitLine(state, { id: "wilderness" }), /never been/);
});

test("dangerLine(): only outside a safe zone", () => {
  assert.equal(dangerLine(createInitialState(), { safe: true }), null);
  assert.match(dangerLine(createInitialState(), { safe: false }), /back to the wall/);
});

// -------------------------------------------------------- player state

test("healthLine(): quiet while healthy, louder as you drop", () => {
  const state = createInitialState();
  assert.equal(healthLine(state), null);

  state.hp = state.hpMax * 0.5;
  assert.match(healthLine(state), /hurt/);

  state.hp = state.hpMax * 0.2;
  assert.match(healthLine(state), /bad way/);
});

test("packLine(): quiet until the backpack is nearly full", () => {
  const state = createInitialState();
  assert.equal(packLine(state), null);

  // backpackSlotsUsed counts distinct non-tool, non-potion ids against the
  // belt-derived cap, which is 100 with no belt equipped - and only ids that
  // resolve in ALL_ITEMS count at all, so these have to be real.
  const fillers = Object.entries(ALL_ITEMS)
    .filter(([, item]) => item.type !== "tool" && item.type !== "potion")
    .slice(0, 100);
  for (const [id] of fillers) state.inventory[id] = 1;
  assert.match(packLine(state), /completely full/);
});
