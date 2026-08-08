import { formatCommandRow } from "../../format.js";
import { switchScreen } from "../../router.js";
import {
  adjust,
  enterList,
  exitList,
  fieldRow,
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

// Each field is read/written through the state directly - grantSkillXp and
// grantPlayerXp both apply multipliers and can only ever go up, which is the
// wrong shape for an editor that has to be able to lower a value too.
const FIELDS = [
  { id: "hp", label: "Health", get: (s) => s.hp, max: (s) => s.hpMax },
  { id: "hpMax", label: "Max Health", get: (s) => s.hpMax, min: 1 },
  { id: "mp", label: "Mana", get: (s) => s.mp, max: (s) => s.mpMax },
  { id: "mpMax", label: "Max Mana", get: (s) => s.mpMax, min: 1 },
  { id: "gold", label: "Gold", get: (s) => s.gold },
  { id: "level", label: "Level", get: (s) => s.level, min: 1 },
  { id: "experience", label: "Experience", get: (s) => s.experience },
];

// Lowering a max has to drag the current value down with it, or the header
// renders 100/40 and the percentage bands in renderChrome go over 100%.
function clampToMaxes(state) {
  state.hp = Math.min(state.hp, state.hpMax);
  state.mp = Math.min(state.mp, state.mpMax);
}

function step(state, ui, direction) {
  const id = selectedId(ui);
  const field = FIELDS.find((f) => f.id === id);
  if (!field) return;
  state[id] = adjust(field.get(state), direction * stepFor(ui), {
    min: field.min ?? 0,
    max: field.max ? field.max(state) : Infinity,
  });
  clampToMaxes(state);
}

function buildRows(state) {
  const rows = rowBuilder();
  // A boolean doesn't fit FIELDS (every entry there is fed through adjust()),
  // so it rides as a non-selectable header the way adminAchievements.js renders
  // its auto-evaluate switch.
  rows.push(`  godmode: ${state.godmode ? "[ON]" : "[OFF]"}   (session-only)`);
  rows.push("");
  for (const field of FIELDS) {
    const suffix = field.id === "hp" ? `/ ${state.hpMax}` : field.id === "mp" ? `/ ${state.mpMax}` : "";
    rows.push(fieldRow(field.label, field.get(state), { suffix }), field.id);
  }
  return rows;
}

export const adminStatsScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "adminHub"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "adminHub"),
    "+": (state, ui) => step(state, ui, 1),
    "=": (state, ui) => step(state, ui, 1), // the unshifted key most keyboards put + on
    "-": (state, ui) => step(state, ui, -1),
    F: (state) => {
      state.hp = state.hpMax;
      state.mp = state.mpMax;
      state.lastMessage = "Refilled health and mana.";
    },
    G: (state) => {
      state.godmode = !state.godmode;
      state.lastMessage = state.godmode
        ? "Godmode ON - no damage, no mana, no gold, no ingredients."
        : "Godmode OFF.";
    },
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
    paint(ui, buildRows(state), " Player stats ");
    ui.promptRow.setContent(state.lastMessage || `Admin / Player stats - ${stepFooter(ui)}`);
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          ...STEP_COMMANDS,
          { label: "Fill hp/mp", hotkey: "F" },
          { label: "Godmode", hotkey: "G" },
        ],
        { columns: 2 }
      )
    );
  },
};
