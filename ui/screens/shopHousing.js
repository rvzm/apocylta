import { STATIONS, PROPERTY } from "../../item_backbone.js";
import { getBuyPrice, canAfford, chargeGold } from "../../data/shops.js";
import { indoorTimeLine } from "../../data/flavor.js";
import { formatCommandRow } from "../format.js";
import { formatBase, formatCurrency } from "../../currency_backbone.js";
import { switchScreen } from "../router.js";

// Before owning a house, the only thing for sale is the house itself.
// Afterward, the list becomes every station the player hasn't bought yet.
//
// Both the deed and the stations are catalog entries carrying their own
// `value`, so both price through getBuyPrice - the deed used to be a bare
// `const HOUSE_PRICE = 1000` here, the one priced good defined outside
// item_backbone.js.
const HOUSE_DEED = PROPERTY.house_deed;

function buildRows(state) {
  if (!state.house) {
    return {
      lines: [`  - ${HOUSE_DEED.name} - ${formatBase(getBuyPrice(HOUSE_DEED), { short: true })}`],
      rowIds: ["house"],
    };
  }

  const entries = Object.entries(STATIONS)
    .filter(([id]) => !state.ownedStations.has(id))
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  const lines = entries.map(([, station]) => `  - ${station.name} - ${formatBase(getBuyPrice(station), { short: true })}`);
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
  subHeader: [
    "Deeds in a filing cabinet, most of them for places that no longer stand.",
    "The clerk has been here a long time and has stopped pretending to be pleased about it.",
    "A wall map marks the plots still standing. There aren't many left unmarked.",
    indoorTimeLine,
  ],

  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    P: (state, ui) => {
      const id = selectedRowId(ui);
      if (!id) {
        state.lastMessage = "Nothing to purchase.";
        return;
      }

      if (id === "house") {
        const housePrice = getBuyPrice(HOUSE_DEED);
        if (!canAfford(state, housePrice)) {
          state.lastMessage = `You can't afford a house (${formatBase(housePrice, { short: true })}).`;
          return;
        }
        chargeGold(state, housePrice);
        state.house = true;
        state.lastMessage = "You bought a house! Head home to make use of your new stations.";
        return;
      }

      const station = STATIONS[id];
      const price = getBuyPrice(station);
      if (!canAfford(state, price)) {
        state.lastMessage = `You can't afford ${station.name} (${formatBase(price, { short: true })}).`;
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
        (state.house
          ? `Buy a station for your home (${formatCurrency(state.cur, { short: true })})`
          : `Buy a house (${formatCurrency(state.cur, { short: true })})`)
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
