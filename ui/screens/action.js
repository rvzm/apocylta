import { getCurrentLocation } from "../../state/gameState.js";
import { getAction } from "../../data/actions.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import { logger } from "../../logger.js";

export const actionScreen = {
  keymap: {
    S: (state, ui) => {
      logger.info("action", `Stopped action ${state.currentAction.id}.`);
      state.currentAction = null;
      switchScreen(state, ui, "location");
    },
    B: (state, ui) => {
      state.returnScreen = "action";
      switchScreen(state, ui, "backpack");
    },
    J: (state, ui) => { state.toolbeltOrigin = state.currentScreen; switchScreen(state, ui, "toolbelt"); },
    M: (state, ui) => { state.menuOrigin = state.currentScreen; switchScreen(state, ui, "menu"); },
  },

  render(state, ui) {
    const location = getCurrentLocation(state);
    const action = getAction(state.currentAction.id);
    const elapsed = state.currentAction.elapsedSeconds;

    const gatheredEntries = Object.entries(state.currentAction.gatheredThisSession);
    const gatheredLine = gatheredEntries.length
      ? "    gathered: " +
        gatheredEntries.map(([itemId, qty]) => `[${qty}] ${ALL_ITEMS[itemId]?.name ?? itemId}`).join(" | ")
      : "    gathered: (nothing yet)";

    const bodyLines = [
      `${location.description} | elapsed: ${elapsed}s`,
      "",
      `    ${action.verbFlavor(location.name)}`,
      "",
      "",
      "",
      gatheredLine,
    ];
    ui.mainContent.setContent(bodyLines.join("\n"));

    ui.promptRow.setContent("You are doing things.");

    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Stop action", hotkey: "S" },
          { label: "Backpack", hotkey: "B" },
          { label: "Toolbelt", hotkey: "J" },
          { label: "Menu", hotkey: "M" },
        ],
        { columns: 2 }
      )
    );
  },
};
