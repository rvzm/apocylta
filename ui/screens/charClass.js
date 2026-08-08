import { RACES, CLASSES } from "../../player_backbone.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function buildRows() {
  const lines = [];
  const classIds = [];
  for (const [id, cls] of Object.entries(CLASSES)) {
    lines.push(`  - ${cls.name}: ${cls.desc}`);
    classIds.push(id);
  }
  return { lines, classIds };
}

function selectedClassId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const charClassScreen = {
  keymap: {
    C: (state, ui) => {
      const id = selectedClassId(ui);
      if (!id) {
        state.lastMessage = "Select a class first.";
        return;
      }
      state.characterDraft.classId = id;
      switchScreen(state, ui, "charSkills");
    },
    B: (state, ui) => switchScreen(state, ui, "charRace"),
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
    const { lines, classIds } = buildRows();
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = classIds;

    const raceName = RACES[state.characterDraft.raceId]?.name ?? "";
    ui.promptRow.setContent(state.lastMessage || `Name: ${state.characterDraft.name} | Race: ${raceName} - choose your class:`);
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
