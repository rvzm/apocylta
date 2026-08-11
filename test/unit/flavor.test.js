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
import { getDisplay, setDisplay } from "../../state/displaySettings.js";
import { stripMarkup, pickBand, HP_BANDS } from "../../markup.js";
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
  const location = { id: "somewhere", flavorText: [(s, l) => `${l.id} at ${s.level}`] };
  assert.deepEqual(resolveFlavorText(location, state), ["somewhere at 1"]);
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

// The open branch used to say nothing at all about when the shop shuts, which
// is the one thing worth knowing while you're standing in it.
test("openLine(): names hours on BOTH branches", () => {
  const shop = { id: "weapons_shop", openHours: { open: 8, close: 20 } };
  assert.match(stripMarkup(openLine(at(12), shop)), /Open until 8pm\./, "open says when it shuts");
  assert.match(stripMarkup(openLine(at(3), shop)), /Open 8am - 8pm\./, "shut says the whole window");
});

// Green for go, red for no - the signal spellbook/blackMarket rows and
// renderChrome's safe-zone bracket already share.
test("openLine(): colours the hours by whether you can shop now", () => {
  const shop = { id: "weapons_shop", openHours: { open: 8, close: 20 } };
  assert.match(openLine(at(12), shop), /\{green-fg\}\{bold\}8pm\{\/bold\}\{\/green-fg\}/);
  assert.match(openLine(at(3), shop), /\{red-fg\}\{bold\}8am - 8pm\{\/bold\}\{\/red-fg\}/);
});

// black_market runs 11pm-6am, so its hours wrap past midnight.
test("openLine(): handles hours that wrap past midnight", () => {
  const market = { id: "black_market", openHours: { open: 23, close: 6 } };
  assert.match(openLine(at(2), market), /behind the counter/, "2am is inside 11pm-6am");
  assert.match(openLine(at(23, 30), market), /behind the counter/);
  assert.match(openLine(at(12), market), /shutters are down/, "midday is not");
});

test("firstVisitLine(): distinguishes a first arrival from a return", () => {
  const state = createInitialState();
  assert.match(firstVisitLine(state, { id: "town_square", name: "town square" }), /back at town square/);
  assert.match(firstVisitLine(state, { id: "wilderness", name: "wilderness" }), /never been/);
});

test("dangerLine(): reads the location's safe flag either way", () => {
  const state = createInitialState();
  assert.match(dangerLine(state, { safe: true, name: "the park" }), /safe here/);
  assert.match(dangerLine(state, { safe: false, name: "the ruins" }), /back to the wall/);
});

// -------------------------------------------------------- player state

test("healthLine(): gets bleaker as you drop, in order", () => {
  const state = createInitialState();
  assert.match(healthLine(state), /full health/, "untouched at exactly max");

  const said = [0.95, 0.85, 0.7, 0.55, 0.4, 0.2, 0.05].map((f) => {
    state.hp = state.hpMax * f;
    return healthLine(state);
  });

  // 0.95 sits in the gap between the <=0.9 band and the ==1 case.
  assert.equal(said[0], null);
  assert.match(said[1], /bruised/);
  assert.match(said[2], /banged up/);
  assert.match(said[3], /slowing you down/);
  assert.match(said[4], /feel it in your movements/);
  assert.match(said[5], /bad way/);
  assert.match(said[6], /critical/);
});

test("packLine(): quiet only when the pack is empty", () => {
  const state = createInitialState();
  assert.equal(packLine(state), null);

  state.inventory = { wood: 1 };
  assert.match(packLine(state), /a few things/);

  // backpackSlotsUsed counts distinct non-tool, non-potion ids against the
  // belt-derived cap, which is 100 with no belt equipped - and only ids that
  // resolve in ALL_ITEMS count at all, so these have to be real.
  const fillers = Object.entries(ALL_ITEMS)
    .filter(([, item]) => item.type !== "tool" && item.type !== "potion")
    .slice(0, 100);
  for (const [id] of fillers) state.inventory[id] = 1;
  assert.match(packLine(state), /completely full/);
});

// ------------------------------------------------------------- styling

// Every helper routes its colour through markup.js's `styled`, so the display
// setting still governs. Colour goes; the prose (and any bold) stays.
test("colorize off leaves every helper's prose intact and tag-free", () => {
  const before = { ...getDisplay() };
  try {
    setDisplay({ colorize: false });
    const state = createInitialState();
    state.hp = state.hpMax; // healthLine only speaks at full health or below 90%
    state.inventory = { wood: 1 };
    const location = { id: "wilderness", name: "wilderness", safe: false, openHours: { open: 8, close: 20 } };

    const lines = [
      timeLine(state),
      weatherLine(state),
      openLine(at(3), location),
      dangerLine(state, location),
      healthLine(state),
      packLine(state),
      firstVisitLine(state, location),
    ].filter((line) => line != null);

    assert.ok(lines.length >= 5, "expected most helpers to have something to say");
    for (const line of lines) {
      assert.equal(typeof line, "string");
      assert.doesNotMatch(line, /-fg\}/, `"${line}" still carries a colour tag`);
    }
  } finally {
    setDisplay(before);
  }
});

// resolveFlavorText drops nulls to make a line conditional; a helper that
// stringified its null through a style wrapper would render "null" instead.
test("a helper with nothing to say still returns null, not styled null", () => {
  const clear = at(0);
  // weather() is derived from the clock, so find an hour whose weather is clear.
  let quiet = null;
  for (let hour = 0; hour < 24 && quiet === null; hour++) {
    if (weatherLine(at(hour)) === null) quiet = hour;
  }
  assert.notEqual(quiet, null, "some hour of day 0 should have clear weather");
  assert.equal(weatherLine(at(quiet)), null);
  assert.equal(healthLine(Object.assign(createInitialState(), { hp: 95, hpMax: 100 })), null);
  assert.equal(packLine(createInitialState()), null);
  assert.equal(clear.clock.totalMinutes, 0);
});

// healthLine and the status bar's HP number read the same table, so they can't
// disagree about how bad things are.
test("healthLine() bands with markup.js's shared HP_BANDS", () => {
  const state = createInitialState();
  state.hpMax = 100;

  state.hp = 100;
  assert.match(healthLine(state), /\{green-fg\}/);
  state.hp = 45;
  assert.match(healthLine(state), new RegExp(`\\{${pickBand(0.45, HP_BANDS).color}-fg\\}`));
  state.hp = 5;
  assert.match(healthLine(state), /\{red-fg\}\{bold\}/, "critical health shouts");
});
