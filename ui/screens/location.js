import { getCurrentLocation, isLocationOpen, moveTo } from "../../state/gameState.js";
import { getAction, beginAction } from "../../data/actions.js";
import { spawnEncounter, beginCombat, canChallengeBoss, BOSS_LEVEL_REQUIREMENT } from "../../data/combat.js";
import { HUB_FEATURES, getHubFeature } from "../../data/hubFeatures.js";
import { getShop } from "../../data/shops.js";
import { resolveFlavorText } from "../../data/locations.js";
import { stationIdsAtLocation } from "../../data/stations.js";
import { formatCommandRow, wrapIndented, bold } from "../format.js";
import { switchScreen } from "../router.js";
import { logger } from "../../logger.js";

// The flavour block's own indent, and the fallbacks for a screen that hasn't
// reported a width yet. Exported so test/unit/locations.test.js can measure the
// body exactly the way this screen renders it, rather than approximating.
export const BODY_INDENT = 4;
export const DEFAULT_SCREEN_WIDTH = 120;
export const MIN_WRAP_WIDTH = 40;

// Single source of truth for "what actions actually work here" - used by
// both the numbered display and the digit dispatch below, so a location
// listing a dead/unresolvable action id (e.g. playerhome's organize_inventory)
// can never cause the displayed number and the triggered action to drift.
// Exported alongside travel.js's orderedExits() so integration tests can
// derive which digit triggers which action instead of hardcoding positions.
export function validActionsAt(location) {
  return location.interactiveActions.map(getAction).filter(Boolean);
}

function startAction(state, ui, actionId) {
  const location = getCurrentLocation(state);
  const action = getAction(actionId);
  if (!location.interactiveActions.includes(actionId)) {
    state.lastMessage = `You can't ${action.label.toLowerCase()} here.`;
    return;
  }
  if (action.instant) {
    action.effect(state);
    state.lastMessage = action.resultMessage;
    return;
  }
  if (action.combat) {
    if (action.boss && !canChallengeBoss(state)) {
      state.lastMessage = `You need fighting level ${BOSS_LEVEL_REQUIREMENT} before taking that on.`;
      return;
    }
    const encounter = spawnEncounter(state, { boss: !!action.boss });
    if (!encounter) {
      state.lastMessage = "Nothing shows itself.";
      return;
    }
    beginCombat(state, encounter);
    logger.info("location", `Encounter started at ${location.id}.`);
    switchScreen(state, ui, "combat");
    return;
  }
  // Actions that need a choice first hand off to their picker screen, which
  // begins the action itself once something is selected. Data-driven so that
  // stays one branch no matter how many actions grow a selector.
  if (action.select) {
    switchScreen(state, ui, action.select);
    return;
  }
  beginAction(state, actionId);
  logger.info("location", `Started action ${actionId} at ${location.id}.`);
  switchScreen(state, ui, "action");
}

function triggerHubFeature(state, ui, featureId) {
  const location = getCurrentLocation(state);
  const feature = getHubFeature(featureId);
  if (!location.hubFeatures.includes(featureId)) {
    state.lastMessage = `There's no ${feature.label.toLowerCase()} here.`;
    return;
  }
  if (feature.to) {
    if (feature.requires && !feature.requires(state)) {
      state.lastMessage = feature.requiresMessage ?? "You can't do that yet.";
      return;
    }
    moveTo(state, feature.to);
    switchScreen(state, ui, "location");
    return;
  }
  if (feature.screen) {
    switchScreen(state, ui, feature.screen);
    return;
  }
  const shop = getShop(featureId);
  if (shop) {
    if (!isLocationOpen(state)) {
      state.lastMessage = `The ${location.name} is closed right now. Come back later.`;
      return;
    }
    state.shopContext = shop;
    switchScreen(state, ui, shop.screen ?? (shop.mode === "sell" ? "shopSell" : "shopBuy"));
    return;
  }
  state.lastMessage = feature.message;
}

// Stations get one shared entry point (a picker screen) instead of a
// dedicated hotkey each - the location just needs to list which station ids
// are present, same presence-flag role hubFeatures entries always had.
function triggerStations(state, ui) {
  const location = getCurrentLocation(state);
  const stationIds = stationIdsAtLocation(state, location);
  if (!stationIds.length) {
    state.lastMessage = "There's nothing to craft here.";
    return;
  }
  switchScreen(state, ui, "stationSelect");
}

// Built once, but every handler re-resolves against the CURRENT location on
// each press rather than being tied to one fixed action/feature. Actions get
// positional digits (1st action at this location is "1", etc.) so they never
// need a globally-reserved letter. Hub features keep their per-id letter, but
// the same letter can now be reused by different hub features at different
// (never-simultaneously-active) locations - only within one location's own
// hubFeatures list does a letter still need to be unique.
const keymap = {
  T: (state, ui) => switchScreen(state, ui, "travel"),
  K: (state, ui) => triggerStations(state, ui),
  M: (state, ui) => {
    state.menuOrigin = state.currentScreen;
    switchScreen(state, ui, "menu");
  },
};
for (let n = 1; n <= 9; n++) {
  keymap[String(n)] = (state, ui) => {
    const action = validActionsAt(getCurrentLocation(state))[n - 1];
    if (action) startAction(state, ui, action.id);
  };
}
const hubFeatureHotkeys = new Set(Object.values(HUB_FEATURES).map((f) => f.hotkey));
for (const hotkey of hubFeatureHotkeys) {
  keymap[hotkey] = (state, ui) => {
    const featureId = getCurrentLocation(state).hubFeatures.find((id) => getHubFeature(id)?.hotkey === hotkey);
    if (featureId) triggerHubFeature(state, ui, featureId);
  };
}

export const locationScreen = {
  keymap,

  onEnter(state) {
    state.lastMessage = null;
  },

  render(state, ui) {
    const location = getCurrentLocation(state);

    // mainContent is width:"100%" with a line border, so its inner width is the
    // screen minus the two border columns. Read per render rather than captured:
    // the pane follows a terminal resize, and so must the wrap.
    const width = Math.max(MIN_WRAP_WIDTH, (ui.screen?.width ?? DEFAULT_SCREEN_WIDTH) - 2);
    const wrap = (line, indent) => wrapIndented(line, { width, indent });

    // flavorText may be one string or an array with computed entries, and those
    // entries may carry markup - see resolveFlavorText and data/flavor.js.
    // Blank spacers stay blank rather than being indented; wrapIndented returns
    // a single empty row for them, so the flatMap preserves them as-is.
    const flavor = resolveFlavorText(location, state).flatMap((line) => (line ? wrap(line, BODY_INDENT) : [""]));
    const bodyLines = [...wrap(bold(location.description), 0), "", ...flavor];
    if (state.lastMessage) {
      bodyLines.push("", ...wrap(state.lastMessage, BODY_INDENT));
    }
    ui.mainContent.setContent(bodyLines.join("\n"));

    ui.promptRow.setContent("What would you like to do?");

    const commands = [
      { label: "Travel", hotkey: "T" },
      ...validActionsAt(location).map((a, i) => ({ label: a.label, hotkey: String(i + 1) })),
      ...location.hubFeatures
        .map(getHubFeature)
        .filter(Boolean)
        .map((f) => ({ label: f.label, hotkey: f.hotkey })),
      { label: "Stations", hotkey: "K" },
      { label: "Menu", hotkey: "M" },
    ];
    ui.commandList.setContent(formatCommandRow(commands));
  },
};
