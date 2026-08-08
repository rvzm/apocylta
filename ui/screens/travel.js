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

function renderBody(state, ui) {
  const location = getCurrentLocation(state);
  const exits = orderedExits(location);

  const grid = formatLocationGrid(previewColumns(exits), { screenWidth: ui.screen.width });
  ui.mainContent.setContent(`Travel from ${location.name}\n\n${grid}`);
  ui.promptRow.setContent(state.lastMessage || "Where would you like to go?");

  const commands = exits.map((exit, i) => ({ label: exit.label, hotkey: String(i + 1) }));
  commands.push({ label: "Back", hotkey: "B" });
  ui.commandList.setContent(formatCommandRow(commands));
}

// Built once; each handler re-resolves the current location's exits at call
// time (same pattern as location.js's numbered actions) rather than being
// tied to a fixed destination - an unbound digit (fewer than 9 exits here)
// is simply a no-op.
const keymap = {
  B: (state, ui) => switchScreen(state, ui, "location"),
};
for (let n = 1; n <= 9; n++) {
  keymap[String(n)] = (state, ui) => {
    const exit = orderedExits(getCurrentLocation(state))[n - 1];
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
}

export const travelScreen = {
  keymap,

  onEnter(state) {
    state.lastMessage = null;
  },

  render(state, ui) {
    renderBody(state, ui);
  },
};
