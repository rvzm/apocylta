import { STATIONS } from "../../item_backbone.js";
import { getStationRecipes, stationIdsAtLocation } from "../../data/stations.js";
import { getCurrentLocation } from "../../state/gameState.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function buildStationRows(state) {
  const location = getCurrentLocation(state);
  const stationIds = stationIdsAtLocation(state, location);
  const lines = stationIds.map((id) => `  - ${STATIONS[id].name}`);

  if (!lines.length) {
    lines.push("No stations here.");
    stationIds.push(null);
  }

  return { lines, stationIds };
}

function selectedStationId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const stationSelectScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    C: (state, ui) => {
      const stationId = selectedStationId(ui);
      if (!stationId) {
        state.lastMessage = "Select a station first.";
        return;
      }
      const station = getStationRecipes(stationId);
      state.stationContext = { stationId, skill: station?.skill ?? null, recipes: station?.recipes ?? {} };
      switchScreen(state, ui, "stationCraft");
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
    const { lines, stationIds } = buildStationRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = stationIds;
    // setItems() carries the previous screen's selected index forward when
    // the item counts differ (it doesn't reset to 0) - force it explicitly.
    ui.inventoryList.select(0);

    ui.promptRow.setContent(state.lastMessage || "Which station would you like to use?");
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
