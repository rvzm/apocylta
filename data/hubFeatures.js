// apocylta world data - hub features (non-action, stub location amenities)

export const HUB_FEATURES = {
  quest_board: {
    id: "quest_board",
    // Not "Q" - main.js binds a global hard-quit on screen.key(["q","Q","C-c"])
    // that fires independently of (and before) the app's own screen-level
    // keymaps, so "Q" can never actually reach a feature hotkey here - it
    // just quits the whole game. Picked "C" since every other free letter
    // that could plausibly stand for "quest"/"board" is already claimed by
    // another hub feature (see the full hotkey list in this file).
    hotkey: "C",
    label: "Quest Board",
    screen: "questBoard",
  },
  safehouse: {
    id: "safehouse",
    hotkey: "S",
    label: "Safehouse",
    to: "safehouse",
  },
  shop_weapons: { id: "shop_weapons", hotkey: "W", label: "Weapons" },
  shop_armor: { id: "shop_armor", hotkey: "A", label: "Armor" },
  shop_potions: { id: "shop_potions", hotkey: "P", label: "Potions" },
  shop_general: { id: "shop_general", hotkey: "B", label: "Browse" },
  shop_illegal: { id: "shop_illegal", hotkey: "I", label: "Illicit Goods" },
  shop_sell: { id: "shop_sell", hotkey: "O", label: "Offload" },
  shop_ammo: {
    id: "shop_ammo",
    hotkey: "R",
    label: "Rounds",
    message: "The ammo counter is empty. Not implemented yet.",
  },
  shop_repair: {
    id: "shop_repair",
    hotkey: "U",
    label: "Upkeep",
    message: "No one's here to repair your gear yet. Not implemented yet.",
  },
  shop_ingredients: {
    id: "shop_ingredients",
    hotkey: "H",
    label: "Herbalist",
    message: "The ingredients shelf is bare. Not implemented yet.",
  },
  shop_upgrades: {
    id: "shop_upgrades",
    hotkey: "E",
    label: "Enhancements",
    message: "No upgrades available yet. Not implemented yet.",
  },
  shop_housing: { id: "shop_housing", hotkey: "D", label: "Deeds" },
  mine: { id: "mine", hotkey: "N", label: "Mine", screen: "mineSelect" },
  toolbelt: { id: "toolbelt", hotkey: "L", label: "Toolbelt", screen: "toolbelt" },
  go_to_home: {
    id: "go_to_home",
    hotkey: "J",
    label: "Go Home",
    to: "playerhome",
    requires: (state) => state.house,
    requiresMessage: "You don't own a home yet.",
  },
};

export function getHubFeature(id) {
  return HUB_FEATURES[id];
}
