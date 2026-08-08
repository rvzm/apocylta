// state/clock.js - the day-wrapping clock maths, in one place.
//
// Imports nothing on purpose. state/gameState.js carried two identical copies
// of the modulo below (formatClock and isLocationOpen), and data/flavor.js
// needs a third - but flavor.js can't import gameState, because gameState
// imports data/locations.js and locations.js imports flavor.js. This leaf
// breaks that without duplicating the arithmetic again.

export const MINUTES_PER_DAY = 24 * 60;

// Double modulo so a negative totalMinutes still lands inside the day.
export function minutesIntoDay(state) {
  return ((state.clock.totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function hourOfDay(state) {
  return Math.floor(minutesIntoDay(state) / 60);
}

// Which day the run is on - flavour hashes off it so weather drifts across
// days rather than repeating every 24h.
export function dayNumber(state) {
  return Math.floor(state.clock.totalMinutes / MINUTES_PER_DAY);
}

// No openHours means always open. open/close wrap past midnight when
// close < open (e.g. an 11pm-6am shop). Lives here rather than in gameState so
// data/flavor.js's openLine can describe the same rule in prose without
// importing gameState - see the header above.
export function isOpenAt(hours, state) {
  if (!hours) return true;
  const hour = hourOfDay(state);
  return hours.open <= hours.close
    ? hour >= hours.open && hour < hours.close
    : hour >= hours.open || hour < hours.close;
}
