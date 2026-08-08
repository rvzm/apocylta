import { visibleQuests, acceptQuest } from "../../data/quests.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function buildRows(state) {
  const quests = visibleQuests(state);
  const lines = quests.map((q) => `  - ${q.name} (Lv.${q.level}) - reward: ${q.reward.gold}gp, ${q.reward.xp}xp`);
  const questIds = quests.map((q) => q.id);

  if (!lines.length) {
    lines.push("No quests available right now.");
    questIds.push(null);
  }

  return { lines, questIds };
}

function selectedQuestId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const questBoardScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    A: (state, ui) => {
      const questId = selectedQuestId(ui);
      if (!questId) {
        state.lastMessage = "Select a quest first.";
        return;
      }
      state.lastMessage = acceptQuest(state, questId)
        ? "Quest accepted! Check your Journal for details."
        : "You can't accept that quest.";
      ui.inventoryList._resetSelection = true;
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
    ui.inventoryList._resetSelection = true;
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const { lines, questIds } = buildRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = questIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }

    ui.promptRow.setContent(state.lastMessage || "Quest Board - accept a quest.");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Accept", hotkey: "A" },
        ],
        { columns: 2 }
      )
    );
  },
};
