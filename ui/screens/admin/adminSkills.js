import { SKILLS, skillLevelCost } from "../../../skill_backbone.js";
import { formatCommandRow } from "../../format.js";
import { switchScreen } from "../../router.js";
import {
  adjust,
  enterList,
  exitList,
  paint,
  requireAdmin,
  resetStep,
  rowBuilder,
  selectedId,
  STEP_COMMANDS,
  stepFooter,
  stepFor,
  stepKeys,
} from "./shared.js";

const MAX_LEVEL = 99;

// Rows alternate level and xp for the same skill, so the id carries both.
function parse(id) {
  const [skillId, field] = id.split(":");
  return { skillId, field };
}

// Setting a level pins xp to that level's threshold, the shape
// finalizeCharacter() uses. grantSkillXp is deliberately not involved: it
// applies proficiency and difficulty multipliers, cascades into player xp, and
// can't lower anything.
function step(state, ui, direction) {
  const selected = selectedId(ui);
  if (!selected) return;
  const { skillId, field } = parse(selected);
  const skill = state.skills[skillId];
  if (!skill) return;

  if (field === "level") {
    skill.level = adjust(skill.level, direction * stepFor(ui), { min: 1, max: MAX_LEVEL });
    skill.xp = skillLevelCost(skill.level);
  } else {
    skill.xp = adjust(skill.xp, direction * stepFor(ui));
  }
}

function toggleProficient(state, ui) {
  const selected = selectedId(ui);
  if (!selected) return;
  const skill = state.skills[parse(selected).skillId];
  if (skill) skill.proficient = !skill.proficient;
}

function buildRows(state) {
  const rows = rowBuilder();
  for (const [skillId, def] of Object.entries(SKILLS)) {
    const skill = state.skills[skillId];
    if (!skill) continue;
    const next = skillLevelCost(skill.level + 1);
    rows.push(`  ${def.name.padEnd(14)} level [${String(skill.level).padStart(4)} ]${skill.proficient ? "  *proficient" : ""}`, `${skillId}:level`);
    rows.push(`  ${"".padEnd(14)}    xp [${String(skill.xp).padStart(4)} ]  next level at ${next}`, `${skillId}:xp`);
  }
  return rows;
}

export const adminSkillsScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "adminHub"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "adminHub"),
    "+": (state, ui) => step(state, ui, 1),
    "=": (state, ui) => step(state, ui, 1),
    "-": (state, ui) => step(state, ui, -1),
    P: toggleProficient,
    ...stepKeys(),
  },

  onEnter(state, ui) {
    if (requireAdmin(state, ui)) return;
    enterList(state, ui);
    resetStep(ui);
    ui.inventoryList.select(0);
  },

  onExit: exitList,

  render(state, ui) {
    paint(ui, buildRows(state), " Skills ");
    ui.promptRow.setContent(state.lastMessage || `Admin / Skills - ${stepFooter(ui)}`);
    ui.commandList.setContent(
      formatCommandRow([{ label: "Back", hotkey: "B" }, ...STEP_COMMANDS, { label: "Proficient", hotkey: "P" }], {
        columns: 2,
      })
    );
  },
};
