import { catchableFish, canCatchFish } from "../../data/fishing.js";
import { timeLine, weatherLine, packLine } from "../../data/flavor.js";
import { beginAction } from "../../data/actions.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import { logger } from "../../logger.js";

function buildFishRows(state) {
  // The location's `water` decides what's swimming here - see data/fishing.js.
  // Passing no location would list every species in the game.
  const fish = catchableFish(state.currentLocationId);
  const lines = fish.map(
    ({ id, fish: species, requiredLevel }) =>
      `  - ${label(id)} (${species.caught}, requires fishing lvl ${requiredLevel ?? "?"})`
  );
  const speciesIds = fish.map(({ id }) => id);

  if (!lines.length) {
    lines.push("There's no water to fish here.");
    speciesIds.push(null);
  }

  return { lines, speciesIds };
}

function label(speciesId) {
  return speciesId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function selectedSpeciesId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

export const fishSelectScreen = {
  subHeader: [
    "The water moves against the bank, steady and unbothered.",
    "Something breaks the surface further out, then doesn't again.",
    "Reeds bend along the shallows where the current runs slow.",
    timeLine,
    weatherLine,
    packLine,
  ],

  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    C: (state, ui) => {
      const speciesId = selectedSpeciesId(ui);
      if (!speciesId) {
        state.lastMessage = "Pick something to fish for first.";
        return;
      }
      const { ok, reason } = canCatchFish(state, speciesId);
      if (!ok) {
        state.lastMessage = reason;
        return;
      }
      // lootIds rides through to rollLootByType's allowIds, so the gather only
      // ever turns up what was chosen. It's a list because the ancients yield
      // parts (scale/tooth/flesh/bone) rather than one raw catch.
      // targetLevel is the species' own required level: a leviathan slips the
      // line far more often than a pike does at the same fishing level.
      const { itemIds, requiredLevel } = catchableFish(state.currentLocationId).find(({ id }) => id === speciesId);
      beginAction(state, "fish", { lootIds: itemIds, species: speciesId, targetLevel: requiredLevel ?? 1 });
      logger.info("fishSelect", `Started fishing for ${speciesId}.`);
      switchScreen(state, ui, "action");
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const { lines, speciesIds } = buildFishRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = speciesIds;
    ui.inventoryList.select(0);

    ui.promptRow.setContent(state.lastMessage || "What would you like to fish for?");
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Choose", hotkey: "C" },
        ],
        { columns: 2 }
      )
    );
  },
};
