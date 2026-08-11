import fs from "fs";
import { endCombat } from "../../data/combat.js";
import { deleteSave } from "../../state/persistence.js";
import { AUTOSAVE_PATH } from "../../state/autosave.js";
import { createInitialState } from "../../state/gameState.js";
import { player_config } from "../../config.js";
import { LOCATIONS } from "../../data/locations.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import { formatBase } from "../../currency_backbone.js";
import { logger } from "../../logger.js";

// Permadeath is destructive and irreversible, so it happens here rather than
// in data/combat.js: this screen is already the thing the player is looking at
// when it lands, and keeping the deletion out of the engine means the engine
// never imports state/persistence.js (and with it db_backbone.js, which opens
// the SQLite file at import time - see the test-isolation note in CLAUDE.md).
function wipeRun(state) {
  if (state.saveSlotId != null) {
    try {
      deleteSave(state.saveSlotId);
      logger.info("defeat", `Permadeath: deleted slot ${state.saveSlotId}.`);
    } catch (err) {
      logger.error("defeat", `Permadeath: could not delete slot ${state.saveSlotId}: ${err.message}`);
    }
  }
  try {
    if (fs.existsSync(AUTOSAVE_PATH)) fs.unlinkSync(AUTOSAVE_PATH);
  } catch (err) {
    logger.error("defeat", `Permadeath: could not delete the autosave: ${err.message}`);
  }
}

export const defeatScreen = {
  keymap: {
    X: (state, ui) => {
      const permadeath = state.lastDefeat?.permadeath;
      endCombat(state);
      state.lastDefeat = null;

      if (!permadeath) {
        switchScreen(state, ui, "location");
        return;
      }

      wipeRun(state);
      // Nothing of this character survives, so reset to a blank slate before
      // the title screen - otherwise Continue would still show their stats.
      Object.assign(state, createInitialState());
      switchScreen(state, ui, "title");
    },
  },

  render(state, ui) {
    const summary = state.lastDefeat ?? { permadeath: false, itemsLost: 0, goldLost: 0 };
    const wakeAt = LOCATIONS[player_config.startingLocation]?.name ?? player_config.startingLocation;

    const bodyLines = summary.permadeath
      ? [
          "You are dead.",
          "",
          `    ${state.name ?? "You"} fell on ${state.difficulty} difficulty. There is no waking up from that.`,
          "",
          `    Everything is gone: ${summary.itemsLost} items, ${formatBase(summary.goldLost, { short: true })}, and the save itself.`,
          "",
          "    Press X to return to the title screen.",
        ]
      : [
          "Everything goes dark.",
          "",
          `    You come to back at the ${wakeAt}, stripped of everything you carried.`,
          "",
          `    Lost: ${summary.itemsLost} items and ${formatBase(summary.goldLost, { short: true })}.`,
          `    Kept: whatever you had equipped, your skills, and your levels.`,
          "",
          `    You've been handed the basics again: a belt and a wooden dagger.`,
        ];

    ui.mainContent.setContent(bodyLines.join("\n"));
    ui.promptRow.setContent(summary.permadeath ? "This run is over." : "You survived. Barely.");
    ui.commandList.setContent(formatCommandRow([{ label: "Continue", hotkey: "X" }], { columns: 1 }));
  },
};
