import { getCurrentLocation } from "../../state/gameState.js";
import { getAction } from "../../data/actions.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { gatherTimeFor } from "../../player_backbone.js";
import { formatCommandRow } from "../format.js";
import { switchScreen, pushScreen } from "../router.js";
import { logger } from "../../logger.js";

// Rows reserved for the attempt log. The loop keeps a couple more than this;
// showing four fits the space the pane already had blank.
const ATTEMPT_ROWS = 4;

export const actionScreen = {
  keymap: {
    S: (state, ui) => {
      logger.info("action", `Stopped action ${state.currentAction.id}.`);
      state.currentAction = null;
      switchScreen(state, ui, "location");
    },
    // All three go DEEPER - the gather keeps running behind them, so every one
    // has to come back here. [J] used to write a `toolbeltOrigin` that nothing
    // read, which is how the Toolbelt ended up returning you to the location
    // screen with a gather still ticking.
    B: (state, ui) => pushScreen(state, ui, "backpack"),
    J: (state, ui) => pushScreen(state, ui, "toolbelt"),
    M: (state, ui) => pushScreen(state, ui, "menu"),
  },

  render(state, ui) {
    // The game loop can end the action out from under this screen - running out
    // of bait while fishing does exactly that - so re-route rather than reading
    // an id off null, the same defence traveling.js and combat.js carry.
    if (!state.currentAction) {
      switchScreen(state, ui, "location");
      return;
    }

    const location = getCurrentLocation(state);
    const action = getAction(state.currentAction.id);
    const elapsed = state.currentAction.elapsedSeconds;

    const gatheredEntries = Object.entries(state.currentAction.gatheredThisSession);
    const gatheredLine = gatheredEntries.length
      ? "    gathered: " +
        gatheredEntries.map(([itemId, qty]) => `[${qty}] ${ALL_ITEMS[itemId]?.name ?? itemId}`).join(" | ")
      : "    gathered: (nothing yet)";

    // The last few attempts, newest at the bottom. Padded to a fixed height so
    // the gathered line below doesn't walk up the pane as the log fills.
    const attempts = (state.currentAction.attempts ?? []).slice(-ATTEMPT_ROWS);
    const attemptLines = [
      ...attempts.map((line) => `    ${line}`),
      ...Array(Math.max(0, ATTEMPT_ROWS - attempts.length)).fill(""),
    ];

    // Attempts are seconds apart now (10 on normal, 30 on nightmare), so
    // without this the screen looks hung between them.
    const interval = gatherTimeFor(state.difficulty);
    const nextIn = interval - (elapsed % interval);

    const bodyLines = [
      `${location.description} | elapsed: ${elapsed}s`,
      "",
      `    ${action.verbFlavor(location.name)}`,
      "",
      ...attemptLines,
      `    next attempt in ${nextIn}s`,
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
