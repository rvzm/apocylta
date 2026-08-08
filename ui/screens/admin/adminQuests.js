import { QUESTS } from "../../../quest_backbone.js";
import { objectiveStatus, isQuestComplete } from "../../../data/quests.js";
import { colorTag, formatCommandRow } from "../../format.js";
import { switchScreen } from "../../router.js";
import { enterList, exitList, paint, requireAdmin, rowBuilder, selectedId } from "./shared.js";

function parse(id) {
  const [questId, ...rest] = id.split("::");
  return { questId, label: rest.join("::") || null };
}

// Bypasses acceptQuest(), which refuses locked and under-level quests - two of
// the four shipped quests are locked:true and unreachable through it.
function toggleAccepted(state, ui) {
  const selected = selectedId(ui);
  if (!selected) return;
  const { questId } = parse(selected);
  if (state.quests[questId]) {
    delete state.quests[questId];
    state.lastMessage = `Dropped ${QUESTS[questId].name}.`;
    return;
  }
  state.quests[questId] = { status: "in_progress", objectiveProgress: {}, adminForced: {}, completedAt: null };
  state.lastMessage = `Accepted ${QUESTS[questId].name}.`;
}

// Writes record.adminForced, which objectiveStatus() reads ahead of its type
// switch. Only sellItem/craftItem/useSpell keep a counter that could be written
// to directly; the other seven are derived from inventory, location, skills or
// kills, so an override is the only way to force them.
function toggleObjective(state, ui) {
  const selected = selectedId(ui);
  if (!selected) return;
  const { questId, label } = parse(selected);
  const record = state.quests[questId];
  if (!record) {
    state.lastMessage = "Accept the quest first.";
    return;
  }
  if (!label) return toggleAccepted(state, ui);

  record.adminForced ??= {};
  if (record.adminForced[label]) delete record.adminForced[label];
  else record.adminForced[label] = true;
}

function toggleComplete(state, ui) {
  const selected = selectedId(ui);
  if (!selected) return;
  const { questId } = parse(selected);
  const record = state.quests[questId];
  if (!record) {
    state.lastMessage = "Accept the quest first.";
    return;
  }
  if (record.status === "completed") {
    record.status = "in_progress";
    record.completedAt = null;
    state.lastMessage = `${QUESTS[questId].name} back to in progress.`;
    return;
  }
  // Marked directly rather than via completeQuest(), which pays the reward and
  // refuses anything not genuinely finished.
  record.status = "completed";
  record.completedAt = Date.now();
  state.lastMessage = `${QUESTS[questId].name} marked complete (no reward paid).`;
}

function buildRows(state) {
  const rows = rowBuilder();
  for (const [questId, quest] of Object.entries(QUESTS)) {
    const record = state.quests[questId];
    const tags = [
      quest.locked ? "locked" : null,
      `lv ${quest.level}`,
      record ? record.status : "not accepted",
      record && isQuestComplete(state, questId) ? "objectives met" : null,
    ]
      .filter(Boolean)
      .join(", ");

    const header = `  [${record ? "x" : " "}] ${quest.name.padEnd(26)} (${tags})`;
    rows.push(record?.status === "completed" ? colorTag(header, "green") : header, questId);

    for (const label of Object.keys(quest.objectives ?? {})) {
      const { current, target, complete } = objectiveStatus(state, questId, label);
      const forced = !!record?.adminForced?.[label];
      const line = `      [${complete ? "x" : " "}] ${label} (${current}/${target})${forced ? "  <- forced" : ""}`;
      rows.push(forced ? colorTag(line, "yellow") : line, `${questId}::${label}`);
    }
    rows.push("");
  }
  return rows;
}

export const adminQuestsScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "adminHub"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "adminHub"),
    T: toggleObjective,
    A: toggleAccepted,
    C: toggleComplete,
  },

  onEnter(state, ui) {
    if (requireAdmin(state, ui)) return;
    enterList(state, ui);
    ui.inventoryList.select(0);
  },

  onExit: exitList,

  render(state, ui) {
    paint(ui, buildRows(state), " Quests ");
    ui.promptRow.setContent(state.lastMessage || "Admin / Quests - forced objectives are saved with the quest.");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Toggle objective", hotkey: "T" },
          { label: "Accept/drop", hotkey: "A" },
          { label: "Complete", hotkey: "C" },
        ],
        { columns: 2 }
      )
    );
  },
};
