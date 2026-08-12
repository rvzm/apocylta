import { getEnemy } from "../../enemy_backbone.js";
import { currentEnemy, resolveRound, endCombat } from "../../data/combat.js";
import { formatCommandRow } from "../format.js";
import { switchScreen, pushScreen } from "../router.js";
import { logger } from "../../logger.js";

const BAR_WIDTH = 28;
const VISIBLE_LOG_LINES = 6;

export function formatEnemyBar(hp, hpMax, width = BAR_WIDTH) {
  const progress = hpMax > 0 ? Math.max(0, Math.min(1, hp / hpMax)) : 0;
  const filled = Math.max(0, Math.min(width, Math.round(progress * width)));
  return "#".repeat(filled) + "-".repeat(width - filled);
}

// A group is only ever a header - you fight its members one at a time, so
// without this the pack you're in would be invisible and the screen would just
// show a procession of seemingly unrelated enemies. Returns null for a lone
// enemy, which has no pack to name.
export function buildGroupHeader(combat) {
  const group = getEnemy(combat?.sourceId);
  if (!group?.members) return null;
  // combat.index runs past the end once the last member falls, so the position
  // counter only makes sense while someone is still standing.
  const position = currentEnemy(combat) ? `${combat.index + 1} of ${combat.enemies.length}` : "cleared";
  return `${group.name}  -  ${position}`;
}

// Rounds only advance on a keypress, so every action handler funnels through
// here: refuse input once the encounter has an outcome (the player is looking
// at the result and needs to press Continue), otherwise resolve one round and
// route out if that round ended the fight.
function takeTurn(state, ui, action) {
  const combat = state.currentCombat;
  if (!combat || combat.outcome) return;

  resolveRound(state, action);

  if (combat.outcome === "defeat") {
    switchScreen(state, ui, "defeat");
  }
}

function leaveCombat(state, ui) {
  const combat = state.currentCombat;
  if (!combat?.outcome) return;
  logger.info("combat", `Encounter ended: ${combat.outcome}.`);
  endCombat(state);
  switchScreen(state, ui, "location");
}

export const combatScreen = {
  keymap: {
    A: (state, ui) => takeTurn(state, ui, { type: "attack" }),
    F: (state, ui) => takeTurn(state, ui, { type: "flee" }),

    C: (state, ui) => {
      if (state.currentCombat?.outcome) return;
      state.combatSelectContext = { mode: "spell" };
      switchScreen(state, ui, "combatSelect");
    },
    P: (state, ui) => {
      if (state.currentCombat?.outcome) return;
      state.combatSelectContext = { mode: "potion" };
      switchScreen(state, ui, "combatSelect");
    },

    B: (state, ui) => pushScreen(state, ui, "backpack"),
    M: (state, ui) => pushScreen(state, ui, "menu"),

    // Only meaningful once the fight is decided - see the legend swap in render().
    X: (state, ui) => leaveCombat(state, ui),
  },

  render(state, ui) {
    // An encounter can end while the player is on another screen (they pressed
    // M mid-fight, then popped back off the Menu into the fight).
    // Same defensive re-route the traveling screen needs.
    if (!state.currentCombat) {
      switchScreen(state, ui, "location");
      return;
    }

    const combat = state.currentCombat;
    const enemy = currentEnemy(combat);

    const headerLines = [];
    const groupHeader = buildGroupHeader(combat);
    if (groupHeader) headerLines.push(groupHeader, "");

    if (enemy) {
      const def = getEnemy(enemy.id);
      const title = def?.desc ?? enemy.name;
      headerLines.push(`${title}    hp: ${enemy.hp}/${enemy.hpMax}`);
      headerLines.push(`[${formatEnemyBar(enemy.hp, enemy.hpMax)}]`);
    } else {
      headerLines.push("Nothing left standing.");
      headerLines.push(`[${formatEnemyBar(0, 1)}]`);
    }

    const log = combat.log.slice(-VISIBLE_LOG_LINES).map((line) => `    > ${line}`);

    ui.mainContent.setContent([...headerLines, "", `    round ${combat.round}`, "", ...log].join("\n"));

    const over = !!combat.outcome;
    ui.promptRow.setContent(
      combat.outcome === "victory"
        ? `You won. ${combat.defeated.length} down.`
        : combat.outcome === "fled"
          ? "You got away."
          : `Fighting ${enemy?.name ?? "..."}.`
    );

    ui.commandList.setContent(
      formatCommandRow(
        over
          ? [{ label: "Continue", hotkey: "X" }]
          : [
              { label: "Attack", hotkey: "A" },
              { label: "Cast", hotkey: "C" },
              { label: "Potion", hotkey: "P" },
              { label: "Flee", hotkey: "F" },
              { label: "Backpack", hotkey: "B" },
              { label: "Menu", hotkey: "M" },
            ],
        { columns: 3 }
      )
    );
  },
};
