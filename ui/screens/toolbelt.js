import { ALL_ITEMS } from "../../item_backbone.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import {
  waterBottleCap,
  slingshotAmmoCap,
  quiverCap,
  backpackSlotCap,
  backpackSlotsUsed,
  potionSlotCap,
  potionSlotsUsed,
} from "../../data/toolbelt.js";

export const toolbeltScreen = {
  keymap: {
    S: (state, ui) => switchScreen(state, ui, "toolSwap"),
    C: (state, ui) => switchScreen(state, ui, "slingshotSwap"),
    B: (state, ui) => {
      state.returnScreen = "toolbelt";
      switchScreen(state, ui, "backpack");
    },
    J: (state, ui) => switchScreen(state, ui, "journal"),
    // Hub features (unlike Menu) are only ever reached from the location
    // screen, so ESC can go straight there without an origin-tracking field.
    ESCAPE: (state, ui) => switchScreen(state, ui, "location"),
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
      `Backpack:           ${backpackSlotsUsed(state)}/${backpackSlotCap(state)}`,
      `Potions:            ${potionSlotsUsed(state)}/${potionSlotCap(state)}`,
    ];
    if (state.lastMessage) bodyLines.push("", `    ${state.lastMessage}`);
    ui.mainContent.setContent(bodyLines.join("\n"));

    ui.promptRow.setContent("What would you like to do?");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Swap Tool", hotkey: "S" },
          { label: "Change Slingshot", hotkey: "C" },
          { label: "Backpack", hotkey: "B" },
          { label: "Journal", hotkey: "J" },
        ],
        { columns: 2 }
      )
    );
  },
};
