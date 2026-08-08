import { ALL_ITEMS } from "../../item_backbone.js";
import { mineableOres, canMineOre } from "../../data/mining.js";
import { beginAction } from "../../data/actions.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import { logger } from "../../logger.js";

function buildOreRows(state) {
  // The local mine's MINE_LOCK tier decides what's down here - see
  // data/mining.js. Passing no location would list the whole catalog.
  const ores = mineableOres(state.currentLocationId);
  const lines = ores.map(
    ({ item, requiredLevel }) => `  - ${item.name} (requires mining lvl ${requiredLevel ?? "?"})`
  );
  const oreIds = ores.map(({ id }) => id);

  if (!lines.length) {
    lines.push("Nothing to mine here.");
    oreIds.push(null);
  }

  return { lines, oreIds };
}

function selectedOreId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const mineSelectScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    C: (state, ui) => {
      const oreId = selectedOreId(ui);
      if (!oreId) {
        state.lastMessage = "Select an ore first.";
        return;
      }
      const { ok, reason } = canMineOre(state, oreId);
      if (!ok) {
        state.lastMessage = reason;
        return;
      }
      // Just the chosen ore - coal and gemstones come from data/mining.js's
      // rollMineBonuses() instead, so they add to the haul rather than
      // outweighing it (fuel used to win two thirds of every roll).
      beginAction(state, "mine", { lootSubtype: ALL_ITEMS[oreId].subtype });
      logger.info("mineSelect", `Started mining ${oreId}.`);
      switchScreen(state, ui, "action");
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const { lines, oreIds } = buildOreRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = oreIds;
    ui.inventoryList.select(0);

    ui.promptRow.setContent(state.lastMessage || "Which ore would you like to mine?");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Choose", hotkey: "C" },
        ],
        { columns: 2 }
      )
    );
  },
};
