import { getCurrentLocation, moveTo } from "../../state/gameState.js";
import { LOCATIONS } from "../../data/locations.js";
import { beginTravel } from "../../data/travel.js";
import { formatCommandRow, formatLocationGrid } from "../format.js";
import { switchScreen } from "../router.js";

// Same shop-then-everything-else ordering renderBody() displays, so the
// numbers a player sees always match what a digit press actually travels
// to. Shops are pulled to the front; every other exit (path, airboat, or
// any future category) keeps its original declared order.
//
// Exported so integration tests can derive "which digit goes where" from the
// same function the UI uses, instead of hardcoding positions - reordering a
// location's exits has silently broken those tests twice now.
export function orderedExits(location) {
  return [...location.exits.filter((exit) => exit.category === "shop"), ...location.exits.filter((exit) => exit.category !== "shop")];
}

// One column per exit, showing the destinations reachable one hop further -
// lets the player preview a second hop before committing to the first.
function previewColumns(exits) {
  return exits.map((exit) => {
    const destination = LOCATIONS[exit.to];
    const rows = destination
      ? destination.exits.map((subExit) => LOCATIONS[subExit.to]?.name ?? subExit.label)
      : [];
    return { header: exit.label, rows };
  });
}

// The digit each exit sits on, in order. "0" is the TENTH exit, not a zeroth:
// town_square crossed nine the moment it gained a magic shop, which silently
// made its portal room - the teleport hub - unreachable, since renderBody only
// ever numbered exits the keymap could also bind.
//
// Exported so a test can assert no location has more exits than there are keys
// to reach them with.
export const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

function renderBody(state, ui) {
  const location = getCurrentLocation(state);
  const exits = orderedExits(location);

  const grid = formatLocationGrid(previewColumns(exits), { screenWidth: ui.screen.width });
  ui.mainContent.setContent(`Travel from ${location.name}\n\n${grid}`);
  ui.promptRow.setContent(state.lastMessage || "Where would you like to go?");

  // Same DIGITS list the keymap binds, so a rendered number always presses.
  const commands = exits
    .filter((_, i) => i < DIGITS.length)
    .map((exit, i) => ({ label: exit.label, hotkey: DIGITS[i] }));
  commands.push({ label: "Back", hotkey: "B" });
  ui.commandList.setContent(formatCommandRow(commands));
}

// Built once; each handler re-resolves the current location's exits at call
// time (same pattern as location.js's numbered actions) rather than being
// tied to a fixed destination - an unbound digit (fewer exits than digits
// here) is simply a no-op.
const keymap = {
  B: (state, ui) => switchScreen(state, ui, "location"),
};
DIGITS.forEach((digit, index) => {
  keymap[digit] = (state, ui) => {
    const exit = orderedExits(getCurrentLocation(state))[index];
    if (!exit) return;
    // A handful of location exits point at ids that aren't defined in
    // LOCATIONS yet (unfinished world data) - guard here rather than let
    // the location screen crash on an undefined location after arriving.
    if (!LOCATIONS[exit.to]) {
      state.lastMessage = "That destination isn't ready yet.";
      return;
    }
    if (!exit.time) {
      moveTo(state, exit.to);
      switchScreen(state, ui, "location");
      return;
    }
    beginTravel(state, exit);
    switchScreen(state, ui, "traveling");
  };
});

export const travelScreen = {
  keymap,

  onEnter(state) {
    state.lastMessage = null;
  },

  render(state, ui) {
    renderBody(state, ui);
  },
};
