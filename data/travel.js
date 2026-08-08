import { grantSkillXp, moveTo } from "../state/gameState.js";

export function beginTravel(state, exit) {
  state.currentTravel = {
    fromLocationId: state.currentLocationId,
    toLocationId: exit.to,
    category: exit.category,
    totalSeconds: exit.time,
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
  grantSkillXp(state, "speed", travel.totalSeconds);
  moveTo(state, travel.toLocationId);
  state.currentTravel = null;
  return true;
}
