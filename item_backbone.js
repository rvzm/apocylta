// apocylta items
import { SKILLS, listSkills } from "./skill_backbone.js";


// Here we list all the items in the game, their types, subtypes, and properties. This includes weapons, armor, potions, crafting materials, and more.
// First are the TYPE declarations, then ITEM definitions, then METALURGY and RECIPES.
// Most registries also include a "global: {}" tag, this tag is used to define global properties for that type of item, such as what skill
// is used to gather it, what action is associated with it, or what station it is used at. This is used to avoid repeating the same
// properties for every item of that type.
// global: {} tags -
//   - station: The station(s) where the listed items can be used. This is used to determine what items can be used at what
//  stations, and to display the correct items in the station UI.
//   - skill: The skill(s) associated with the listed items. This is used to determine what items can be used with what skills,
//  and to display the correct items in the skill UI.
//   - gather: The action(s) associated with the listed items. This is used to determine what items can be gathered with what actions,
// "enhancement" is the black market's charm/talisman/beads/ring/bangle ladder,
// translated into canonical items by withBlackMarketDefaults() below. It gets a
// type of its own rather than riding "magic": that would put all 70 into the
// magic shop's stock and into rollLootByType's magic pool, neither of which is
// wanted for something only the black market sells.
export const ITEM_TYPES = ["weapon", "armor", "scrap", "crafting", "recipe", "treasure", "mining", "smithing", "metal", "food", "potion", "tool", "kit", "set", "magic", "aid", "enhancement"];
export const WEAPON_TYPES = ["melee", "sword", "dagger", "battleaxe", "slingshot", "ranged", "throwing", "staff", "bow"];
export const ARMOR_TYPES = ["simple_robe","leather", "tin", "chainmail", "bronze", "cobalt", "copper", "wooden", "iron", "steel", "mithril", "adamantite", "syllic", "mage_robe", "mythic", "unique", "godlike"];
export const ARMOR_SLOTS = ["head", "torso", "legs", "boots", "hands", "cloak", "ring", "necklace", "belt", "shield"];
export const MAGE_ROBE_TYPES = ["basic", "advanced", "mythic", "unique", "godlike"];
export const SCRAP_TYPES = ["metal", "plastic", "wood", "stone", "fabric", "glass", "misc"];
// "fishing" covers bait/nets/hooks - carried gear that gates a catch by being
// in the backpack rather than equipped (see the FISHING_ITEMS mapping below).
export const CRAFTING_TYPES = ["woodworking", "metalworking", "tool", "alchemy", "cooking", "smithing", "magic", "fishing", ...SCRAP_TYPES];
export const MINING_TYPES = ["tin", "copper", "iron", "cobalt", "mithril", "adamantite", "syllic", "silkre", "runite", "gold", "fuel", "gemstone"];
export const SMITHING_TYPES = ["tin", "copper", "bronze", "iron", "cobalt", "black_cobalt", "steel", "black_steel", "mithril", "adamantite", "syllic", "runite", "gold", "silkre", "fuel", "alloy"];
export const METAL_TYPES = ["base", "alloy", "precious", "rare", "exotic"];
export const FOOD_CATAGORIES = ["raw_food", "raw_meat", "raw_fish", "raw_fungi", "raw_vegetables", "raw_herbs", "raw_fruits", "cooked_food"];
// "grilled"/"smoked"/"pickled" are the fishing preparations (FISHING_RECIPES);
// "baked" was already here and is shared with the bread/pie recipes.
export const FOOD_SUBTYPES = ["basic", "stew", "baked", "grilled", "fried", "smoked", "pickled", "brewed", "ingredient"];
export const POTION_CATAGORIES = ["heal", "mana", "poison", "buff"];
export const TOOL_CATAGORIES = ["shovel", "pickaxe", "hammer", "saw", "axe", "fishing rod", "lockpick", "combat_aid", "combat_bait", "combat_trap", "combat_bomb"];
export const KIT_CATAGORIES = ["first_aid", "survival", "tool", "crafting", "armor"];
export const SET_CATAGORIES = ["armor", "weapon", "tool", "crafting"];
export const MAGIC_CATAGORIES = ["scroll", "wand", "crystal", "rune", "talisman", "orb", "book", "focus"];
export const ITEM_RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "unique", "godlike"];


export const ITEMS = {
    // Scrap
    "stone":          { name: "Stone",          type: "scrap", subtype: "stone",   gather: ["mine", "forage", "chop", "scrap"], rarity: "common" },
    "plastic":        { name: "Plastic",        type: "scrap", subtype: "plastic", gather: ["forage", "scrap"], rarity: "common" },
    "ripped_fabric":  { name: "Ripped Fabric",  type: "scrap", subtype: "fabric",  gather: ["forage", "scrap"], rarity: "common" },
    "wood_plank":     { name: "Wood Plank",     type: "scrap", subtype: "wood",    gather: ["chop", "forage", "scrap"], rarity: "common" },
    "scrap_metal":    { name: "Scrap Metal",    type: "scrap", subtype: "metal",   gather: ["mine", "forage", "scrap"], rarity: "common" },
    "bottle":         { name: "Bottle",         type: "scrap", subtype: "glass",   gather: ["forage", "scrap"], rarity: "common" },
    "lockpick_parts": { name: "Lockpick Parts", type: "scrap", subtype: "metal",   gather: ["forage", "scrap"], rarity: "uncommon" },
    "broken_watch":   { name: "Broken Watch",   type: "scrap", subtype: "metal",   gather: ["forage", "scrap"], rarity: "uncommon" },
    "copper_wire":    { name: "Copper Wire",    type: "scrap", subtype: "metal",   gather: ["forage", "scrap"], rarity: "uncommon" },
    "copper_pipe":    { name: "Copper Pipe",    type: "scrap", subtype: "metal",   gather: ["forage", "scrap"], rarity: "uncommon" },

    // Weapons
    // - Swords
    "wooden_sword":     { name: "Wooden Sword",     type: "weapon", subtype: "sword", rarity: "common",    damage: 5, durability: 50 },
    "tin_sword":        { name: "Tin Sword",        type: "weapon", subtype: "sword", rarity: "common",    damage: 7, durability: 60 },
    // Every other weapon line has a copper tier; sword and dagger were the two
    // that never got one, leaving SMITHING_RECIPES.copper_sword/copper_dagger
    // pointing at items that didn't exist. Stats sit between tin and bronze,
    // matching copper_battleaxe/copper_bow's placement on their own lines.
    "copper_sword":     { name: "Copper Sword",     type: "weapon", subtype: "sword", rarity: "uncommon",  damage: 9, durability: 65 },
    "bronze_sword":     { name: "Bronze Sword",     type: "weapon", subtype: "sword", rarity: "uncommon",  damage: 12, durability: 80 },
    "iron_sword":       { name: "Iron Sword",       type: "weapon", subtype: "sword", rarity: "common",    damage: 10, durability: 100 },
    "cobalt_sword":     { name: "Cobalt Sword",     type: "weapon", subtype: "sword", rarity: "rare",      damage: 15, durability: 120 },
    "steel_sword":      { name: "Steel Sword",      type: "weapon", subtype: "sword", rarity: "uncommon",  damage: 20, durability: 150 },
    "mithril_sword":    { name: "Mithril Sword",    type: "weapon", subtype: "sword", rarity: "epic",      damage: 35, durability: 200 },
    "adamantite_sword": { name: "Adamantite Sword", type: "weapon", subtype: "sword", rarity: "legendary", damage: 50, durability: 300 },
    "syllic_sword":     { name: "Syllic Sword",     type: "weapon", subtype: "sword", rarity: "mythic",    damage: 70, durability: 400 },
    // - Daggers
    "wooden_dagger":     { name: "Wooden Dagger",     type: "weapon", subtype: "dagger", rarity: "common",    damage: 3, durability: 40 },
    "tin_dagger":        { name: "Tin Dagger",        type: "weapon", subtype: "dagger", rarity: "common",    damage: 5, durability: 50 },
    "copper_dagger":     { name: "Copper Dagger",     type: "weapon", subtype: "dagger", rarity: "uncommon",  damage: 6, durability: 55 },
    "bronze_dagger":     { name: "Bronze Dagger",     type: "weapon", subtype: "dagger", rarity: "uncommon",  damage: 8, durability: 70 },
    "iron_dagger":       { name: "Iron Dagger",       type: "weapon", subtype: "dagger", rarity: "common",    damage: 6, durability: 80 },
    "cobalt_dagger":     { name: "Cobalt Dagger",     type: "weapon", subtype: "dagger", rarity: "rare",      damage: 10, durability: 100 },
    "steel_dagger":      { name: "Steel Dagger",      type: "weapon", subtype: "dagger", rarity: "uncommon",  damage: 12, durability: 100 },
    "mithril_dagger":    { name: "Mithril Dagger",    type: "weapon", subtype: "dagger", rarity: "epic",      damage: 20, durability: 150 },
    "adamantite_dagger": { name: "Adamantite Dagger", type: "weapon", subtype: "dagger", rarity: "legendary", damage: 30, durability: 200 },
    "syllic_dagger":     { name: "Syllic Dagger",     type: "weapon", subtype: "dagger", rarity: "mythic",    damage: 40, durability: 250 },
    // - Battleaxes
    "wooden_battleaxe":     { name: "Wooden Battleaxe",     type: "weapon", subtype: "battleaxe", rarity: "common",    damage: 8, durability: 60 },
    "tin_battleaxe":        { name: "Tin Battleaxe",        type: "weapon", subtype: "battleaxe", rarity: "common",    damage: 10, durability: 70 },
    "copper_battleaxe":     { name: "Copper Battleaxe",     type: "weapon", subtype: "battleaxe", rarity: "uncommon",  damage: 15, durability: 90 },
    "bronze_battleaxe":     { name: "Bronze Battleaxe",     type: "weapon", subtype: "battleaxe", rarity: "uncommon",  damage: 20, durability: 100 },
    "iron_battleaxe":       { name: "Iron Battleaxe",       type: "weapon", subtype: "battleaxe", rarity: "common",    damage: 18, durability: 120 },
    "cobalt_battleaxe":     { name: "Cobalt Battleaxe",     type: "weapon", subtype: "battleaxe", rarity: "rare",      damage: 25, durability: 150 },
    "steel_battleaxe":      { name: "Steel Battleaxe",      type: "weapon", subtype: "battleaxe", rarity: "uncommon",  damage: 30, durability: 180 },
    "mithril_battleaxe":    { name: "Mithril Battleaxe",    type: "weapon", subtype: "battleaxe", rarity: "epic",      damage: 40, durability: 200 },
    "adamantite_battleaxe": { name: "Adamantite Battleaxe", type: "weapon", subtype: "battleaxe", rarity: "legendary", damage: 50, durability: 250 },
    "syllic_battleaxe":     { name: "Syllic Battleaxe",     type: "weapon", subtype: "battleaxe", rarity: "mythic",    damage: 60, durability: 300 },
    // - Bows
    "wooden_bow":     { name: "Wooden Bow",     type: "weapon", subtype: "ranged", rarity: "common",    damage: 5, durability: 50 },
    "tin_bow":        { name: "Tin Bow",        type: "weapon", subtype: "ranged", rarity: "common",    damage: 7, durability: 60 },
    "copper_bow":     { name: "Copper Bow",     type: "weapon", subtype: "ranged", rarity: "uncommon",  damage: 10, durability: 70 },
    "bronze_bow":     { name: "Bronze Bow",     type: "weapon", subtype: "ranged", rarity: "uncommon",  damage: 12, durability: 80 },
    "iron_bow":       { name: "Iron Bow",       type: "weapon", subtype: "ranged", rarity: "common",    damage: 10, durability: 100 },
    "cobalt_bow":     { name: "Cobalt Bow",     type: "weapon", subtype: "ranged", rarity: "rare",      damage: 15, durability: 120 },
    "steel_bow":      { name: "Steel Bow",      type: "weapon", subtype: "ranged", rarity: "uncommon",  damage: 20, durability: 150 },
    "mithril_bow":    { name: "Mithril Bow",    type: "weapon", subtype: "ranged", rarity: "epic",      damage: 35, durability: 200 },
    "adamantite_bow": { name: "Adamantite Bow", type: "weapon", subtype: "ranged", rarity: "legendary", damage: 50, durability: 300 },
    "syllic_bow":     { name: "Syllic Bow",     type: "weapon", subtype: "ranged", rarity: "mythic",    damage: 70, durability: 400 },
    // - Slingshots
    "wooden_slingshot":     { name: "Wooden Slingshot",     type: "weapon", subtype: "slingshot", rarity: "common",    damage: 5, durability: 50 },
    "tin_slingshot":        { name: "Tin Slingshot",        type: "weapon", subtype: "slingshot", rarity: "common",    damage: 7, durability: 60 },
    "copper_slingshot":     { name: "Copper Slingshot",     type: "weapon", subtype: "slingshot", rarity: "uncommon",  damage: 10, durability: 70 },
    "bronze_slingshot":     { name: "Bronze Slingshot",     type: "weapon", subtype: "slingshot", rarity: "uncommon",  damage: 12, durability: 80 },
    "iron_slingshot":       { name: "Iron Slingshot",       type: "weapon", subtype: "slingshot", rarity: "common",    damage: 10, durability: 100 },
    "cobalt_slingshot":     { name: "Cobalt Slingshot",     type: "weapon", subtype: "slingshot", rarity: "rare",      damage: 15, durability: 120 },
    "steel_slingshot":      { name: "Steel Slingshot",      type: "weapon", subtype: "slingshot", rarity: "uncommon",  damage: 20, durability: 150 },
    "mithril_slingshot":    { name: "Mithril Slingshot",    type: "weapon", subtype: "slingshot", rarity: "epic",      damage: 35, durability: 200 },
    "adamantite_slingshot": { name: "Adamantite Slingshot", type: "weapon", subtype: "slingshot", rarity: "legendary", damage: 50, durability: 300 },
    "syllic_slingshot":     { name: "Syllic Slingshot",     type: "weapon", subtype: "slingshot", rarity: "mythic",    damage: 70, durability: 400 },
    // - Magic Staves
    "wooden_staff":     { name: "Wooden Staff",     type: "weapon", subtype: "staff", rarity: "common",    damage: 5, durability: 50 },
    "tin_staff":        { name: "Tin Staff",        type: "weapon", subtype: "staff", rarity: "common",    damage: 7, durability: 60 },
    "copper_staff":     { name: "Copper Staff",     type: "weapon", subtype: "staff", rarity: "uncommon",  damage: 10, durability: 70 },
    "bronze_staff":     { name: "Bronze Staff",     type: "weapon", subtype: "staff", rarity: "uncommon",  damage: 12, durability: 80 },
    "iron_staff":       { name: "Iron Staff",       type: "weapon", subtype: "staff", rarity: "common",    damage: 10, durability: 100 },
    "cobalt_staff":     { name: "Cobalt Staff",     type: "weapon", subtype: "staff", rarity: "rare",      damage: 15, durability: 120 },
    "steel_staff":      { name: "Steel Staff",      type: "weapon", subtype: "staff", rarity: "uncommon",  damage: 20, durability: 150 },
    "mithril_staff":    { name: "Mithril Staff",    type: "weapon", subtype: "staff", rarity: "epic",      damage: 35, durability: 200 },
    "adamantite_staff": { name: "Adamantite Staff", type: "weapon", subtype: "staff", rarity: "legendary", damage: 50, durability: 300 },
    "syllic_staff":     { name: "Syllic Staff",     type: "weapon", subtype: "staff", rarity: "mythic",    damage: 70, durability: 400 },

    // Combat Tools and Resources
    // - Aid
    "bandage_box": { name: "Bandage Box", type: "tool", subtype: "combat_aid", rarity: "common", effect: "heals minor wounds", durability: 5 },
    "medic_bag": { name: "Medic Bag", type: "tool", subtype: "combat_aid", rarity: "uncommon", effect: "heals moderate wounds", durability: 10 },
    "trauma_bag": { name: "Trauma Bag", type: "tool", subtype: "combat_aid", rarity: "rare", effect: "heals severe wounds", durability: 15 },
    "aegis_kit": { name: "AEGIS Kit", type: "tool", subtype: "combat_aid", rarity: "epic", effect: "heals critical wounds and stabilizes the patient", durability: 20 },
    "phoenix_kit": { name: "Phoenix Kit", type: "tool", subtype: "combat_aid", rarity: "legendary", effect: "heals critical wounds, stabilizes the patient, and revives them from death", durability: 25 },
    // - Bait
    "small_bait": { name: "Small Bait", type: "tool", subtype: "combat_bait", rarity: "common", effect: "attracts small enemies", durability: 10 },
    "medium_bait": { name: "Medium Bait", type: "tool", subtype: "combat_bait", rarity: "uncommon", effect: "attracts medium enemies", durability: 20 },
    "large_bait": { name: "Large Bait", type: "tool", subtype: "combat_bait", rarity: "rare", effect: "attracts large enemies", durability: 30 },
    "small_group_bait": { name: "Small Group Bait", type: "tool", subtype: "combat_bait", rarity: "uncommon", effect: "attracts a small group of enemies", durability: 15 },
    "medium_group_bait": { name: "Medium Group Bait", type: "tool", subtype: "combat_bait", rarity: "rare", effect: "attracts a medium group of enemies", durability: 25 },
    "large_group_bait": { name: "Large Group Bait", type: "tool", subtype: "combat_bait", rarity: "epic", effect: "attracts a large group of enemies", durability: 35 },
    // - Traps
    "trap": { name: "Trap", type: "tool", subtype: "combat_trap", rarity: "common", effect: "traps enemies for a short time", durability: 5 },
    "large_trap": { name: "Large Trap", type: "tool", subtype: "combat_trap", rarity: "uncommon", effect: "traps enemies for a moderate time", durability: 8 },
    "net_trap": { name: "Net Trap", type: "tool", subtype: "combat_trap", rarity: "uncommon", effect: "traps enemies for a longer time", durability: 10 },
    "large_net_trap": { name: "Large Net Trap", type: "tool", subtype: "combat_trap", rarity: "rare", effect: "traps enemies for a long time", durability: 15 },
    "escape_trap": { name: "Escape Trap", type: "tool", subtype: "combat_trap", rarity: "epic", effect: "traps enemies for a very long time and allows the user to escape", durability: 20 },
    // - Bombs
    "bomb": { name: "Bomb", type: "tool", subtype: "combat_bomb", rarity: "uncommon", effect: "deals area damage to enemies", durability: 1 },
    "smoke_bomb": { name: "Smoke Bomb", type: "tool", subtype: "combat_bomb", rarity: "rare", effect: "creates a smoke screen to escape enemies", durability: 1 },
    "flash_bomb": { name: "Flash Bomb", type: "tool", subtype: "combat_bomb", rarity: "epic", effect: "blinds enemies for a short time", durability: 1 },
    "sticky_bomb": { name: "Sticky Bomb", type: "tool", subtype: "combat_bomb", rarity: "legendary", effect: "sticks to enemies and deals damage over time", durability: 1 },
    "nuclear_bomb": { name: "Nuclear Bomb", type: "tool", subtype: "combat_bomb", rarity: "mythic", effect: "deals massive area damage to enemies, killing them.", durability: 1 },

    
    // Armors
    "simple_hood":          { name: "Simple Hood",          type: "armor", slot: "head", subtype: "simple_robe", rarity: "common", defense: 2, durability: 30 },
    "simple_gloves":        { name: "Simple Gloves",        type: "armor", slot: "hands", subtype: "simple_robe", rarity: "common", defense: 2, durability: 30 },
    "simple_tunic":         { name: "Simple Tunic",         type: "armor", slot: "torso", subtype: "simple_robe", rarity: "common", defense: 4, durability: 50 },
    "simple_pants":         { name: "Simple Pants",         type: "armor", slot: "legs", subtype: "simple_robe", rarity: "common", defense: 3, durability: 40 },
    "simple_boots":         { name: "Simple Boots",         type: "armor", slot: "boots", subtype: "simple_robe", rarity: "common", defense: 2, durability: 30 },
    "simple_cloak":         { name: "Simple Cloak",         type: "armor", slot: "cloak", subtype: "simple_robe", rarity: "common", defense: 1, durability: 20 },

    "leather_cowl":       { name: "Leather Cowl",       type: "armor", slot: "head", subtype: "leather", rarity: "common", defense: 5, durability: 50 },
    "leather_gloves":     { name: "Leather Gloves",     type: "armor", slot: "hands", subtype: "leather", rarity: "common", defense: 5, durability: 50 },
    "leather_tunic":      { name: "Leather Tunic",      type: "armor", slot: "torso", subtype: "leather", rarity: "common", defense: 10, durability: 80 },
    "leather_pants":      { name: "Leather Pants",      type: "armor", slot: "legs", subtype: "leather", rarity: "common", defense: 8, durability: 70 },
    "leather_boots":      { name: "Leather Boots",      type: "armor", slot: "boots", subtype: "leather", rarity: "common", defense: 5, durability: 50 },

    "tin_helmet":        { name: "Tin Helmet",        type: "armor", slot: "head", subtype: "tin", rarity: "common", defense: 10, durability: 100 },
    "tin_gauntlets":     { name: "Tin Gauntlets",     type: "armor", slot: "hands", subtype: "tin", rarity: "common", defense: 10, durability: 100 },
    "tin_chestplate":    { name: "Tin Chestplate",    type: "armor", slot: "torso", subtype: "tin", rarity: "common", defense: 20, durability: 150 },
    "tin_leggings":      { name: "Tin Leggings",      type: "armor", slot: "legs", subtype: "tin", rarity: "common", defense: 15, durability: 120 },
    "tin_boots":         { name: "Tin Boots",         type: "armor", slot: "boots", subtype: "tin", rarity: "common", defense: 10, durability: 100 },

    "copper_helmet":     { name: "Copper Helmet",     type: "armor", slot: "head", subtype: "copper", rarity: "uncommon", defense: 12, durability: 110 },
    "copper_gauntlets":  { name: "Copper Gauntlets",  type: "armor", slot: "hands", subtype: "copper", rarity: "uncommon", defense: 12, durability: 110 },
    "copper_chestplate": { name: "Copper Chestplate", type: "armor", slot: "torso", subtype: "copper", rarity: "uncommon", defense: 22, durability: 160 },
    "copper_leggings":   { name: "Copper Leggings",   type: "armor", slot: "legs", subtype: "copper", rarity: "uncommon", defense: 18, durability: 130 },
    "copper_boots":      { name: "Copper Boots",      type: "armor", slot: "boots", subtype: "copper", rarity: "uncommon", defense: 12, durability: 110 },

    "chainmail_cowl":       { name: "Chainmail Cowl",       type: "armor", slot: "head", subtype: "chainmail", rarity: "rare", defense: 20, durability: 150 },
    "chainmail_gloves":     { name: "Chainmail Gloves",     type: "armor", slot: "hands", subtype: "chainmail", rarity: "rare", defense: 20, durability: 150 },
    "chainmail_tunic":      { name: "Chainmail Tunic",      type: "armor", slot: "torso", subtype: "chainmail", rarity: "rare", defense: 40, durability: 250 },
    "chainmail_pants":      { name: "Chainmail Pants",      type: "armor", slot: "legs", subtype: "chainmail", rarity: "rare", defense: 30, durability: 200 },
    "chainmail_boots":      { name: "Chainmail Boots",      type: "armor", slot: "boots", subtype: "chainmail", rarity: "rare", defense: 20, durability: 150 },

    "bronze_helmet":     { name: "Bronze Helmet",     type: "armor", slot: "head", subtype: "bronze", rarity: "uncommon", defense: 15, durability: 120 },
    "bronze_gauntlets":  { name: "Bronze Gauntlets",  type: "armor", slot: "hands", subtype: "bronze", rarity: "uncommon", defense: 15, durability: 120 },
    "bronze_chestplate": { name: "Bronze Chestplate", type: "armor", slot: "torso", subtype: "bronze", rarity: "uncommon", defense: 25, durability: 180 },
    "bronze_leggings":   { name: "Bronze Leggings",   type: "armor", slot: "legs", subtype: "bronze", rarity: "uncommon", defense: 20, durability: 150 },
    "bronze_boots":      { name: "Bronze Boots",      type: "armor", slot: "boots", subtype: "bronze", rarity: "uncommon", defense: 15, durability: 120 },

    "iron_helmet":       { name: "Iron Helmet",     type: "armor", slot: "head", subtype: "iron", rarity: "common", defense: 10, durability: 100 },
    "iron_gauntlets":    { name: "Iron Gauntlets",  type: "armor", slot: "hands", subtype: "iron", rarity: "common", defense: 10, durability: 100 },
    "iron_chestplate":   { name: "Iron Chestplate", type: "armor", slot: "torso", subtype: "iron", rarity: "common", defense: 20, durability: 150 },
    "iron_leggings":     { name: "Iron Leggings",   type: "armor", slot: "legs", subtype: "iron", rarity: "common", defense: 15, durability: 120 },
    "iron_boots":        { name: "Iron Boots",      type: "armor", slot: "boots", subtype: "iron", rarity: "common", defense: 10, durability: 100 },

    "cobalt_helmet":     { name: "Cobalt Helmet",     type: "armor", slot: "head", subtype: "cobalt", rarity: "rare", defense: 30, durability: 150 },
    "cobalt_gauntlets":  { name: "Cobalt Gauntlets",  type: "armor", slot: "hands", subtype: "cobalt", rarity: "rare", defense: 30, durability: 150 },
    "cobalt_chestplate": { name: "Cobalt Chestplate", type: "armor", slot: "torso", subtype: "cobalt", rarity: "rare", defense: 40, durability: 200 },
    "cobalt_leggings":   { name: "Cobalt Leggings",   type: "armor", slot: "legs", subtype: "cobalt", rarity: "rare", defense: 35, durability: 180 },
    "cobalt_boots":      { name: "Cobalt Boots",      type: "armor", slot: "boots", subtype: "cobalt", rarity: "rare", defense: 30, durability: 150 },

    "steel_helmet":      { name: "Steel Helmet",     type: "armor", slot: "head", subtype: "steel", rarity: "uncommon", defense: 20, durability: 150 },
    "steel_gauntlets":   { name: "Steel Gauntlets",  type: "armor", slot: "hands", subtype: "steel", rarity: "uncommon", defense: 20, durability: 150 },
    "steel_chestplate":  { name: "Steel Chestplate", type: "armor", slot: "torso", subtype: "steel", rarity: "uncommon", defense: 30, durability: 200 },
    "steel_leggings":    { name: "Steel Leggings",   type: "armor", slot: "legs", subtype: "steel", rarity: "uncommon", defense: 25, durability: 180 },
    "steel_boots":       { name: "Steel Boots",      type: "armor", slot: "boots", subtype: "steel", rarity: "uncommon", defense: 20, durability: 150 },

    "mithril_helmet":     { name: "Mithril Helmet", type: "armor", slot: "head", subtype: "mithril", rarity: "epic", defense: 40, durability: 200 },
    "mithril_gauntlets":  { name: "Mithril Gauntlets", type: "armor", slot: "hands", subtype: "mithril", rarity: "epic", defense: 40, durability: 200 },
    "mithril_chestplate": { name: "Mithril Chestplate", type: "armor", slot: "torso", subtype: "mithril", rarity: "epic", defense: 50, durability: 250 },
    "mithril_leggings":   { name: "Mithril Leggings", type: "armor", slot: "legs", subtype: "mithril", rarity: "epic", defense: 45, durability: 220 },
    "mithril_boots":      { name: "Mithril Boots", type: "armor", slot: "boots", subtype: "mithril", rarity: "epic", defense: 40, durability: 200 },

    "adamantite_helmet":     { name: "Adamantite Helmet", type: "armor", slot: "head", subtype: "adamantite", rarity: "legendary", defense: 60, durability: 250 },
    "adamantite_gauntlets":  { name: "Adamantite Gauntlets", type: "armor", slot: "hands", subtype: "adamantite", rarity: "legendary", defense: 60, durability: 250 },
    "adamantite_chestplate": { name: "Adamantite Chestplate", type: "armor", slot: "torso", subtype: "adamantite", rarity: "legendary", defense: 70, durability: 300 },
    "adamantite_leggings":   { name: "Adamantite Leggings", type: "armor", slot: "legs", subtype: "adamantite", rarity: "legendary", defense: 65, durability: 280 },
    "adamantite_boots":      { name: "Adamantite Boots", type: "armor", slot: "boots", subtype: "adamantite", rarity: "legendary", defense: 60, durability: 250 },

    "syllic_helmet":     { name: "Syllic Helmet", type: "armor", slot: "head", subtype: "syllic", rarity: "mythic", defense: 80, durability: 300 },
    "syllic_gauntlets":  { name: "Syllic Gauntlets", type: "armor", slot: "hands", subtype: "syllic", rarity: "mythic", defense: 80, durability: 300 },
    "syllic_chestplate": { name: "Syllic Chestplate", type: "armor", slot: "torso", subtype: "syllic", rarity: "mythic", defense: 90, durability: 350 },
    "syllic_leggings":   { name: "Syllic Leggings", type: "armor", slot: "legs", subtype: "syllic", rarity: "mythic", defense: 85, durability: 320 },
    "syllic_boots":      { name: "Syllic Boots", type: "armor", slot: "boots", subtype: "syllic", rarity: "mythic", defense: 80, durability: 300 },

    // Mage Robes
    "blue_mage_hood":       { name: "Blue Mage Hood",       type: "armor", slot: "head", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "blue_mage_gloves":     { name: "Blue Mage Gloves",     type: "armor", slot: "hands", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "blue_mage_robe":       { name: "Blue Mage Robe",       type: "armor", slot: "torso", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 20, durability: 150 },
    "blue_mage_pants":      { name: "Blue Mage Pants",      type: "armor", slot: "legs", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 15, durability: 120 },
    "blue_mage_boots":      { name: "Blue Mage Boots",      type: "armor", slot: "boots", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "blue_mage_cape":       { name: "Blue Mage Cape",       type: "armor", slot: "cloak", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 5, durability: 80 },

    "red_mage_hood":       { name: "Red Mage Hood",       type: "armor", slot: "head", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "red_mage_gloves":     { name: "Red Mage Gloves",     type: "armor", slot: "hands", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "red_mage_robe":       { name: "Red Mage Robe",       type: "armor", slot: "torso", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 20, durability: 150 },
    "red_mage_pants":      { name: "Red Mage Pants",      type: "armor", slot: "legs", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 15, durability: 120 },
    "red_mage_boots":      { name: "Red Mage Boots",      type: "armor", slot: "boots", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "red_mage_cape":       { name: "Red Mage Cape",       type: "armor", slot: "cloak", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 5, durability: 80 },

    "green_mage_hood":       { name: "Green Mage Hood",       type: "armor", slot: "head", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "green_mage_gloves":     { name: "Green Mage Gloves",     type: "armor", slot: "hands", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "green_mage_robe":       { name: "Green Mage Robe",       type: "armor", slot: "torso", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 20, durability: 150 },
    "green_mage_pants":      { name: "Green Mage Pants",      type: "armor", slot: "legs", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 15, durability: 120 },
    "green_mage_boots":      { name: "Green Mage Boots",      type: "armor", slot: "boots", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 10, durability: 100 },
    "green_mage_cape":       { name: "Green Mage Cape",       type: "armor", slot: "cloak", subtype: "mage_robe", robetype: "basic", rarity: "mythic", defense: 5, durability: 80 },

    // Advanced Mage Robes (Mage Armors)
    "black_mage_hood":       { name: "Black Mage Hood",       type: "armor", slot: "head", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 20, durability: 140 },
    "black_mage_gloves":     { name: "Black Mage Gloves",     type: "armor", slot: "hands", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 20, durability: 140 },
    "black_mage_robe":       { name: "Black Mage Robe",       type: "armor", slot: "torso", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 40, durability: 200 },
    "black_mage_pants":      { name: "Black Mage Pants",      type: "armor", slot: "legs", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 30, durability: 180 },
    "black_mage_boots":      { name: "Black Mage Boots",      type: "armor", slot: "boots", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 20, durability: 140 },
    "black_mage_cape":       { name: "Black Mage Cape",       type: "armor", slot: "cloak", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 10, durability: 120 },

    "white_mage_hood":       { name: "White Mage Hood",       type: "armor", slot: "head", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 20, durability: 140 },
    "white_mage_gloves":     { name: "White Mage Gloves",     type: "armor", slot: "hands", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 20, durability: 140 },
    "white_mage_robe":       { name: "White Mage Robe",       type: "armor", slot: "torso", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 40, durability: 200 },
    "white_mage_pants":      { name: "White Mage Pants",      type: "armor", slot: "legs", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 30, durability: 180 },
    "white_mage_boots":      { name: "White Mage Boots",      type: "armor", slot: "boots", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 20, durability: 140 },
    "white_mage_cape":       { name: "White Mage Cape",       type: "armor", slot: "cloak", subtype: "mage_robe", robetype: "advanced", rarity: "mythic", defense: 10, durability: 120 },

    // Shields
    "wooden_shield":     { name: "Wooden Shield",     type: "armor", slot: "shield", subtype: "wooden", rarity: "common", defense: 10, durability: 100 },
    "tin_shield":        { name: "Tin Shield",        type: "armor", slot: "shield", subtype: "tin", rarity: "common", defense: 15, durability: 120 },
    "copper_shield":     { name: "Copper Shield",     type: "armor", slot: "shield", subtype: "copper", rarity: "uncommon", defense: 18, durability: 140 },
    "chainmail_shield":  { name: "Chainmail Shield",  type: "armor", slot: "shield", subtype: "chainmail", rarity: "rare", defense: 25, durability: 180 },
    "bronze_shield":     { name: "Bronze Shield",     type: "armor", slot: "shield", subtype: "bronze", rarity: "uncommon", defense: 20, durability: 150 },
    "iron_shield":       { name: "Iron Shield",       type: "armor", slot: "shield", subtype: "iron", rarity: "common", defense: 15, durability: 120 },
    "cobalt_shield":     { name: "Cobalt Shield",     type: "armor", slot: "shield", subtype: "cobalt", rarity: "rare", defense: 30, durability: 200 },
    "steel_shield":      { name: "Steel Shield",      type: "armor", slot: "shield", subtype: "steel", rarity: "uncommon", defense: 25, durability: 180 },
    "mithril_shield":    { name: "Mithril Shield",    type: "armor", slot: "shield", subtype: "mithril", rarity: "epic", defense: 40, durability: 250 },
    "adamantite_shield": { name: "Adamantite Shield", type: "armor", slot: "shield", subtype: "adamantite", rarity: "legendary", defense: 50, durability: 300 },
    "syllic_shield":     { name: "Syllic Shield",     type: "armor", slot: "shield", subtype: "syllic", rarity: "mythic", defense: 60, durability: 350 },

    // Potions
    "healing_potion": { name: "Healing Potion", type: "potion", subtype: "heal", rarity: "common", heal: 20 },
    "mana_potion": { name: "Mana Potion", type: "potion", subtype: "mana", rarity: "common", mana_restore: 20 },
    "attack_potion": { name: "Attack Potion", type: "potion", subtype: "buff", rarity: "uncommon", buff: { stat: "attack", duration: 30 } },
    "strength_potion": { name: "Strength Potion", type: "potion", subtype: "buff", rarity: "uncommon", buff: { stat: "strength", duration: 30 } },
    "defense_potion": { name: "Defense Potion", type: "potion", subtype: "buff", rarity: "uncommon", buff: { stat: "defense", duration: 30 } },
    
    // Poisons
    "poison_potion": { name: "Poison Potion", type: "potion", subtype: "poison", rarity: "rare", poison_damage: 20 },
    "defense_debuff_poison": { name: "Defense Debuff Poison", type: "potion", subtype: "poison", rarity: "uncommon", poison: { stat: "defense", duration: 30 } },
    "health_poison": { name: "Health Poison", type: "potion", subtype: "poison", rarity: "uncommon", poison: { stat: "health", damage: 25 } },
    
    // Aid Items
    "bandage": { name: "Bandage", type: "aid", subtype: "heal", rarity: "common", heal: 10 },
    "antidote": { name: "Antidote", type: "aid", subtype: "cure", rarity: "common", cure: ["poison"] },
    "elixir": { name: "Elixir", type: "aid", subtype: "restore", rarity: "rare", restore: ["health", "mana"] },
    "revive": { name: "Revive", type: "aid", subtype: "revive", rarity: "rare", revive: true },
    "antivenom": { name: "Antivenom", type: "aid", subtype: "cure", rarity: "uncommon", cure: ["poison"] },

    // Tools
    // - Tool Starters
    "shovel_starter": { name: "Shovel Starter", type: "crafting", subtype: "tool", rarity: "common", durability: 50 },
    "saw_starter": { name: "Saw Starter", type: "crafting", subtype: "tool", rarity: "common", durability: 50 },
    "axe_starter": { name: "Axe Starter", type: "crafting", subtype: "tool", rarity: "common", durability: 50 },
    "fishing_rod_starter": { name: "Fishing Rod Starter", type: "crafting", subtype: "tool", rarity: "common", durability: 50 },
    "pickaxe_starter": { name: "Pickaxe Starter", type: "crafting", subtype: "tool", rarity: "common", durability: 50 },
    // - Basic Tools
    "hammer": { name: "Hammer", type: "tool", subtype: "hammer", rarity: "common", durability: 50 },
    "shovel": { name: "Shovel", type: "tool", subtype: "shovel", rarity: "common", durability: 60 },
    "saw":    { name: "Saw",    type: "tool", subtype: "saw",    rarity: "common", durability: 70 },
    "axe":    { name: "Axe",    type: "tool", subtype: "axe",    rarity: "common", durability: 80 },
    // "fishing_rod" lives in FISHING_ITEMS now, as the basic tier of its own rod
    // ladder - the starter pack, tool kit and crafting recipe still resolve it.
    "pickaxe": { name: "Pickaxe", type: "tool", subtype: "pickaxe", rarity: "common", durability: 60 },
    "lockpick": { name: "Lockpick", type: "tool", subtype: "lockpick", rarity: "uncommon", durability: 50 },
    // - Advanced Tools
    // - - Shovels
    "tin_shovel": { name: "Tin Shovel", type: "tool", subtype: "shovel", rarity: "common", durability: 70 },
    "copper_shovel": { name: "Copper Shovel", type: "tool", subtype: "shovel", rarity: "common", durability: 70 },
    "bronze_shovel": { name: "Bronze Shovel", type: "tool", subtype: "shovel", rarity: "uncommon", durability: 80 },
    "iron_shovel": { name: "Iron Shovel", type: "tool", subtype: "shovel", rarity: "common", durability: 70 },
    "steel_shovel": { name: "Steel Shovel", type: "tool", subtype: "shovel", rarity: "uncommon", durability: 80 },
    "mithril_shovel": { name: "Mithril Shovel", type: "tool", subtype: "shovel", rarity: "epic", durability: 150 },
    "adamantite_shovel": { name: "Adamantite Shovel", type: "tool", subtype: "shovel", rarity: "legendary", durability: 200 },
    "syllic_shovel": { name: "Syllic Shovel", type: "tool", subtype: "shovel", rarity: "mythic", durability: 250 },
    // - - Saws
    "tin_saw": { name: "Tin Saw", type: "tool", subtype: "saw", rarity: "common", durability: 70 },
    "copper_saw": { name: "Copper Saw", type: "tool", subtype: "saw", rarity: "common", durability: 70 },
    "bronze_saw": { name: "Bronze Saw", type: "tool", subtype: "saw", rarity: "uncommon", durability: 80 },
    "iron_saw": { name: "Iron Saw", type: "tool", subtype: "saw", rarity: "common", durability: 75 },
    "steel_saw": { name: "Steel Saw", type: "tool", subtype: "saw", rarity: "uncommon", durability: 80 },
    "mithril_saw": { name: "Mithril Saw", type: "tool", subtype: "saw", rarity: "epic", durability: 150 },
    "adamantite_saw": { name: "Adamantite Saw", type: "tool", subtype: "saw", rarity: "legendary", durability: 200 },
    "syllic_saw": { name: "Syllic Saw", type: "tool", subtype: "saw", rarity: "mythic", durability: 250 },
    // - - Axes
    "tin_axe": { name: "Tin Axe", type: "tool", subtype: "axe", rarity: "common", durability: 70 },
    "copper_axe": { name: "Copper Axe", type: "tool", subtype: "axe", rarity: "common", durability: 70 },
    "bronze_axe": { name: "Bronze Axe", type: "tool", subtype: "axe", rarity: "uncommon", durability: 80 },
    "iron_axe": { name: "Iron Axe", type: "tool", subtype: "axe", rarity: "common", durability: 75 },
    "steel_axe": { name: "Steel Axe", type: "tool", subtype: "axe", rarity: "uncommon", durability: 80 },
    "mithril_axe": { name: "Mithril Axe", type: "tool", subtype: "axe", rarity: "epic", durability: 150 },
    "adamantite_axe": { name: "Adamantite Axe", type: "tool", subtype: "axe", rarity: "legendary", durability: 200 },
    "syllic_axe": { name: "Syllic Axe", type: "tool", subtype: "axe", rarity: "mythic", durability: 250 },
    // - - Fishing Rods
    "tin_fishing_rod": { name: "Tin Fishing Rod", type: "tool", subtype: "fishing rod", rarity: "common", durability: 70 },
    "copper_fishing_rod": { name: "Copper Fishing Rod", type: "tool", subtype: "fishing rod", rarity: "common", durability: 70 },
    "bronze_fishing_rod": { name: "Bronze Fishing Rod", type: "tool", subtype: "fishing rod", rarity: "uncommon", durability: 80 },
    "iron_fishing_rod": { name: "Iron Fishing Rod", type: "tool", subtype: "fishing rod", rarity: "common", durability: 75 },
    "steel_fishing_rod": { name: "Steel Fishing Rod", type: "tool", subtype: "fishing rod", rarity: "uncommon", durability: 80 },
    "mithril_fishing_rod": { name: "Mithril Fishing Rod", type: "tool", subtype: "fishing rod", rarity: "epic", durability: 150 },
    "adamantite_fishing_rod": { name: "Adamantite Fishing Rod", type: "tool", subtype: "fishing rod", rarity: "legendary", durability: 200 },
    "syllic_fishing_rod": { name: "Syllic Fishing Rod", type: "tool", subtype: "fishing rod", rarity: "mythic", durability: 250 },
    // - - Pickaxes
    "tin_pickaxe": { name: "Tin Pickaxe", type: "tool", subtype: "pickaxe", rarity: "common", durability: 70 },
    "copper_pickaxe": { name: "Copper Pickaxe", type: "tool", subtype: "pickaxe", rarity: "common", durability: 70 },
    "bronze_pickaxe": { name: "Bronze Pickaxe", type: "tool", subtype: "pickaxe", rarity: "uncommon", durability: 80 },
    "iron_pickaxe": { name: "Iron Pickaxe", type: "tool", subtype: "pickaxe", rarity: "common", durability: 75 },
    "steel_pickaxe": { name: "Steel Pickaxe", type: "tool", subtype: "pickaxe", rarity: "uncommon", durability: 80 },
    "mithril_pickaxe": { name: "Mithril Pickaxe", type: "tool", subtype: "pickaxe", rarity: "epic", durability: 150 },
    "adamantite_pickaxe": { name: "Adamantite Pickaxe", type: "tool", subtype: "pickaxe", rarity: "legendary", durability: 200 },
    "syllic_pickaxe": { name: "Syllic Pickaxe", type: "tool", subtype: "pickaxe", rarity: "mythic", durability: 250 },

    // Kits
    // - Basic Kits
    "first_aid_kit": { name: "First Aid Kit", type: "kit", subtype: "first_aid", rarity: "uncommon", contents: ["healing_potion", "bandage"] },
    "survival_kit": { name: "Survival Kit", type: "kit", subtype: "survival", rarity: "rare", contents: ["healing_potion", "mana_potion", "bread"] },
    "tool_kit": { name: "Tool Kit", type: "kit", subtype: "tool", rarity: "uncommon", contents: ["hammer", "shovel", "saw"] },
    "crafting_kit": { name: "Crafting Kit", type: "kit", subtype: "crafting", rarity: "rare", contents: {"hammer": 1, "shovel": 1, "wood": 3, "iron_bar": 2} },
    // - Advanced Kits
    "advanced_first_aid_kit": { name: "Advanced First Aid Kit", type: "kit", subtype: "first_aid", rarity: "rare", contents: {"healing_potion": 3, "mana_potion": 2, "bandage": 5} },
    "advanced_survival_kit": { name: "Advanced Survival Kit", type: "kit", subtype: "survival", rarity: "epic", contents: {"healing_potion": 5, "mana_potion": 3, "bread": 2, "empty_bottle": 3} },
    "advanced_tool_kit": { name: "Advanced Tool Kit", type: "kit", subtype: "tool", rarity: "rare", contents: {"hammer": 1, "shovel": 1, "saw": 1, "axe": 1, "fishing_rod": 1, "iron_pickaxe": 1} },
    // - Armor Kits
    "bronze_helmet_kit": { name: "Bronze Helmet Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["bronze_helmet"] },
    "bronze_chestplate_kit": { name: "Bronze Chestplate Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["bronze_chestplate"] },
    "bronze_leggings_kit": { name: "Bronze Leggings Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["bronze_leggings"] },
    "bronze_boots_kit": { name: "Bronze Boots Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["bronze_boots"] },
    "bronze_gauntlets_kit": { name: "Bronze Gauntlets Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["bronze_gauntlets"] },
    "iron_helmet_kit": { name: "Iron Helmet Kit", type: "kit", subtype: "armor", rarity: "common", recipes: ["iron_helmet"] },
    "iron_chestplate_kit": { name: "Iron Chestplate Kit", type: "kit", subtype: "armor", rarity: "common", recipes: ["iron_chestplate"] },
    "iron_leggings_kit": { name: "Iron Leggings Kit", type: "kit", subtype: "armor", rarity: "common", recipes: ["iron_leggings"] },
    "iron_boots_kit": { name: "Iron Boots Kit", type: "kit", subtype: "armor", rarity: "common", recipes: ["iron_boots"] },
    "iron_gauntlets_kit": { name: "Iron Gauntlets Kit", type: "kit", subtype: "armor", rarity: "common", recipes: ["iron_gauntlets"] },
    "steel_helmet_kit": { name: "Steel Helmet Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["steel_helmet"] },
    "steel_chestplate_kit": { name: "Steel Chestplate Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["steel_chestplate"] },
    "steel_leggings_kit": { name: "Steel Leggings Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["steel_leggings"] },
    "steel_boots_kit": { name: "Steel Boots Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["steel_boots"] },
    "steel_gauntlets_kit": { name: "Steel Gauntlets Kit", type: "kit", subtype: "armor", rarity: "uncommon", recipes: ["steel_gauntlets"] },
    "mithril_helmet_kit": { name: "Mithril Helmet Kit", type: "kit", subtype: "armor", rarity: "epic", recipes: ["mithril_helmet"] },
    "mithril_chestplate_kit": { name: "Mithril Chestplate Kit", type: "kit", subtype: "armor", rarity: "epic", recipes: ["mithril_chestplate"] },
    "mithril_leggings_kit": { name: "Mithril Leggings Kit", type: "kit", subtype: "armor", rarity: "epic", recipes: ["mithril_leggings"] },
    "mithril_boots_kit": { name: "Mithril Boots Kit", type: "kit", subtype: "armor", rarity: "epic", recipes: ["mithril_boots"] },
    "mithril_gauntlets_kit": { name: "Mithril Gauntlets Kit", type: "kit", subtype: "armor", rarity: "epic", recipes: ["mithril_gauntlets"] },
    "adamantite_helmet_kit": { name: "Adamantite Helmet Kit", type: "kit", subtype: "armor", rarity: "legendary", recipes: ["adamantite_helmet"] },
    "adamantite_chestplate_kit": { name: "Adamantite Chestplate Kit", type: "kit", subtype: "armor", rarity: "legendary", recipes: ["adamantite_chestplate"] },
    "adamantite_leggings_kit": { name: "Adamantite Leggings Kit", type: "kit", subtype: "armor", rarity: "legendary", recipes: ["adamantite_leggings"] },
    "adamantite_boots_kit": { name: "Adamantite Boots Kit", type: "kit", subtype: "armor", rarity: "legendary", recipes: ["adamantite_boots"] },
    "adamantite_gauntlets_kit": { name: "Adamantite Gauntlets Kit", type: "kit", subtype: "armor", rarity: "legendary", recipes: ["adamantite_gauntlets"] },
    
    // Sets
    // - Armor Sets
    "bronze_armor_set": { name: "Bronze Set", type: "set", subtype: "armor", rarity: "uncommon", items: ["bronze_helmet", "bronze_chestplate", "bronze_leggings", "bronze_boots", "bronze_gauntlets"] },
    "iron_armor_set": { name: "Iron Set", type: "set", subtype: "armor", rarity: "common", items: ["iron_helmet", "iron_chestplate", "iron_leggings", "iron_boots", "iron_gauntlets"] },
    "steel_armor_set": { name: "Steel Set", type: "set", subtype: "armor", rarity: "uncommon", items: ["steel_helmet", "steel_chestplate", "steel_leggings", "steel_boots", "steel_gauntlets"] },
    "mithril_armor_set": { name: "Mithril Set", type: "set", subtype: "armor", rarity: "epic", items: ["mithril_helmet", "mithril_chestplate", "mithril_leggings", "mithril_boots", "mithril_gauntlets"] },
    "adamantite_armor_set": { name: "Adamantite Set", type: "set", subtype: "armor", rarity: "legendary", items: ["adamantite_helmet", "adamantite_chestplate", "adamantite_leggings", "adamantite_boots", "adamantite_gauntlets"] },
    // - Weapon Sets
    "bronze_weapon_set": { name: "Bronze Weapon Set", type: "set", subtype: "weapon", rarity: "uncommon", items: ["bronze_sword", "bronze_dagger", "bronze_bow"] },
    "iron_weapon_set": { name: "Iron Weapon Set", type: "set", subtype: "weapon", rarity: "common", items: ["iron_sword", "iron_dagger", "iron_bow"] },
    "steel_weapon_set": { name: "Steel Weapon Set", type: "set", subtype: "weapon", rarity: "uncommon", items: ["steel_sword", "steel_dagger", "steel_bow"] },
    "mithril_weapon_set": { name: "Mithril Weapon Set", type: "set", subtype: "weapon", rarity: "epic", items: ["mithril_sword", "mithril_dagger", "mithril_bow"] },
    "adamantite_weapon_set": { name: "Adamantite Weapon Set", type: "set", subtype: "weapon", rarity: "legendary", items: ["adamantite_sword", "adamantite_dagger", "adamantite_bow"] },
    // - Tool Sets
    "basic_tool_set": { name: "Basic Tool Set", type: "set", subtype: "tool", rarity: "common", items: ["hammer", "shovel", "saw"] },
    "advanced_tool_set": { name: "Advanced Tool Set", type: "set", subtype: "tool", rarity: "uncommon", items: ["iron_pickaxe", "steel_shovel", "mithril_saw"] },
    // - Crafting Sets
    "basic_crafting_set": { name: "Basic Crafting Set", type: "set", subtype: "crafting", rarity: "common", items: { "hammer": 1, "shovel": 1, "saw": 1, "wood": 5, "leather": 5, "string": 2, "empty_bottle": 2 } },
    "advanced_crafting_set": { name: "Advanced Crafting Set", type: "set", subtype: "crafting", rarity: "uncommon", items: { "iron_pickaxe": 1, "steel_shovel": 1, "mithril_saw": 1, "mithril_bar": 5, "wood": 8, "leather": 8, "string": 5, "empty_bottle": 5, "bone": 2 } },
    "fletching_set": { name: "Fletching Set", type: "set", subtype: "crafting", rarity: "uncommon", items: { "wood": 5, "feather": 10, "string": 5, "iron_bar": 2 } },
    "smithing_set": { name: "Smithing Set", type: "set", subtype: "crafting", rarity: "uncommon", items: { "iron_bar": 5, "steel_bar": 3, "mithril_bar": 2, "adamantite_bar": 1, "hammer": 1 } },

    
    // Edible Raw Foods
    // The generic "raw_fish"/"raw_crab" pair used to live here. Every catch is
    // now a named species in FISHING_ITEMS below (which owns raw_crab), and the
    // subtype "raw_fish" survives as the category all of them share.
    "raw_mushroom": { name: "Raw Mushroom", type: "food", subtype: "raw_fungi", gather: "forage", rarity: "common", health_boost: 5 },
    "raw_vegetables": { name: "Raw Vegetables", type: "food", subtype: "raw_vegetables", gather: "forage", rarity: "common", health_boost: 5 },
    "raw_herbs": { name: "Raw Herbs", type: "food", subtype: "raw_herbs", gather: "forage", rarity: "common", health_boost: 5 },
    "raw_fruits": { name: "Raw Fruits", type: "food", subtype: "raw_food", gather: "forage", rarity: "common", health_boost: 5 },

    // Inedible Raw Foods
    "raw_rabbit": { name: "Raw Rabbit", type: "food", subtype: "raw_meat", gather: "hunt", rarity: "common", health_boost: 5 },
    "raw_chicken": { name: "Raw Chicken", type: "food", subtype: "raw_meat", gather: "hunt", rarity: "common", health_boost: 5 },
    "raw_beef": { name: "Raw Beef", type: "food", subtype: "raw_meat", gather: "hunt", rarity: "common", health_boost: 5 },
    "raw_pork": { name: "Raw Pork", type: "food", subtype: "raw_meat", gather: "hunt", rarity: "common", health_boost: 5 },
    "raw_venison": { name: "Raw Venison", type: "food", subtype: "raw_meat", gather: "hunt", rarity: "common", health_boost: 5 },
    "raw_duck": { name: "Raw Duck", type: "food", subtype: "raw_meat", gather: "hunt", rarity: "common", health_boost: 5 },

    // Ingredients for Cooking (foragable, uses raw_food subtype)
    "salt": { name: "Salt", type: "food", subtype: "raw_food", rarity: "common", health_boost: 1 },
    "vinegar": { name: "Vinegar", type: "food", subtype: "raw_food", rarity: "common", health_boost: 1 },
    "oil": { name: "Oil", type: "food", subtype: "raw_food", rarity: "common", health_boost: 1 },
    "peppercorn": { name: "Peppercorn", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "pepper_flakes": { name: "Pepper Flakes", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "spices": { name: "Spices", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "herbs": { name: "Herbs", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "garlic_clove": { name: "Garlic Clove", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "onion_slice": { name: "Onion Slice", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "lemon": { name: "Lemon", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "lime": { name: "Lime", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "cinnamon_stick": { name: "Cinnamon Stick", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "nutmeg": { name: "Nutmeg", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "clove": { name: "Clove", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "bay_leaf": { name: "Bay Leaf", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "rosemary": { name: "Rosemary", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "thyme": { name: "Thyme", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "oregano": { name: "Oregano", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "basil": { name: "Basil", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "parsley": { name: "Parsley", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "dill": { name: "Dill", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "sage": { name: "Sage", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "tarragon": { name: "Tarragon", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "chili_pepper": { name: "Chili Pepper", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "paprika": { name: "Paprika", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "cayenne_pepper": { name: "Cayenne Pepper", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "saffron": { name: "Saffron", type: "food", subtype: "raw_food", rarity: "rare", health_boost: 5 },
    "vanilla_bean": { name: "Vanilla Bean", type: "food", subtype: "raw_food", rarity: "rare", health_boost: 5 },
    "cocoa_powder": { name: "Cocoa Powder", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "coffee_beans": { name: "Coffee Beans", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "tea_leaves": { name: "Tea Leaves", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "honey": { name: "Honey", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "maple_syrup": { name: "Maple Syrup", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "eggs": { name: "Eggs", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "cream": { name: "Cream", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "cheese": { name: "Cheese", type: "food", subtype: "raw_food", rarity: "common", health_boost: 3 },
    "green_tea_leaves": { name: "Green Tea Leaves", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "black_tea_leaves": { name: "Black Tea Leaves", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "white_tea_leaves": { name: "White Tea Leaves", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "herbal_tea_leaves": { name: "Herbal Tea Leaves", type: "food", subtype: "raw_food", rarity: "common", health_boost: 2 },
    "matcha_powder": { name: "Matcha Powder", type: "food", subtype: "raw_food", rarity: "rare", health_boost: 5 },

    // Non-forageable ingredients (subtypes: ingredient, pastry, dough, etc. - NOT raw_food)
    "flour": { name: "Flour", type: "food", subtype: "ingredient", rarity: "common" },
    "sugar": { name: "Sugar", type: "food", subtype: "ingredient", rarity: "common" },
    "yeast": { name: "Yeast", type: "food", subtype: "ingredient", rarity: "common" },
    "butter": { name: "Butter", type: "food", subtype: "ingredient", rarity: "common" },
    "milk": { name: "Milk", type: "food", subtype: "ingredient", rarity: "common" },
    "baking_powder": { name: "Baking Powder", type: "food", subtype: "ingredient", rarity: "common" },
    "baking_soda": { name: "Baking Soda", type: "food", subtype: "ingredient", rarity: "common" },
    "pie_crust": { name: "Pie Crust", type: "food", subtype: "ingredient", rarity: "common" },
    "cake_mix": { name: "Cake Mix", type: "food", subtype: "ingredient", rarity: "common" },
    "bread_dough": { name: "Bread Dough", type: "food", subtype: "ingredient", rarity: "common" },

    // Fruits 
    "apple": { name: "Apple", type: "food", subtype: "raw_fruits", rarity: "common", health_boost: 5 },
    "banana": { name: "Banana", type: "food", subtype: "raw_fruits", rarity: "common", health_boost: 5 },
    "orange": { name: "Orange", type: "food", subtype: "raw_fruits", rarity: "common", health_boost: 5 },
    "grape": { name: "Grape", type: "food", subtype: "raw_fruits", rarity: "common", health_boost: 5 },
    "strawberry": { name: "Strawberry", type: "food", subtype: "raw_fruits", rarity: "common", health_boost: 5 },
    "peach": { name: "Peach", type: "food", subtype: "raw_fruits", rarity: "common", health_boost: 5 },
    
    // Vegetables
    "carrot": { name: "Carrot", type: "food", subtype: "raw_vegetables", rarity: "common", health_boost: 5 },
    "potato": { name: "Potato", type: "food", subtype: "raw_vegetables", rarity: "common", health_boost: 5 },
    "tomato": { name: "Tomato", type: "food", subtype: "raw_vegetables", rarity: "common", health_boost: 5 },
    "onion": { name: "Onion", type: "food", subtype: "raw_vegetables", rarity: "common", health_boost: 5 },
    "garlic": { name: "Garlic", type: "food", subtype: "raw_vegetables", rarity: "common", health_boost: 5 },
    "pepper": { name: "Pepper", type: "food", subtype: "raw_vegetables", rarity: "common", health_boost: 5 },
    "cucumber": { name: "Cucumber", type: "food", subtype: "raw_vegetables", rarity: "common", health_boost: 5 },
    "lettuce": { name: "Lettuce", type: "food", subtype: "raw_vegetables", rarity: "common", health_boost: 5 },

    // Herbs and Mushrooms for potions and cooking
    "green_herbs": { name: "Green Herbs", type: "food", subtype: "raw_herbs", rarity: "common", health_boost: 5 },
    "red_herbs": { name: "Red Herbs", type: "food", subtype: "raw_herbs", rarity: "common", health_boost: 5 },
    "yellow_herbs": { name: "Yellow Herbs", type: "food", subtype: "raw_herbs", rarity: "common", health_boost: 5 },
    "blue_herbs": { name: "Blue Herbs", type: "food", subtype: "raw_herbs", rarity: "common", health_boost: 5 },
    "purple_herbs": { name: "Purple Herbs", type: "food", subtype: "raw_herbs", rarity: "common", health_boost: 5 },
    "white_herbs": { name: "White Herbs", type: "food", subtype: "raw_herbs", rarity: "common", health_boost: 5 },
    "black_herbs": { name: "Black Herbs", type: "food", subtype: "raw_herbs", rarity: "common", health_boost: 5 },
    "red_mushroom": { name: "Red Mushroom", type: "food", subtype: "raw_fungi", rarity: "common", health_boost: 5 },
    "green_mushroom": { name: "Green Mushroom", type: "food", subtype: "raw_fungi", rarity: "common", health_boost: 5 },
    "blue_mushroom": { name: "Blue Mushroom", type: "food", subtype: "raw_fungi", rarity: "common", health_boost: 5 },
    "yellow_mushroom": { name: "Yellow Mushroom", type: "food", subtype: "raw_fungi", rarity: "common", health_boost: 5 },
    "purple_mushroom": { name: "Purple Mushroom", type: "food", subtype: "raw_fungi", rarity: "common", health_boost: 5 },
    "white_mushroom": { name: "White Mushroom", type: "food", subtype: "raw_fungi", rarity: "common", health_boost: 5 },
    "black_mushroom": { name: "Black Mushroom", type: "food", subtype: "raw_fungi", rarity: "common", health_boost: 5 },
    "red_berry": { name: "Red Berry", type: "food", subtype: "raw_food", rarity: "common", health_boost: 5 },
    "green_berry": { name: "Green Berry", type: "food", subtype: "raw_food", rarity: "common", health_boost: 5 },
    "blue_berry": { name: "Blue Berry", type: "food", subtype: "raw_food", rarity: "common", health_boost: 5 },
    "yellow_berry": { name: "Yellow Berry", type: "food", subtype: "raw_food", rarity: "common", health_boost: 5 },
    "purple_berry": { name: "Purple Berry", type: "food", subtype: "raw_food", rarity: "common", health_boost: 5 },
    "white_berry": { name: "White Berry", type: "food", subtype: "raw_food", rarity: "common", health_boost: 5 },
    "black_berry": { name: "Black Berry", type: "food", subtype: "raw_food", rarity: "common", health_boost: 5 },

    // Basic Cooked Food
    "cooked_rabbit": { name: "Cooked Rabbit", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_chicken": { name: "Cooked Chicken", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_beef": { name: "Cooked Beef", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_pork": { name: "Cooked Pork", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_venison": { name: "Cooked Venison", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_duck": { name: "Cooked Duck", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    // cooked_fish/cooked_crab/cooked_lobster/cooked_clam moved to FISHING_ITEMS,
    // which cooks each species separately (and six ways).
    "cooked_mushroom": { name: "Cooked Mushroom", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_vegetables": { name: "Cooked Vegetables", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_fruits": { name: "Cooked Fruits", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_herbs": { name: "Cooked Herbs", type: "food", subtype: "cooked_food", rarity: "common", health_boost: 15 },
    "cooked_stew": { name: "Cooked Stew", type: "food", subtype: "stew", rarity: "uncommon", health_boost: 25 },

    // Mixed Cooked Foods
    "meat_stew": { name: "Meat Stew", type: "food", subtype: "stew", rarity: "uncommon", health_boost: 30 },
    "vegetable_stew": { name: "Vegetable Stew", type: "food", subtype: "stew", rarity: "uncommon", health_boost: 30 },
    "fruit_stew": { name: "Fruit Stew", type: "food", subtype: "stew", rarity: "uncommon", health_boost: 30 },
    "colorful_herb_stew": { name: "Colorful Herb Stew", type: "food", subtype: "stew", rarity: "uncommon", health_boost: 30 },
    "mixed_herb_stew":  { name: "Mixed Herb Stew", type: "food", subtype: "stew", rarity: "rare", health_boost: 40 },
    "vibrant_herb_stew": { name: "Vibrant Herb Stew", type: "food", subtype: "stew", rarity: "rare", health_boost: 50 },
    "ultimate_herb_stew": { name: "Ultimate Herb Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 75 },
    "colorful_mushroom_stew": { name: "Colorful Mushroom Stew", type: "food", subtype: "stew", rarity: "rare", health_boost: 50 },
    "mixed_mushroom_stew": { name: "Mixed Mushroom Stew", type: "food", subtype: "stew", rarity: "rare", health_boost: 60 },
    "vibrant_mushroom_stew": { name: "Vibrant Mushroom Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 80 },
    "ultimate_mushroom_stew": { name: "Ultimate Mushroom Stew", type: "food", subtype: "stew", rarity: "legendary", health_boost: 100 },
    "mixed_berry_stew": { name: "Mixed Berry Stew", type: "food", subtype: "stew", rarity: "rare", health_boost: 60 },
    "vibrant_berry_stew": { name: "Vibrant Berry Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 80 },
    "ultimate_berry_stew": { name: "Ultimate Berry Stew", type: "food", subtype: "stew", rarity: "legendary", health_boost: 100 },

    // Advanced Cooked Foods
    "gourmet_meat_stew": { name: "Gourmet Meat Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 80 },
    "gourmet_vegetable_stew": { name: "Gourmet Vegetable Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 80 },
    "gourmet_fruit_stew": { name: "Gourmet Fruit Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 80 },
    "gourmet_herb_stew": { name: "Gourmet Herb Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 80 },
    "gourmet_mushroom_stew": { name: "Gourmet Mushroom Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 80 },
    "gourmet_berry_stew": { name: "Gourmet Berry Stew", type: "food", subtype: "stew", rarity: "epic", health_boost: 80 },
    "ultimate_gourmet_stew": { name: "Ultimate Gourmet Stew", type: "food", subtype: "stew", rarity: "legendary", health_boost: 120 },
    
    // Basic Baked Goods
    "bread": { name: "Bread", type: "food", subtype: "baked", rarity: "common", health_boost: 10 },
    "golden_apple": { name: "Golden Apple", type: "food", subtype: "baked", rarity: "rare", health_boost: 20 },
    "cookies": { name: "Cookies", type: "food", subtype: "baked", rarity: "uncommon", health_boost: 20 },
    "cake": { name: "Cake", type: "food", subtype: "baked", rarity: "rare", health_boost: 30 },
    "pie": { name: "Pie", type: "food", subtype: "baked", rarity: "rare", health_boost: 30 },

    // Mixed Baked Goods
    "fruit_pie": { name: "Fruit Pie", type: "food", subtype: "baked", rarity: "rare", health_boost: 30 },
    "mixed_fruit_pie": { name: "Mixed Fruit Pie", type: "food", subtype: "baked", rarity: "epic", health_boost: 40 },
    "vibrant_fruit_pie": { name: "Vibrant Fruit Pie", type: "food", subtype: "baked", rarity: "epic", health_boost: 50 },
    "ultimate_fruit_pie": { name: "Ultimate Fruit Pie", type: "food", subtype: "baked", rarity: "legendary", health_boost: 60 },
    "berry_pie": { name: "Berry Pie", type: "food", subtype: "baked", rarity: "rare", health_boost: 30 },
    "mushroom_pie": { name: "Mushroom Pie", type: "food", subtype: "baked", rarity: "rare", health_boost: 30 },
    "mixed_mushroom_pie": { name: "Mixed Mushroom Pie", type: "food", subtype: "baked", rarity: "epic", health_boost: 40 },
    "vibrant_mushroom_pie": { name: "Vibrant Mushroom Pie", type: "food", subtype: "baked", rarity: "epic", health_boost: 50 },
    "ultimate_mushroom_pie": { name: "Ultimate Mushroom Pie", type: "food", subtype: "baked", rarity: "legendary", health_boost: 60 },
    "herb_bread": { name: "Herb Bread", type: "food", subtype: "baked", rarity: "uncommon", health_boost: 20 },
    "mixed_herb_bread": { name: "Mixed Herb Bread", type: "food", subtype: "baked", rarity: "rare", health_boost: 30 },
    "vibrant_herb_bread": { name: "Vibrant Herb Bread", type: "food", subtype: "baked", rarity: "epic", health_boost: 40 },
    "ultimate_herb_bread": { name: "Ultimate Herb Bread", type: "food", subtype: "baked", rarity: "legendary", health_boost: 50 },

    // Advanced Baked Goods
    "gourmet_fruit_pie": { name: "Gourmet Fruit Pie", type: "food", subtype: "baked", rarity: "epic", health_boost: 50 },
    "gourmet_mushroom_pie": { name: "Gourmet Mushroom Pie", type: "food", subtype: "baked", rarity: "epic", health_boost: 50 },
    "gourmet_herb_bread": { name: "Gourmet Herb Bread", type: "food", subtype: "baked", rarity: "epic", health_boost: 50 },
    "ultimate_gourmet_baked_goods": { name: "Ultimate Gourmet Baked Goods", type: "food", subtype: "baked", rarity: "legendary", health_boost: 75 },

    // Brewed Drinks
    // - Teas
    "herbal_tea": { name: "Herbal Tea", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "green_tea": { name: "Green Tea", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "black_tea": { name: "Black Tea", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "white_tea": { name: "White Tea", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    // - Fruit Juices
    "fruit_juice": { name: "Fruit Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "peach_juice": { name: "Peach Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "apple_juice": { name: "Apple Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "grape_juice": { name: "Grape Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "orange_juice": { name: "Orange Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    // - Berry Juices
    "red_berry_juice": { name: "Red Berry Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "green_berry_juice": { name: "Green Berry Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "blue_berry_juice": { name: "Blue Berry Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "yellow_berry_juice": { name: "Yellow Berry Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "purple_berry_juice": { name: "Purple Berry Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "white_berry_juice": { name: "White Berry Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "black_berry_juice": { name: "Black Berry Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "berry_juice": { name: "Berry Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    // - Vegetable Juices
    "citrus_juice": { name: "Citrus Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "vegetable_juice": { name: "Vegetable Juice", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    // - Coffee and Cocoa
    "coffee": { name: "Coffee", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },
    "cocoa": { name: "Cocoa", type: "food", subtype: "brewed", rarity: "uncommon", health_boost: 15 },

    // - Mixed Brews
    "mushroom_brew": { name: "Mushroom Brew", type: "food", subtype: "brewed", rarity: "rare", health_boost: 20 },
    "berry_brew": { name: "Berry Brew", type: "food", subtype: "brewed", rarity: "rare", health_boost: 20 },
    "mixed_herb_brew": { name: "Mixed Herb Brew", type: "food", subtype: "brewed", rarity: "epic", health_boost: 30 },
    "vibrant_herb_brew": { name: "Vibrant Herb Brew", type: "food", subtype: "brewed", rarity: "epic", health_boost: 40 },
    "ultimate_herb_brew": { name: "Ultimate Herb Brew", type: "food", subtype: "brewed", rarity: "legendary", health_boost: 50 },

    // Basic Items
    "wood": { name: "Wood", type: "crafting", subtype: "wood", gather: "chop", rarity: "common" },
    "leather": { name: "Leather", type: "crafting", subtype: "raw", gather: "tan", rarity: "common" },
    "string": { name: "String", type: "crafting", subtype: "string", rarity: "common" },
    "firewood": { name: "Firewood", type: "crafting", subtype: "wood", gather: "chop", rarity: "common" },
    "sinew": { name: "Sinew", type: "crafting", subtype: "fiber", gather: "hunt", rarity: "common" },
    "flint": { name: "Flint", type: "crafting", subtype: "stone", rarity: "common" },
    "bone": { name: "Bone", type: "crafting", subtype: "bone", gather: "hunt", rarity: "common" },
    "feather": { name: "Feather", type: "crafting", subtype: "raw", gather: "hunt", rarity: "common" },
    "clay": { name: "Clay", type: "crafting", subtype: "raw", gather: "mine", rarity: "common" },
    "sand": { name: "Sand", type: "crafting", subtype: "raw", gather: "mine", rarity: "common" },
    "empty_bottle": { name: "Empty Bottle", type: "crafting", subtype: "glass", gather: "forage", rarity: "common" },

    // Mining ores
    "tin_ore": { name: "Tin Ore", type: "mining", subtype: "tin", rarity: "common" },
    "copper_ore": { name: "Copper Ore", type: "mining", subtype: "copper", rarity: "common" },
    "iron_ore": { name: "Iron Ore", type: "mining", subtype: "iron", rarity: "common" },
    "gold_ore": { name: "Gold Ore", type: "mining", subtype: "gold", rarity: "uncommon" },
    "cobalt_ore": { name: "Cobalt Ore", type: "mining", subtype: "cobalt", rarity: "uncommon" },
    "mithril_ore": { name: "Mithril Ore", type: "mining", subtype: "mithril", rarity: "rare" },
    "runite_ore": { name: "Runite Ore", type: "mining", subtype: "runite", rarity: "epic" },
    "adamantite_ore": { name: "Adamantite Ore", type: "mining", subtype: "adamantite", rarity: "legendary" },
    "syllic_ore": { name: "Syllic Ore", type: "mining", subtype: "syllic", rarity: "legendary" },
    
    // Smithing bars
    "tin_bar": { name: "Tin Bar", type: "smithing", subtype: "tin", rarity: "common" },
    "copper_bar": { name: "Copper Bar", type: "smithing", subtype: "copper", rarity: "common" },
    "bronze_bar": { name: "Bronze Bar", type: "smithing", subtype: "alloy", rarity: "uncommon" },
    "iron_bar": { name: "Iron Bar", type: "smithing", subtype: "iron", rarity: "common" },
    "gold_bar": { name: "Gold Bar", type: "smithing", subtype: "gold", rarity: "uncommon" },
    "cobalt_bar": { name: "Cobalt Bar", type: "smithing", subtype: "cobalt", rarity: "uncommon" },
    "black_cobalt_bar": { name: "Black Cobalt Bar", type: "smithing", subtype: "cobalt", rarity: "rare" },
    "steel_bar": { name: "Steel Bar", type: "smithing", subtype: "alloy", rarity: "uncommon" },
    "black_steel_bar": { name: "Black Steel Bar", type: "smithing", subtype: "alloy", rarity: "rare" },
    "mithril_bar": { name: "Mithril Bar", type: "smithing", subtype: "mithril", rarity: "rare" },
    "runite_bar": { name: "Runite Bar", type: "smithing", subtype: "runite", rarity: "epic" },
    "adamantite_bar": { name: "Adamantite Bar", type: "smithing", subtype: "adamantite", rarity: "legendary" },
    "syllic_bar": { name: "Syllic Bar", type: "smithing", subtype: "syllic", rarity: "legendary" },

};

export const TOOLBELTS = {
    global: { type: "armor", slot: "belt" },
    "leather_belt": { name: "Leather Belt", subtype: "leather", rarity: "common", belt: { slingAmmo: 10, potions: 5, backpack: 100 }, description: "A simple leather belt, providing basic utility and storage." },
    "chainmail_belt": { name: "Chainmail Belt", subtype: "chainmail", rarity: "uncommon", belt: { slingAmmo: 15, potions: 10, backpack: 150 }, description: "A belt made of interlocking metal rings, providing moderate protection and utility." },
    "adventurer_belt": { name: "Adventurer Belt", subtype: "adventurer", rarity: "uncommon", belt: { slingAmmo: 15, potions: 10, backpack: 175 }, description: "A belt favored by adventurers for its practicality and durability." },
    "plate_belt": { name: "Plate Belt", subtype: "plate", rarity: "rare", belt: { slingAmmo: 20, potions: 15, backpack: 200 }, description: "A sturdy belt made of plate armor." },
    "mythic_belt": { name: "Mythic Belt", subtype: "mythic", rarity: "mythic", belt: { slingAmmo: 30, potions: 20, backpack: 300 }, buff: ["attack"], description: "A legendary belt said to be imbued with the power of the gods, granting its wearer unparalleled abilities." },
    "apocyltas_eye": { name: "Apocyltas Eye", subtype: "mythic", rarity: "mythic", belt: { slingAmmo: 50, potions: 30, backpack: 500 }, buff: ["attack", "defense", "magic"], description: "A legendary belt said to be imbued with the power of the gods, granting its wearer unparalleled abilities." },
};

export const MYTHIC_ITEMS = {
    // Mythic Weapons
    "mythic_sword": { name: "Mythic Sword", type: "weapon", subtype: "sword", rarity: "mythic", damage: 100, buff: ["attack"], description: "A sword of legendary power, said to be forged by the gods themselves." },
    "mythic_dagger": { name: "Mythic Dagger", type: "weapon", subtype: "dagger", rarity: "mythic", damage: 75, buff: ["attack"], description: "A dagger of legendary power, said to be forged by the gods themselves." },
    "mythic_slingshot": { name: "Mythic Slingshot", type: "weapon", subtype: "slingshot", rarity: "mythic", damage: 60, buff: ["attack"], description: "A slingshot of legendary power, said to be forged by the gods themselves." },
    "mythic_bow": { name: "Mythic Bow", type: "weapon", subtype: "bow", rarity: "mythic", damage: 90, buff: ["attack"], description: "A bow of legendary power, said to be forged by the gods themselves." },
    "mythic_staff": { name: "Mythic Staff", type: "weapon", subtype: "staff", rarity: "mythic", damage: 80, buff: ["magic"], description: "A staff of legendary power, said to be forged by the gods themselves." },
    // Mythic Armor
    "mythic_armor_set": { name: "Mythic Armor Set", type: "set", subtype: "armor", rarity: "mythic", items: ["mythic_helmet", "mythic_chestplate", "mythic_leggings", "mythic_boots", "mythic_gauntlets"], description: "An armor set of legendary power, said to be forged by the gods themselves." },
    "mythic_helmet": { name: "Mythic Helmet", type: "armor", slot: "head", subtype: "mythic", rarity: "mythic", defense: 50, buff: ["defense"], description: "A helmet of legendary power, said to be forged by the gods themselves." },
    "mythic_chestplate": { name: "Mythic Chestplate", type: "armor", slot: "torso", subtype: "mythic", rarity: "mythic", defense: 100, buff: ["defense"], description: "A chestplate of legendary power, said to be forged by the gods themselves." },
    "mythic_leggings": { name: "Mythic Leggings", type: "armor", slot: "legs", subtype: "mythic", rarity: "mythic", defense: 75, buff: ["defense"], description: "Leggings of legendary power, said to be forged by the gods themselves." },
    "mythic_boots": { name: "Mythic Boots", type: "armor", slot: "boots", subtype: "mythic", rarity: "mythic", defense: 50, buff: ["defense"], description: "Boots of legendary power, said to be forged by the gods themselves." },
    "mythic_gauntlets": { name: "Mythic Gauntlets", type: "armor", slot: "hands", subtype: "mythic", rarity: "mythic", defense: 50, buff: ["defense"], description: "Gauntlets of legendary power, said to be forged by the gods themselves." },
    "mythic_shield": { name: "Mythic Shield", type: "armor", slot: "shield", subtype: "mythic", rarity: "mythic", defense: 100, buff: ["defense"], description: "A shield of legendary power, said to be forged by the gods themselves." },

};

export const UNIQUE_ITEMS = {
    // Unique Weapons -- Standard, non-god-tier items that are unique in nature
    "sterling_sword": { name: "Sterling Sword", type: "weapon", subtype: "sword", rarity: "unique", damage: 50, description: "A finely crafted sword with a unique design." },
    "obsidian_dagger": { name: "Obsidian Dagger", type: "weapon", subtype: "dagger", rarity: "unique", damage: 40, description: "A dagger made from sharp obsidian, known for its cutting edge." },
    "enchanted_bow": { name: "Enchanted Bow", type: "weapon", subtype: "bow", rarity: "unique", damage: 45, description: "A bow imbued with magical properties, enhancing its accuracy and power." },
    "mystic_staff": { name: "Mystic Staff", type: "weapon", subtype: "staff", rarity: "unique", damage: 55, description: "A staff that channels mystical energies, increasing spell potency." },
    // Unique Weapons -- God-tier, mythic items that are unique in nature
    "excalibur": { name: "Excalibur", type: "weapon", subtype: "sword", rarity: "mythic", damage: 170, description: "The legendary sword of King Arthur, said to possess immense power." },
    "dagger_of_time": { name: "Dagger of Time", type: "weapon", subtype: "dagger", rarity: "mythic", damage: 190, description: "A dagger that can manipulate time, allowing the wielder to slow or speed up time." },
    "bow_of_eternity": { name: "Bow of Eternity", type: "weapon", subtype: "bow", rarity: "mythic", damage: 195, description: "A bow that never misses its target, said to be blessed by the gods." },
    "staff_of_wisdom": { name: "Staff of Wisdom", type: "weapon", subtype: "staff", rarity: "mythic", damage: 185, buff: ["magic"], description: "A staff that grants the wielder unparalleled knowledge and insight." },
    // Unique Armor -- Standard, non-god-tier items that are unique in nature
    "shadow_cloak": { name: "Shadow Cloak", type: "armor", slot: "cloak", subtype: "unique", rarity: "unique", defense: 60, description: "A cloak that allows the wearer to blend into shadows, enhancing stealth." },
    "amulet_of_protection": { name: "Amulet of Protection", type: "armor", slot: "necklace", rarity: "unique", defense: 40, buff: ["defense"], description: "An amulet that provides a protective aura, reducing damage taken." },
    // Unique Armor -- God-tier, mythic items that are unique in nature
    "aegis_shield": { name: "Aegis Shield", type: "armor", slot: "shield", rarity: "unique", defense: 100, buff: ["defense"], description: "The legendary shield of Zeus, said to be unbreakable and capable of deflecting any attack." },
    "helm_of_valor": { name: "Helm of Valor", type: "armor", slot: "head", rarity: "unique", defense: 90, buff: ["defense"], description: "A helmet that inspires courage and bravery in battle, said to be worn by legendary heroes." },
    "guilded_chestplate": { name: "Guilded Chestplate", type: "armor", slot: "torso", rarity: "unique", defense: 85, buff: ["defense"], description: "A chestplate adorned with intricate guild symbols, offering both protection and prestige." },
    "kopeks_leggings": { name: "Kopeks Leggings", type: "armor", slot: "legs", rarity: "unique", defense: 75, buff: ["defense"], description: "Leggings that provide unmatched agility and protection, said to be favored by elite warriors." },
    "boots_of_swiftness": { name: "Boots of Swiftness", type: "armor", slot: "boots", rarity: "unique", defense: 70, buff: ["defense"], description: "Boots that grant the wearer incredible speed and agility, said to be favored by legendary warriors." },
    "cloak_of_invisibility": { name: "Cloak of Invisibility", type: "armor", slot: "cloak", rarity: "unique", defense: 50, buff: ["defense"], description: "A cloak that renders the wearer invisible, said to be a gift from the gods themselves." },
    "ring_of_eternity": { name: "Ring of Eternity", type: "armor", slot: "ring", rarity: "unique", defense: 30, buff: ["defense"], description: "A ring that grants the wearer immortality, said to be forged by the gods themselves." },
};

export const TREASURE_ITEMS = {
    global: { type: "treasure", gather: ["forage", "look", "chop"], skill: "survival" },
    "gold_vase": { name: "Gold Vase", type: "treasure", rarity: "rare", value: 100 },
    "silver_crown": { name: "Silver Crown", type: "treasure", rarity: "uncommon", value: 50 },
    "diamond_necklace": { name: "Diamond Necklace", type: "treasure", rarity: "epic", value: 200 },
    "jeweled_dagger": { name: "Jeweled Dagger", type: "treasure", rarity: "epic", value: 250 },
    "emerald_ring": { name: "Emerald Ring", type: "treasure", rarity: "uncommon", value: 75 },
    "ruby_bracelet": { name: "Ruby Bracelet", type: "treasure", rarity: "rare", value: 120 },
    "sapphire_earrings": { name: "Sapphire Earrings", type: "treasure", rarity: "epic", value: 180 },
    "platinum_coin": { name: "Platinum Coin", type: "treasure", rarity: "legendary", value: 300 },
    "ancient_artifact": { name: "Ancient Artifact", type: "treasure", rarity: "legendary", value: 500 },
}

// *** END OF MAIN ITEM CATALOG ***

// Starter Packs - Packs player can choose from at the start of the game, each containing a set of items to help them get started. Each pack has a name,
//  a list of items, and a description. Some packs may be locked behind certain conditions (e.g., New Game Plus).
export const STARTER_PACKS = {
    "deep_pockets": { name: "Deep Pockets", items: { gold: 5000 }, description: "Start with 5000 gold in your inventory." },
    "basic_tools": { name: "Basic Tools", items: { hammer: 1, shovel: 1, saw: 1 }, description: "Start with a basic set of tools." },
    "starter_kit": { name: "Starter Kit", items: { healing_potion: 5, mana_potion: 5, bread: 10 }, description: "Start with a basic kit of potions and food." },
    "armor_pack": { name: "Armor Pack", items: { steel_armor_set: 1, steel_sword: 1 }, description: "Start with a steel armor set and a steel sword." },
    "weapon_pack": { name: "Weapon Pack", items: { mithril_sword: 1, mithril_dagger: 1 }, description: "Start with a mithril sword and a mithril dagger." },
    // New Game Plus Packs - These packs are only available in New Game Plus mode, and contain more powerful items to help the player in their next playthrough.
    "adventurer_pack": { name: "Adventurer Pack", items: { iron_sword: 1, iron_armor_set: 1, healing_potion: 5 }, description: "Start with an iron sword, iron armor set, and some healing potions.", ngp: true },
    "legendary_pack": { name: "Legendary Pack", items: { adamantite_sword: 1, adamantite_armor_set: 1 }, description: "Start with an adamantite sword and an adamantite armor set.", ngp: true },
};

// Metalurgy
// name: The display name of the metal
// subtype: The category of the metal (base, precious, rare, exotic / or alloys)
// rarity: The rarity of the metal (common, uncommon, rare, legendary, mythic)
// ingredients: The required metals to create this metal (for alloys)
export const METALURGY = {
    global: { type: "metal", gather: "mine", skill: ["mining", "smithing"] },
    // Base Metals
    "tin": { name: "Tin", subtype: "base", rarity: "common" },
    "iron": { name: "Iron", subtype: "base", rarity: "common" },
    "cobalt": { name: "Cobalt", subtype: "base", rarity: "uncommon" },
    // Precious Metals
    "copper": { name: "Copper", subtype: "base", rarity: "common" },
    "gold": { name: "Gold", subtype: "precious", rarity: "rare" },
    "mithril": { name: "Mithril", subtype: "precious", rarity: "rare" },
    // Exotic Metals
    "silkre": { name: "Silkre", subtype: "exotic", rarity: "rare" },
    "adamantite": { name: "Adamantite", subtype: "rare", rarity: "legendary" },
    "runite": { name: "Runite", subtype: "rare", rarity: "legendary" },
    // Exotic
    "syllic": { name: "Syllic", subtype: "exotic", rarity: "mythic" },
    // Alloys
    "bronze": { name: "Bronze", subtype: "alloy", rarity: "common", ingredients: ["tin_ore", "copper_ore"] },
    "black_cobalt": { name: "Black Cobalt", subtype: "alloy", rarity: "uncommon", ingredients: ["iron_ore", "cobalt_ore"] },
    "steel": { name: "Steel", subtype: "alloy", rarity: "uncommon", ingredients: ["iron_ore", "bronze_bar"] },
    // Polyalloys
    "black_steel": { name: "Black Steel", subtype: "polyalloy", rarity: "legendary", ingredients: ["steel_bar", "black_cobalt_bar"] },
};

// Mining non-ore resource map
export const MINING_RESOURCES = {
    global: { type: ["mining","smithing"], gather: "mine", skill: "mining", drops: true},
    // Basic Resources
    "coal": { name: "Coal", type: "mining", subtype: "fuel", rarity: "common" },
    "coal_chunks": { name: "Coal Chunks", type: "mining", subtype: "fuel", rarity: "common" },
    "coal_dust": { name: "Coal Dust", type: "mining", subtype: "fuel", rarity: "common" },
    "coal_ore": { name: "Coal Ore", type: "mining", subtype: "fuel", rarity: "common" },
    "charcoal": { name: "Charcoal", type: "smithing", subtype: "fuel", rarity: "common" },
    "flux": { name: "Flux", type: "smithing", subtype: "alloy", rarity: "uncommon" },
    "limestone": { name: "Limestone", type: "smithing", subtype: "alloy", rarity: "uncommon" },

    // Gemstones
    "ruby": { name: "Ruby", type: "mining", subtype: "gemstone", rarity: "rare" },
    "sapphire": { name: "Sapphire", type: "mining", subtype: "gemstone", rarity: "rare" },
    "emerald": { name: "Emerald", type: "mining", subtype: "gemstone", rarity: "rare" },
    "diamond": { name: "Diamond", type: "mining", subtype: "gemstone", rarity: "legendary" },
    "amethyst": { name: "Amethyst", type: "mining", subtype: "gemstone", rarity: "epic" },
    "topaz": { name: "Topaz", type: "mining", subtype: "gemstone", rarity: "epic" },
    "opal": { name: "Opal", type: "mining", subtype: "gemstone", rarity: "epic" },
};

// What each mine tier unlocks. A location's `mine:` field (data/locations.js)
// names the tier; data/mining.js gates the ore selector on it.
//
// Two naming conventions live here on purpose: `metals` entries are item
// SUBTYPES ("tin"), while `gems` and `fuel` are item IDS ("ruby", "coal") -
// every gemstone item shares the subtype "gemstone" and every fuel shares
// "fuel", so there'd be nothing to distinguish them by otherwise.
// isMineableAtTier() matches against either.
//
// Anything absent from every tier (gold, and the smithing-type flux/limestone
// listed below, which never reach the mining filter at all) is unlisted rather
// than forbidden - it shows in every mine. Add a name here to gate it.
//
// Five tiers, ordered by the mining level their metals need: tin/copper 1, iron
// 5, cobalt 10, mithril 25, syllic 40, adamantite 45, runite 60. `advanced` sits
// between mid_tier and high_tier and is what the Cordura deep mines resolve to -
// they used to resolve to nothing at all (see the helpers below).
// `tier` must stay contiguous from 1: mineLockNamesUpTo() counts up through it,
// and ALL_MINE_LOCK_NAMES takes its ceiling from the number of keys here.
export const MINE_LOCK = {
    basic: { metals: ["tin", "copper", "iron"], gems: ["ruby", "sapphire", "emerald"], fuel: ["coal"], tier: 1 },
    mid_tier: { metals: ["cobalt", "mithril"], gems: ["diamond", "amethyst", "topaz"], fuel: ["charcoal"], tier: 2 },
    advanced: { metals: ["syllic"], gems: [], fuel: [], tier: 3 },
    high_tier: { metals: ["adamantite"], gems: ["opal"], fuel: ["flux", "limestone"], tier: 4 },
    legendary: { metals: ["runite"], gems: [], fuel: [], tier: 5 },
}
// MINE LOCK helpers
//
// Both of these were switch statements mirroring the object above, and the
// duplication cost real behaviour: nine locations (the Cordura deep mines) name
// a tier the switch had no case for, so getMineLockByName() returned null,
// mineableOres() applied NO gate, and those mines quietly offered every ore in
// the game - runite included. A lookup can't fall out of step with the table.
export function getMineLockByTier(tier) {
    return Object.values(MINE_LOCK).find((lock) => lock.tier === tier) ?? null;
}
export function getMineLockByName(name) {
    return MINE_LOCK[name] ?? null;
}
export function getMineLockMetalsByTier(tier) {
    const lock = getMineLockByTier(tier);
    return lock ? lock.metals : [];
}
export function getMineLockGemsByTier(tier) {
    const lock = getMineLockByTier(tier);
    return lock ? lock.gems : [];
}
export function getMineLockFuelByTier(tier) {
    const lock = getMineLockByTier(tier);
    return lock ? lock.fuel : [];
}
// Every metal/gem/fuel name a tier-N mine unlocks, cumulatively - a mid_tier
// mine yields everything basic does plus its own. Tiers are additive rather
// than each listing the full set, so MINE_LOCK stays short.
export function mineLockNamesUpTo(tier) {
    const names = new Set();
    for (let t = 1; t <= tier; t++) {
        const lock = getMineLockByTier(t);
        if (!lock) continue;
        for (const name of [...lock.metals, ...lock.gems, ...lock.fuel]) names.add(name);
    }
    return names;
}

const ALL_MINE_LOCK_NAMES = mineLockNamesUpTo(Object.keys(MINE_LOCK).length);

// Can this ore be pulled out of a tier-N mine? Matches on the id OR the
// subtype, because MINE_LOCK keys metals by subtype and gems/fuel by id.
//
// An ore listed in NO tier is unlisted rather than forbidden and comes back
// true everywhere - otherwise adding an ore item would silently make it
// unmineable until someone remembered to file it under a tier.
export function isMineableAtTier(tier, oreId, subtype) {
    const listed = ALL_MINE_LOCK_NAMES.has(subtype) ? subtype : ALL_MINE_LOCK_NAMES.has(oreId) ? oreId : null;
    if (listed === null) return true;
    return mineLockNamesUpTo(tier).has(listed);
}

// Magic Item Resources (gathered from mining, foraging, and other sources)
export const MAGIC_RESOURCES = {
    global: { gather: ["mine", "forage"], skill: ["magic", "crafting"], drops: true },
    // Basic Magic Resources

    // Crafting Magic Resources
    "ley_crystals": { name: "Ley Crystals", type: "crafting", subtype: "magic", rarity: "rare" },
    "arcane_essence": { name: "Arcane Essence", type: "crafting", subtype: "magic", rarity: "legendary" },
    "mystic_dust": { name: "Mystic Dust", type: "crafting", subtype: "magic", rarity: "epic" },
    "void_shard": { name: "Void Shard", type: "crafting", subtype: "magic", rarity: "mythic" },
    "celestial_fragment": { name: "Celestial Fragment", type: "crafting", subtype: "magic", rarity: "godlike" },
    "enchanted_essence": { name: "Enchanted Essence", type: "crafting", subtype: "magic", rarity: "legendary" },
    "mystic_essence": { name: "Mystic Essence", type: "crafting", subtype: "magic", rarity: "epic" },
    "arcane_shard": { name: "Arcane Shard", type: "crafting", subtype: "magic", rarity: "rare" },
    "void_essence": { name: "Void Essence", type: "crafting", subtype: "magic", rarity: "mythic" },
    "celestial_shard": { name: "Celestial Shard", type: "crafting", subtype: "magic", rarity: "godlike" },
    "enchanted_shard": { name: "Enchanted Shard", type: "crafting", subtype: "magic", rarity: "legendary" },
    "mystic_shard": { name: "Mystic Shard", type: "crafting", subtype: "magic", rarity: "epic" },
    "arcane_essence": { name: "Arcane Essence", type: "crafting", subtype: "magic", rarity: "rare" },
    "void_fragment": { name: "Void Fragment", type: "crafting", subtype: "magic", rarity: "mythic" },
    "celestial_essence": { name: "Celestial Essence", type: "crafting", subtype: "magic", rarity: "godlike" },
    "enchanted_fragment": { name: "Enchanted Fragment", type: "crafting", subtype: "magic", rarity: "legendary" },
    "mystic_fragment": { name: "Mystic Fragment", type: "crafting", subtype: "magic", rarity: "epic" },
};

// Magic Items - Spellcasting focuses, wands, orbs, and other magical implements
export const MAGIC_ITEMS = {
    global: { type: "magic", skill: "magic" },
    // Spellcasting Focuses
    "basic_scroll": { name: "Basic Scroll", type: "magic", subtype: "scroll", rarity: "common" },
    "enchanted_scroll": { name: "Enchanted Scroll", type: "magic", subtype: "scroll", rarity: "uncommon" },
    "ancient_scroll": { name: "Ancient Scroll", type: "magic", subtype: "scroll", rarity: "rare" },
    "mystic_scroll": { name: "Mystic Scroll", type: "magic", subtype: "scroll", rarity: "epic" },
    "arcane_scroll": { name: "Arcane Scroll", type: "magic", subtype: "scroll", rarity: "legendary" },

    "simple_wand": { name: "Simple Wand", type: "magic", subtype: "wand", rarity: "common" },
    "enchanted_wand": { name: "Enchanted Wand", type: "magic", subtype: "wand", rarity: "uncommon" },
    "ancient_wand": { name: "Ancient Wand", type: "magic", subtype: "wand", rarity: "rare" },
    "mystic_wand": { name: "Mystic Wand", type: "magic", subtype: "wand", rarity: "epic" },
    "arcane_wand": { name: "Arcane Wand", type: "magic", subtype: "wand", rarity: "legendary" },
    "crystal_wand": { name: "Crystal Wand", type: "magic", subtype: "wand", rarity: "mythic" },
    "void_wand": { name: "Void Wand", type: "magic", subtype: "wand", rarity: "godlike" },

    "basic_runestone": { name: "Basic Runestone", type: "magic", subtype: "rune", rarity: "common" },
    "enchanted_runestone": { name: "Enchanted Runestone", type: "magic", subtype: "rune", rarity: "uncommon" },
    "ancient_runestone": { name: "Ancient Runestone", type: "magic", subtype: "rune", rarity: "rare" },
    "mystic_runestone": { name: "Mystic Runestone", type: "magic", subtype: "rune", rarity: "epic" },
    "arcane_runestone": { name: "Arcane Runestone", type: "magic", subtype: "rune", rarity: "legendary" },

    "simple_talisman": { name: "Simple Talisman", type: "magic", subtype: "talisman", rarity: "common" },
    "enchanted_talisman": { name: "Enchanted Talisman", type: "magic", subtype: "talisman", rarity: "uncommon" },
    "ancient_talisman": { name: "Ancient Talisman", type: "magic", subtype: "talisman", rarity: "rare" },
    "mystic_talisman": { name: "Mystic Talisman", type: "magic", subtype: "talisman", rarity: "epic" },
    "arcane_talisman": { name: "Arcane Talisman", type: "magic", subtype: "talisman", rarity: "legendary" },

    "crystal_orb": { name: "Crystal Orb", type: "magic", subtype: "focus", rarity: "legendary" },
    "dim_crystal": { name: "Dim Crystal", type: "magic", subtype: "crystal", rarity: "uncommon" },
    "glowing_crystal": { name: "Glowing Crystal", type: "magic", subtype: "crystal", rarity: "rare" },
    "red_crystal": { name: "Red Crystal", type: "magic", subtype: "crystal", rarity: "rare" },
    "blue_crystal": { name: "Blue Crystal", type: "magic", subtype: "crystal", rarity: "rare" },
    "green_crystal": { name: "Green Crystal", type: "magic", subtype: "crystal", rarity: "rare" },
    "white_crystal": { name: "White Crystal", type: "magic", subtype: "crystal", rarity: "legendary" },
    "void_crystal": { name: "Void Crystal", type: "magic", subtype: "crystal", rarity: "mythic" },
    "black_crystal": { name: "Black Crystal", type: "magic", subtype: "crystal", rarity: "godlike" },

    "glowing_orb": { name: "Glowing Orb", type: "magic", subtype: "orb", rarity: "rare" },
    "red_orb": { name: "Red Orb", type: "magic", subtype: "orb", rarity: "rare" },
    "blue_orb": { name: "Blue Orb", type: "magic", subtype: "orb", rarity: "rare" },
    "green_orb": { name: "Green Orb", type: "magic", subtype: "orb", rarity: "epic" },
    "black_orb": { name: "Black Orb", type: "magic", subtype: "orb", rarity: "legendary" },
    "white_orb": { name: "White Orb", type: "magic", subtype: "orb", rarity: "mythic" },
    "void_orb": { name: "Void Orb", type: "magic", subtype: "orb", rarity: "godlike" },

    "simple_spellbook": { name: "Simple Spellbook", type: "magic", subtype: "book", rarity: "common" },
    "enchanted_spellbook": { name: "Enchanted Spellbook", type: "magic", subtype: "book", rarity: "uncommon" },
    "ancient_spellbook": { name: "Ancient Spellbook", type: "magic", subtype: "book", rarity: "rare" },
    "mystic_spellbook": { name: "Mystic Spellbook", type: "magic", subtype: "book", rarity: "epic" },
    "arcane_spellbook": { name: "Arcane Spellbook", type: "magic", subtype: "book", rarity: "legendary" },
    "crystal_spellbook": { name: "Crystal Spellbook", type: "magic", subtype: "book", rarity: "legendary" },
    "mythic_spellbook": { name: "Mythic Spellbook", type: "magic", subtype: "book", rarity: "mythic" },
    "demonic_spellbook": { name: "Demonic Spellbook", type: "magic", subtype: "book", rarity: "godlike" },

    "simple_void": { name: "Simple Void", type: "magic", subtype: "focus", rarity: "common" },
    "dim_void": { name: "Dim Void", type: "magic", subtype: "focus", rarity: "common" },
    "humming_void": { name: "Humming Void", type: "magic", subtype: "focus", rarity: "uncommon" },
    "enchanted_void": { name: "Enchanted Void", type: "magic", subtype: "focus", rarity: "uncommon" },
    "glowing_void": { name: "Glowing Void", type: "magic", subtype: "focus", rarity: "rare" },
    "red_void": { name: "Red Void", type: "magic", subtype: "focus", rarity: "rare" },
    "blue_void": { name: "Blue Void", type: "magic", subtype: "focus", rarity: "rare" },
    "green_void": { name: "Green Void", type: "magic", subtype: "focus", rarity: "epic" },
    "crystal_void": { name: "Crystal Void", type: "magic", subtype: "focus", rarity: "legendary" },
    "white_void": { name: "White Void", type: "magic", subtype: "focus", rarity: "legendary" },
    "mythic_void": { name: "Mythic Void", type: "magic", subtype: "focus", rarity: "mythic" },
    "demonic_void": { name: "Demonic Void", type: "magic", subtype: "focus", rarity: "mythic" },
    "black_hole_void": { name: "Black Hole Void", type: "magic", subtype: "focus", rarity: "godlike" },
};

// Smithing Recipes - Recipes for crafting items at a forge or anvil, using various metals and other materials
export const SMITHING_RECIPES = {
    global: { station: ["anvil", "forge", "blast_furnace", "smithing_table", "mythic_forge", "apocyltian_forge"], skill: "smithing" },
    // Bars
    "tin_bar": { ingredients: { "tin_ore": 1, "coal": 1 }, station: [ true ], result: "tin_bar" },
    "copper_bar": { ingredients: { "copper_ore": 1, "coal": 1 }, station: [ true ], result: "copper_bar" },
    "bronze_bar": { ingredients: { "tin_ore": 1, "copper_ore": 1, "coal": 1 }, station: [ true ], result: "bronze_bar" },
    "iron_bar": { ingredients: { "iron_ore": 1, "coal": 1 }, station: [ true ], result: "iron_bar" },
    "cobalt_bar": { ingredients: { "cobalt_ore": 1, "coal": 1 }, station: [ true ], result: "cobalt_bar" },
    "steel_bar": { ingredients: { "iron_ore": 1, "bronze_bar": 1, "coal": 2 }, station: [ true ], result: "steel_bar" },
    "mithril_bar": { ingredients: { "mithril_ore": 1, "coal": 2 }, station: [ true ], result: "mithril_bar" },
    "adamantite_bar": { ingredients: { "adamantite_ore": 1, "coal": 3 }, station: [ true ], result: "adamantite_bar" },
    "syllic_bar": { ingredients: { "syllic_ore": 1, "coal": 4 }, station: [ true ], result: "syllic_bar" },
    
    // Weapons
    "tin_sword": { ingredients: { "tin_bar": 2, "wood": 1 }, station: [ true ], result: "tin_sword" },
    "copper_sword": { ingredients: { "copper_bar": 2, "wood": 1 }, station: [ true ], result: "copper_sword" },
    "bronze_sword": { ingredients: { "bronze_bar": 2, "wood": 1 }, station: [ true ], result: "bronze_sword" },
    "iron_sword": { ingredients: { "iron_bar": 2, "wood": 1 }, station: [ true ], result: "iron_sword" },
    "cobalt_sword": { ingredients: { "cobalt_bar": 2, "wood": 1 }, station: [ true ], result: "cobalt_sword" },
    "steel_sword": { ingredients: { "steel_bar": 2, "wood": 1 }, station: [ true ], result: "steel_sword" },
    "mithril_sword": { ingredients: { "mithril_bar": 2, "wood": 1 }, station: [ "blast_furnace" ], result: "mithril_sword" },
    "adamantite_sword": { ingredients: { "adamantite_bar": 2, "wood": 1 }, station: [ "smithing_table" ], result: "adamantite_sword" },
    "syllic_sword": { ingredients: { "syllic_bar": 2, "wood": 1 }, station: [ "mythic_forge" ], result: "syllic_sword" },

    "tin_dagger": { ingredients: { "tin_bar": 1, "wood": 1 }, station: [ true ], result: "tin_dagger" },
    "copper_dagger": { ingredients: { "copper_bar": 1, "wood": 1 }, station: [ true ], result: "copper_dagger" },
    "bronze_dagger": { ingredients: { "bronze_bar": 1, "wood": 1 }, station: [ true ], result: "bronze_dagger" },
    "iron_dagger": { ingredients: { "iron_bar": 1, "wood": 1 }, station: [ true ], result: "iron_dagger" },
    "cobalt_dagger": { ingredients: { "cobalt_bar": 1, "wood": 1 }, station: [ true ], result: "cobalt_dagger" },
    "steel_dagger": { ingredients: { "steel_bar": 1, "wood": 1 }, station: [ true ], result: "steel_dagger" },
    "mithril_dagger": { ingredients: { "mithril_bar": 1, "wood": 1 }, station: [ "blast_furnace" ], result: "mithril_dagger" },
    "adamantite_dagger": { ingredients: { "adamantite_bar": 1, "wood": 1 }, station: [ "smithing_table" ], result: "adamantite_dagger" },
    "syllic_dagger": { ingredients: { "syllic_bar": 1, "wood": 1 }, station: [ "mythic_forge" ], result: "syllic_dagger" },

    "tin_battleaxe": { ingredients: { "tin_bar": 2, "wood": 1 }, station: [ true ], result: "tin_battleaxe" },
    "copper_battleaxe": { ingredients: { "copper_bar": 2, "wood": 1 }, station: [ true ], result: "copper_battleaxe" },
    "bronze_battleaxe": { ingredients: { "bronze_bar": 2, "wood": 1 }, station: [ true ], result: "bronze_battleaxe" },
    "iron_battleaxe": { ingredients: { "iron_bar": 2, "wood": 1 }, station: [ true ], result: "iron_battleaxe" },
    "cobalt_battleaxe": { ingredients: { "cobalt_bar": 2, "wood": 1 }, station: [ true ], result: "cobalt_battleaxe" },
    "steel_battleaxe": { ingredients: { "steel_bar": 2, "wood": 1 }, station: [ true ], result: "steel_battleaxe" },
    "mithril_battleaxe": { ingredients: { "mithril_bar": 2, "wood": 1 }, station: [ "blast_furnace" ], result: "mithril_battleaxe" },
    "adamantite_battleaxe": { ingredients: { "adamantite_bar": 2, "wood": 1 }, station: [ "smithing_table" ], result: "adamantite_battleaxe" },
    "syllic_battleaxe": { ingredients: { "syllic_bar": 2, "wood": 1 }, station: [ "mythic_forge" ], result: "syllic_battleaxe" },

    // Armors
    "bronze_helmet": { ingredients: { "bronze_bar": 2 }, station: [ true ], result: "bronze_helmet" },
    "bronze_gauntlets": { ingredients: { "bronze_bar": 2 }, station: [ true ], result: "bronze_gauntlets" },
    "bronze_chestplate": { ingredients: { "bronze_bar": 4 }, station: [ true ], result: "bronze_chestplate" },
    "bronze_leggings": { ingredients: { "bronze_bar": 3 }, station: [ true ], result: "bronze_leggings" },
    "bronze_boots": { ingredients: { "bronze_bar": 2 }, station: [ true ], result: "bronze_boots" },
    
    "iron_helmet": { ingredients: { "iron_bar": 2 }, station: [ true ], result: "iron_helmet" },
    "iron_gauntlets": { ingredients: { "iron_bar": 2 }, station: [ true ], result: "iron_gauntlets" },
    "iron_chestplate": { ingredients: { "iron_bar": 4 }, station: [ true ], result: "iron_chestplate" },
    "iron_leggings": { ingredients: { "iron_bar": 3 }, station: [ true ], result: "iron_leggings" },
    "iron_boots": { ingredients: { "iron_bar": 2 }, station: [ true ], result: "iron_boots" },

    "cobalt_helmet": { ingredients: { "cobalt_bar": 2 }, station: [ true ], result: "cobalt_helmet" },
    "cobalt_gauntlets": { ingredients: { "cobalt_bar": 2 }, station: [ true ], result: "cobalt_gauntlets" },
    "cobalt_chestplate": { ingredients: { "cobalt_bar": 4 }, station: [ true ], result: "cobalt_chestplate" },
    "cobalt_leggings": { ingredients: { "cobalt_bar": 3 }, station: [ true ], result: "cobalt_leggings" },
    "cobalt_boots": { ingredients: { "cobalt_bar": 2 }, station: [ true ], result: "cobalt_boots" },

    "steel_helmet": { ingredients: { "steel_bar": 2 }, station: [ true ], result: "steel_helmet" },
    "steel_gauntlets": { ingredients: { "steel_bar": 2 }, station: [ true ], result: "steel_gauntlets" },
    "steel_chestplate": { ingredients: { "steel_bar": 4 }, station: [ true ], result: "steel_chestplate" },
    "steel_leggings": { ingredients: { "steel_bar": 3 }, station: [ true ], result: "steel_leggings" },
    "steel_boots": { ingredients: { "steel_bar": 2 }, station: [ true ], result: "steel_boots" },

    "mithril_helmet": { ingredients: { "mithril_bar": 2 }, station: [ "blast_furnace" ], result: "mithril_helmet" },
    "mithril_gauntlets": { ingredients: { "mithril_bar": 2 }, station: [ "blast_furnace" ], result: "mithril_gauntlets" },
    "mithril_chestplate": { ingredients: { "mithril_bar": 4 }, station: [ "blast_furnace" ], result: "mithril_chestplate" },
    "mithril_leggings": { ingredients: { "mithril_bar": 3 }, station: [ "blast_furnace" ], result: "mithril_leggings" },
    "mithril_boots": { ingredients: { "mithril_bar": 2 }, station: [ "blast_furnace" ], result: "mithril_boots" },

    "adamantite_helmet": { ingredients: { "adamantite_bar": 2 }, station: [ "smithing_table" ], result: "adamantite_helmet" },
    "adamantite_gauntlets": { ingredients: { "adamantite_bar": 2 }, station: [ "smithing_table"], result: "adamantite_gauntlets" },
    "adamantite_chestplate": { ingredients: { "adamantite_bar": 4 }, station: [ "smithing_table" ], result: "adamantite_chestplate" },
    "adamantite_leggings": { ingredients: { "adamantite_bar": 3 }, station: [ "smithing_table" ], result: "adamantite_leggings" },
    "adamantite_boots": { ingredients: { "adamantite_bar": 2 }, station: [ "smithing_table" ], result: "adamantite_boots" },

    "syllic_helmet": { ingredients: { "syllic_bar": 2 }, station: [ "mythic_forge" ], result: "syllic_helmet" },
    "syllic_gauntlets": { ingredients: { "syllic_bar": 2 }, station: [ "mythic_forge" ], result: "syllic_gauntlets" },
    "syllic_chestplate": { ingredients: { "syllic_bar": 4 }, station: [ "mythic_forge" ], result: "syllic_chestplate" },
    "syllic_leggings": { ingredients: { "syllic_bar": 3 }, station: [ "mythic_forge" ], result: "syllic_leggings" },
    "syllic_boots": { ingredients: { "syllic_bar": 2 }, station: [ "mythic_forge" ], result: "syllic_boots" },

    // Shields
    "bronze_shield": { ingredients: { "bronze_bar": 3, "wood": 1 }, station: [ true ], result: "bronze_shield" },
    "iron_shield": { ingredients: { "iron_bar": 3, "wood": 1 }, station: [ true ], result: "iron_shield" },
    "steel_shield": { ingredients: { "steel_bar": 3, "wood": 1 }, station: [ true ], result: "steel_shield" },
    "mithril_shield": { ingredients: { "mithril_bar": 3, "wood": 1 }, station: [ "blast_furnace" ], result: "mithril_shield" },
    "adamantite_shield": { ingredients: { "adamantite_bar": 3, "wood": 1 }, station: [ "smithing_table" ], result: "adamantite_shield" },
    "syllic_shield": { ingredients: { "syllic_bar": 3, "wood": 1 }, station: [ "mythic_forge" ], result: "syllic_shield" },

}

// Smithing recipe helpers

// Station inclusion Check - Stations are hierarchical, so a recipe that lists "forge" is also craftable at "blast_furnace" and "mythic_forge", but not vice versa.
export function isRecipeSmithableAtStation(recipe, station) {
    if (!recipe.station || !Array.isArray(recipe.station)) return false;
    const stationHierarchy = ["anvil", "forge", "blast_furnace", "smithing_table", "mythic_forge", "apocyltian_forge"];
    const recipeStations = recipe.station.map(s => s.toLowerCase());
    const stationIndex = stationHierarchy.indexOf(station.toLowerCase());
    if (stationIndex === -1) return false;
    for (const recipeStation of recipeStations) {
        const recipeStationIndex = stationHierarchy.indexOf(recipeStation);
        if (recipeStationIndex !== -1 && recipeStationIndex <= stationIndex) {
            return true;
        }
    }
    return false;
}




export const CRAFTING_RECIPES = {
    global: { station: ["crafting_table", "anvil"], skill: "crafting" },
    "lockpick": { ingredients: { "lockpick_parts": 3 }, tool: "hammer", result: { "lockpick": 5 } },
    "hammer": { ingredients: { "iron_ore": 1, "wood": 1 }, result: "hammer" },
    "shovel": { ingredients: { "iron_ore": 1, "wood": 1 }, result: "shovel" },
    "saw": { ingredients: { "iron_ore": 1, "wood": 1 }, result: "saw" },
    "fishing_rod": { ingredients: { "string": 2, "wood": 1 }, result: "fishing_rod" },
    "pickaxe": { ingredients: { "iron_ore": 1, "wood": 1 }, result: "pickaxe" },
    "lockpick_parts": { ingredients: { "iron_ore": 1 }, result: "lockpick_parts" },
    "firewood": { ingredients: { "wood": 1 }, result: { "firewood": 5 } },
    "coal_from_ore": { ingredients: { "coal_ore": 1 }, result: { "coal": 10 } },
    "coal_from_chunks": { ingredients: { "coal_chunks": 1 }, result: { "coal": 5 } },
    "coal_from_dust": { ingredients: { "coal_dust": 5 }, result: { "coal": 2 } },

}
export const COOKING_RECIPES = {
    global: { station: ["cooking_station", "campfire"], skill: "cooking" },
    // Basic Cooking Recipes
    "cooked_rabbit": { ingredients: { "raw_rabbit": 1 }, result: "cooked_rabbit" },
    "cooked_chicken": { ingredients: { "raw_chicken": 1 }, result: "cooked_chicken" },
    "cooked_beef": { ingredients: { "raw_beef": 1 }, result: "cooked_beef" },
    "cooked_pork": { ingredients: { "raw_pork": 1 }, result: "cooked_pork" },
    "cooked_venison": { ingredients: { "raw_venison": 1 }, result: "cooked_venison" },
    "cooked_duck": { ingredients: { "raw_duck": 1 }, result: "cooked_duck" },
    // Every fish/crustacean/shellfish/mollusk recipe lives in FISHING_RECIPES,
    // which registers at these same two stations (see data/stations.js).
    "cooked_mushroom": { ingredients: { "raw_mushroom": 1 }, result: "cooked_mushroom" },
    "cooked_vegetables": { ingredients: { "raw_vegetables": 1 }, result: "cooked_vegetables" },
    "cooked_fruits": { ingredients: { "raw_fruits": 1 }, result: "cooked_fruits" },
    "cooked_herbs": { ingredients: { "raw_herbs": 1 }, result: "cooked_herbs" },
    "cooked_stew": { ingredients: { "raw_rabbit": 1, "raw_vegetables": 1, "raw_herbs": 1 }, result: "cooked_stew" },

    // Mixed Cooked Foods
    "meat_stew": { ingredients: { "raw_rabbit": 1, "raw_chicken": 1, "raw_beef": 1, "raw_pork": 1 }, result: "meat_stew" },
    "vegetable_stew": { ingredients: { "raw_vegetables": 3, "raw_herbs": 2 }, result: "vegetable_stew" },
    "fruit_stew": { ingredients: { "raw_fruits": 3, "raw_herbs": 2 }, result: "fruit_stew" },
    "colorful_herb_stew": { ingredients: { "red_herbs": 1, "blue_herbs": 1, "green_herbs": 1, "yellow_herbs": 1 }, result: "colorful_herb_stew" },
    "mixed_herb_stew": { ingredients: { "red_herbs": 2, "blue_herbs": 2, "green_herbs": 2, "yellow_herbs": 2 }, result: "mixed_herb_stew" },
    "vibrant_herb_stew": { ingredients: { "purple_herbs": 2, "yellow_herbs": 2, "white_herbs": 2 }, result: "vibrant_herb_stew" },
    "ultimate_herb_stew": { ingredients: { "red_herbs": 3, "blue_herbs": 3, "green_herbs": 3, "yellow_herbs": 3 }, result: "ultimate_herb_stew" },
    "colorful_mushroom_stew": { ingredients: { "red_mushroom": 1, "blue_mushroom": 1, "green_mushroom": 1, "yellow_mushroom": 1 }, result: "colorful_mushroom_stew" },
    "mixed_mushroom_stew": { ingredients: { "red_mushroom": 2, "blue_mushroom": 2, "green_mushroom": 2, "yellow_mushroom": 2 }, result: "mixed_mushroom_stew" },
    "vibrant_mushroom_stew": { ingredients: { "purple_mushroom": 2, "yellow_mushroom": 2, "white_mushroom": 2 }, result: "vibrant_mushroom_stew" },
    "ultimate_mushroom_stew": { ingredients: { "red_mushroom": 3, "blue_mushroom": 3, "green_mushroom": 3, "yellow_mushroom": 3 }, result: "ultimate_mushroom_stew" },
    "mixed_berry_stew": { ingredients: { "red_berry": 2, "blue_berry": 2, "green_berry": 2, "yellow_berry": 2 }, result: "mixed_berry_stew" },
    "vibrant_berry_stew": { ingredients: { "purple_berry": 2, "yellow_berry": 2, "white_berry": 2 }, result: "vibrant_berry_stew" },
    "ultimate_berry_stew": { ingredients: { "red_berry": 3, "blue_berry": 3, "green_berry": 3, "yellow_berry": 3 }, result: "ultimate_berry_stew" },

    // Baked Goods
    "bread": { ingredients: { "flour": 2, "water": 1 }, result: "bread" },
    "golden_apple": { ingredients: { "apple": 1, "gold_bar": 1 }, result: "golden_apple" },
    "cookies": { ingredients: { "flour": 2, "sugar": 1, "butter": 1 }, result: "cookies" },
    "cake": { ingredients: { "flour": 3, "sugar": 2, "eggs": 2, "milk": 1 }, result: "cake" },
    "pie": { ingredients: { "flour": 3, "sugar": 2, "fruit": 3 }, result: "pie" },

    // Brewed Drinks
    "herbal_tea": { ingredients: { "green_herbs": 1, "water": 1 }, result: "herbal_tea" },
    "green_tea": { ingredients: { "green_tea_leaves": 1, "water": 1 }, result: "green_tea" },
    "black_tea": { ingredients: { "black_tea_leaves": 1, "water": 1 }, result: "black_tea" },
    "white_tea": { ingredients: { "white_tea_leaves": 1, "water": 1 }, result: "white_tea" },
    "fruit_juice": { ingredients: { "raw_fruits": 3, "water": 1 }, result: "fruit_juice" },
    "mushroom_brew": { ingredients: { "red_mushroom": 1, "blue_mushroom": 1, "water": 1 }, result: "mushroom_brew" },
    "berry_brew": { ingredients: { "red_berry": 1, "blue_berry": 1, "water": 1 }, result: "berry_brew" },
    "mixed_herb_brew": { ingredients: { "red_herbs": 1, "blue_herbs": 1, "green_herbs": 1, "water": 1 }, result: "mixed_herb_brew" },
    "vibrant_herb_brew": { ingredients: { "purple_herbs": 1, "yellow_herbs": 1, "white_herbs": 1, "water": 1 }, result: "vibrant_herb_brew" },
    "ultimate_herb_brew": { ingredients: { "red_herbs": 2, "blue_herbs": 2, "green_herbs": 2, "water": 1 }, result: "ultimate_herb_brew" },
}
export const POTION_RECIPES = {
    global: { station: "alchemy_table", skill: "alchemy" },
    "healing_potion": { ingredients: { "red_herbs": 2, "water": 1 }, result: "healing_potion" },
    "mana_potion": { ingredients: { "blue_herbs": 2, "water": 1 }, result: "mana_potion" },
    "poison_potion": { ingredients: { "green_herbs": 2, "water": 1 }, result: "poison_potion" },
    "attack_potion": { ingredients: { "red_herbs": 1, "yellow_herbs": 1, "water": 1 }, result: "attack_potion" },
    "defense_debuff_poison": { ingredients: { "green_herbs": 1, "black_herbs": 1, "water": 1 }, result: "defense_debuff_poison" },
    "health_poison": { ingredients: { "green_herbs": 1, "red_herbs": 1, "water": 1 }, result: "health_poison" },
}

// Stations
// These are the various stations that can be used to craft items, cook food, or brew potions. 
// Each station has a name, type, rarity, and a list of outputs that it can produce.
// Here are the fields:
// name: The name of the station
// type: The type of the station (e.g., crafting, cooking, brewing)
// rarity: The rarity of the station (e.g., common, uncommon, rare)
// outputs: A list of output types or subtypes that the station can produce (e.g., crafting, cooking, brewing)
export const STATIONS = {
    "crafting_table": { name: "Crafting Table", type: "station", rarity: "common", outputs: ["crafting"] },
    "alchemy_table": { name: "Alchemy Table", type: "station", rarity: "uncommon", outputs: ["potions", "poisons"] },
    "cooking_station": { name: "Cooking Station", type: "station", rarity: "common", outputs: ["cooked_food", "stew", "baked", "brewed"] },
    "campfire": { name: "Campfire", type: "station", rarity: "common", outputs: ["cooked_food", "potions"] },
    // Forge/Smithing stations
    "anvil": { name: "Anvil", type: "station", rarity: "common", outputs: ["smithing"] },
    "forge": { name: "Forge", type: "station", rarity: "common", outputs: ["smithing"] },
    "blast_furnace": { name: "Blast Furnace", type: "station", rarity: "uncommon", outputs: ["smithing"] },
    "smithing_table": { name: "Smithing Table", type: "station", rarity: "rare", outputs: ["smithing"] },
    "mythic_forge": { name: "Mythic Forge", type: "station", rarity: "mythic", outputs: ["smithing"] },
    "apocyltian_forge": { name: "Apocyltian Forge", type: "station", rarity: "godlike", outputs: ["smithing"] }
}

// Consumables Logic
// These are the logic for main item types. Keyed by item `type`, and read by
// data/items.js's useItem() - the one place a consumable is consumed - to
// grant `xp` in `skill` and hand back `output` (if any) as a byproduct.
// "aid" has no obvious skill of its own; survival is the closest existing one
// (bandages/antidotes are field medicine), and its xp sits between food's and
// potions'.
export const CONSUME = {
    "potion": { skill: "alchemy", xp: 5, output: "empty_bottle" },
    "food":   { skill: "survival", xp: 2, output: null },
    "aid":    { skill: "survival", xp: 3, output: null },
}

// Shop Rarity display logic
export const SHOP_RARITY_DISPLAY = {
    "common": { color: "gray", display: "Common", level: 1 },
    "uncommon": { color: "green", display: "Uncommon", level: 5 },
    "rare": { color: "blue", display: "Rare", level: 15 },
    "epic": { color: "purple", display: "Epic", level: 25 },
    "legendary": { color: "orange", display: "Legendary", level: 35 },
    "mythic": { color: "red", display: "Mythic", level: 65 },
    "godlike": { color: "black", display: "Godlike", level: 100 },
}

// ALL_ITEMS is built at the very bottom of this file instead of here: it now
// includes the fishing catalog, which is declared further down, and a `const`
// can't be spread before it's initialized.

// Resolves an item id to the equipment slot it belongs in ("weapon", or an
// armor piece's "slot" field), or null if the item can't be equipped.
export function equipSlotOf(itemId) {
  const item = ALL_ITEMS[itemId];
  if (!item) return null;
  if (item.type === "weapon" && item.subtype === "slingshot") return "slingshot";
  if (item.type === "weapon") return "weapon";
  if (item.type === "tool") return "tool";
  if (item.type === "armor") return item.slot || null;
  // Enhancements wear in their own five slots, not on the armor paperdoll -
  // the "ring" tier would otherwise fight ring_of_eternity for one slot.
  // state/gameState.js's equipItem() routes on ENHANCEMENT_SLOTS membership.
  if (item.type === "enhancement") return item.enhancementSlot || null;
  return null;
}

// ** Black Market **
// The five enhancement tiers, ascending. Also the five slots an enhancement can
// be worn in - see ENHANCEMENT_SLOTS below, which is the same list under the
// name state/gameState.js uses it by.
export const BLACKMARKET_ENHANCEMENT_TYPES = ["charm", "talisman", "beads", "ring", "bangle"];
// Skill KEYS, not skill objects: this is a subtype vocabulary, and every
// enhancement's `subtype` is the id of the skill it boosts. listSkills() hands
// back the full records, which is what it sat as while nothing read it.
export const BLACKMARKET_ENHANCEMENT_SUBTYPES = listSkills().map((skill) => skill.key);
export const BLACKMARKET = {
    enhancements: {
        //  Charms - Low tier, cheap, and easy to find. Provide small bonuses to skills or stats.
        "charms": {
            "luck_charm": { name: "Luck Charm", type: "charm", subtype: "luck", effect: { luckUp: 5 }, cost: 1000, desc: "Increases Luck by 5." },
            "strength_charm": { name: "Strength Charm", type: "charm", subtype: "strength", effect: { strengthUp: 5 }, cost: 1000, desc: "Increases Strength by 5." },
            "defense_charm": { name: "Defense Charm", type: "charm", subtype: "defense", effect: { defenseUp: 5 }, cost: 1000, desc: "Increases Defense by 5." },
            "speed_charm": { name: "Speed Charm", type: "charm", subtype: "speed", effect: { speedUp: 5 }, cost: 1000, desc: "Increases Speed by 5." },
            "survival_charm": { name: "Survival Charm", type: "charm", subtype: "survival", effect: { survivalUp: 5 }, cost: 1000, desc: "Increases Survival by 5." },
            "fishing_charm": { name: "Fishing Charm", type: "charm", subtype: "fishing", effect: { fishingUp: 5 }, cost: 1000, desc: "Increases Fishing by 5." },
            "smithing_charm": { name: "Smithing Charm", type: "charm", subtype: "smithing", effect: { smithingUp: 5 }, cost: 1000, desc: "Increases Smithing by 5." },
            "mining_charm": { name: "Mining Charm", type: "charm", subtype: "mining", effect: { miningUp: 5 }, cost: 1000, desc: "Increases Mining by 5." },
            "crafting_charm": { name: "Crafting Charm", type: "charm", subtype: "crafting", effect: { craftingUp: 5 }, cost: 1000, desc: "Increases Crafting by 5." },
            "alchemy_charm": { name: "Alchemy Charm", type: "charm", subtype: "alchemy", effect: { alchemyUp: 5 }, cost: 1000, desc: "Increases Alchemy by 5." },
            "trapping_charm": { name: "Trapping Charm", type: "charm", subtype: "trapping", effect: { trappingUp: 5 }, cost: 1000, desc: "Increases Trapping by 5." },
            "woodcutting_charm": { name: "Woodcutting Charm", type: "charm", subtype: "woodcutting", effect: { woodcuttingUp: 5 }, cost: 1000, desc: "Increases Woodcutting by 5." },
            "cooking_charm": { name: "Cooking Charm", type: "charm", subtype: "cooking", effect: { cookingUp: 5 }, cost: 1000, desc: "Increases Cooking by 5." },
            "barter_charm": { name: "Barter Charm", type: "charm", subtype: "barter", effect: { barterUp: 5 }, cost: 1000, desc: "Increases Barter by 5." },
        },
        "talismans": {
            // Talismans - Mid-tier, more expensive, and harder to find. Provide moderate bonuses to skills or stats.
            "luck_talisman": { name: "Luck Talisman", type: "talisman", subtype: "luck", effect: { luckUp: 10 }, cost: 5000, desc: "Increases Luck by 10." },
            "strength_talisman": { name: "Strength Talisman", type: "talisman", subtype: "strength", effect: { strengthUp: 10 }, cost: 5000, desc: "Increases Strength by 10." },
            "defense_talisman": { name: "Defense Talisman", type: "talisman", subtype: "defense", effect: { defenseUp: 10 }, cost: 5000, desc: "Increases Defense by 10." },
            "speed_talisman": { name: "Speed Talisman", type: "talisman", subtype: "speed", effect: { speedUp: 10 }, cost: 5000, desc: "Increases Speed by 10." },
            "survival_talisman": { name: "Survival Talisman", type: "talisman", subtype: "survival", effect: { survivalUp: 10 }, cost: 5000, desc: "Increases Survival by 10." },
            "fishing_talisman": { name: "Fishing Talisman", type: "talisman", subtype: "fishing", effect: { fishingUp: 10 }, cost: 5000, desc: "Increases Fishing by 10." },
            "smithing_talisman": { name: "Smithing Talisman", type: "talisman", subtype: "smithing", effect: { smithingUp: 10 }, cost: 5000, desc: "Increases Smithing by 10." },
            "mining_talisman": { name: "Mining Talisman", type: "talisman", subtype: "mining", effect: { miningUp: 10 }, cost: 5000, desc: "Increases Mining by 10." },
            "crafting_talisman": { name: "Crafting Talisman", type: "talisman", subtype: "crafting", effect: { craftingUp: 10 }, cost: 5000, desc: "Increases Crafting by 10." },
            "alchemy_talisman": { name: "Alchemy Talisman", type: "talisman", subtype: "alchemy", effect: { alchemyUp: 10 }, cost: 5000, desc: "Increases Alchemy by 10." },
            "trapping_talisman": { name: "Trapping Talisman", type: "talisman", subtype: "trapping", effect: { trappingUp: 10 }, cost: 5000, desc: "Increases Trapping by 10." },
            "woodcutting_talisman": { name: "Woodcutting Talisman", type: "talisman", subtype: "woodcutting", effect: { woodcuttingUp: 10 }, cost: 5000, desc: "Increases Woodcutting by 10." },
            "cooking_talisman": { name: "Cooking Talisman", type: "talisman", subtype: "cooking", effect: { cookingUp: 10 }, cost: 5000, desc: "Increases Cooking by 10." },
            "barter_talisman": { name: "Barter Talisman", type: "talisman", subtype: "barter", effect: { barterUp: 10 }, cost: 5000, desc: "Increases Barter by 10." },
        },
        "beads": {
            // Beads - High-tier, very expensive, and rare. Provide significant bonuses to skills or stats.
            "luck_beads": { name: "Luck Beads", type: "beads", subtype: "luck", effect: { luckUp: 20 }, cost: 20000, desc: "Increases Luck by 20." },
            "strength_beads": { name: "Strength Beads", type: "beads", subtype: "strength", effect: { strengthUp: 20 }, cost: 20000, desc: "Increases Strength by 20." },
            "defense_beads": { name: "Defense Beads", type: "beads", subtype: "defense", effect: { defenseUp: 20 }, cost: 20000, desc: "Increases Defense by 20." },
            "speed_beads": { name: "Speed Beads", type: "beads", subtype: "speed", effect: { speedUp: 20 }, cost: 20000, desc: "Increases Speed by 20." },
            "survival_beads": { name: "Survival Beads", type: "beads", subtype: "survival", effect: { survivalUp: 20 }, cost: 20000, desc: "Increases Survival by 20." },
            "fishing_beads": { name: "Fishing Beads", type: "beads", subtype: "fishing", effect: { fishingUp: 20 }, cost: 20000, desc: "Increases Fishing by 20." },
            "smithing_beads": { name: "Smithing Beads", type: "beads", subtype: "smithing", effect: { smithingUp: 20 }, cost: 20000, desc: "Increases Smithing by 20." },
            "mining_beads": { name: "Mining Beads", type: "beads", subtype: "mining", effect: { miningUp: 20 }, cost: 20000, desc: "Increases Mining by 20." },
            "crafting_beads": { name: "Crafting Beads", type: "beads", subtype: "crafting", effect: { craftingUp: 20 }, cost: 20000, desc: "Increases Crafting by 20." },
            "alchemy_beads": { name: "Alchemy Beads", type: "beads", subtype: "alchemy", effect: { alchemyUp: 20 }, cost: 20000, desc: "Increases Alchemy by 20." },
            "trapping_beads": { name: "Trapping Beads", type: "beads", subtype: "trapping", effect: { trappingUp: 20 }, cost: 20000, desc: "Increases Trapping by 20." },
            "woodcutting_beads": { name: "Woodcutting Beads", type: "beads", subtype: "woodcutting", effect: { woodcuttingUp: 20 }, cost: 20000, desc: "Increases Woodcutting by 20." },
            "cooking_beads": { name: "Cooking Beads", type: "beads", subtype: "cooking", effect: { cookingUp: 20 }, cost: 20000, desc: "Increases Cooking by 20." },
            "barter_beads": { name: "Barter Beads", type: "beads", subtype: "barter", effect: { barterUp: 20 }, cost: 20000, desc: "Increases Barter by 20." },
        },
        "rings": {
            // Rings - Top-tier, extremely expensive, and legendary. Provide massive bonuses to skills or stats.
            "luck_ring": { name: "Luck Ring", type: "ring", subtype: "luck", effect: { luckUp: 50 }, cost: 100000, desc: "Increases Luck by 50." },
            "strength_ring": { name: "Strength Ring", type: "ring", subtype: "strength", effect: { strengthUp: 50 }, cost: 100000, desc: "Increases Strength by 50." },
            "defense_ring": { name: "Defense Ring", type: "ring", subtype: "defense", effect: { defenseUp: 50 }, cost: 100000, desc: "Increases Defense by 50." },
            "speed_ring": { name: "Speed Ring", type: "ring", subtype: "speed", effect: { speedUp: 50 }, cost: 100000, desc: "Increases Speed by 50." },
            "survival_ring": { name: "Survival Ring", type: "ring", subtype: "survival", effect: { survivalUp: 50 }, cost: 100000, desc: "Increases Survival by 50." },
            "fishing_ring": { name: "Fishing Ring", type: "ring", subtype: "fishing", effect: { fishingUp: 50 }, cost: 100000, desc: "Increases Fishing by 50." },
            "smithing_ring": { name: "Smithing Ring", type: "ring", subtype: "smithing", effect: { smithingUp: 50 }, cost: 100000, desc: "Increases Smithing by 50." },
            "mining_ring": { name: "Mining Ring", type: "ring", subtype: "mining", effect: { miningUp: 50 }, cost: 100000, desc: "Increases Mining by 50." },
            "crafting_ring": { name: "Crafting Ring", type: "ring", subtype: "crafting", effect: { craftingUp: 50 }, cost: 100000, desc: "Increases Crafting by 50." },
            "alchemy_ring": { name: "Alchemy Ring", type: "ring", subtype: "alchemy", effect: { alchemyUp: 50 }, cost: 100000, desc: "Increases Alchemy by 50." },
            "trapping_ring": { name: "Trapping Ring", type: "ring", subtype: "trapping", effect: { trappingUp: 50 }, cost: 100000, desc: "Increases Trapping by 50." },
            "woodcutting_ring": { name: "Woodcutting Ring", type: "ring", subtype: "woodcutting", effect: { woodcuttingUp: 50 }, cost: 100000, desc: "Increases Woodcutting by 50." },
            "cooking_ring": { name: "Cooking Ring", type: "ring", subtype: "cooking", effect: { cookingUp: 50 }, cost: 100000, desc: "Increases Cooking by 50." },
            "barter_ring": { name: "Barter Ring", type: "ring", subtype: "barter", effect: { barterUp: 50 }, cost: 100000, desc: "Increases Barter by 50." },
        },
        "bangles": {
            // Bangles - Legendary-tier, almost impossible to find. Provide unparalleled bonuses to skills or stats.
            "luck_bangle": { name: "Luck Bangle", type: "bangle", subtype: "luck", effect: { luckUp: 100 }, cost: 500000, desc: "Increases Luck by 100." },
            "strength_bangle": { name: "Strength Bangle", type: "bangle", subtype: "strength", effect: { strengthUp: 100 }, cost: 500000, desc: "Increases Strength by 100." },
            "defense_bangle": { name: "Defense Bangle", type: "bangle", subtype: "defense", effect: { defenseUp: 100 }, cost: 500000, desc: "Increases Defense by 100." },
            "speed_bangle": { name: "Speed Bangle", type: "bangle", subtype: "speed", effect: { speedUp: 100 }, cost: 500000, desc: "Increases Speed by 100." },
            "survival_bangle": { name: "Survival Bangle", type: "bangle", subtype: "survival", effect: { survivalUp: 100 }, cost: 500000, desc: "Increases Survival by 100." },
            "fishing_bangle": { name: "Fishing Bangle", type: "bangle", subtype: "fishing", effect: { fishingUp: 100 }, cost: 500000, desc: "Increases Fishing by 100." },
            "smithing_bangle": { name: "Smithing Bangle", type: "bangle", subtype: "smithing", effect: { smithingUp: 100 }, cost: 500000, desc: "Increases Smithing by 100." },
            "mining_bangle": { name: "Mining Bangle", type: "bangle", subtype: "mining", effect: { miningUp: 100 }, cost: 500000, desc: "Increases Mining by 100." },
            "crafting_bangle": { name: "Crafting Bangle", type: "bangle", subtype: "crafting", effect: { craftingUp: 100 }, cost: 500000, desc: "Increases Crafting by 100." },
            "alchemy_bangle": { name: "Alchemy Bangle", type: "bangle", subtype: "alchemy", effect: { alchemyUp: 100 }, cost: 500000, desc: "Increases Alchemy by 100." },
            "trapping_bangle": { name: "Trapping Bangle", type: "bangle", subtype: "trapping", effect: { trappingUp: 100 }, cost: 500000, desc: "Increases Trapping by 100." },
            "woodcutting_bangle": { name: "Woodcutting Bangle", type: "bangle", subtype: "woodcutting", effect: { woodcuttingUp: 100 }, cost: 500000, desc: "Increases Woodcutting by 100." },
            "cooking_bangle": { name: "Cooking Bangle", type: "bangle", subtype: "cooking", effect: { cookingUp: 100 }, cost: 500000, desc: "Increases Cooking by 100." },
            "barter_bangle": { name: "Barter Bangle", type: "bangle", subtype: "barter", effect: { barterUp: 100 }, cost: 500000, desc: "Increases Barter by 100." },
        },
    },
    illicit_goods: {
        "Magic Focuses": {
            global: { type: "magic", keyRef: MAGIC_ITEMS },
            "void_crystal": { key: "void_crystal", name: "Void Crystal", cost: 50000 },
            "black_crystal": { key: "black_crystal", name: "Black Crystal", cost: 75000 },
            "white_orb": { key: "white_orb", name: "White Orb", cost: 100000 },
            "void_orb": { key: "void_orb", name: "Void Orb", cost: 150000 },
            "mythic_spellbook": { key: "mythic_spellbook", name: "Mythic Spellbook", cost: 200000 },
            "demonic_spellbook": { key: "demonic_spellbook", name: "Demonic Spellbook", cost: 250000 },
            "demonic_void": { key: "demonic_void", name: "Demonic Void", cost: 300000 },
            "black_hole_void": { key: "black_hole_void", name: "Black Hole Void", cost: 500000 },
        },
        // No single `type`: this section genuinely mixes weapon (the four
        // named blades/bows) and armor (the four named pieces).
        "Forbidden Artifacts": {
            global: { keyRef: UNIQUE_ITEMS },
            "excalibur": { key: "excalibur", name: "Excalibur", cost: 200000 },
            "dagger_of_time": { key: "dagger_of_time", name: "Dagger of Time", cost: 300000 },
            "bow_of_eternity": { key: "bow_of_eternity", name: "Bow of Eternity", cost: 400000 },
            "staff_of_wisdom": { key: "staff_of_wisdom", name: "Staff of Wisdom", cost: 500000 },
            "aegis_shield": { key: "aegis_shield", name: "Aegis Shield", cost: 100000 },
            "boots_of_swiftness": { key: "boots_of_swiftness", name: "Boots of Swiftness", cost: 150000 },
            "cloak_of_invisibility": { key: "cloak_of_invisibility", name: "Cloak of Invisibility", cost: 400000 },
            "ring_of_eternity": { key: "ring_of_eternity", name: "Ring of Eternity", cost: 500000 },
        },
        // Unlike the two sections above, these keys are NOT item ids - a bundle
        // is a name for a pile of something else, and what you get is its
        // `outputs`. So `keyRef` here points at where those OUTPUTS live, and it
        // takes two catalogs because coal is a MINING_RESOURCES entry while the
        // five ores are ITEMS - which is the reason the screen resolves through
        // ALL_ITEMS rather than through keyRef.
        "Smithing Bundles": {
            global: { type: "smithing", keyRef: [ITEMS, MINING_RESOURCES], outputsOnly: true },
            "box_of_coal": { key: "box_of_coal", name: "Box of Coal", outputs: { "coal": 100 }, cost: 1000 },
            "box_of_iron": { key: "box_of_iron", name: "Box of Iron", outputs: { "iron_ore": 30 }, cost: 5000 },
            "box_of_gold": { key: "box_of_gold", name: "Box of Gold", outputs: { "gold_ore": 20 }, cost: 10000 },
            "box_of_mithril": { key: "box_of_mithril", name: "Box of Mithril", outputs: { "mithril_ore": 10 }, cost: 20000 },
            "box_of_adamantite": { key: "box_of_adamantite", name: "Box of Adamantite", outputs: { "adamantite_ore": 5 }, cost: 50000 },
            "box_of_runite": { key: "box_of_runite", name: "Box of Runite", outputs: { "runite_ore": 2 }, cost: 100000 },
        }
    },

};
// Black Market Helpers
//
// Both collections are two levels deep - a section, then its entries - and a
// section may carry a `global` block. Everything below strips that key rather
// than treating it as an entry, the same guard the recipe collections and
// withGlobalDefaults() rely on; without it "global" renders as a shop row.
function sectionEntries(section) {
    return Object.entries(section).filter(([key]) => key !== "global");
}

// The sections of one BLACKMARKET collection ("illicit_goods"/"enhancements"),
// in declaration order - which is the order the shop screen tabs them in, and
// for enhancements is also cheapest-tier-first.
export function blackMarketSections(collectionKey) {
    const collection = BLACKMARKET[collectionKey];
    if (!collection) return [];
    return Object.entries(collection).map(([key, section]) => ({
        key,
        // "illicit_goods" sections are authored with display names already
        // ("Magic Focuses"); enhancement groups are lowercase keys ("charms").
        label: key.includes(" ") ? key : key.charAt(0).toUpperCase() + key.slice(1),
        global: section.global ?? null,
        entries: sectionEntries(section),
    }));
}

// One entry by key, from either collection. Returns { key, entry, collection,
// section } so a caller knows which half of the market it came from.
export function blackMarketEntry(key) {
    for (const collectionKey of Object.keys(BLACKMARKET)) {
        for (const section of blackMarketSections(collectionKey)) {
            const hit = section.entries.find(([entryKey]) => entryKey === key);
            if (hit) return { key, entry: hit[1], collection: collectionKey, section: section.key };
        }
    }
    return null;
}

// What buying one entry actually hands over: { itemId: qty }. Most entries are
// a single real item named by their own id; the smithing bundles name a pile
// of something else in `outputs` and are not items themselves.
//
// Takes the id separately rather than reading entry.key: only illicit_goods
// entries carry a `key` field, the 70 translated enhancements don't.
export function blackMarketGrants(id, entry) {
    return entry?.outputs ?? { [id]: 1 };
}

// The five slots an enhancement can be worn in, under the name the state layer
// uses. Same list as the tier ladder - one worn item per tier.
export const ENHANCEMENT_SLOTS = BLACKMARKET_ENHANCEMENT_TYPES;

// Rarity by tier, so the enhancements price and sort alongside everything else
// through SHOP_RARITY_DISPLAY. The black market skips the barter gate these
// levels would otherwise impose (see ui/screens/blackMarket.js) - this is here
// for getSellPrice, the backpack and the playercard.
const ENHANCEMENT_RARITY = {
    charm: "rare", talisman: "epic", beads: "legendary", ring: "mythic", bangle: "godlike",
};

// BLACKMARKET.enhancements is authored in its own vocabulary - a `type` of
// "charm"/"talisman"/"beads"/"ring"/"bangle", none of which ITEM_TYPES knows -
// exactly like FISHING_ITEMS below. Same treatment: translate once into
// canonical items, keep the authored vocabulary under its own field names
// (enhancementSlot/enhancementGroup, mirroring fishingType/fishingTier), and
// export the result as what ALL_ITEMS carries.
//
// `subtype` needs no translating: it is already the id of the skill the entry
// boosts, which is what state/gameState.js's effectiveSkillLevel() sums by.
function withBlackMarketDefaults(enhancements) {
    const items = {};
    for (const [group, section] of Object.entries(enhancements)) {
        for (const [id, entry] of sectionEntries(section)) {
            const { type, cost, ...rest } = entry;
            items[id] = {
                ...rest,
                type: "enhancement",
                enhancementSlot: type,
                enhancementGroup: group,
                rarity: ENHANCEMENT_RARITY[type] ?? "rare",
                // getBuyPrice/getSellPrice read `value` first, so the authored
                // cost is the price rather than a rarity-derived guess.
                value: cost,
            };
        }
    }
    return items;
}

export const BLACKMARKET_CATALOG = withBlackMarketDefaults(BLACKMARKET.enhancements);

// Dedicated Fishing Section
// Fishing is a unique skill in the game, and it has its own set of items, recipes, and logic. The following section defines the fishing-related items, recipes, and mechanics.
export const FISHING_TYPES = ["rod", "bait", "net", "hook", "fish", "crustacean", "shellfish", "mollusk"];
export const FISHING_SUBTYPES = {
    "rod": ["basic", "crafted", "forged", "enchanted", "mythic", "godlike"],
    "bait": ["basic", "crafted", "forged", "enchanted", "mythic", "godlike"],
    "net": ["basic", "crafted", "forged", "enchanted", "mythic", "godlike"],
    "hook": ["basic", "crafted", "forged", "enchanted", "mythic", "godlike"],
    "fish": ["shallow", "deep", "offland", "ancient", "mythic", "godlike"],
    "crustacean": ["shallow", "deep", "offland", "ancient", "mythic", "godlike"],
    "shellfish": ["shallow", "deep", "offland", "ancient", "mythic", "godlike"],
    "mollusk": ["fresh", "muck", "swamp", "ancient", "mythic", "godlike"],
};
export const FISHING_RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "unique", "exotic", "ancient", "godlike"];
// Fish, How they are Caught, their Rarity, and Difficulty to Catch
// No `global` tag here: half these species are crustaceans/shellfish/molluscs,
// so there is no one type to inherit. What each species IS lives on its catch
// item in FISHING_ITEMS (`fishingType`), which is what getFishByType() reads.
export const FISH = {
    // Common and uncommon fish that can be caught in freshwater and saltwater environments.
    "pike": { water: "freshwater", caught: "bait", rarity: "common", difficulty: 1, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    "perch": { water: "freshwater", caught: "bait", rarity: "common", difficulty: 1, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    "bass": { water: "freshwater", caught: "rod", rarity: "common", difficulty: 1, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    "trout": { water: "freshwater", caught: "rod", rarity: "common", difficulty: 1, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    "carp": { water: "freshwater", caught: "bait", rarity: "common", difficulty: 1, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    "catfish": { water: "freshwater", caught: "bait", rarity: "common", difficulty: 1, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    "tilapia": { water: "freshwater", caught: "bait", rarity: "uncommon", difficulty: 2, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    
    "sturgeon": { water: true, caught: "rod", rarity: "uncommon", difficulty: 2, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    "salmon": { water: true, caught: "rod", rarity: "uncommon", difficulty: 2, desc: "A freshwater fish that is commonly found in lakes and rivers." },
    "shrimp": { water: true, caught: "net", rarity: "common", difficulty: 1, desc: "A saltwater crustacean that is commonly found in oceans." },
    "crab": { water: true, caught: "net", rarity: "common", difficulty: 1, desc: "A saltwater crustacean that is commonly found in oceans." },
    "clam": { water: true, caught: "hook", rarity: "common", difficulty: 1, desc: "A saltwater shellfish that is commonly found in oceans." },
        
    "tuna": { water: "saltwater", caught: "rod", rarity: "rare", difficulty: 3, desc: "A saltwater fish that is commonly found in oceans." },
    "lobster": { water: "saltwater", caught: "net", rarity: "uncommon", difficulty: 2, desc: "A saltwater crustacean that is commonly found in oceans." },
    "mussel": { water: "saltwater", caught: "hook", rarity: "common", difficulty: 1, desc: "A saltwater shellfish that is commonly found in oceans." },
    "oyster": { water: "saltwater", caught: "bait", rarity: "uncommon", difficulty: 2, desc: "A saltwater mollusk that is commonly found in oceans." },
    // Rare, Ancient, Epic, and Legendary fish.
    // - Freshwater
    "catfish_king": { water: "freshwater", caught: "rod", rarity: "epic", difficulty: 5, desc: "A legendary freshwater fish that is commonly found in lakes and rivers." },
    "golden_trout": { water: "freshwater", caught: "rod", rarity: "legendary", difficulty: 6, desc: "A legendary freshwater fish that is commonly found in lakes and rivers." },
    "raibow_salmon": { water: "freshwater", caught: "rod", rarity: "legendary", difficulty: 7, desc: "A mythic freshwater fish that is commonly found in lakes and rivers." },
    "giant_carp": { water: "freshwater", caught: "rod", rarity: "mythic", difficulty: 8, desc: "A mythic freshwater fish that is commonly found in lakes and rivers." },
    "giant_catfish": { water: "freshwater", caught: "rod", rarity: "mythic", difficulty: 9, desc: "A mythic freshwater fish that is commonly found in lakes and rivers." },
    // - Saltwater
    "anglerfish": { water: "freshwater", caught: "rod", rarity: "rare", difficulty: 4, desc: "A rare freshwater fish that is commonly found in lakes and rivers." },
    "giant_tuna": { water: "saltwater", caught: "rod", rarity: "rare", difficulty: 4, desc: "A rare saltwater fish that is commonly found in oceans." },
    "giant_lobster": { water: "saltwater", caught: "net", rarity: "epic", difficulty: 5, desc: "A legendary saltwater crustacean that is commonly found in oceans." },
    "giant_crab": { water: "saltwater", caught: "net", rarity: "epic", difficulty: 5, desc: "A legendary saltwater crustacean that is commonly found in oceans." },
    "giant_clam": { water: "saltwater", caught: "hook", rarity: "epic", difficulty: 5, desc: "A legendary saltwater shellfish that is commonly found in oceans." },
    "giant_mussel": { water: "saltwater", caught: "hook", rarity: "epic", difficulty: 5, desc: "A legendary saltwater shellfish that is commonly found in oceans." },
    "giant_oyster": { water: "saltwater", caught: "bait", rarity: "epic", difficulty: 5, desc: "A legendary saltwater mollusk that is commonly found in oceans." },
    // Mythic, unique, exotic, ancient, and godlike fish. Saltwater only.
    "barboros": { water: "saltwater", caught: "hook", rarity: "legendary", difficulty: 6, desc: "A mythic saltwater creature that is commonly found in oceans." },
    "kraken": { water: "saltwater", caught: "net", rarity: "legendary", difficulty: 6, desc: "A legendary saltwater creature that is commonly found in oceans." },
    "leviathan": { water: "saltwater", caught: "net", rarity: "mythic", difficulty: 7, desc: "A mythic saltwater creature that is commonly found in oceans." },
    "poseidon": { water: "saltwater", caught: "net", rarity: "godlike", difficulty: 8, desc: "A godlike saltwater creature that is commonly found in oceans." },
    "tarvus": { water: "saltwater", caught: "rod", rarity: "godlike", difficulty: 9, desc: "A godlike saltwater creature that is commonly found in oceans." },
    // Top level Godlike fish, only obtainable through special events or quests.
    "leviathan_king": { water: "saltwater", caught: "net", rarity: "godlike", difficulty: 10, desc: "A godlike saltwater creature that is only obtainable through special events or quests." },
    "poseidon_king": { water: "saltwater", caught: "net", rarity: "godlike", difficulty: 10, desc: "A godlike saltwater creature that is only obtainable through special events or quests." },
    "tarvus_king": { water: "saltwater", caught: "rod", rarity: "godlike", difficulty: 10, desc: "A godlike saltwater creature that is only obtainable through special events or quests." },
};
// Authored in fishing vocabulary: `type` is one of FISHING_TYPES and `subtype`
// one of FISHING_SUBTYPES, neither of which the engine speaks. withFishingDefaults()
// at the bottom of this section translates every entry into a canonical
// ITEM_TYPES item (keeping the fishing vocabulary as `fishingType`/`fishingTier`)
// and exports the result as FISHING_CATALOG - that, not this, is what ALL_ITEMS
// carries. No `global` tag: the mapping supplies the shared fields instead.
export const FISHING_ITEMS = {
    // Basic Fishing items.
    "fishing_rod": { name: "Fishing Rod", type: "rod", subtype: "basic", rarity: "common", desc: "A basic fishing rod for catching fish." },
    "fishing_bait": { name: "Fishing Bait", type: "bait", subtype: "basic", rarity: "common", desc: "Basic bait for attracting fish." },
    "fishing_net": { name: "Fishing Net", type: "net", subtype: "basic", rarity: "common", desc: "A basic net for catching multiple fish at once." },
    "fishing_hook": { name: "Fishing Hook", type: "hook", subtype: "basic", rarity: "common", desc: "A basic hook for catching fish." },
    // Crafted Fishing items.
    "crafted_fishing_rod": { name: "Crafted Fishing Rod", type: "rod", subtype: "crafted", rarity: "uncommon", desc: "A crafted fishing rod for catching fish." },
    "crafted_fishing_bait": { name: "Crafted Fishing Bait", type: "bait", subtype: "crafted", rarity: "uncommon", desc: "Crafted bait for attracting fish." },
    "crafted_fishing_net": { name: "Crafted Fishing Net", type: "net", subtype: "crafted", rarity: "uncommon", desc: "A crafted net for catching multiple fish at once." },
    "crafted_fishing_hook": { name: "Crafted Fishing Hook", type: "hook", subtype: "crafted", rarity: "uncommon", desc: "A crafted hook for catching fish." },
    // Forged Fishing items.
    "forged_fishing_rod": { name: "Forged Fishing Rod", type: "rod", subtype: "forged", rarity: "rare", desc: "A forged fishing rod for catching fish." },
    "forged_fishing_bait": { name: "Forged Fishing Bait", type: "bait", subtype: "forged", rarity: "rare", desc: "Forged bait for attracting fish." },
    "forged_fishing_net": { name: "Forged Fishing Net", type: "net", subtype: "forged", rarity: "rare", desc: "A forged net for catching multiple fish at once." },
    "forged_fishing_hook": { name: "Forged Fishing Hook", type: "hook", subtype: "forged", rarity: "rare", desc: "A forged hook for catching fish." },
    // Enchanted Fishing items.
    "enchanted_fishing_rod": { name: "Enchanted Fishing Rod", type: "rod", subtype: "enchanted", rarity: "epic", desc: "An enchanted fishing rod for catching fish." },
    "enchanted_fishing_bait": { name: "Enchanted Fishing Bait", type: "bait", subtype: "enchanted", rarity: "epic", desc: "Enchanted bait for attracting fish." },
    "enchanted_fishing_net": { name: "Enchanted Fishing Net", type: "net", subtype: "enchanted", rarity: "epic", desc: "An enchanted net for catching multiple fish at once." },
    "enchanted_fishing_hook": { name: "Enchanted Fishing Hook", type: "hook", subtype: "enchanted", rarity: "epic", desc: "An enchanted hook for catching fish." },
    // Mythic Fishing items.
    "mythic_fishing_rod": { name: "Mythic Fishing Rod", type: "rod", subtype: "mythic", rarity: "legendary", desc: "A mythic fishing rod for catching fish." },
    "mythic_fishing_bait": { name: "Mythic Fishing Bait", type: "bait", subtype: "mythic", rarity: "legendary", desc: "Mythic bait for attracting fish." },
    "mythic_fishing_net": { name: "Mythic Fishing Net", type: "net", subtype: "mythic", rarity: "legendary", desc: "A mythic net for catching multiple fish at once." },
    "mythic_fishing_hook": { name: "Mythic Fishing Hook", type: "hook", subtype: "mythic", rarity: "legendary", desc: "A mythic hook for catching fish." },
    // Godlike Fishing items.
    "godlike_fishing_rod": { name: "Godlike Fishing Rod", type: "rod", subtype: "godlike", rarity: "mythic", desc: "A godlike fishing rod for catching fish." },
    "godlike_fishing_bait": { name: "Godlike Fishing Bait", type: "bait", subtype: "godlike", rarity: "mythic", desc: "Godlike bait for attracting fish." },
    "godlike_fishing_net": { name: "Godlike Fishing Net", type: "net", subtype: "godlike", rarity: "mythic", desc: "A godlike net for catching multiple fish at once." },
    "godlike_fishing_hook": { name: "Godlike Fishing Hook", type: "hook", subtype: "godlike", rarity: "mythic", desc: "A godlike hook for catching fish." },
    // Fish and other aquatic creatures.
    // INGREDIENTS -- From Ancient to Godlike, these are the raw materials for cooking and crafting.
    "leviathan_scale": { name: "Leviathan Scale", type: "fish", subtype: "ancient", rarity: "mythic", desc: "A scale from the legendary Leviathan fish." },
    "leviathan_tooth": { name: "Leviathan Tooth", type: "fish", subtype: "ancient", rarity: "mythic", desc: "A tooth from the legendary Leviathan fish." },
    "leviathan_flesh": { name: "Leviathan Flesh", type: "fish", subtype: "ancient", rarity: "mythic", desc: "Flesh from the legendary Leviathan fish." },
    "leviathan_bone": { name: "Leviathan Bone", type: "fish", subtype: "ancient", rarity: "mythic", desc: "A bone from the legendary Leviathan fish." },
    "poseidon_scale": { name: "Poseidon Scale", type: "fish", subtype: "ancient", rarity: "godlike", desc: "A scale from the legendary Poseidon fish." },
    "poseidon_tooth": { name: "Poseidon Tooth", type: "fish", subtype: "ancient", rarity: "godlike", desc: "A tooth from the legendary Poseidon fish." },
    "poseidon_flesh": { name: "Poseidon Flesh", type: "fish", subtype: "ancient", rarity: "godlike", desc: "Flesh from the legendary Poseidon fish." },
    "poseidon_bone": { name: "Poseidon Bone", type: "fish", subtype: "ancient", rarity: "godlike", desc: "A bone from the legendary Poseidon fish." },
    "tarvus_scale": { name: "Tarvus Scale", type: "fish", subtype: "ancient", rarity: "godlike", desc: "A scale from the legendary Tarvus fish." },
    "tarvus_tooth": { name: "Tarvus Tooth", type: "fish", subtype: "ancient", rarity: "godlike", desc: "A tooth from the legendary Tarvus fish." },
    "tarvus_flesh": { name: "Tarvus Flesh", type: "fish", subtype: "ancient", rarity: "godlike", desc: "Flesh from the legendary Tarvus fish." },
    "tarvus_bone": { name: "Tarvus Bone", type: "fish", subtype: "ancient", rarity: "godlike", desc: "A bone from the legendary Tarvus fish." },
    "leviathan_king_scale": { name: "Leviathan King Scale", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A scale from the godlike Leviathan King fish." },
    "leviathan_king_flesh": { name: "Leviathan King Flesh", type: "fish", subtype: "godlike", rarity: "mythic", desc: "Flesh from the godlike Leviathan King fish." },
    "leviathan_king_tooth": { name: "Leviathan King Tooth", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A tooth from the godlike Leviathan King fish." },
    "leviathan_king_bone": { name: "Leviathan King Bone", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A bone from the godlike Leviathan King fish." },
    "poseidon_king_scale": { name: "Poseidon King Scale", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A scale from the godlike Poseidon King fish." },
    "poseidon_king_flesh": { name: "Poseidon King Flesh", type: "fish", subtype: "godlike", rarity: "mythic", desc: "Flesh from the godlike Poseidon King fish." },
    "poseidon_king_tooth": { name: "Poseidon King Tooth", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A tooth from the godlike Poseidon King fish." },
    "poseidon_king_bone": { name: "Poseidon King Bone", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A bone from the godlike Poseidon King fish." },
    "tarvus_king_scale": { name: "Tarvus King Scale", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A scale from the godlike Tarvus King fish." },
    "tarvus_king_flesh": { name: "Tarvus King Flesh", type: "fish", subtype: "godlike", rarity: "mythic", desc: "Flesh from the godlike Tarvus King fish." },
    "tarvus_king_tooth": { name: "Tarvus King Tooth", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A tooth from the godlike Tarvus King fish." },
    "tarvus_king_bone": { name: "Tarvus King Bone", type: "fish", subtype: "godlike", rarity: "mythic", desc: "A bone from the godlike Tarvus King fish." },
    // - RAW
    "raw_pike": { name: "Raw Pike", type: "fish", subtype: "shallow", rarity: "common", desc: "A raw pike, fresh from the water." },
    "raw_perch": { name: "Raw Perch", type: "fish", subtype: "shallow", rarity: "common", desc: "A raw perch, fresh from the water." },
    "raw_bass": { name: "Raw Bass", type: "fish", subtype: "shallow", rarity: "common", desc: "A raw bass, fresh from the water." },
    "raw_trout": { name: "Raw Trout", type: "fish", subtype: "shallow", rarity: "common", desc: "A raw trout, fresh from the water." },
    "raw_carp": { name: "Raw Carp", type: "fish", subtype: "shallow", rarity: "common", desc: "A raw carp, fresh from the water." },
    "raw_catfish": { name: "Raw Catfish", type: "fish", subtype: "shallow", rarity: "common", desc: "A raw catfish, fresh from the water." },
    "raw_salmon": { name: "Raw Salmon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A raw salmon, fresh from the water." },
    "raw_sturgeon": { name: "Raw Sturgeon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A raw sturgeon, fresh from the water." },
    "raw_tilapia": { name: "Raw Tilapia", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A raw tilapia, fresh from the water." },
    "raw_tuna": { name: "Raw Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A raw tuna, fresh from the water." },
    "raw_lobster": { name: "Raw Lobster", type: "crustacean", subtype: "shallow", rarity: "uncommon", desc: "A raw lobster, fresh from the water." },
    "raw_shrimp": { name: "Raw Shrimp", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A raw shrimp, fresh from the water." },
    "raw_crab": { name: "Raw Crab", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A raw crab, fresh from the water." },
    "raw_clam": { name: "Raw Clam", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A raw clam, fresh from the water." },
    "raw_mussel": { name: "Raw Mussel", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A raw mussel, fresh from the water." },
    "raw_oyster": { name: "Raw Oyster", type: "mollusk", subtype: "fresh", rarity: "uncommon", desc: "A raw oyster, fresh from the water." },
    "raw_anglerfish": { name: "Raw Anglerfish", type: "fish", subtype: "deep", rarity: "rare", desc: "A raw anglerfish, fresh from the water." },
    "raw_catfish_king": { name: "Raw Catfish King", type: "fish", subtype: "deep", rarity: "epic", desc: "A raw catfish king, fresh from the water." },
    "raw_golden_trout": { name: "Raw Golden Trout", type: "fish", subtype: "deep", rarity: "legendary", desc: "A raw golden trout, fresh from the water." },
    "raw_raibow_salmon": { name: "Raw Rainbow Salmon", type: "fish", subtype: "deep", rarity: "legendary", desc: "A raw rainbow salmon, fresh from the water." },
    "raw_giant_carp": { name: "Raw Giant Carp", type: "fish", subtype: "deep", rarity: "mythic", desc: "A raw giant carp, fresh from the water." },
    "raw_giant_catfish": { name: "Raw Giant Catfish", type: "fish", subtype: "deep", rarity: "mythic", desc: "A raw giant catfish, fresh from the water." },
    "raw_giant_tuna": { name: "Raw Giant Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A raw giant tuna, fresh from the water." },
    "raw_giant_lobster": { name: "Raw Giant Lobster", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A raw giant lobster, fresh from the water." },
    "raw_giant_crab": { name: "Raw Giant Crab", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A raw giant crab, fresh from the water." },
    "raw_giant_clam": { name: "Raw Giant Clam", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A raw giant clam, fresh from the water." },
    "raw_giant_mussel": { name: "Raw Giant Mussel", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A raw giant mussel, fresh from the water." },
    "raw_giant_oyster": { name: "Raw Giant Oyster", type: "mollusk", subtype: "fresh", rarity: "epic", desc: "A raw giant oyster, fresh from the water." },
    "raw_kraken": { name: "Raw Kraken", type: "crustacean", subtype: "deep", rarity: "legendary", desc: "A raw kraken, fresh from the water." },
    "raw_barboros": { name: "Raw Barboros", type: "fish", subtype: "deep", rarity: "legendary", desc: "A raw barboros, fresh from the water." },
    // - COOKED
    "cooked_pike": { name: "Cooked Pike", type: "fish", subtype: "shallow", rarity: "common", desc: "A cooked pike, ready to eat." },
    "cooked_perch": { name: "Cooked Perch", type: "fish", subtype: "shallow", rarity: "common", desc: "A cooked perch, ready to eat." },
    "cooked_bass": { name: "Cooked Bass", type: "fish", subtype: "shallow", rarity: "common", desc: "A cooked bass, ready to eat." },
    "cooked_trout": { name: "Cooked Trout", type: "fish", subtype: "shallow", rarity: "common", desc: "A cooked trout, ready to eat." },
    "cooked_carp": { name: "Cooked Carp", type: "fish", subtype: "shallow", rarity: "common", desc: "A cooked carp, ready to eat." },
    "cooked_catfish": { name: "Cooked Catfish", type: "fish", subtype: "shallow", rarity: "common", desc: "A cooked catfish, ready to eat." },
    "cooked_salmon": { name: "Cooked Salmon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A cooked salmon, ready to eat." },
    "cooked_sturgeon": { name: "Cooked Sturgeon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A cooked sturgeon, ready to eat." },
    "cooked_tilapia": { name: "Cooked Tilapia", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A cooked tilapia, ready to eat." },
    "cooked_tuna": { name: "Cooked Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A cooked tuna, ready to eat." },
    "cooked_lobster": { name: "Cooked Lobster", type: "crustacean", subtype: "shallow", rarity: "uncommon", desc: "A cooked lobster, ready to eat." },
    "cooked_shrimp": { name: "Cooked Shrimp", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A cooked shrimp, ready to eat." },
    "cooked_crab": { name: "Cooked Crab", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A cooked crab, ready to eat." },
    "cooked_clam": { name: "Cooked Clam", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A cooked clam, ready to eat." },
    "cooked_mussel": { name: "Cooked Mussel", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A cooked mussel, ready to eat." },
    "cooked_oyster": { name: "Cooked Oyster", type: "mollusk", subtype: "fresh", rarity: "uncommon", desc: "A cooked oyster, ready to eat." },
    "cooked_anglerfish": { name: "Cooked Anglerfish", type: "fish", subtype: "deep", rarity: "rare", desc: "A cooked anglerfish, ready to eat." },
    "cooked_catfish_king": { name: "Cooked Catfish King", type: "fish", subtype: "deep", rarity: "epic", desc: "A cooked catfish king, ready to eat." },
    "cooked_golden_trout": { name: "Cooked Golden Trout", type: "fish", subtype: "deep", rarity: "legendary", desc: "A cooked golden trout, ready to eat." },
    "cooked_raibow_salmon": { name: "Cooked Rainbow Salmon", type: "fish", subtype: "deep", rarity: "legendary", desc: "A cooked rainbow salmon, ready to eat." },
    "cooked_giant_carp": { name: "Cooked Giant Carp", type: "fish", subtype: "deep", rarity: "mythic", desc: "A cooked giant carp, ready to eat." },
    "cooked_giant_catfish": { name: "Cooked Giant Catfish", type: "fish", subtype: "deep", rarity: "mythic", desc: "A cooked giant catfish, ready to eat." },
    "cooked_giant_tuna": { name: "Cooked Giant Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A cooked giant tuna, ready to eat." },
    "cooked_giant_lobster": { name: "Cooked Giant Lobster", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A cooked giant lobster, ready to eat." },
    "cooked_giant_crab": { name: "Cooked Giant Crab", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A cooked giant crab, ready to eat." },
    "cooked_giant_clam": { name: "Cooked Giant Clam", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A cooked giant clam, ready to eat." },
    "cooked_giant_mussel": { name: "Cooked Giant Mussel", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A cooked giant mussel, ready to eat." },
    "cooked_giant_oyster": { name: "Cooked Giant Oyster", type: "mollusk", subtype: "fresh", rarity: "epic", desc: "A cooked giant oyster, ready to eat." },
    "cooked_kraken": { name: "Cooked Kraken", type: "crustacean", subtype: "deep", rarity: "legendary", desc: "A cooked kraken, ready to eat." },
    "cooked_barboros": { name: "Cooked Barboros", type: "fish", subtype: "deep", rarity: "legendary", desc: "A cooked barboros, ready to eat." },
    "grilled_pike": { name: "Grilled Pike", type: "fish", subtype: "shallow", rarity: "common", desc: "A grilled pike, ready to eat." },
    "grilled_perch": { name: "Grilled Perch", type: "fish", subtype: "shallow", rarity: "common", desc: "A grilled perch, ready to eat." },
    "grilled_bass": { name: "Grilled Bass", type: "fish", subtype: "shallow", rarity: "common", desc: "A grilled bass, ready to eat." },
    "grilled_trout": { name: "Grilled Trout", type: "fish", subtype: "shallow", rarity: "common", desc: "A grilled trout, ready to eat." },
    "grilled_carp": { name: "Grilled Carp", type: "fish", subtype: "shallow", rarity: "common", desc: "A grilled carp, ready to eat." },
    "grilled_catfish": { name: "Grilled Catfish", type: "fish", subtype: "shallow", rarity: "common", desc: "A grilled catfish, ready to eat." },
    "grilled_salmon": { name: "Grilled Salmon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A grilled salmon, ready to eat." },
    "grilled_sturgeon": { name: "Grilled Sturgeon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A grilled sturgeon, ready to eat." },
    "grilled_tilapia": { name: "Grilled Tilapia", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A grilled tilapia, ready to eat." },
    "grilled_tuna": { name: "Grilled Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A grilled tuna, ready to eat." },
    "grilled_lobster": { name: "Grilled Lobster", type: "crustacean", subtype: "shallow", rarity: "uncommon", desc: "A grilled lobster, ready to eat." },
    "grilled_shrimp": { name: "Grilled Shrimp", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A grilled shrimp, ready to eat." },
    "grilled_crab": { name: "Grilled Crab", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A grilled crab, ready to eat." },
    "grilled_clam": { name: "Grilled Clam", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A grilled clam, ready to eat." },
    "grilled_mussel": { name: "Grilled Mussel", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A grilled mussel, ready to eat." },
    "grilled_oyster": { name: "Grilled Oyster", type: "mollusk", subtype: "fresh", rarity: "uncommon", desc: "A grilled oyster, ready to eat." },
    "grilled_anglerfish": { name: "Grilled Anglerfish", type: "fish", subtype: "deep", rarity: "rare", desc: "A grilled anglerfish, ready to eat." },
    "grilled_catfish_king": { name: "Grilled Catfish King", type: "fish", subtype: "deep", rarity: "epic", desc: "A grilled catfish king, ready to eat." },
    "grilled_golden_trout": { name: "Grilled Golden Trout", type: "fish", subtype: "deep", rarity: "legendary", desc: "A grilled golden trout, ready to eat." },
    "grilled_raibow_salmon": { name: "Grilled Rainbow Salmon", type: "fish", subtype: "deep", rarity: "legendary", desc: "A grilled rainbow salmon, ready to eat." },
    "grilled_giant_carp": { name: "Grilled Giant Carp", type: "fish", subtype: "deep", rarity: "mythic", desc: "A grilled giant carp, ready to eat." },
    "grilled_giant_catfish": { name: "Grilled Giant Catfish", type: "fish", subtype: "deep", rarity: "mythic", desc: "A grilled giant catfish, ready to eat." },
    "grilled_giant_tuna": { name: "Grilled Giant Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A grilled giant tuna, ready to eat." },
    "grilled_giant_lobster": { name: "Grilled Giant Lobster", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A grilled giant lobster, ready to eat." },
    "grilled_giant_crab": { name: "Grilled Giant Crab", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A grilled giant crab, ready to eat." },
    "grilled_giant_clam": { name: "Grilled Giant Clam", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A grilled giant clam, ready to eat." },
    "grilled_giant_mussel": { name: "Grilled Giant Mussel", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A grilled giant mussel, ready to eat." },
    "grilled_giant_oyster": { name: "Grilled Giant Oyster", type: "mollusk", subtype: "fresh", rarity: "epic", desc: "A grilled giant oyster, ready to eat." },
    "grilled_kraken": { name: "Grilled Kraken", type: "crustacean", subtype: "deep", rarity: "legendary", desc: "A grilled kraken, ready to eat." },
    "grilled_barboros": { name: "Grilled Barboros", type: "fish", subtype: "deep", rarity: "legendary", desc: "A grilled barboros, ready to eat." },
    "baked_pike": { name: "Baked Pike", type: "fish", subtype: "shallow", rarity: "common", desc: "A baked pike, ready to eat." },
    "baked_perch": { name: "Baked Perch", type: "fish", subtype: "shallow", rarity: "common", desc: "A baked perch, ready to eat." },
    "baked_bass": { name: "Baked Bass", type: "fish", subtype: "shallow", rarity: "common", desc: "A baked bass, ready to eat." },
    "baked_trout": { name: "Baked Trout", type: "fish", subtype: "shallow", rarity: "common", desc: "A baked trout, ready to eat." },
    "baked_carp": { name: "Baked Carp", type: "fish", subtype: "shallow", rarity: "common", desc: "A baked carp, ready to eat." },
    "baked_catfish": { name: "Baked Catfish", type: "fish", subtype: "shallow", rarity: "common", desc: "A baked catfish, ready to eat." },
    "baked_salmon": { name: "Baked Salmon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A baked salmon, ready to eat." },
    "baked_sturgeon": { name: "Baked Sturgeon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A baked sturgeon, ready to eat." },
    "baked_tilapia": { name: "Baked Tilapia", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A baked tilapia, ready to eat." },
    "baked_tuna": { name: "Baked Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A baked tuna, ready to eat." },
    "baked_lobster": { name: "Baked Lobster", type: "crustacean", subtype: "shallow", rarity: "uncommon", desc: "A baked lobster, ready to eat." },
    "baked_shrimp": { name: "Baked Shrimp", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A baked shrimp, ready to eat." },
    "baked_crab": { name: "Baked Crab", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A baked crab, ready to eat." },
    "baked_clam": { name: "Baked Clam", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A baked clam, ready to eat." },
    "baked_mussel": { name: "Baked Mussel", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A baked mussel, ready to eat." },
    "baked_oyster": { name: "Baked Oyster", type: "mollusk", subtype: "fresh", rarity: "uncommon", desc: "A baked oyster, ready to eat." },
    "baked_anglerfish": { name: "Baked Anglerfish", type: "fish", subtype: "deep", rarity: "rare", desc: "A baked anglerfish, ready to eat." },
    "baked_catfish_king": { name: "Baked Catfish King", type: "fish", subtype: "deep", rarity: "epic", desc: "A baked catfish king, ready to eat." },
    "baked_golden_trout": { name: "Baked Golden Trout", type: "fish", subtype: "deep", rarity: "legendary", desc: "A baked golden trout, ready to eat." },
    "baked_raibow_salmon": { name: "Baked Rainbow Salmon", type: "fish", subtype: "deep", rarity: "legendary", desc: "A baked rainbow salmon, ready to eat." },
    "baked_giant_carp": { name: "Baked Giant Carp", type: "fish", subtype: "deep", rarity: "mythic", desc: "A baked giant carp, ready to eat." },
    "baked_giant_catfish": { name: "Baked Giant Catfish", type: "fish", subtype: "deep", rarity: "mythic", desc: "A baked giant catfish, ready to eat." },
    "baked_giant_tuna": { name: "Baked Giant Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A baked giant tuna, ready to eat." },
    "baked_giant_lobster": { name: "Baked Giant Lobster", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A baked giant lobster, ready to eat." },
    "baked_giant_crab": { name: "Baked Giant Crab", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A baked giant crab, ready to eat." },
    "baked_giant_clam": { name: "Baked Giant Clam", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A baked giant clam, ready to eat." },
    "baked_giant_mussel": { name: "Baked Giant Mussel", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A baked giant mussel, ready to eat." },
    "baked_giant_oyster": { name: "Baked Giant Oyster", type: "mollusk", subtype: "fresh", rarity: "epic", desc: "A baked giant oyster, ready to eat." },
    "baked_kraken": { name: "Baked Kraken", type: "crustacean", subtype: "deep", rarity: "legendary", desc: "A baked kraken, ready to eat." },
    "baked_barboros": { name: "Baked Barboros", type: "fish", subtype: "deep", rarity: "legendary", desc: "A baked barboros, ready to eat." },
    "smoked_pike": { name: "Smoked Pike", type: "fish", subtype: "shallow", rarity: "common", desc: "A smoked pike, ready to eat." },
    "smoked_perch": { name: "Smoked Perch", type: "fish", subtype: "shallow", rarity: "common", desc: "A smoked perch, ready to eat." },
    "smoked_bass": { name: "Smoked Bass", type: "fish", subtype: "shallow", rarity: "common", desc: "A smoked bass, ready to eat." },
    "smoked_trout": { name: "Smoked Trout", type: "fish", subtype: "shallow", rarity: "common", desc: "A smoked trout, ready to eat." },
    "smoked_carp": { name: "Smoked Carp", type: "fish", subtype: "shallow", rarity: "common", desc: "A smoked carp, ready to eat." },
    "smoked_catfish": { name: "Smoked Catfish", type: "fish", subtype: "shallow", rarity: "common", desc: "A smoked catfish, ready to eat." },
    "smoked_salmon": { name: "Smoked Salmon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A smoked salmon, ready to eat." },
    "smoked_sturgeon": { name: "Smoked Sturgeon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A smoked sturgeon, ready to eat." },
    "smoked_tilapia": { name: "Smoked Tilapia", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A smoked tilapia, ready to eat." },
    "smoked_tuna": { name: "Smoked Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A smoked tuna, ready to eat." },
    "smoked_lobster": { name: "Smoked Lobster", type: "crustacean", subtype: "shallow", rarity: "uncommon", desc: "A smoked lobster, ready to eat." },
    "smoked_shrimp": { name: "Smoked Shrimp", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A smoked shrimp, ready to eat." },
    "smoked_crab": { name: "Smoked Crab", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A smoked crab, ready to eat." },
    "smoked_clam": { name: "Smoked Clam", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A smoked clam, ready to eat." },
    "smoked_mussel": { name: "Smoked Mussel", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A smoked mussel, ready to eat." },
    "smoked_oyster": { name: "Smoked Oyster", type: "mollusk", subtype: "fresh", rarity: "uncommon", desc: "A smoked oyster, ready to eat." },
    "smoked_anglerfish": { name: "Smoked Anglerfish", type: "fish", subtype: "deep", rarity: "rare", desc: "A smoked anglerfish, ready to eat." },
    "smoked_catfish_king": { name: "Smoked Catfish King", type: "fish", subtype: "deep", rarity: "epic", desc: "A smoked catfish king, ready to eat." },
    "smoked_golden_trout": { name: "Smoked Golden Trout", type: "fish", subtype: "deep", rarity: "legendary", desc: "A smoked golden trout, ready to eat." },
    "smoked_raibow_salmon": { name: "Smoked Rainbow Salmon", type: "fish", subtype: "deep", rarity: "legendary", desc: "A smoked rainbow salmon, ready to eat." },
    "smoked_giant_carp": { name: "Smoked Giant Carp", type: "fish", subtype: "deep", rarity: "mythic", desc: "A smoked giant carp, ready to eat." },
    "smoked_giant_catfish": { name: "Smoked Giant Catfish", type: "fish", subtype: "deep", rarity: "mythic", desc: "A smoked giant catfish, ready to eat." },
    "smoked_giant_tuna": { name: "Smoked Giant Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A smoked giant tuna, ready to eat." },
    "smoked_giant_lobster": { name: "Smoked Giant Lobster", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A smoked giant lobster, ready to eat." },
    "smoked_giant_crab": { name: "Smoked Giant Crab", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A smoked giant crab, ready to eat." },
    "smoked_giant_clam": { name: "Smoked Giant Clam", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A smoked giant clam, ready to eat." },
    "smoked_giant_mussel": { name: "Smoked Giant Mussel", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A smoked giant mussel, ready to eat." },
    "smoked_giant_oyster": { name: "Smoked Giant Oyster", type: "mollusk", subtype: "fresh", rarity: "epic", desc: "A smoked giant oyster, ready to eat." },
    "smoked_kraken": { name: "Smoked Kraken", type: "crustacean", subtype: "deep", rarity: "legendary", desc: "A smoked kraken, ready to eat." },
    "smoked_barboros": { name: "Smoked Barboros", type: "fish", subtype: "deep", rarity: "legendary", desc: "A smoked barboros, ready to eat." },
    "pickled_pike": { name: "Pickled Pike", type: "fish", subtype: "shallow", rarity: "common", desc: "A pickled pike, ready to eat." },
    "pickled_perch": { name: "Pickled Perch", type: "fish", subtype: "shallow", rarity: "common", desc: "A pickled perch, ready to eat." },
    "pickled_bass": { name: "Pickled Bass", type: "fish", subtype: "shallow", rarity: "common", desc: "A pickled bass, ready to eat." },
    "pickled_trout": { name: "Pickled Trout", type: "fish", subtype: "shallow", rarity: "common", desc: "A pickled trout, ready to eat." },
    "pickled_carp": { name: "Pickled Carp", type: "fish", subtype: "shallow", rarity: "common", desc: "A pickled carp, ready to eat." },
    "pickled_catfish": { name: "Pickled Catfish", type: "fish", subtype: "shallow", rarity: "common", desc: "A pickled catfish, ready to eat." },
    "pickled_salmon": { name: "Pickled Salmon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A pickled salmon, ready to eat." },
    "pickled_sturgeon": { name: "Pickled Sturgeon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A pickled sturgeon, ready to eat." },
    "pickled_tilapia": { name: "Pickled Tilapia", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A pickled tilapia, ready to eat." },
    "pickled_tuna": { name: "Pickled Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A pickled tuna, ready to eat." },
    "pickled_lobster": { name: "Pickled Lobster", type: "crustacean", subtype: "shallow", rarity: "uncommon", desc: "A pickled lobster, ready to eat." },
    "pickled_shrimp": { name: "Pickled Shrimp", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A pickled shrimp, ready to eat." },
    "pickled_crab": { name: "Pickled Crab", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A pickled crab, ready to eat." },
    "pickled_clam": { name: "Pickled Clam", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A pickled clam, ready to eat." },
    "pickled_mussel": { name: "Pickled Mussel", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A pickled mussel, ready to eat." },
    "pickled_oyster": { name: "Pickled Oyster", type: "mollusk", subtype: "fresh", rarity: "uncommon", desc: "A pickled oyster, ready to eat." },
    "pickled_anglerfish": { name: "Pickled Anglerfish", type: "fish", subtype: "deep", rarity: "rare", desc: "A pickled anglerfish, ready to eat." },
    "pickled_catfish_king": { name: "Pickled Catfish King", type: "fish", subtype: "deep", rarity: "epic", desc: "A pickled catfish king, ready to eat." },
    "pickled_golden_trout": { name: "Pickled Golden Trout", type: "fish", subtype: "deep", rarity: "legendary", desc: "A pickled golden trout, ready to eat." },
    "pickled_raibow_salmon": { name: "Pickled Rainbow Salmon", type: "fish", subtype: "deep", rarity: "legendary", desc: "A pickled rainbow salmon, ready to eat." },
    "pickled_giant_carp": { name: "Pickled Giant Carp", type: "fish", subtype: "deep", rarity: "mythic", desc: "A pickled giant carp, ready to eat." },
    "pickled_giant_catfish": { name: "Pickled Giant Catfish", type: "fish", subtype: "deep", rarity: "mythic", desc: "A pickled giant catfish, ready to eat." },
    "pickled_giant_tuna": { name: "Pickled Giant Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A pickled giant tuna, ready to eat." },
    "pickled_giant_lobster": { name: "Pickled Giant Lobster", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A pickled giant lobster, ready to eat." },
    "pickled_giant_crab": { name: "Pickled Giant Crab", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A pickled giant crab, ready to eat." },
    "pickled_giant_clam": { name: "Pickled Giant Clam", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A pickled giant clam, ready to eat." },
    "pickled_giant_mussel": { name: "Pickled Giant Mussel", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A pickled giant mussel, ready to eat." },
    "pickled_giant_oyster": { name: "Pickled Giant Oyster", type: "mollusk", subtype: "fresh", rarity: "epic", desc: "A pickled giant oyster, ready to eat." },
    "pickled_kraken": { name: "Pickled Kraken", type: "crustacean", subtype: "deep", rarity: "legendary", desc: "A pickled kraken, ready to eat." },
    "pickled_barboros": { name: "Pickled Barboros", type: "fish", subtype: "deep", rarity: "legendary", desc: "A pickled barboros, ready to eat." },
    "fried_pike": { name: "Fried Pike", type: "fish", subtype: "shallow", rarity: "common", desc: "A fried pike, ready to eat." },
    "fried_perch": { name: "Fried Perch", type: "fish", subtype: "shallow", rarity: "common", desc: "A fried perch, ready to eat." },
    "fried_bass": { name: "Fried Bass", type: "fish", subtype: "shallow", rarity: "common", desc: "A fried bass, ready to eat." },
    "fried_trout": { name: "Fried Trout", type: "fish", subtype: "shallow", rarity: "common", desc: "A fried trout, ready to eat." },
    "fried_carp": { name: "Fried Carp", type: "fish", subtype: "shallow", rarity: "common", desc: "A fried carp, ready to eat." },
    "fried_catfish": { name: "Fried Catfish", type: "fish", subtype: "shallow", rarity: "common", desc: "A fried catfish, ready to eat." },
    "fried_salmon": { name: "Fried Salmon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A fried salmon, ready to eat." },
    "fried_sturgeon": { name: "Fried Sturgeon", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A fried sturgeon, ready to eat." },
    "fried_tilapia": { name: "Fried Tilapia", type: "fish", subtype: "deep", rarity: "uncommon", desc: "A fried tilapia, ready to eat." },
    "fried_tuna": { name: "Fried Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A fried tuna, ready to eat." },
    "fried_lobster": { name: "Fried Lobster", type: "crustacean", subtype: "shallow", rarity: "uncommon", desc: "A fried lobster, ready to eat." },
    "fried_shrimp": { name: "Fried Shrimp", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A fried shrimp, ready to eat." },
    "fried_crab": { name: "Fried Crab", type: "crustacean", subtype: "shallow", rarity: "common", desc: "A fried crab, ready to eat." },
    "fried_clam": { name: "Fried Clam", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A fried clam, ready to eat." },
    "fried_mussel": { name: "Fried Mussel", type: "shellfish", subtype: "shallow", rarity: "common", desc: "A fried mussel, ready to eat." },
    "fried_oyster": { name: "Fried Oyster", type: "mollusk", subtype: "fresh", rarity: "uncommon", desc: "A fried oyster, ready to eat." },
    "fried_anglerfish": { name: "Fried Anglerfish", type: "fish", subtype: "deep", rarity: "rare", desc: "A fried anglerfish, ready to eat." },
    "fried_catfish_king": { name: "Fried Catfish King", type: "fish", subtype: "deep", rarity: "epic", desc: "A fried catfish king, ready to eat." },
    "fried_golden_trout": { name: "Fried Golden Trout", type: "fish", subtype: "deep", rarity: "legendary", desc: "A fried golden trout, ready to eat." },
    "fried_raibow_salmon": { name: "Fried Rainbow Salmon", type: "fish", subtype: "deep", rarity: "legendary", desc: "A fried rainbow salmon, ready to eat." },
    "fried_giant_carp": { name: "Fried Giant Carp", type: "fish", subtype: "deep", rarity: "mythic", desc: "A fried giant carp, ready to eat." },
    "fried_giant_catfish": { name: "Fried Giant Catfish", type: "fish", subtype: "deep", rarity: "mythic", desc: "A fried giant catfish, ready to eat." },
    "fried_giant_tuna": { name: "Fried Giant Tuna", type: "fish", subtype: "deep", rarity: "rare", desc: "A fried giant tuna, ready to eat." },
    "fried_giant_lobster": { name: "Fried Giant Lobster", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A fried giant lobster, ready to eat." },
    "fried_giant_crab": { name: "Fried Giant Crab", type: "crustacean", subtype: "shallow", rarity: "epic", desc: "A fried giant crab, ready to eat." },
    "fried_giant_clam": { name: "Fried Giant Clam", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A fried giant clam, ready to eat." },
    "fried_giant_mussel": { name: "Fried Giant Mussel", type: "shellfish", subtype: "shallow", rarity: "epic", desc: "A fried giant mussel, ready to eat." },
    "fried_giant_oyster": { name: "Fried Giant Oyster", type: "mollusk", subtype: "fresh", rarity: "epic", desc: "A fried giant oyster, ready to eat." },
    "fried_kraken": { name: "Fried Kraken", type: "crustacean", subtype: "deep", rarity: "legendary", desc: "A fried kraken, ready to eat." },
    "fried_barboros": { name: "Fried Barboros", type: "fish", subtype: "deep", rarity: "legendary", desc: "A fried barboros, ready to eat." }
};

// Fishing Recipes - How to Cook Fish and Other Aquatic Creatures
// `global.station`/`global.skill` are what register these at the two cooking
// stations - data/stations.js derives STATION_RECIPES from this block alone and
// merges them into the pool COOKING_RECIPES already declares there.
// `cookingTime` is flavour for now: crafting resolves instantly, so nothing
// reads it yet.
export const FISHING_RECIPES = {
    global: { station: ["cooking_station", "campfire"], skill: "cooking" },
    // Cooked Fish Recipes
    "cooked_pike": { name: "Cooked Pike", ingredients: { "raw_pike": 1 }, result: "cooked_pike", cookingTime: 5, desc: "A cooked pike, ready to eat." },
    "cooked_perch": { name: "Cooked Perch", ingredients: { "raw_perch": 1 }, result: "cooked_perch", cookingTime: 5, desc: "A cooked perch, ready to eat." },
    "cooked_bass": { name: "Cooked Bass", ingredients: { "raw_bass": 1 }, result: "cooked_bass", cookingTime: 5, desc: "A cooked bass, ready to eat." },
    "cooked_trout": { name: "Cooked Trout", ingredients: { "raw_trout": 1 }, result: "cooked_trout", cookingTime: 5, desc: "A cooked trout, ready to eat." },
    "cooked_carp": { name: "Cooked Carp", ingredients: { "raw_carp": 1 }, result: "cooked_carp", cookingTime: 5, desc: "A cooked carp, ready to eat." },
    "cooked_catfish": { name: "Cooked Catfish", ingredients: { "raw_catfish": 1 }, result: "cooked_catfish", cookingTime: 5, desc: "A cooked catfish, ready to eat." },
    "cooked_salmon": { name: "Cooked Salmon", ingredients: { "raw_salmon": 1 }, result: "cooked_salmon", cookingTime: 5, desc: "A cooked salmon, ready to eat." },
    "cooked_tilapia": { name: "Cooked Tilapia", ingredients: { "raw_tilapia": 1 }, result: "cooked_tilapia", cookingTime: 5, desc: "A cooked tilapia, ready to eat." },
    "cooked_tuna": { name: "Cooked Tuna", ingredients: { "raw_tuna": 1 }, result: "cooked_tuna", cookingTime: 5, desc: "A cooked tuna, ready to eat." },
    "cooked_lobster": { name: "Cooked Lobster", ingredients: { "raw_lobster": 1 }, result: "cooked_lobster", cookingTime: 5, desc: "A cooked lobster, ready to eat." },
    "cooked_shrimp": { name: "Cooked Shrimp", ingredients: { "raw_shrimp": 1 }, result: "cooked_shrimp", cookingTime: 5, desc: "A cooked shrimp, ready to eat." },
    "cooked_crab": { name: "Cooked Crab", ingredients: { "raw_crab": 1 }, result: "cooked_crab", cookingTime: 5, desc: "A cooked crab, ready to eat." },
    "cooked_clam": { name: "Cooked Clam", ingredients: { "raw_clam": 1 }, result: "cooked_clam", cookingTime: 5, desc: "A cooked clam, ready to eat." },
    "cooked_mussel": { name: "Cooked Mussel", ingredients: { "raw_mussel": 1 }, result: "cooked_mussel", cookingTime: 5, desc: "A cooked mussel, ready to eat." },
    "cooked_oyster": { name: "Cooked Oyster", ingredients: { "raw_oyster": 1 }, result: "cooked_oyster", cookingTime: 5, desc: "A cooked oyster, ready to eat." },
    "cooked_anglerfish": { name: "Cooked Anglerfish", ingredients: { "raw_anglerfish": 1 }, result: "cooked_anglerfish", cookingTime: 5, desc: "A cooked anglerfish, ready to eat." },
    "cooked_catfish_king": { name: "Cooked Catfish King", ingredients: { "raw_catfish_king": 1 }, result: "cooked_catfish_king", cookingTime: 5, desc: "A cooked catfish king, ready to eat." },
    "cooked_golden_trout": { name: "Cooked Golden Trout", ingredients: { "raw_golden_trout": 1 }, result: "cooked_golden_trout", cookingTime: 5, desc: "A cooked golden trout, ready to eat." },
    "cooked_raibow_salmon": { name: "Cooked Rainbow Salmon", ingredients: { "raw_raibow_salmon": 1 }, result: "cooked_raibow_salmon", cookingTime: 5, desc: "A cooked rainbow salmon, ready to eat." },
    "cooked_giant_carp": { name: "Cooked Giant Carp", ingredients: { "raw_giant_carp": 1 }, result: "cooked_giant_carp", cookingTime: 5, desc: "A cooked giant carp, ready to eat." },
    "cooked_giant_catfish": { name: "Cooked Giant Catfish", ingredients: { "raw_giant_catfish": 1 }, result: "cooked_giant_catfish", cookingTime: 5, desc: "A cooked giant catfish, ready to eat." },
    "cooked_giant_tuna": { name: "Cooked Giant Tuna", ingredients: { "raw_giant_tuna": 1 }, result: "cooked_giant_tuna", cookingTime: 5, desc: "A cooked giant tuna, ready to eat." },
    "cooked_giant_lobster": { name: "Cooked Giant Lobster", ingredients: { "raw_giant_lobster": 1 }, result: "cooked_giant_lobster", cookingTime: 5, desc: "A cooked giant lobster, ready to eat." },
    "cooked_giant_crab": { name: "Cooked Giant Crab", ingredients: { "raw_giant_crab": 1 }, result: "cooked_giant_crab", cookingTime: 5, desc: "A cooked giant crab, ready to eat." },
    "cooked_giant_clam": { name: "Cooked Giant Clam", ingredients: { "raw_giant_clam": 1 }, result: "cooked_giant_clam", cookingTime: 5, desc: "A cooked giant clam, ready to eat." },
    "cooked_giant_mussel": { name: "Cooked Giant Mussel", ingredients: { "raw_giant_mussel": 1 }, result: "cooked_giant_mussel", cookingTime: 5, desc: "A cooked giant mussel, ready to eat." },
    "cooked_giant_oyster": { name: "Cooked Giant Oyster", ingredients: { "raw_giant_oyster": 1 }, result: "cooked_giant_oyster", cookingTime: 5, desc: "A cooked giant oyster, ready to eat." },
    "cooked_kraken": { name: "Cooked Kraken", ingredients: { "raw_kraken": 1 }, result: "cooked_kraken", cookingTime: 5, desc: "A cooked kraken, ready to eat." },
    "cooked_barboros": { name: "Cooked Barboros", ingredients: { "raw_barboros": 1 }, result: "cooked_barboros", cookingTime: 5, desc: "A cooked barboros, ready to eat." },
    // Grilled Fish Recipes
    "grilled_pike": { name: "Grilled Pike", ingredients: { "raw_pike": 1, "firewood": 1 }, result: "grilled_pike", cookingTime: 7, desc: "A grilled pike, ready to eat." },
    "grilled_perch": { name: "Grilled Perch", ingredients: { "raw_perch": 1, "firewood": 1 }, result: "grilled_perch", cookingTime: 7, desc: "A grilled perch, ready to eat." },
    "grilled_bass": { name: "Grilled Bass", ingredients: { "raw_bass": 1, "firewood": 1 }, result: "grilled_bass", cookingTime: 7, desc: "A grilled bass, ready to eat." },
    "grilled_trout": { name: "Grilled Trout", ingredients: { "raw_trout": 1, "firewood": 1 }, result: "grilled_trout", cookingTime: 7, desc: "A grilled trout, ready to eat." },
    "grilled_carp": { name: "Grilled Carp", ingredients: { "raw_carp": 1, "firewood": 1 }, result: "grilled_carp", cookingTime: 7, desc: "A grilled carp, ready to eat." },
    "grilled_catfish": { name: "Grilled Catfish", ingredients: { "raw_catfish": 1, "firewood": 1 }, result: "grilled_catfish", cookingTime: 7, desc: "A grilled catfish, ready to eat." },
    "grilled_salmon": { name: "Grilled Salmon", ingredients: { "raw_salmon": 1, "firewood": 1 }, result: "grilled_salmon", cookingTime: 7, desc: "A grilled salmon, ready to eat." },
    "grilled_tilapia": { name: "Grilled Tilapia", ingredients: { "raw_tilapia": 1, "firewood": 1 }, result: "grilled_tilapia", cookingTime: 7, desc: "A grilled tilapia, ready to eat." },
    "grilled_tuna": { name: "Grilled Tuna", ingredients: { "raw_tuna": 1, "firewood": 1 }, result: "grilled_tuna", cookingTime: 7, desc: "A grilled tuna, ready to eat." },
    "grilled_lobster": { name: "Grilled Lobster", ingredients: { "raw_lobster": 1, "firewood": 1 }, result: "grilled_lobster", cookingTime: 7, desc: "A grilled lobster, ready to eat." },
    "grilled_shrimp": { name: "Grilled Shrimp", ingredients: { "raw_shrimp": 1, "firewood": 1 }, result: "grilled_shrimp", cookingTime: 7, desc: "A grilled shrimp, ready to eat." },
    "grilled_crab": { name: "Grilled Crab", ingredients: { "raw_crab": 1, "firewood": 1 }, result: "grilled_crab", cookingTime: 7, desc: "A grilled crab, ready to eat." },
    "grilled_clam": { name: "Grilled Clam", ingredients: { "raw_clam": 1, "firewood": 1 }, result: "grilled_clam", cookingTime: 7, desc: "A grilled clam, ready to eat." },
    "grilled_mussel": { name: "Grilled Mussel", ingredients: { "raw_mussel": 1, "firewood": 1 }, result: "grilled_mussel", cookingTime: 7, desc: "A grilled mussel, ready to eat." },
    "grilled_oyster": { name: "Grilled Oyster", ingredients: { "raw_oyster": 1, "firewood": 1 }, result: "grilled_oyster", cookingTime: 7, desc: "A grilled oyster, ready to eat." },
    "grilled_anglerfish": { name: "Grilled Anglerfish", ingredients: { "raw_anglerfish": 1, "firewood": 1 }, result: "grilled_anglerfish", cookingTime: 7, desc: "A grilled anglerfish, ready to eat." },
    "grilled_catfish_king": { name: "Grilled Catfish King", ingredients: { "raw_catfish_king": 1, "firewood": 1 }, result: "grilled_catfish_king", cookingTime: 7, desc: "A grilled catfish king, ready to eat." },
    "grilled_golden_trout": { name: "Grilled Golden Trout", ingredients: { "raw_golden_trout": 1, "firewood": 1 }, result: "grilled_golden_trout", cookingTime: 7, desc: "A grilled golden trout, ready to eat." },
    "grilled_raibow_salmon": { name: "Grilled Rainbow Salmon", ingredients: { "raw_raibow_salmon": 1, "firewood": 1 }, result: "grilled_raibow_salmon", cookingTime: 7, desc: "A grilled rainbow salmon, ready to eat." },
    "grilled_giant_carp": { name: "Grilled Giant Carp", ingredients: { "raw_giant_carp": 1, "firewood": 1 }, result: "grilled_giant_carp", cookingTime: 7, desc: "A grilled giant carp, ready to eat." },
    "grilled_giant_catfish": { name: "Grilled Giant Catfish", ingredients: { "raw_giant_catfish": 1, "firewood": 1 }, result: "grilled_giant_catfish", cookingTime: 7, desc: "A grilled giant catfish, ready to eat." },
    "grilled_giant_tuna": { name: "Grilled Giant Tuna", ingredients: { "raw_giant_tuna": 1, "firewood": 1 }, result: "grilled_giant_tuna", cookingTime: 7, desc: "A grilled giant tuna, ready to eat." },
    "grilled_giant_lobster": { name: "Grilled Giant Lobster", ingredients: { "raw_giant_lobster": 1, "firewood": 1 }, result: "grilled_giant_lobster", cookingTime: 7, desc: "A grilled giant lobster, ready to eat." },
    "grilled_giant_crab": { name: "Grilled Giant Crab", ingredients: { "raw_giant_crab": 1, "firewood": 1 }, result: "grilled_giant_crab", cookingTime: 7, desc: "A grilled giant crab, ready to eat." },
    "grilled_giant_clam": { name: "Grilled Giant Clam", ingredients: { "raw_giant_clam": 1, "firewood": 1 }, result: "grilled_giant_clam", cookingTime: 7, desc: "A grilled giant clam, ready to eat." },
    "grilled_giant_mussel": { name: "Grilled Giant Mussel", ingredients: { "raw_giant_mussel": 1, "firewood": 1 }, result: "grilled_giant_mussel", cookingTime: 7, desc: "A grilled giant mussel, ready to eat." },
    "grilled_giant_oyster": { name: "Grilled Giant Oyster", ingredients: { "raw_giant_oyster": 1, "firewood": 1 }, result: "grilled_giant_oyster", cookingTime: 7, desc: "A grilled giant oyster, ready to eat." },
    "grilled_kraken": { name: "Grilled Kraken", ingredients: { "raw_kraken": 1, "firewood": 1 }, result: "grilled_kraken", cookingTime: 7, desc: "A grilled kraken, ready to eat." },
    "grilled_barboros": { name: "Grilled Barboros", ingredients: { "raw_barboros": 1, "firewood": 1 }, result: "grilled_barboros", cookingTime: 7, desc: "A grilled barboros, ready to eat." },
    // Baked Fish Recipes
    "baked_pike": { name: "Baked Pike", ingredients: { "raw_pike": 1, "flour": 1 }, result: "baked_pike", cookingTime: 10, desc: "A baked pike, ready to eat." },
    "baked_perch": { name: "Baked Perch", ingredients: { "raw_perch": 1, "flour": 1 }, result: "baked_perch", cookingTime: 10, desc: "A baked perch, ready to eat." },
    "baked_bass": { name: "Baked Bass", ingredients: { "raw_bass": 1, "flour": 1 }, result: "baked_bass", cookingTime: 10, desc: "A baked bass, ready to eat." },
    "baked_trout": { name: "Baked Trout", ingredients: { "raw_trout": 1, "flour": 1 }, result: "baked_trout", cookingTime: 10, desc: "A baked trout, ready to eat." },
    "baked_carp": { name: "Baked Carp", ingredients: { "raw_carp": 1, "flour": 1 }, result: "baked_carp", cookingTime: 10, desc: "A baked carp, ready to eat." },
    "baked_catfish": { name: "Baked Catfish", ingredients: { "raw_catfish": 1, "flour": 1 }, result: "baked_catfish", cookingTime: 10, desc: "A baked catfish, ready to eat." },
    "baked_salmon": { name: "Baked Salmon", ingredients: { "raw_salmon": 1, "flour": 1 }, result: "baked_salmon", cookingTime: 10, desc: "A baked salmon, ready to eat." },
    "baked_tilapia": { name: "Baked Tilapia", ingredients: { "raw_tilapia": 1, "flour": 1 }, result: "baked_tilapia", cookingTime: 10, desc: "A baked tilapia, ready to eat." },
    "baked_tuna": { name: "Baked Tuna", ingredients: { "raw_tuna": 1, "flour": 1 }, result: "baked_tuna", cookingTime: 10, desc: "A baked tuna, ready to eat." },
    "baked_lobster": { name: "Baked Lobster", ingredients: { "raw_lobster": 1, "flour": 1 }, result: "baked_lobster", cookingTime: 10, desc: "A baked lobster, ready to eat." },
    "baked_shrimp": { name: "Baked Shrimp", ingredients: { "raw_shrimp": 1, "flour": 1 }, result: "baked_shrimp", cookingTime: 10, desc: "A baked shrimp, ready to eat." },
    "baked_crab": { name: "Baked Crab", ingredients: { "raw_crab": 1, "flour": 1 }, result: "baked_crab", cookingTime: 10, desc: "A baked crab, ready to eat." },
    "baked_clam": { name: "Baked Clam", ingredients: { "raw_clam": 1, "flour": 1 }, result: "baked_clam", cookingTime: 10, desc: "A baked clam, ready to eat." },
    "baked_mussel": { name: "Baked Mussel", ingredients: { "raw_mussel": 1, "flour": 1 }, result: "baked_mussel", cookingTime: 10, desc: "A baked mussel, ready to eat." },
    "baked_oyster": { name: "Baked Oyster", ingredients: { "raw_oyster": 1, "flour": 1 }, result: "baked_oyster", cookingTime: 10, desc: "A baked oyster, ready to eat." },
    "baked_anglerfish": { name: "Baked Anglerfish", ingredients: { "raw_anglerfish": 1, "flour": 1 }, result: "baked_anglerfish", cookingTime: 10, desc: "A baked anglerfish, ready to eat." },
    "baked_catfish_king": { name: "Baked Catfish King", ingredients: { "raw_catfish_king": 1, "flour": 1 }, result: "baked_catfish_king", cookingTime: 10, desc: "A baked catfish king, ready to eat." },
    "baked_golden_trout": { name: "Baked Golden Trout", ingredients: { "raw_golden_trout": 1, "flour": 1 }, result: "baked_golden_trout", cookingTime: 10, desc: "A baked golden trout, ready to eat." },
    "baked_raibow_salmon": { name: "Baked Rainbow Salmon", ingredients: { "raw_raibow_salmon": 1, "flour": 1 }, result: "baked_raibow_salmon", cookingTime: 10, desc: "A baked rainbow salmon, ready to eat." },
    "baked_giant_carp": { name: "Baked Giant Carp", ingredients: { "raw_giant_carp": 1, "flour": 1 }, result: "baked_giant_carp", cookingTime: 10, desc: "A baked giant carp, ready to eat." },
    "baked_giant_catfish": { name: "Baked Giant Catfish", ingredients: { "raw_giant_catfish": 1, "flour": 1 }, result: "baked_giant_catfish", cookingTime: 10, desc: "A baked giant catfish, ready to eat." },
    "baked_giant_tuna": { name: "Baked Giant Tuna", ingredients: { "raw_giant_tuna": 1, "flour": 1 }, result: "baked_giant_tuna", cookingTime: 10, desc: "A baked giant tuna, ready to eat." },
    "baked_giant_lobster": { name: "Baked Giant Lobster", ingredients: { "raw_giant_lobster": 1, "flour": 1 }, result: "baked_giant_lobster", cookingTime: 10, desc: "A baked giant lobster, ready to eat." },
    "baked_giant_crab": { name: "Baked Giant Crab", ingredients: { "raw_giant_crab": 1, "flour": 1 }, result: "baked_giant_crab", cookingTime: 10, desc: "A baked giant crab, ready to eat." },
    "baked_giant_clam": { name: "Baked Giant Clam", ingredients: { "raw_giant_clam": 1, "flour": 1 }, result: "baked_giant_clam", cookingTime: 10, desc: "A baked giant clam, ready to eat." },
    "baked_giant_mussel": { name: "Baked Giant Mussel", ingredients: { "raw_giant_mussel": 1, "flour": 1 }, result: "baked_giant_mussel", cookingTime: 10, desc: "A baked giant mussel, ready to eat." },
    "baked_giant_oyster": { name: "Baked Giant Oyster", ingredients: { "raw_giant_oyster": 1, "flour": 1 }, result: "baked_giant_oyster", cookingTime: 10, desc: "A baked giant oyster, ready to eat." },
    "baked_kraken": { name: "Baked Kraken", ingredients: { "raw_kraken": 1, "flour": 1 }, result: "baked_kraken", cookingTime: 10, desc: "A baked kraken, ready to eat." },
    "baked_barboros": { name: "Baked Barboros", ingredients: { "raw_barboros": 1, "flour": 1 }, result: "baked_barboros", cookingTime: 10, desc: "A baked barboros, ready to eat." },
    // Smoked Fish Recipes
    "smoked_pike": { name: "Smoked Pike", ingredients: { "raw_pike": 1, "firewood": 1, "coal": 1 }, result: "smoked_pike", cookingTime: 15, desc: "A smoked pike, ready to eat." },
    "smoked_perch": { name: "Smoked Perch", ingredients: { "raw_perch": 1, "firewood": 1, "coal": 1 }, result: "smoked_perch", cookingTime: 15, desc: "A smoked perch, ready to eat." },
    "smoked_bass": { name: "Smoked Bass", ingredients: { "raw_bass": 1, "firewood": 1, "coal": 1 }, result: "smoked_bass", cookingTime: 15, desc: "A smoked bass, ready to eat." },
    "smoked_trout": { name: "Smoked Trout", ingredients: { "raw_trout": 1, "firewood": 1, "coal": 1 }, result: "smoked_trout", cookingTime: 15, desc: "A smoked trout, ready to eat." },
    "smoked_carp": { name: "Smoked Carp", ingredients: { "raw_carp": 1, "firewood": 1, "coal": 1 }, result: "smoked_carp", cookingTime: 15, desc: "A smoked carp, ready to eat." },
    "smoked_catfish": { name: "Smoked Catfish", ingredients: { "raw_catfish": 1, "firewood": 1, "coal": 1 }, result: "smoked_catfish", cookingTime: 15, desc: "A smoked catfish, ready to eat." },
    "smoked_salmon": { name: "Smoked Salmon", ingredients: { "raw_salmon": 1, "firewood": 1, "coal": 1 }, result: "smoked_salmon", cookingTime: 15, desc: "A smoked salmon, ready to eat." },
    "smoked_tilapia": { name: "Smoked Tilapia", ingredients: { "raw_tilapia": 1, "firewood": 1, "coal": 1 }, result: "smoked_tilapia", cookingTime: 15, desc: "A smoked tilapia, ready to eat." },
    "smoked_tuna": { name: "Smoked Tuna", ingredients: { "raw_tuna": 1, "firewood": 1, "coal": 1 }, result: "smoked_tuna", cookingTime: 15, desc: "A smoked tuna, ready to eat." },
    "smoked_lobster": { name: "Smoked Lobster", ingredients: { "raw_lobster": 1, "firewood": 1, "coal": 1 }, result: "smoked_lobster", cookingTime: 15, desc: "A smoked lobster, ready to eat." },
    "smoked_shrimp": { name: "Smoked Shrimp", ingredients: { "raw_shrimp": 1, "firewood": 1, "coal": 1 }, result: "smoked_shrimp", cookingTime: 15, desc: "A smoked shrimp, ready to eat." },
    "smoked_crab": { name: "Smoked Crab", ingredients: { "raw_crab": 1, "firewood": 1, "coal": 1 }, result: "smoked_crab", cookingTime: 15, desc: "A smoked crab, ready to eat." },
    "smoked_clam": { name: "Smoked Clam", ingredients: { "raw_clam": 1, "firewood": 1, "coal": 1 }, result: "smoked_clam", cookingTime: 15, desc: "A smoked clam, ready to eat." },
    "smoked_mussel": { name: "Smoked Mussel", ingredients: { "raw_mussel": 1, "firewood": 1, "coal": 1 }, result: "smoked_mussel", cookingTime: 15, desc: "A smoked mussel, ready to eat." },
    "smoked_oyster": { name: "Smoked Oyster", ingredients: { "raw_oyster": 1, "firewood": 1, "coal": 1 }, result: "smoked_oyster", cookingTime: 15, desc: "A smoked oyster, ready to eat." },
    "smoked_anglerfish": { name: "Smoked Anglerfish", ingredients: { "raw_anglerfish": 1, "firewood": 1, "coal": 1 }, result: "smoked_anglerfish", cookingTime: 15, desc: "A smoked anglerfish, ready to eat." },
    "smoked_catfish_king": { name: "Smoked Catfish King", ingredients: { "raw_catfish_king": 1, "firewood": 1, "coal": 1 }, result: "smoked_catfish_king", cookingTime: 15, desc: "A smoked catfish king, ready to eat." },
    "smoked_golden_trout": { name: "Smoked Golden Trout", ingredients: { "raw_golden_trout": 1, "firewood": 1, "coal": 1 }, result: "smoked_golden_trout", cookingTime: 15, desc: "A smoked golden trout, ready to eat." },
    "smoked_raibow_salmon": { name: "Smoked Rainbow Salmon", ingredients: { "raw_raibow_salmon": 1, "firewood": 1, "coal": 1 }, result: "smoked_raibow_salmon", cookingTime: 15, desc: "A smoked rainbow salmon, ready to eat." },
    "smoked_giant_carp": { name: "Smoked Giant Carp", ingredients: { "raw_giant_carp": 1, "firewood": 1, "coal": 1 }, result: "smoked_giant_carp", cookingTime: 15, desc: "A smoked giant carp, ready to eat." },
    "smoked_giant_catfish": { name: "Smoked Giant Catfish", ingredients: { "raw_giant_catfish": 1, "firewood": 1, "coal": 1 }, result: "smoked_giant_catfish", cookingTime: 15, desc: "A smoked giant catfish, ready to eat." },
    "smoked_giant_tuna": { name: "Smoked Giant Tuna", ingredients: { "raw_giant_tuna": 1, "firewood": 1, "coal": 1 }, result: "smoked_giant_tuna", cookingTime: 15, desc: "A smoked giant tuna, ready to eat." },
    "smoked_giant_lobster": { name: "Smoked Giant Lobster", ingredients: { "raw_giant_lobster": 1, "firewood": 1, "coal": 1 }, result: "smoked_giant_lobster", cookingTime: 15, desc: "A smoked giant lobster, ready to eat." },
    "smoked_giant_crab": { name: "Smoked Giant Crab", ingredients: { "raw_giant_crab": 1, "firewood": 1, "coal": 1 }, result: "smoked_giant_crab", cookingTime: 15, desc: "A smoked giant crab, ready to eat." },
    "smoked_giant_clam": { name: "Smoked Giant Clam", ingredients: { "raw_giant_clam": 1, "firewood": 1, "coal": 1 }, result: "smoked_giant_clam", cookingTime: 15, desc: "A smoked giant clam, ready to eat." },
    "smoked_giant_mussel": { name: "Smoked Giant Mussel", ingredients: { "raw_giant_mussel": 1, "firewood": 1, "coal": 1 }, result: "smoked_giant_mussel", cookingTime: 15, desc: "A smoked giant mussel, ready to eat." },
    "smoked_giant_oyster": { name: "Smoked Giant Oyster", ingredients: { "raw_giant_oyster": 1, "firewood": 1, "coal": 1 }, result: "smoked_giant_oyster", cookingTime: 15, desc: "A smoked giant oyster, ready to eat." },
    "smoked_kraken": { name: "Smoked Kraken", ingredients: { "raw_kraken": 1, "firewood": 1, "coal": 1 }, result: "smoked_kraken", cookingTime: 15, desc: "A smoked kraken, ready to eat." },
    "smoked_barboros": { name: "Smoked Barboros", ingredients: { "raw_barboros": 1, "firewood": 1, "coal": 1 }, result: "smoked_barboros", cookingTime: 15, desc: "A smoked barboros, ready to eat." },
    // Pickled Fish Recipes
    "pickled_pike": { name: "Pickled Pike", ingredients: { "raw_pike": 1, "vinegar": 1 }, result: "pickled_pike", cookingTime: 20, desc: "A pickled pike, ready to eat." },
    "pickled_perch": { name: "Pickled Perch", ingredients: { "raw_perch": 1, "vinegar": 1 }, result: "pickled_perch", cookingTime: 20, desc: "A pickled perch, ready to eat." },
    "pickled_bass": { name: "Pickled Bass", ingredients: { "raw_bass": 1, "vinegar": 1 }, result: "pickled_bass", cookingTime: 20, desc: "A pickled bass, ready to eat." },
    "pickled_trout": { name: "Pickled Trout", ingredients: { "raw_trout": 1, "vinegar": 1 }, result: "pickled_trout", cookingTime: 20, desc: "A pickled trout, ready to eat." },
    "pickled_carp": { name: "Pickled Carp", ingredients: { "raw_carp": 1, "vinegar": 1 }, result: "pickled_carp", cookingTime: 20, desc: "A pickled carp, ready to eat." },
    "pickled_catfish": { name: "Pickled Catfish", ingredients: { "raw_catfish": 1, "vinegar": 1 }, result: "pickled_catfish", cookingTime: 20, desc: "A pickled catfish, ready to eat." },
    "pickled_salmon": { name: "Pickled Salmon", ingredients: { "raw_salmon": 1, "vinegar": 1 }, result: "pickled_salmon", cookingTime: 20, desc: "A pickled salmon, ready to eat." },
    "pickled_tilapia": { name: "Pickled Tilapia", ingredients: { "raw_tilapia": 1, "vinegar": 1 }, result: "pickled_tilapia", cookingTime: 20, desc: "A pickled tilapia, ready to eat." },
    "pickled_tuna": { name: "Pickled Tuna", ingredients: { "raw_tuna": 1, "vinegar": 1 }, result: "pickled_tuna", cookingTime: 20, desc: "A pickled tuna, ready to eat." },
    "pickled_lobster": { name: "Pickled Lobster", ingredients: { "raw_lobster": 1, "vinegar": 1 }, result: "pickled_lobster", cookingTime: 20, desc: "A pickled lobster, ready to eat." },
    "pickled_shrimp": { name: "Pickled Shrimp", ingredients: { "raw_shrimp": 1, "vinegar": 1 }, result: "pickled_shrimp", cookingTime: 20, desc: "A pickled shrimp, ready to eat." },
    "pickled_crab": { name: "Pickled Crab", ingredients: { "raw_crab": 1, "vinegar": 1 }, result: "pickled_crab", cookingTime: 20, desc: "A pickled crab, ready to eat." },
    "pickled_clam": { name: "Pickled Clam", ingredients: { "raw_clam": 1, "vinegar": 1 }, result: "pickled_clam", cookingTime: 20, desc: "A pickled clam, ready to eat." },
    "pickled_mussel": { name: "Pickled Mussel", ingredients: { "raw_mussel": 1, "vinegar": 1 }, result: "pickled_mussel", cookingTime: 20, desc: "A pickled mussel, ready to eat." },
    "pickled_oyster": { name: "Pickled Oyster", ingredients: { "raw_oyster": 1, "vinegar": 1 }, result: "pickled_oyster", cookingTime: 20, desc: "A pickled oyster, ready to eat." },
    "pickled_anglerfish": { name: "Pickled Anglerfish", ingredients: { "raw_anglerfish": 1, "vinegar": 1 }, result: "pickled_anglerfish", cookingTime: 20, desc: "A pickled anglerfish, ready to eat." },
    "pickled_catfish_king": { name: "Pickled Catfish King", ingredients: { "raw_catfish_king": 1, "vinegar": 1 }, result: "pickled_catfish_king", cookingTime: 20, desc: "A pickled catfish king, ready to eat." },
    "pickled_golden_trout": { name: "Pickled Golden Trout", ingredients: { "raw_golden_trout": 1, "vinegar": 1 }, result: "pickled_golden_trout", cookingTime: 20, desc: "A pickled golden trout, ready to eat." },
    "pickled_raibow_salmon": { name: "Pickled Rainbow Salmon", ingredients: { "raw_raibow_salmon": 1, "vinegar": 1 }, result: "pickled_raibow_salmon", cookingTime: 20, desc: "A pickled rainbow salmon, ready to eat." },
    "pickled_giant_carp": { name: "Pickled Giant Carp", ingredients: { "raw_giant_carp": 1, "vinegar": 1 }, result: "pickled_giant_carp", cookingTime: 20, desc: "A pickled giant carp, ready to eat." },
    "pickled_giant_catfish": { name: "Pickled Giant Catfish", ingredients: { "raw_giant_catfish": 1, "vinegar": 1 }, result: "pickled_giant_catfish", cookingTime: 20, desc: "A pickled giant catfish, ready to eat." },
    "pickled_giant_tuna": { name: "Pickled Giant Tuna", ingredients: { "raw_giant_tuna": 1, "vinegar": 1 }, result: "pickled_giant_tuna", cookingTime: 20, desc: "A pickled giant tuna, ready to eat." },
    "pickled_giant_lobster": { name: "Pickled Giant Lobster", ingredients: { "raw_giant_lobster": 1, "vinegar": 1 }, result: "pickled_giant_lobster", cookingTime: 20, desc: "A pickled giant lobster, ready to eat." },
    "pickled_giant_crab": { name: "Pickled Giant Crab", ingredients: { "raw_giant_crab": 1, "vinegar": 1 }, result: "pickled_giant_crab", cookingTime: 20, desc: "A pickled giant crab, ready to eat." },
    "pickled_giant_clam": { name: "Pickled Giant Clam", ingredients: { "raw_giant_clam": 1, "vinegar": 1 }, result: "pickled_giant_clam", cookingTime: 20, desc: "A pickled giant clam, ready to eat." },
    "pickled_giant_mussel": { name: "Pickled Giant Mussel", ingredients: { "raw_giant_mussel": 1, "vinegar": 1 }, result: "pickled_giant_mussel", cookingTime: 20, desc: "A pickled giant mussel, ready to eat." },
    "pickled_giant_oyster": { name: "Pickled Giant Oyster", ingredients: { "raw_giant_oyster": 1, "vinegar": 1 }, result: "pickled_giant_oyster", cookingTime: 20, desc: "A pickled giant oyster, ready to eat." },
    "pickled_kraken": { name: "Pickled Kraken", ingredients: { "raw_kraken": 1, "vinegar": 1 }, result: "pickled_kraken", cookingTime: 20, desc: "A pickled kraken, ready to eat." },
    "pickled_barboros": { name: "Pickled Barboros", ingredients: { "raw_barboros": 1, "vinegar": 1 }, result: "pickled_barboros", cookingTime: 20, desc: "A pickled barboros, ready to eat." },
    // Fried Fish Recipes
    "fried_pike": { name: "Fried Pike", ingredients: { "raw_pike": 1, "oil": 1 }, result: "fried_pike", cookingTime: 8, desc: "A fried pike, ready to eat." },
    "fried_perch": { name: "Fried Perch", ingredients: { "raw_perch": 1, "oil": 1 }, result: "fried_perch", cookingTime: 8, desc: "A fried perch, ready to eat." },
    "fried_bass": { name: "Fried Bass", ingredients: { "raw_bass": 1, "oil": 1 }, result: "fried_bass", cookingTime: 8, desc: "A fried bass, ready to eat." },
    "fried_trout": { name: "Fried Trout", ingredients: { "raw_trout": 1, "oil": 1 }, result: "fried_trout", cookingTime: 8, desc: "A fried trout, ready to eat." },
    "fried_carp": { name: "Fried Carp", ingredients: { "raw_carp": 1, "oil": 1 }, result: "fried_carp", cookingTime: 8, desc: "A fried carp, ready to eat." },
    "fried_catfish": { name: "Fried Catfish", ingredients: { "raw_catfish": 1, "oil": 1 }, result: "fried_catfish", cookingTime: 8, desc: "A fried catfish, ready to eat." },
    "fried_salmon": { name: "Fried Salmon", ingredients: { "raw_salmon": 1, "oil": 1 }, result: "fried_salmon", cookingTime: 8, desc: "A fried salmon, ready to eat." },
    "fried_tilapia": { name: "Fried Tilapia", ingredients: { "raw_tilapia": 1, "oil": 1 }, result: "fried_tilapia", cookingTime: 8, desc: "A fried tilapia, ready to eat." },
    "fried_tuna": { name: "Fried Tuna", ingredients: { "raw_tuna": 1, "oil": 1 }, result: "fried_tuna", cookingTime: 8, desc: "A fried tuna, ready to eat." },
    "fried_lobster": { name: "Fried Lobster", ingredients: { "raw_lobster": 1, "oil": 1 }, result: "fried_lobster", cookingTime: 8, desc: "A fried lobster, ready to eat." },
    "fried_shrimp": { name: "Fried Shrimp", ingredients: { "raw_shrimp": 1, "oil": 1 }, result: "fried_shrimp", cookingTime: 8, desc: "A fried shrimp, ready to eat." },
    "fried_crab": { name: "Fried Crab", ingredients: { "raw_crab": 1, "oil": 1 }, result: "fried_crab", cookingTime: 8, desc: "A fried crab, ready to eat." },
    "fried_clam": { name: "Fried Clam", ingredients: { "raw_clam": 1, "oil": 1 }, result: "fried_clam", cookingTime: 8, desc: "A fried clam, ready to eat." },
    "fried_mussel": { name: "Fried Mussel", ingredients: { "raw_mussel": 1, "oil": 1 }, result: "fried_mussel", cookingTime: 8, desc: "A fried mussel, ready to eat." },
    "fried_oyster": { name: "Fried Oyster", ingredients: { "raw_oyster": 1, "oil": 1 }, result: "fried_oyster", cookingTime: 8, desc: "A fried oyster, ready to eat." },
    "fried_anglerfish": { name: "Fried Anglerfish", ingredients: { "raw_anglerfish": 1, "oil": 1 }, result: "fried_anglerfish", cookingTime: 8, desc: "A fried anglerfish, ready to eat." },
    "fried_catfish_king": { name: "Fried Catfish King", ingredients: { "raw_catfish_king": 1, "oil": 1 }, result: "fried_catfish_king", cookingTime: 8, desc: "A fried catfish king, ready to eat." },
    "fried_golden_trout": { name: "Fried Golden Trout", ingredients: { "raw_golden_trout": 1, "oil": 1 }, result: "fried_golden_trout", cookingTime: 8, desc: "A fried golden trout, ready to eat." },
    "fried_raibow_salmon": { name: "Fried Rainbow Salmon", ingredients: { "raw_raibow_salmon": 1, "oil": 1 }, result: "fried_raibow_salmon", cookingTime: 8, desc: "A fried rainbow salmon, ready to eat." },
    "fried_giant_carp": { name: "Fried Giant Carp", ingredients: { "raw_giant_carp": 1, "oil": 1 }, result: "fried_giant_carp", cookingTime: 8, desc: "A fried giant carp, ready to eat." },
    "fried_giant_catfish": { name: "Fried Giant Catfish", ingredients: { "raw_giant_catfish": 1, "oil": 1 }, result: "fried_giant_catfish", cookingTime: 8, desc: "A fried giant catfish, ready to eat." },
    "fried_giant_tuna": { name: "Fried Giant Tuna", ingredients: { "raw_giant_tuna": 1, "oil": 1 }, result: "fried_giant_tuna", cookingTime: 8, desc: "A fried giant tuna, ready to eat." },
    "fried_giant_lobster": { name: "Fried Giant Lobster", ingredients: { "raw_giant_lobster": 1, "oil": 1 }, result: "fried_giant_lobster", cookingTime: 8, desc: "A fried giant lobster, ready to eat." },
    "fried_giant_crab": { name: "Fried Giant Crab", ingredients: { "raw_giant_crab": 1, "oil": 1 }, result: "fried_giant_crab", cookingTime: 8, desc: "A fried giant crab, ready to eat." },
    "fried_giant_clam": { name: "Fried Giant Clam", ingredients: { "raw_giant_clam": 1, "oil": 1 }, result: "fried_giant_clam", cookingTime: 8, desc: "A fried giant clam, ready to eat." },
    "fried_giant_mussel": { name: "Fried Giant Mussel", ingredients: { "raw_giant_mussel": 1, "oil": 1 }, result: "fried_giant_mussel", cookingTime: 8, desc: "A fried giant mussel, ready to eat." },
    "fried_giant_oyster": { name: "Fried Giant Oyster", ingredients: { "raw_giant_oyster": 1, "oil": 1 }, result: "fried_giant_oyster", cookingTime: 8, desc: "A fried giant oyster, ready to eat." },
    "fried_kraken": { name: "Fried Kraken", ingredients: { "raw_kraken": 1, "oil": 1 }, result: "fried_kraken", cookingTime: 8, desc: "A fried kraken, ready to eat." },
    "fried_barboros": { name: "Fried Barboros", ingredients: { "raw_barboros": 1, "oil": 1 }, result: "fried_barboros", cookingTime: 8, desc: "A fried barboros, ready to eat." }
};

// --- Fishing catalog -> canonical items -------------------------------------
// FISHING_ITEMS is authored in fishing vocabulary. Everything downstream (the
// backpack tabs, equipSlotOf, rollLootByType, data/items.js's consumeEffectOf,
// shop pricing) only understands ITEM_TYPES, so the translation happens once,
// here, rather than teaching each of those about rods and molluscs.

// Rods are the one fishing item that equips, so they're the one that needs a
// durability. Tiers, not rarity: a mythic-rarity rod and the mythic TIER rod
// are different axes in this data.
const FISHING_ROD_DURABILITY = { basic: 80, crafted: 100, forged: 140, enchanted: 180, mythic: 250, godlike: 400 };

// The preparations, keyed by the id prefix that names them. `subtype` is the
// canonical food subtype (all of them declared in FOOD_SUBTYPES/FOOD_CATAGORIES
// above), and `boost` the base healing before the rarity bonus below.
const FISH_PREPARATIONS = {
    raw:     { subtype: "raw_fish",    boost: 5  },
    cooked:  { subtype: "cooked_food", boost: 15 },
    pickled: { subtype: "pickled",     boost: 18 },
    grilled: { subtype: "grilled",     boost: 20 },
    fried:   { subtype: "fried",       boost: 20 },
    baked:   { subtype: "baked",       boost: 22 },
    smoked:  { subtype: "smoked",      boost: 25 },
};

// What the rarer catches are worth as food. Without this a smoked kraken heals
// exactly as much as a smoked pike, which makes the whole difficulty ladder
// pointless the moment you can cook.
const FISH_RARITY_BOOST = { common: 0, uncommon: 5, rare: 10, epic: 20, legendary: 35, mythic: 50, godlike: 75 };

const CATCH_TYPES = ["fish", "crustacean", "shellfish", "mollusk"];

// The fishing `type` -> canonical (type, subtype) mapping. Bait/nets/hooks are
// deliberately NOT type "tool": equipSlotOf() would then put them in the single
// tool slot, competing with the rod, when what gates a catch is simply carrying
// them (see data/fishing.js).
function canonicalFishingFields(id, item) {
    if (item.type === "rod") {
        return { type: "tool", subtype: "fishing rod", durability: FISHING_ROD_DURABILITY[item.subtype] ?? 80 };
    }
    if (["bait", "net", "hook"].includes(item.type)) {
        return { type: "crafting", subtype: "fishing" };
    }
    const prep = FISH_PREPARATIONS[id.split("_")[0]];
    // A catch-typed item with no preparation prefix is a body part (leviathan_scale,
    // tarvus_bone...) - a trophy/material, not something you eat.
    if (!prep) return { type: "crafting", subtype: "fishing" };
    return {
        type: "food",
        subtype: prep.subtype,
        health_boost: prep.boost + (FISH_RARITY_BOOST[item.rarity] ?? 0),
        gather: "fish",
    };
}

// Keeps the authored vocabulary as `fishingType`/`fishingTier` - data/fishing.js
// gates on those, and losing them to the canonical fields would leave nothing
// to tell a net from a hook.
function withFishingDefaults(catalog) {
    const { global, ...entries } = catalog;
    return Object.fromEntries(
        Object.entries(entries).map(([id, item]) => {
            const { type, subtype, ...rest } = item;
            return [id, { ...rest, fishingType: type, fishingTier: subtype, ...canonicalFishingFields(id, item) }];
        })
    );
}

export const FISHING_CATALOG = withFishingDefaults(FISHING_ITEMS);

// Species names longest-first, so "leviathan_king_scale" resolves to
// leviathan_king rather than to leviathan - the same shadowing problem
// data/stations.js's METAL_MATCH_ORDER solves for black_cobalt/cobalt.
const SPECIES_MATCH_ORDER = Object.keys(FISH).sort((a, b) => b.length - a.length);

// What a species yields when caught: its raw catch item, or - for the ancients
// and their kings, which have no "raw_" form - the scales/teeth/flesh/bones
// named after it. Returns [] for a species with neither, which data/fishing.js
// reads as "not catchable yet" rather than crashing on an undefined item.
export function catchItemsFor(speciesId) {
    if (`raw_${speciesId}` in FISHING_CATALOG) return [`raw_${speciesId}`];
    return Object.keys(FISHING_CATALOG).filter(
        (id) => id.startsWith(`${speciesId}_`) && SPECIES_MATCH_ORDER.find((s) => id.startsWith(`${s}_`)) === speciesId
    );
}

// Fishing Helpers
export function getFishByRarity(rarity) {
    return Object.keys(FISH).filter(fish => FISH[fish].rarity === rarity);
}

export function getRecipeByResult(result) {
    return Object.keys(FISHING_RECIPES).find(recipe => FISHING_RECIPES[recipe].result === result);
}

// A species' type ("fish", "crustacean", ...) lives on its catch item, not on
// the FISH entry - see the comment on FISH above.
export function getFishByType(type) {
    return Object.keys(FISH).filter(fish => FISHING_CATALOG[catchItemsFor(fish)[0]]?.fishingType === type);
}

export function getRecipeByIngredient(ingredient) {
    return Object.keys(FISHING_RECIPES).filter(recipe => ingredient in (FISHING_RECIPES[recipe].ingredients ?? {}));
}
export function getFishByWaterType(waterType) {
    return Object.keys(FISH).filter(fish => FISH[fish].water === waterType);
}
export function getRecipeByName(name) {
    return Object.keys(FISHING_RECIPES).find(recipe => FISHING_RECIPES[recipe].name === name);
}
// And a helper to get requested info from the FISH and FISHING_RECIPES objects
export function getFishInfo(fishName) {
    return FISH[fishName] || null;
}

export function getRecipeInfo(recipeName) {
    return FISHING_RECIPES[recipeName] || null;
}

// Single lookup covering all catalogs (no id overlap between them) - for
// anything that needs to display/categorize an item without caring which
// catalog it came from (inventory screens, loot rolling, etc).
// Merges a catalog's `global` tag onto every entry before combining - some
// catalogs (TOOLBELTS) rely on inheriting type/slot from `global` rather
// than repeating it per entry, the way `global` was always documented to
// work at the top of this file (data/stations.js's STATION_RECIPES derivation
// does the equivalent thing for recipe collections).
//
// This sits at the bottom of the file rather than beside the other catalogs
// because FISHING_CATALOG is declared just above, and a const can't be spread
// before it's initialized.
function withGlobalDefaults(catalog) {
  const { global, ...entries } = catalog;
  if (!global) return entries;
  return Object.fromEntries(Object.entries(entries).map(([id, item]) => [id, { ...global, ...item }]));
}

export const ALL_ITEMS = {
  ...ITEMS,
  ...withGlobalDefaults(TREASURE_ITEMS),
  ...MYTHIC_ITEMS,
  ...UNIQUE_ITEMS,
  ...withGlobalDefaults(MINING_RESOURCES),
  ...withGlobalDefaults(MAGIC_RESOURCES),
  ...withGlobalDefaults(MAGIC_ITEMS),
  ...withGlobalDefaults(TOOLBELTS),
  ...FISHING_CATALOG,
  ...BLACKMARKET_CATALOG,
};