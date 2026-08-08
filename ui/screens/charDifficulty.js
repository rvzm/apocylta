import { DIFFICULTY_LEVELS } from "../../player_backbone.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function buildRows() {
  const lines = [];
  const difficultyIds = [];
  for (const [id, tier] of Object.entries(DIFFICULTY_LEVELS)) {
    lines.push(`  - ${tier.name}: ${tier.desc}`);
    difficultyIds.push(id);
  }
  return { lines, difficultyIds };
}

function selectedDifficultyId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const charDifficultyScreen = {
  keymap: {
    C: (state, ui) => {
      const id = selectedDifficultyId(ui);
      if (!id) {
        state.lastMessage = "Select a difficulty first.";
        return;
      }
      state.characterDraft.difficultyId = id;
      switchScreen(state, ui, "charStarterPack");
    },
    B: (state, ui) => switchScreen(state, ui, "charName"),
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
    const { lines, difficultyIds } = buildRows();
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = difficultyIds;
    // select() must run after setItems() - blessed's list resets the
    // selection index when items are (re)populated, so calling this in
    // onEnter (which always runs before render/setItems) is a no-op.
    ui.inventoryList.select(Math.max(0, difficultyIds.indexOf("normal")));

    ui.promptRow.setContent(state.lastMessage || `Name: ${state.characterDraft.name} - choose your difficulty:`);
    ui.commandList.setContent(
      formatCommandRow([{ label: "Confirm", hotkey: "C" }, { label: "Back", hotkey: "B" }], { columns: 2 })
    );
  },
};
