import { RACES } from "../../player_backbone.js";
import { STARTER_PACKS } from "../../item_backbone.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function buildRows() {
  const lines = [];
  const raceIds = [];
  for (const [id, race] of Object.entries(RACES)) {
    lines.push(`  - ${race.name}: ${race.desc}`);
    raceIds.push(id);
  }
  return { lines, raceIds };
}

function selectedRaceId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const charRaceScreen = {
  keymap: {
    C: (state, ui) => {
      const id = selectedRaceId(ui);
      if (!id) {
        state.lastMessage = "Select a race first.";
        return;
      }
      state.characterDraft.raceId = id;
      switchScreen(state, ui, "charClass");
    },
    B: (state, ui) => switchScreen(state, ui, "charStarterPack"),
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.mainContent.hide();
    ui.inventoryList.select(0);
    ui.inventoryList.show();
    ui.inventoryList.focus();
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const { lines, raceIds } = buildRows();
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = raceIds;

    const packName = STARTER_PACKS[state.characterDraft.starterPackId]?.name ?? "";
    ui.promptRow.setContent(state.lastMessage || `Name: ${state.characterDraft.name} | Pack: ${packName} - choose your race:`);
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Confirm", hotkey: "C" },
          { label: "Back", hotkey: "B" },
        ],
        { columns: 2 }
      )
    );
  },
};
