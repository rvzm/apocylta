import { ALL_ITEMS } from "../../item_backbone.js";
import { formatCommandRow } from "../format.js";
import { timeLine, weatherLine } from "../../data/flavor.js";
import { applySubHeader } from "../subHeader.js";
import { pushScreen, popScreen } from "../router.js";
import {
  waterBottleCap,
  slingshotAmmoCap,
  quiverCap,
  backpackWeightCap,
  backpackWeightUsed,
  toolbeltWeightCap,
  toolbeltWeightUsed,
  potionSlotCap,
  potionSlotsUsed,
} from "../../data/toolbelt.js";

// Weights go down to 0.01, so a load reads as a decimal - but a whole number
// shouldn't render as "17.00". One decimal is enough to see a stack move.
function fmt(weight) {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

export const toolbeltScreen = {

  subHeader: ["Your Toolbelt"],
  
  keymap: {
    S: (state, ui) => pushScreen(state, ui, "toolSwap"),
    C: (state, ui) => pushScreen(state, ui, "slingshotSwap"),
    // The belt's CONTENTS, as against the equipped gear and load numbers this
    // screen shows. Its own B/ESCAPE come back here, so it reads as a
    // sub-screen rather than a sibling of the backpack.
    P: (state, ui) => pushScreen(state, ui, "pouch"),
    X: (state, ui) => pushScreen(state, ui, "spellbook"),
    B: (state, ui) => pushScreen(state, ui, "backpack"),
    J: (state, ui) => pushScreen(state, ui, "journal"),
    // Back to whoever opened it. This used to read menuOrigin - a DIFFERENT
    // screen's origin - on the assumption that hub features are only ever
    // reached from the location screen. The action screen's [J] broke that
    // assumption, and ESC dropped you wherever the Menu was last opened from.
    ESCAPE: (state, ui) => popScreen(state, ui, "location"),
  },

  onEnter(state) {
    state.lastMessage = null;
  },

  render(state, ui) {
    const toolName = state.equipment.tool ? ALL_ITEMS[state.equipment.tool]?.name ?? state.equipment.tool : "none";
    const slingshotName = state.equipment.slingshot
      ? ALL_ITEMS[state.equipment.slingshot]?.name ?? state.equipment.slingshot
      : "none";
    const beltName = state.equipment.belt ? ALL_ITEMS[state.equipment.belt]?.name ?? state.equipment.belt : "none";
    const quiverMax = quiverCap(state);
  
    const bodyLines = [
      `Equipped Belt:      ${beltName}`,
      `Equipped Tool:      ${toolName}`,
      `Water Bottle:       ${state.toolbelt.waterBottle}/${waterBottleCap(state)}`,
      `Slingshot Ammo:     ${state.toolbelt.slingshotAmmo}/${slingshotAmmoCap(state)}`,
      `Equipped Slingshot: ${slingshotName}`,
      `Quiver:             ${state.toolbelt.quiver}${quiverMax === Infinity ? "" : `/${quiverMax}`}`,
      // Two weight budgets and one slot count - see data/toolbelt.js for why
      // the potion pouch is still counted in slots.
      `Toolbelt Load:      ${fmt(toolbeltWeightUsed(state))}/${fmt(toolbeltWeightCap(state))}`,
      `Backpack Load:      ${fmt(backpackWeightUsed(state))}/${fmt(backpackWeightCap(state))}`,
      `Potions:            ${potionSlotsUsed(state)}/${potionSlotCap(state)}`,
    ];
    if (state.lastMessage) bodyLines.push("", `    ${state.lastMessage}`);
    ui.mainContent.setContent(bodyLines.join("\n"));

    ui.promptRow.setContent("What would you like to do?");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Pouch", hotkey: "P" },
          { label: "Swap Tool", hotkey: "S" },
          { label: "Change Slingshot", hotkey: "C" },
          { label: "Spellbook", hotkey: "X" },
          { label: "Backpack", hotkey: "B" },
          { label: "Journal", hotkey: "J" },
          { label: "Back", hotkey: "ESC" },
        ],
        { columns: 2 }
      )
    );
  },
};
