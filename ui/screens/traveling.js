import { LOCATIONS } from "../../data/locations.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

const TRACK_WIDTH = 40;

export function buildTravelTrack(elapsedSeconds, progress, category) {
  const even = elapsedSeconds % 2 === 0;
  let trackChar;
  let marker;
  if (category === "airboat") {
    marker = even ? ">[@@@]->" : ">[@@@]-->";
    trackChar = "~";
  } else if (category === "teleport") {
    marker = even ? "0o0" : "o0o";
    trackChar = "*";
  } else if (category === "cave" || category === "in_cave") {
    // in_cave is the whole inside-the-cave network (10 of the 12 cave exits);
    // without it here those trips drew the surface road.
    marker = even ? "([o](" : ")[o])";
    trackChar = even ? "." : ",";
  } else {
    marker = even ? "+[]" : "[]+++";
    trackChar = "-";
  }

  // Clamped against the marker's own length, not a hardcoded 3 - the longer
  // markers used to write past the end of the array and return a track wider
  // than TRACK_WIDTH, stretching the row as a trip neared its destination.
  const lastStart = Math.max(0, TRACK_WIDTH - marker.length);
  const pos = Math.min(lastStart, Math.floor(progress * lastStart));

  const track = trackChar.repeat(TRACK_WIDTH).split("");
  for (let i = 0; i < marker.length; i++) track[pos + i] = marker[i];
  return track.join("");
}

export const travelingScreen = {
  keymap: {
    B: (state, ui) => {
      state.currentTravel = null;
      switchScreen(state, ui, "location");
    },
    M: (state, ui) => {
      state.menuOrigin = state.currentScreen;
      switchScreen(state, ui, "menu");
    },
  },

  render(state, ui) {
    // Travel ticks in the background regardless of active screen (same as
    // currentAction) - but unlike currentAction, it can complete itself
    // while the player is elsewhere (e.g. they pressed M mid-trip, it
    // finished while they were on the Menu screen, then Menu's ESCAPE sends
    // them back to menuOrigin="traveling"). Guard against rendering a
    // completed/null currentTravel instead of assuming it's still live.
    if (!state.currentTravel) {
      switchScreen(state, ui, "location");
      return;
    }

    const travel = state.currentTravel;
    const from = LOCATIONS[travel.fromLocationId]?.name ?? travel.fromLocationId;
    const to = LOCATIONS[travel.toLocationId]?.name ?? travel.toLocationId;
    const remaining = travel.totalSeconds - travel.elapsedSeconds;
    const progress = travel.elapsedSeconds / travel.totalSeconds;
    const track = buildTravelTrack(travel.elapsedSeconds, progress, travel.category);

    ui.mainContent.setContent(
      [`Leaving ${from}, heading to ${to}.`, "", `[${from}] ${track} [${to}]`, "", `    ${remaining}s remaining`].join("\n")
    );
    ui.promptRow.setContent("Traveling...");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Menu", hotkey: "M" },
        ],
        { columns: 2 }
      )
    );
  },
};
