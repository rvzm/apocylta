import { app_version } from "../../config.js";
import { formatCommandRow, formatRelativeTime } from "../format.js";
import { switchScreen } from "../router.js";

export const titleScreen = {
  keymap: {
    N: (state, ui) => {
      state.characterDraft = {
        name: "",
        difficultyId: null,
        starterPackId: null,
        raceId: null,
        classId: null,
        proficientSkillIds: [],
      };
      switchScreen(state, ui, "charName");
    },
    C: (state, ui) => {
      state.saveSlotsContext = { mode: "load", returnScreen: "title" };
      switchScreen(state, ui, "saveSlots");
    },
    E: (state, ui) => {
      ui.screen.destroy();
      process.exit(0);
    },
  },

  onEnter(state) {
    state.lastMessage = null;
  },

  render(state, ui) {
    // The version lives here rather than in the header, which gave up its
    // space to the player's name and level - and a title screen is where a
    // version belongs anyway.
    const bodyLines = [
      "APOCYLTA",
      "",
      `    post-apocalypse rpg, for your terminal.  v${app_version}`,
      "",
      "",
      "The land is harsh, but you can make your way well enough. Travel around, and gather, forage, mine, and fight for the materials you need to survive.",
      "",
      "You can also craft, trade, and gamble, and eventually become a legend.",
      "",
      "Press N to start a new game",
      "Press C to continue an existing one.",
      "",
      "Press E to exit."
    ];
    // main.js stamps the run before the first render, so `first_run` is
    // already set by now - `previousRun` is what distinguishes a genuine first
    // launch, since stampRun() returns the row as it was *before* stamping.
    const welcome = state.previousRun
      ? `Welcome back. You last played ${formatRelativeTime(state.previousRun)}.`
      : "Welcome to the wasteland. This is your first run.";
    bodyLines.push("", welcome);

    if (state.lastMessage) bodyLines.push("", `    ${state.lastMessage}`);
    ui.mainContent.setContent(bodyLines.join("\n"));

    ui.promptRow.setContent("What would you like to do?");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "New Game", hotkey: "N" },
          { label: "Continue", hotkey: "C" },
          { label: "Exit", hotkey: "E" },
        ],
        { columns: 3 }
      )
    );
  },
};
