import { STATIONS } from "../../item_backbone.js";
import { getBuyPrice, canAfford, chargeGold } from "../../data/shops.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

const HOUSE_PRICE = 1000;

// Before owning a house, the only thing for sale is the house itself.
// Afterward, the list becomes every station the player hasn't bought yet -
// STATIONS entries have a `rarity` field just like ITEMS, so the existing
// rarity-based getBuyPrice formula applies unchanged.
function buildRows(state) {
  if (!state.house) {
    return { lines: [`  - House Deed - ${HOUSE_PRICE}gp`], rowIds: ["house"] };
  }

  const entries = Object.entries(STATIONS)
    .filter(([id]) => !state.ownedStations.has(id))
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  const lines = entries.map(([, station]) => `  - ${station.name} - ${getBuyPrice(station)}gp`);
  const rowIds = entries.map(([id]) => id);

  if (!lines.length) {
    lines.push("You already own every station.");
    rowIds.push(null);
  }

  return { lines, rowIds };
}

function selectedRowId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const shopHousingScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    P: (state, ui) => {
      const id = selectedRowId(ui);
      if (!id) {
        state.lastMessage = "Nothing to purchase.";
        return;
      }

      if (id === "house") {
        if (!canAfford(state, HOUSE_PRICE)) {
          state.lastMessage = `You can't afford a house (${HOUSE_PRICE}gp).`;
          return;
        }
        chargeGold(state, HOUSE_PRICE);
        state.house = true;
        state.lastMessage = "You bought a house! Head home to make use of your new stations.";
        return;
      }

      const station = STATIONS[id];
      const price = getBuyPrice(station);
      if (!canAfford(state, price)) {
        state.lastMessage = `You can't afford ${station.name} (${price}gp).`;
        return;
      }
      chargeGold(state, price);
      state.ownedStations.add(id);
      state.lastMessage = `Bought ${station.name} for your home.`;
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
    // Reset once on entry (not on later re-renders from Purchase itself) so
    // repeat purchases don't keep snapping the cursor back to row 0 - same
    // fix as stationCraft.js's Craft action.
    ui.inventoryList._resetSelection = true;
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const { lines, rowIds } = buildRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = rowIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }

    ui.promptRow.setContent(
      state.lastMessage ||
        (state.house ? `Buy a station for your home (gp: ${state.gold})` : `Buy a house (gp: ${state.gold})`)
    );
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Purchase", hotkey: "P" },
        ],
        { columns: 2 }
      )
    );
  },
};
