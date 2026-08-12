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
  // The three counters shop_general was split into. F, X and V are the only
  // free letters left - everything else is claimed by another feature here, by
  // location.js's own T/K/M, or by main.js's global hard-quit on Q.
  shop_food: { id: "shop_food", hotkey: "F", label: "Food" },
  // "X" appears nowhere in "Materials", so the `R` action_key style has no
  // letter to embolden and falls back to its prefix form - the same documented
  // fallback `<>`, `+-` and every digit-keyed row already take. Worth it for a
  // label that says what's behind the counter.
  shop_crafting: { id: "shop_crafting", hotkey: "X", label: "Materials" },
  shop_scrap: { id: "shop_scrap", hotkey: "V", label: "Salvage" },
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
  // Was the shop_upgrades stub until BLACKMARKET.enhancements got a screen -
  // the two black markets were its only consumers, so it was renamed in place
  // rather than left beside a near-duplicate.
  shop_enhancements: { id: "shop_enhancements", hotkey: "E", label: "Enhancements" },
  // "G" rather than "M": main.js has no claim on it, and unlike M (Menu) it is
  // free at the location screen - it also appears in the label, which the "R"
  // action_key style needs a letter to embolden.
  shop_magic: { id: "shop_magic", hotkey: "G", label: "Magic" },
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
