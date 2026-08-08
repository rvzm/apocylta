import { startedQuests, objectiveStatus, claimCompletedQuests } from "../../data/quests.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

function objectiveLine(state, questId, label) {
  const { current, target, complete } = objectiveStatus(state, questId, label);
  return `    ${complete ? "[x]" : "[ ]"} ${label} (${current}/${target})`;
}

function buildBody(state) {
  const entries = startedQuests(state);
  if (!entries.length) return ["You haven't started any quests yet. Visit a Quest Board to pick one up."];

  const lines = [];
  const inProgress = entries.filter((e) => e.record.status === "in_progress");
  const completed = entries.filter((e) => e.record.status === "completed");

  if (inProgress.length) {
    lines.push("In Progress:");
    for (const { id, quest } of inProgress) {
      lines.push(`  ${quest.name}`);
      for (const label of Object.keys(quest.objectives)) lines.push(objectiveLine(state, id, label));
      lines.push(`    Reward: ${quest.reward.gold}gp, ${quest.reward.xp}xp`, "");
    }
  }

  if (completed.length) {
    lines.push("Completed:");
    for (const { quest } of completed) {
      lines.push(`  ${quest.name} - claimed ${quest.reward.gold}gp, ${quest.reward.xp}xp`);
    }
  }

  return lines;
}

export const journalScreen = {
  keymap: {
    ESCAPE: (state, ui) => switchScreen(state, ui, "toolbelt"),
    C: (state, ui) => {
      const claimed = claimCompletedQuests(state);
      state.lastMessage = claimed.length
        ? `Claimed: ${claimed.map((q) => q.name).join(", ")}.`
        : "Nothing ready to claim yet.";
    },
  },

  onEnter(state) {
    state.lastMessage = null;
  },

  render(state, ui) {
    const bodyLines = buildBody(state);
    if (state.lastMessage) bodyLines.push("", `    ${state.lastMessage}`);
    ui.mainContent.setContent(bodyLines.join("\n"));

    ui.promptRow.setContent("Your Journal");
    ui.commandList.setContent(formatCommandRow([{ label: "Claim Rewards", hotkey: "C" }], { columns: 1 }));
  },
};
