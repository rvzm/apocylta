import { ALL_ITEMS } from "../../../item_backbone.js";
import {
  backpackWeightCap,
  backpackWeightUsed,
  toolbeltWeightCap,
  toolbeltWeightUsed,
  potionSlotCap,
  quiverCap,
  slingshotAmmoCap,
  waterBottleCap,
} from "../../../data/toolbelt.js";
import { colorTag, formatCommandRow } from "../../format.js";
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

// Only three toolbelt numbers are stored; every cap is derived from the
// equipped belt (data/toolbelt.js). So the "cap editor" is really a belt
// picker, which is why the belts are listed on this screen rather than left to
// the equipment one.
const COUNTS = [
  { id: "waterBottle", label: "Water Bottle", cap: waterBottleCap },
  { id: "slingshotAmmo", label: "Slingshot Ammo", cap: slingshotAmmoCap },
  { id: "quiver", label: "Quiver", cap: quiverCap },
];

const BELTS = Object.entries(ALL_ITEMS)
  .filter(([, item]) => item.belt)
  .map(([id]) => id);

// quiverCap is Infinity with any belt equipped - the same `=== Infinity` guard
// ui/screens/toolbelt.js and server_backbone.js use. Clamping against it
// directly would be fine, but formatting it wouldn't.
function capText(cap) {
  return cap === Infinity ? "no cap" : `/ ${cap}`;
}

function step(state, ui, direction) {
  const selected = selectedId(ui);
  if (!selected) return;
  const field = COUNTS.find((f) => f.id === selected);
  if (!field) return;
  state.toolbelt[selected] = adjust(state.toolbelt[selected], direction * stepFor(ui), { max: field.cap(state) });
}

// Equipping the belt through the same both-sides write adminEquipment uses, so
// the displaced belt is never lost to a full backpack.
function wearBelt(state, ui) {
  const selected = selectedId(ui);
  if (!selected?.startsWith("belt:")) return;
  const beltId = selected.slice("belt:".length);
  const previous = state.equipment.belt;
  if (previous === beltId) {
    state.equipment.belt = null;
    state.inventory[beltId] = (state.inventory[beltId] || 0) + 1;
    state.lastMessage = `Removed ${ALL_ITEMS[beltId].name}.`;
    return;
  }
  if (previous) state.inventory[previous] = (state.inventory[previous] || 0) + 1;
  state.equipment.belt = beltId;
  const held = state.inventory[beltId] || 0;
  if (held > 1) state.inventory[beltId] = held - 1;
  else delete state.inventory[beltId];
  state.lastMessage = `Wearing ${ALL_ITEMS[beltId].name}.`;
}

function buildRows(state) {
  const rows = rowBuilder();
  for (const field of COUNTS) {
    rows.push(fieldRow(field.label, state.toolbelt[field.id], { suffix: capText(field.cap(state)) }), field.id);
  }

  rows.push("");
  rows.push(
    `  Backpack ${backpackWeightUsed(state)}/${backpackWeightCap(state)}   ` +
      `Toolbelt ${toolbeltWeightUsed(state)}/${toolbeltWeightCap(state)}   ` +
      `Potion slots ${potionSlotCap(state)}   (belt + strength)`
  );
  rows.push("");
  rows.push("  Belt - every cap above comes from this:");
  for (const beltId of BELTS) {
    const belt = ALL_ITEMS[beltId];
    const line = `    ${belt.name.padEnd(18)} ammo ${String(belt.belt.slingAmmo).padStart(3)}  potions ${String(belt.belt.potions).padStart(3)}  pack ${String(belt.belt.backpack).padStart(4)}  belt ${String(belt.belt.toolbelt).padStart(3)}`;
    rows.push(state.equipment.belt === beltId ? colorTag(`${line}  [WORN]`, "green", true) : line, `belt:${beltId}`);
  }
  return rows;
}

export const adminToolbeltScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "adminHub"),
    ESCAPE: (state, ui) => switchScreen(state, ui, "adminHub"),
    "+": (state, ui) => step(state, ui, 1),
    "=": (state, ui) => step(state, ui, 1),
    "-": (state, ui) => step(state, ui, -1),
    W: wearBelt,
    F: (state) => {
      for (const field of COUNTS) {
        const cap = field.cap(state);
        if (cap !== Infinity) state.toolbelt[field.id] = cap;
      }
      state.lastMessage = "Filled every capped toolbelt resource.";
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
    paint(ui, buildRows(state), " Toolbelt ");
    ui.promptRow.setContent(state.lastMessage || `Admin / Toolbelt - ${stepFooter(ui)}`);
    ui.commandList.setContent(
      formatCommandRow(
        [{ label: "Back", hotkey: "B" }, ...STEP_COMMANDS, { label: "Wear belt", hotkey: "W" }, { label: "Fill", hotkey: "F" }],
        { columns: 3 }
      )
    );
  },
};
