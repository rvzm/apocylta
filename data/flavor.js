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
// `location` directly, plus two leaves (state/clock.js, data/toolbelt.js).

import { dayNumber, hourOfDay, isOpenAt } from "../state/clock.js";
import { backpackSlotCap, backpackSlotsUsed } from "./toolbelt.js";

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
  return TIME_LINES[timeOfDay(state)];
}

const INDOOR_TIME_LINES = {
  dawn: "Early light is coming in grey through the windows.",
  morning: "Morning light falls in through the gaps.",
  afternoon: "It's warm in here, and the light is flat and bright.",
  dusk: "The light through the windows has gone amber.",
  night: "It's dark outside; whatever light there is in here is your own.",
};

export function indoorTimeLine(state) {
  return INDOOR_TIME_LINES[timeOfDay(state)];
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
  return WEATHER_LINES[weather(state)];
}

// --------------------------------------------------------- location state

// Null on a location with no openHours - most of them.
export function openLine(state, location) {
  const hours = location?.openHours;
  if (!hours) return null;
  if (isOpenAt(hours, state)) return "Someone's behind the counter, watching you browse.";
  return `The shutters are down. Nobody's here until ${formatHour(hours.open)}.`;
}

function formatHour(hour24) {
  const period = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}${period}`;
}

export function firstVisitLine(state, location) {
  return state.locationsVisited?.has(location.id) ? `Always nice to be back at ${location.name}.` : "You've never been this way before.";
}

export function dangerLine(state, location) {
  return location.safe ? `You feel safe here, ${location.name} is always welcoming.` : "You keep your back to the wall out of habit.";
}

// ----------------------------------------------------------- player state

export function healthLine(state) {
  const fraction = state.hp / state.hpMax;
  if (fraction <= 0.1) return "You're in a critical state - you won't last long.";
  if (fraction <= 0.25) return "You're in a bad way - you won't take much more.";
  if (fraction <= 0.5) return "You're hurt, and you feel it in your movements.";
  if (fraction <= 0.6) return "You're hurt, and it's slowing you down.";
  if (fraction <= 0.75) return "You're a little banged up, but you can keep going.";
  if (fraction <= 0.9) return "You're a little bruised, but nothing serious.";
  if (fraction == 1) return "You're at full health!";
  return null;
}

export function packLine(state) {
  const cap = backpackSlotCap(state);
  const used = backpackSlotsUsed(state);
  if (used >= cap) return "Your pack is completely full; you'll have to drop something.";
  if (used >= cap * 0.9) return "Your pack is almost full.";
  if (used >= cap * 0.75) return "Your pack is getting full.";
  if (used >= cap * 0.5) return "Your pack is half full.";
  if (used >= cap * 0.25) return "Your pack is starting to fill up.";
  if (used >= cap * 0.15) return "Your pack is starting to get used.";
  if (used > 0) return "Your pack has a few things in it.";
  return null;
}
