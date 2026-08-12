import { renderChrome } from "./layout.js";
import { resolveSubHeader, applySubHeader } from "./subHeader.js";

const SCREENS = {};

export function registerScreen(name, screen) {
  SCREENS[name] = screen;
}

export function getScreen(name) {
  return SCREENS[name];
}

export function renderCurrentScreen(state, ui) {
  renderChrome(state, ui);
  const screen = SCREENS[state.currentScreen];
  // Before the screen renders, so a list sizes itself to the height it will
  // actually have. Screens declare `subHeader` and the bar takes care of
  // itself - see ui/subHeader.js.
  applySubHeader(ui, resolveSubHeader(screen, state));
  if (screen) screen.render(state, ui);
}

function enterScreen(state, ui, name) {
  const outgoing = SCREENS[state.currentScreen];
  if (outgoing && outgoing.onExit) outgoing.onExit(state, ui);

  state.currentScreen = name;

  const incoming = SCREENS[name];
  if (incoming.onEnter) incoming.onEnter(state, ui);

  renderCurrentScreen(state, ui);
  ui.screen.render();
}

// --- where "back" goes ------------------------------------------------------
//
// The screen graph has cycles - the Menu opens the Backpack and the Backpack
// opens the Menu - so "where did I come from" cannot be one field per screen.
// It used to be three of them (menuOrigin, returnScreen, toolbeltOrigin), each
// a single slot, and a two-hop detour overwrote the one that mattered: going
// action -> backpack -> menu -> backpack left you cycling between the Menu and
// the Backpack with no way back to the gather you had running.
//
// A stack is the thing that actually represents a path. pushScreen goes deeper
// and remembers; popScreen comes back.
const MAX_DEPTH = 12;

// A hard navigation - an ambush interrupting a gather, travel completing, dying
// - CLEARS the trail. That is the rule that keeps a pop honest: you can only
// ever come back to somewhere you deliberately stepped through, never to a
// screen you were on before something happened to you. push/pop go through
// enterScreen directly so they keep the trail they are maintaining.
export function switchScreen(state, ui, name) {
  state.screenStack = [];
  enterScreen(state, ui, name);
}

export function pushScreen(state, ui, name) {
  // Re-entering the screen you are already on would leave a useless breadcrumb
  // that a later pop reads as "go where you already are".
  if (state.currentScreen !== name) {
    state.screenStack = [...(state.screenStack ?? []), state.currentScreen].slice(-MAX_DEPTH);
  }
  enterScreen(state, ui, name);
}

// `fallback` is where an empty trail leads - the screen this one belongs under
// when you arrived some other way. Every caller passes the sensible one rather
// than relying on the default, since "location" is wrong for a sub-screen of
// the Toolbelt.
export function popScreen(state, ui, fallback = "location") {
  const stack = state.screenStack ?? [];
  const back = stack.length ? stack[stack.length - 1] : fallback;
  state.screenStack = stack.slice(0, -1);
  enterScreen(state, ui, back);
}

// Registered once at bootstrap on screen.on('keypress', ...). Ignored while
// an input widget has grabbed keys (e.g. the travel screen's textbox), since
// blessed doesn't emit screen-level keypress events during grabKeys.
const KEY_NAME_TOKENS = { escape: "ESCAPE", left: "LEFT", right: "RIGHT" };

export function handleKey(state, ui, ch, key) {
  const current = SCREENS[state.currentScreen];
  if (!current || !current.keymap) return;

  const letter = key && KEY_NAME_TOKENS[key.name] ? KEY_NAME_TOKENS[key.name] : (ch || "").toUpperCase();
  const handler = current.keymap[letter];
  if (handler) {
    handler(state, ui);
    renderCurrentScreen(state, ui);
    ui.screen.render();
  }
}
