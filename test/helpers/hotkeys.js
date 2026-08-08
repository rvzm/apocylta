// test/helpers/hotkeys.js - resolves the digit hotkeys the travel and location
// screens assign positionally.
//
// Both screens number their entries by array position, so reordering a
// location's exits or interactiveActions silently shifts every digit after it.
// Hardcoding those numbers has broken the travel integration test twice, so
// these derive them from the very functions the screens use - which also means
// a destination or action that stops existing fails loudly and specifically,
// rather than as a mystery timeout on the wrong screen.
import assert from "node:assert/strict";
import { orderedExits } from "../../ui/screens/travel.js";
import { validActionsAt } from "../../ui/screens/location.js";
import { LOCATIONS } from "../../data/locations.js";

function digitOf(index, what, where) {
  assert.ok(index >= 0, `${where} has no ${what}`);
  assert.ok(index < 9, `${what} is past the 9 digit hotkeys at ${where}`);
  return String(index + 1);
}

// The digit that travels from `locationId` to `destinationId`.
export function travelDigit(locationId, destinationId) {
  const location = LOCATIONS[locationId];
  assert.ok(location, `no such location: ${locationId}`);
  const index = orderedExits(location).findIndex((exit) => exit.to === destinationId);
  return digitOf(index, `an exit to ${destinationId}`, locationId);
}

// The digit that starts `actionId` at `locationId`.
export function actionDigit(locationId, actionId) {
  const location = LOCATIONS[locationId];
  assert.ok(location, `no such location: ${locationId}`);
  const index = validActionsAt(location).findIndex((action) => action.id === actionId);
  return digitOf(index, `the ${actionId} action`, locationId);
}
