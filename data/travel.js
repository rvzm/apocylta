import { grantSkillXp, moveTo, effectiveSkillLevel } from "../state/gameState.js";

// How much of a trip the speed skill shaves off. Deliberately gentle: level 1
// is the authored time exactly, and the floor lands around level 101, so a
// well-travelled character saves real seconds without the world collapsing in
// on itself.
//
// Math.ceil, not round, is what keeps the early game (and the timed integration
// tests, which drive a real game through tmux with a level 1-5 character) on
// the authored numbers - at those levels a 15s road is still 15s.
const TRAVEL_SPEED_PER_LEVEL = 0.004;
const MIN_TRAVEL_FACTOR = 0.6; // never better than 40% off

export function travelSecondsFor(state, baseSeconds) {
  const level = effectiveSkillLevel(state, "speed");
  const factor = Math.max(MIN_TRAVEL_FACTOR, 1 - (level - 1) * TRAVEL_SPEED_PER_LEVEL);
  return Math.max(1, Math.ceil(baseSeconds * factor));
}

export function beginTravel(state, exit) {
  state.currentTravel = {
    fromLocationId: state.currentLocationId,
    toLocationId: exit.to,
    category: exit.category,
    // Both, because they mean different things downstream: totalSeconds is how
    // long you actually walk (and what ui/screens/traveling.js counts down),
    // baseSeconds is what the route is worth - see the xp grant below.
    baseSeconds: exit.time,
    totalSeconds: travelSecondsFor(state, exit.time),
    elapsedSeconds: 0,
  };
}

// Called once per tick while state.currentTravel is set. Returns true the
// tick travel actually completes, so callers (mainly tests) can react -
// gameLoop.js's caller doesn't need the return value, it just re-checks
// state.currentTravel next tick.
export function tickTravel(state) {
  const travel = state.currentTravel;
  if (!travel) return false;
  travel.elapsedSeconds += 1;
  if (travel.elapsedSeconds < travel.totalSeconds) return false;
  // Paid on the route's authored length, NOT on the shortened one. Paying on
  // what you actually walked would make every level of speed cut the xp that
  // speed earns - a skill that taxes its own training, and one that gets harder
  // to level the better you are at it. A route is worth what the route is worth.
  grantSkillXp(state, "speed", travel.baseSeconds ?? travel.totalSeconds);
  moveTo(state, travel.toLocationId);
  state.currentTravel = null;
  return true;
}
