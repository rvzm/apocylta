// Where "back" goes.
//
// This used to be three single-slot fields - menuOrigin, returnScreen and
// toolbeltOrigin - which cannot represent a path through the screen graph's
// cycles. Going action -> backpack -> menu -> backpack overwrote the slot that
// held "action" and left you cycling between the Menu and the Backpack with a
// gather still running behind them. These pin the stack that replaced them.
//
// Driven against stub screens with a stub ui: the router only ever calls
// onExit/onEnter/render and ui.screen.render(), so nothing here needs blessed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerScreen, switchScreen, pushScreen, popScreen } from "../../ui/router.js";
import { createInitialState } from "../../state/gameState.js";

// Enough of a ui for renderCurrentScreen: renderChrome and applySubHeader both
// touch widgets, so the stubs have to absorb whatever they set.
function stubUi() {
  const widget = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === "selected") return 0;
        if (prop in target) return target[prop];
        return () => widget;
      },
      set: (target, prop, value) => ((target[prop] = value), true),
    }
  );
  return new Proxy(
    { screen: { render() {}, width: 120, height: 40 } },
    {
      get: (target, prop) => (prop in target ? target[prop] : widget),
    }
  );
}

// Minimal screens named after the real ones this change is about.
for (const name of ["location", "action", "backpack", "menu", "toolbelt", "pouch"]) {
  registerScreen(name, { render() {} });
}

// A real state, because renderCurrentScreen draws the shared chrome and that
// reads hp, the clock, the current location and the rest of it.
function fresh(at = "location") {
  const state = createInitialState();
  state.currentScreen = at;
  state.screenStack = [];
  return state;
}

test("pushScreen() then popScreen() returns to the pusher", () => {
  const state = fresh("action");
  const ui = stubUi();

  pushScreen(state, ui, "toolbelt");
  assert.equal(state.currentScreen, "toolbelt");
  assert.deepEqual(state.screenStack, ["action"]);

  popScreen(state, ui, "location");
  assert.equal(state.currentScreen, "action", "the reported bug: [J] then ESC must come home");
  assert.deepEqual(state.screenStack, []);
});

test("nested pushes unwind in order", () => {
  const state = fresh("action");
  const ui = stubUi();

  pushScreen(state, ui, "toolbelt");
  pushScreen(state, ui, "pouch");
  assert.deepEqual(state.screenStack, ["action", "toolbelt"]);

  popScreen(state, ui, "toolbelt");
  assert.equal(state.currentScreen, "toolbelt");
  popScreen(state, ui, "location");
  assert.equal(state.currentScreen, "action");
});

// The three-hop detour that the old single slot could not survive.
test("a cycle through the Menu still finds its way home", () => {
  const state = fresh("action");
  const ui = stubUi();

  pushScreen(state, ui, "backpack"); // action -> backpack
  pushScreen(state, ui, "menu"); //    backpack -> menu
  pushScreen(state, ui, "backpack"); // menu -> backpack again

  assert.deepEqual(state.screenStack, ["action", "backpack", "menu"]);
  popScreen(state, ui, "location");
  assert.equal(state.currentScreen, "menu");
  popScreen(state, ui, "location");
  assert.equal(state.currentScreen, "backpack");
  popScreen(state, ui, "location");
  assert.equal(state.currentScreen, "action", "and the gather is still there");
});

test("popScreen() takes the fallback when there's no trail", () => {
  const state = fresh("toolbelt");
  const ui = stubUi();
  popScreen(state, ui, "location");
  assert.equal(state.currentScreen, "location");
  assert.deepEqual(state.screenStack, []);
});

// A hard navigation - an ambush, travel completing, dying - must not leave a
// breadcrumb that a later pop would follow back into a screen you were pulled
// out of.
test("switchScreen() clears the trail", () => {
  const state = fresh("action");
  const ui = stubUi();

  pushScreen(state, ui, "backpack");
  assert.deepEqual(state.screenStack, ["action"]);

  switchScreen(state, ui, "location"); // as the game loop does on an ambush
  assert.deepEqual(state.screenStack, [], "an interruption forgets where you were");

  popScreen(state, ui, "location");
  assert.equal(state.currentScreen, "location", "so back means the fallback, not the interrupted screen");
});

test("pushing the screen you're already on leaves no useless breadcrumb", () => {
  const state = fresh("menu");
  const ui = stubUi();
  pushScreen(state, ui, "menu");
  assert.deepEqual(state.screenStack, [], "otherwise back would mean 'stay here'");
});

test("the trail is capped, so a push cycle can't grow without bound", () => {
  const state = fresh("location");
  const ui = stubUi();
  for (let i = 0; i < 100; i++) {
    pushScreen(state, ui, i % 2 === 0 ? "menu" : "backpack");
  }
  assert.ok(state.screenStack.length <= 12, `expected a capped trail, got ${state.screenStack.length}`);
});

test("a state with no screenStack at all is tolerated", () => {
  // Loaded saves and older state objects predate the field.
  const state = createInitialState();
  state.currentScreen = "toolbelt";
  delete state.screenStack;
  const ui = stubUi();
  popScreen(state, ui, "location");
  assert.equal(state.currentScreen, "location");
});
