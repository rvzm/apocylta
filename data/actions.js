// apocylta world data - interactive actions

import { ALL_ITEMS, SHOP_RARITY_DISPLAY } from "../item_backbone.js";

export const ACTIONS = {
  gather_scraps: {
    id: "gather_scraps",
    label: "Gather scraps",
    verbFlavor: (locationName) =>
      `You are searching for scraps along the streets of the ${locationName}.`,
    lootType: "scrap",
    skill: "foraging",
  },

  look_for_food: {
    id: "look_for_food",
    label: "Look for food",
    verbFlavor: (locationName) =>
      `You are looking for anything edible around the ${locationName}.`,
    lootType: "food",
    lootSubtype: "raw_food",
    skill: "survival",
  },

  trap_game: {
    id: "trap_game",
    label: "Trap game",
    verbFlavor: (locationName) =>
      `You are setting traps to catch game in the ${locationName}.`,
    lootType: "food",
    lootSubtype: "raw_meat",
    skill: "trapping",
  },

  fish: {
    id: "fish",
    label: "Fish",
    verbFlavor: (locationName) =>
      `You are fishing in the waters of the ${locationName}.`,
    lootType: "food",
    lootSubtype: "raw_fish",
    skill: "fishing",
  },

  forage: {
    id: "forage",
    label: "Forage",
    verbFlavor: (locationName) =>
      `You are foraging for wild edibles in the ${locationName}.`,
    lootType: ["food", "crafting"],
    lootSubtype: ["raw_fungi", "raw_herbs", "raw_vegetables", "magic"],
    skill: "foraging",
  },

  chop: {
    id: "chop",
    label: "Chop wood",
    verbFlavor: (locationName) =>
      `You are chopping wood in the ${locationName}.`,
    lootType: "crafting",
    lootSubtype: "wood",
    skill: "woodcutting",
  },

  // No static lootSubtype - the mine selector screen (ui/screens/mineSelect.js)
  // picks the ore and stores its subtype on currentAction.lootSubtype, which
  // gameLoop.js prefers over this action's (absent) static value.
  mine: {
    id: "mine",
    label: "Mine",
    verbFlavor: (locationName) =>
      `You are mining ore in the ${locationName}.`,
    lootType: "mining",
    skill: "mining",
  },

  // Combat actions are neither timed nor instant: startAction() in
  // ui/screens/location.js checks `combat` and hands off to data/combat.js's
  // spawnEncounter() + the turn-based combat screen. Listing them in a
  // location's interactiveActions is what makes them available, exactly like
  // any gathering action - see the `enemies`/`boss` pools in data/locations.js.
  fight: {
    id: "fight",
    label: "Fight",
    combat: true,
    skill: "fighting",
  },
  challenge_boss: {
    id: "challenge_boss",
    label: "Challenge boss",
    combat: true,
    boss: true,
    skill: "fighting",
  },

  // Instant actions resolve immediately (no currentAction loop, no action
  // screen) - startAction() in ui/screens/location.js checks `instant` and
  // runs `effect` in place of switching screens.
  rest: {
    id: "rest",
    label: "Rest",
    instant: true,
    effect: (state) => {
      state.hp = state.hpMax;
      state.mp += 100;
      state.clock.totalMinutes += 60;
    },
    resultMessage: "You rest and feel fully refreshed.",
  },
  wait: {
    id: "wait",
    label: "Wait",
    instant: true,
    effect: (state) => {
      state.clock.totalMinutes += 90;
    },
    resultMessage: "You wait for a while.",
  },
  meditate: {
    id: "meditate",
    label: "Meditate",
    instant: true,
    effect: (state) => {
      state.mp = state.mpMax;
      state.clock.totalMinutes += 300;
    },
    resultMessage: "You meditate and feel your mana restored.",
  },
};

export function getAction(id) {
  return ACTIONS[id];
}

// Snapshots the action's skill level/xp at start, so status-bar/UI code can
// show "gained this session" deltas later without a separate running total -
// skill.xp is a cumulative lifetime value that's never reset on level-up.
export function beginAction(state, actionId, extra = {}) {
  const action = getAction(actionId);
  const skill = action?.skill ? state.skills[action.skill] : null;
  state.currentAction = {
    id: actionId,
    elapsedSeconds: 0,
    gatheredThisSession: {},
    skillLevelAtStart: skill?.level ?? 0,
    skillXpAtStart: skill?.xp ?? 0,
    ...extra,
  };
}

const DEFAULT_QTY_RANGE = { min: 1, max: 2 };

// Rolls one item from item_backbone.js's ITEMS catalog whose `type` matches
// lootType - and, if lootSubtype is given, whose `subtype` also matches (a
// single string, or an array of acceptable subtypes) - rarity-weighted via
// the existing SHOP_RARITY_DISPLAY level map (lower level = more common =
// higher pick weight). Returns { itemId, qty }, or null if nothing matches.
// rng is injectable so callers that need reproducible rolls (combat drops,
// unit tests) can pass a seeded generator instead of Math.random.
//
// `allowIds` narrows further to an explicit id list, for pools that type and
// subtype can't express - every gemstone shares the subtype "gemstone", so
// data/mining.js's tier-gated bonus drop has only the id to go on. Appended
// last on purpose: data/combat.js passes positional `undefined` placeholders
// to reach `rng` in slot 4, so inserting a parameter would break it silently.
export function rollLootByType(lootType, lootSubtype, qtyRange = DEFAULT_QTY_RANGE, rng = Math.random, allowIds = null) {
  const types = Array.isArray(lootType) ? lootType : lootType ? [lootType] : null;
  const subtypes = Array.isArray(lootSubtype) ? lootSubtype : lootSubtype ? [lootSubtype] : null;
  const allowed = allowIds ? new Set(allowIds) : null;
  const pool = Object.entries(ALL_ITEMS).filter(
    ([itemId, item]) =>
      types.includes(item.type) &&
      (!subtypes || subtypes.includes(item.subtype)) &&
      (!allowed || allowed.has(itemId))
  );
  if (pool.length === 0) return null;

  const weighted = pool.map(([itemId, item]) => {
    const level = SHOP_RARITY_DISPLAY[item.rarity]?.level || 1;
    return { itemId, weight: 1 / level };
  });

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * totalWeight;
  let picked = weighted[weighted.length - 1].itemId;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) {
      picked = entry.itemId;
      break;
    }
  }

  const qty = qtyRange.min + Math.floor(rng() * (qtyRange.max - qtyRange.min + 1));
  return { itemId: picked, qty };
}
