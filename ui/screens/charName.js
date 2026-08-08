import { switchScreen } from "../router.js";

function renderBody(state, ui) {
  const lines = [
    "Creating a new character.",
    "",
    "    What is your name?",
  ];
  if (state.lastMessage) lines.push("", `    ${state.lastMessage}`);
  ui.mainContent.setContent(lines.join("\n"));
  ui.promptRow.setContent("Enter your name:");
  ui.commandList.setContent("Press Enter to confirm, Esc to cancel.");
}

export const charNameScreen = {
  // Text entry is handled entirely by ui.nameInput's own submit/cancel
  // events (wired once below), same pattern as ui/screens/travel.js.
  keymap: {},

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.inventoryList.hide();

    if (!ui.nameInput._wired) {
      ui.nameInput.on("submit", (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          state.lastMessage = "Name cannot be empty.";
          renderBody(state, ui);
          ui.nameInput.clearValue();
          ui.nameInput.focus();
          ui.screen.render();
          return;
        }
        state.characterDraft.name = trimmed;
        switchScreen(state, ui, "charDifficulty");
      });
      ui.nameInput.on("cancel", () => {
        state.characterDraft = null;
        switchScreen(state, ui, "title");
      });
      ui.nameInput._wired = true;
    }

    ui.nameInput.setValue(state.characterDraft?.name ?? "");
    ui.nameInput.show();
    ui.nameInput.focus();
  },

  onExit(state, ui) {
    ui.nameInput.hide();
  },

  render(state, ui) {
    renderBody(state, ui);
  },
};
