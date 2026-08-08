import { STARTER_PACKS } from "../../item_backbone.js";
import { DIFFICULTY_LEVELS } from "../../player_backbone.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function buildRows() {
  const lines = [];
  const packIds = [];
  for (const [id, pack] of Object.entries(STARTER_PACKS)) {
    if (pack.ngp) continue; // not available on a fresh character
    lines.push(`  - ${pack.name}: ${pack.description}`);
    packIds.push(id);
  }
  return { lines, packIds };
}

function selectedPackId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const charStarterPackScreen = {
  keymap: {
    C: (state, ui) => {
      const id = selectedPackId(ui);
      if (!id) {
        state.lastMessage = "Select a starter pack first.";
        return;
      }
      state.characterDraft.starterPackId = id;
      switchScreen(state, ui, "charRace");
    },
    B: (state, ui) => switchScreen(state, ui, "charDifficulty"),
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
    const { lines, packIds } = buildRows();
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = packIds;

    const difficultyName = DIFFICULTY_LEVELS[state.characterDraft.difficultyId]?.name ?? "";
    ui.promptRow.setContent(
      state.lastMessage || `Name: ${state.characterDraft.name} | Difficulty: ${difficultyName} - choose your starter pack:`
    );
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
