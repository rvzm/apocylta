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

export function switchScreen(state, ui, name) {
  const outgoing = SCREENS[state.currentScreen];
  if (outgoing && outgoing.onExit) outgoing.onExit(state, ui);

  state.currentScreen = name;

  const incoming = SCREENS[name];
  if (incoming.onEnter) incoming.onEnter(state, ui);

  renderCurrentScreen(state, ui);
  ui.screen.render();
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
