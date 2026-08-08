import { SKILLS } from "../../skill_backbone.js";
import { RACES, CLASSES, profSkillsFor } from "../../player_backbone.js";
import { finalizeCharacter } from "../../state/gameState.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

// Skills already covered by the chosen race+class are never offered here -
// every manual pick is guaranteed additive.
function remainingSkillIds(draft) {
  const race = RACES[draft.raceId];
  const cls = CLASSES[draft.classId];
  const excluded = new Set([...(race?.skillPro ?? []), ...(cls?.skillPro ?? [])]);
  return Object.keys(SKILLS).filter((id) => !excluded.has(id));
}

function buildRows(draft, selectedIds) {
  const lines = [];
  const skillIds = [];
  for (const id of remainingSkillIds(draft)) {
    const mark = selectedIds.has(id) ? "[x]" : "[ ]";
    lines.push(`  ${mark} ${SKILLS[id].name} - ${SKILLS[id].description}`);
    skillIds.push(id);
  }
  return { lines, skillIds };
}

function selectedSkillId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const charSkillsScreen = {
  keymap: {
    T: (state, ui) => {
      const id = selectedSkillId(ui);
      if (!id) return;
      const requiredPicks = profSkillsFor(state.characterDraft.difficultyId);
      const selected = ui.inventoryList._selectedIds;
      if (selected.has(id)) {
        selected.delete(id);
      } else if (selected.size >= requiredPicks) {
        state.lastMessage = `You already picked ${requiredPicks} skills - toggle one off first.`;
      } else {
        selected.add(id);
      }
    },
    C: (state, ui) => {
      const requiredPicks = profSkillsFor(state.characterDraft.difficultyId);
      const selected = ui.inventoryList._selectedIds;
      if (selected.size !== requiredPicks) {
        state.lastMessage = `Pick exactly ${requiredPicks} skills first (${selected.size}/${requiredPicks} selected).`;
        return;
      }
      state.characterDraft.proficientSkillIds = [...selected];
      finalizeCharacter(state, state.characterDraft);
      switchScreen(state, ui, "location");
    },
    B: (state, ui) => switchScreen(state, ui, "charClass"),
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.inventoryList._selectedIds = new Set();
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const requiredPicks = profSkillsFor(state.characterDraft.difficultyId);
    const selected = ui.inventoryList._selectedIds ?? new Set();
    const { lines, skillIds } = buildRows(state.characterDraft, selected);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = skillIds;

    ui.promptRow.setContent(
      state.lastMessage || `Pick ${requiredPicks} skills to be Proficient in (${selected.size}/${requiredPicks} selected):`
    );
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Toggle", hotkey: "T" },
          { label: "Confirm", hotkey: "C" },
          { label: "Back", hotkey: "B" },
        ],
        { columns: 3 }
      )
    );
  },
};
