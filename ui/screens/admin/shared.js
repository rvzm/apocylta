// ui/screens/admin/shared.js - the bits every Admin editor needs.
//
// These screens write state directly and bypass every gate the game has, so
// they're gated behind game_config.allow_admin and hidden from the Menu when
// it's off.
//
// Every admin screen draws into ui.inventoryList rather than ui.mainContent,
// even the ones that are really just a field list: ui/router.js has no UP/DOWN
// tokens (only ESCAPE/LEFT/RIGHT), so arrow keys reach nothing but the focused
// blessed widget. The list is what makes a moveable cursor possible at all.

import { game_config } from "../../../config.js";
import { switchScreen } from "../../router.js";

// config.js reads no env itself - the convention is process.env.X || config at
// the consumer (logger.js's DEBUG_LEVEL, db_backbone.js's DB_PATH). Resolved
// per call rather than cached, so flipping game_config at runtime takes effect
// immediately and tests can set the env var.
//
// ALLOW_ADMIN decides in BOTH directions when it's set: "true" opens the gate,
// anything else closes it, and only an unset (or empty) value falls through to
// the config flag. It used to be an OR against the config, which meant the env
// could only ever open the gate - so there was no way to pin it shut, and
// test/integration/admin.test.js's closed-gate case silently depended on
// config.js shipping allow_admin: false. Flipping that flag broke a test that
// had nothing to do with the flag's value.
export function adminEnabled() {
  const override = process.env.ALLOW_ADMIN;
  if (override !== undefined && override !== "") return override === "true";
  return game_config.allow_admin === true;
}

// Belt-and-braces for every admin screen's onEnter: if the gate closed while
// state.currentScreen still points here, leave rather than render an editor.
// Returns true when the screen bounced.
export function requireAdmin(state, ui) {
  if (adminEnabled()) return false;
  switchScreen(state, ui, "menu");
  return true;
}

// The screen-agnostic list plumbing lives in ui/listScreen.js now that the
// Settings screen shares it; re-exported here so the eight admin editors keep
// importing everything they need from one place.
export { enterList, exitList, selectedId, rowBuilder, paint } from "../../listScreen.js";

// ---------------------------------------------------------------- stepping

const STEPS = [1, 10, 100];

export function stepFor(ui) {
  return ui.inventoryList._adminStep ?? 1;
}

export function resetStep(ui) {
  ui.inventoryList._adminStep = 1;
}

// The 1/2/3 -> 1/10/100 handlers, spread into a screen's keymap.
export function stepKeys() {
  return Object.fromEntries(STEPS.map((size, i) => [String(i + 1), (state, ui) => (ui.inventoryList._adminStep = size)]));
}

// Clamped stepping. `max` is optional, so an unbounded field (gold, xp) just
// floors at `min`.
export function adjust(value, delta, { min = 0, max = Infinity } = {}) {
  const next = (Number.isFinite(value) ? value : 0) + delta;
  return Math.max(min, Math.min(max, next));
}

// ---------------------------------------------------------------- rendering

// "  Max Health        [    100 ]  / 100". No selection marker - the row the
// cursor is on is drawn inverse by the list widget itself.
export function fieldRow(label, value, { suffix = "", width = 20 } = {}) {
  return `  ${label.padEnd(width)}[${String(value).padStart(8)} ]${suffix ? `  ${suffix}` : ""}`;
}

export function stepFooter(ui) {
  return `step: ${stepFor(ui)}`;
}

// Shared legend tail, so the controls read the same on every screen.
export const STEP_COMMANDS = [
  { label: "Adjust", hotkey: "+-" },
  { label: "Step 1/10/100", hotkey: "123" },
];

// A compact stand-in for tabs.js's formatTabStrip. The admin screens tab over
// 15 item types / 13 equipment slots, and the full strip is ~120 characters -
// it wraps the border label onto a second line, which silently eats the first
// row of the list underneath it.
export function compactTabLabel(tabs, index) {
  return ` ${tabs[index]}  (${index + 1}/${tabs.length})  <> `;
}

