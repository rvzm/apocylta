// apocylta world data - location flavour helpers.
//
// Drop-in entries for a location's `flavorText` array (see data/locations.js).
// Every helper is (state, location) => string | null, and returning null drops
// the line entirely - that's how a line appears only when it has something to
// say.
//
// Imports nothing from state/gameState.js, and can't: gameState imports
// data/locations.js, and locations.js imports this file, so reaching back into
// gameState would close the loop. Everything here comes off `state` and
// `location` directly, plus three leaves (state/clock.js, data/toolbelt.js,
// markup.js).
//
// Lines carry meaning in their colour: ambient scene-setting recedes into grey,
// anything about danger or health reads at its own severity, and every one of
// them goes through markup.js's `styled` so the colorize setting still governs.
// markup.js is a top-level leaf importing only state/displaySettings.js, which
// is why styling these costs no new dependency of any weight.

import { dayNumber, hourOfDay, isOpenAt } from "../state/clock.js";
import { backpackSlotCap, backpackSlotsUsed } from "./toolbelt.js";
import { styled, COLOR, pickBand, HP_BANDS } from "../markup.js";

// Ambient lines (time of day, weather) set the scene and shouldn't compete with
// the lines that actually tell you something.
const ambient = (text) => styled(text, { color: COLOR.grey });

// ------------------------------------------------------------- time of day

export function timeOfDay(state) {
  const hour = hourOfDay(state);
  if (hour < 5) return "night";
  if (hour < 8) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "dusk";
  return "night";
}

const TIME_LINES = {
  dawn: "Grey light is creeping over the ruins.",
  morning: "The light is thin and clear, and the air still holds the night's chill.",
  afternoon: "The sun is high, and the heat comes up off the concrete in waves.",
  dusk: "The light is going orange, and the shadows are getting long.",
  night: "It's dark out, and the wind carries sounds you'd rather not place.",
};

// Written for outdoors - it talks about the sky. Use `indoorTimeLine` behind a
// closed door.
export function timeLine(state) {
  return ambient(TIME_LINES[timeOfDay(state)]);
}

const INDOOR_TIME_LINES = {
  dawn: "Early light is coming in grey through the windows.",
  morning: "Morning light falls in through the gaps.",
  afternoon: "It's warm in here, and the light is flat and bright.",
  dusk: "The light through the windows has gone amber.",
  night: "It's dark outside; whatever light there is in here is your own.",
};

export function indoorTimeLine(state) {
  return ambient(INDOOR_TIME_LINES[timeOfDay(state)]);
}

// ---------------------------------------------------------------- weather

const WEATHERS = ["clear", "clear", "overcast", "rain", "wind", "fog"];

// Deterministic from the clock rather than stored: weather that lived in state
// would need persisting, transitions, and a save migration to say "it's
// raining". Hashing the day and a ~4-hour block gives something that holds
// steady for a while, changes on its own, and survives a reload for free.
export function weather(state) {
  const block = dayNumber(state) * 6 + Math.floor(hourOfDay(state) / 4);
  // xorshift-ish scramble so consecutive blocks don't walk the list in order.
  let h = block * 2654435761;
  h ^= h >>> 13;
  return WEATHERS[Math.abs(h) % WEATHERS.length];
}

const WEATHER_LINES = {
  clear: null, // nothing worth saying about ordinary weather
  overcast: "The sky is a flat, heavy grey.",
  rain: "Rain is coming down steadily, drumming on everything metal.",
  wind: "The wind is up, dragging grit and old paper past your boots.",
  fog: "Fog has settled in; you can't see far in any direction.",
};

export function weatherLine(state) {
  const line = WEATHER_LINES[weather(state)];
  // Still null on clear weather - `ambient(null)` would stringify it into a
  // visible "null" line rather than dropping it the way resolveFlavorText does.
  return line == null ? null : ambient(line);
}

// --------------------------------------------------------- location state

// Null on a location with no openHours - most of them.
//
// Both branches name hours now: the open one used to say nothing at all about
// when it shuts, which is the one thing you want to know while you're standing
// in the shop. Green for go, red for no - the same signal ui/screens/spellbook.js,
// ui/screens/blackMarket.js and renderChrome's safe-zone bracket already use.
export function openLine(state, location) {
  const hours = location?.openHours;
  if (!hours) return null;

  if (isOpenAt(hours, state)) {
    const until = styled(formatHour(hours.close), { color: "green", bold: true });
    return `Someone's behind the counter, watching you browse. Open until ${until}.`;
  }
  const window = styled(`${formatHour(hours.open)} - ${formatHour(hours.close)}`, { color: "red", bold: true });
  return `The shutters are down. Open ${window}.`;
}

function formatHour(hour24) {
  const period = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}${period}`;
}

// Gold only on the new-location branch - arriving somewhere for the first time
// is the notable half; coming back somewhere familiar is not.
export function firstVisitLine(state, location) {
  if (state.locationsVisited?.has(location.id)) return `Always nice to be back at ${location.name}.`;
  return styled("You've never been this way before.", { color: COLOR.gold, bold: true });
}

export function dangerLine(state, location) {
  if (location.safe) return styled(`You feel safe here, ${location.name} is always welcoming.`, { color: "green" });
  return styled("You keep your back to the wall out of habit.", { color: "red" });
}

// ----------------------------------------------------------- player state

// Banded through the SAME table ui/layout.js colours the status bar's HP number
// with (markup.js's HP_BANDS), so the sentence and the number can never
// disagree about how bad things are. Bold under a quarter health, where the
// line stops being informational and starts being a warning.
export function healthLine(state) {
  const fraction = state.hpMax > 0 ? state.hp / state.hpMax : 0;

  const text = (() => {
    if (fraction <= 0.1) return "You're in a critical state - you won't last long.";
    if (fraction <= 0.25) return "You're in a bad way - you won't take much more.";
    if (fraction <= 0.5) return "You're hurt, and you feel it in your movements.";
    if (fraction <= 0.6) return "You're hurt, and it's slowing you down.";
    if (fraction <= 0.75) return "You're a little banged up, but you can keep going.";
    if (fraction <= 0.9) return "You're a little bruised, but nothing serious.";
    if (fraction >= 1) return "You're at full health!";
    return null;
  })();
  if (text == null) return null;

  return styled(text, { color: pickBand(fraction, HP_BANDS).color, bold: fraction <= 0.25 });
}

// Amber deepening to red as the pack fills - a full pack is the one state that
// actually stops you picking things up, so it's the one that shouts.
const PACK_BANDS = [
  { min: 1, color: "red", bold: true },
  { min: 0.9, color: COLOR.orange, bold: false },
  { min: 0.5, color: COLOR.amber, bold: false },
  { min: 0, color: COLOR.grey, bold: false },
];

export function packLine(state) {
  const cap = backpackSlotCap(state);
  const used = backpackSlotsUsed(state);

  const text = (() => {
    if (used >= cap) return "Your pack is completely full; you'll have to drop something.";
    if (used >= cap * 0.9) return "Your pack is almost full.";
    if (used >= cap * 0.75) return "Your pack is getting full.";
    if (used >= cap * 0.5) return "Your pack is half full.";
    if (used >= cap * 0.25) return "Your pack is starting to fill up.";
    if (used >= cap * 0.15) return "Your pack is starting to get used.";
    if (used > 0) return "Your pack has a few things in it.";
    return null;
  })();
  if (text == null) return null;

  const band = pickBand(cap > 0 ? used / cap : 0, PACK_BANDS);
  return styled(text, { color: band.color, bold: band.bold });
}
