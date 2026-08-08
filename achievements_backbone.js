// apocylta achievements backbone
// Here we list all possible achievements in the game.
// name:   Achievement name
// desc:   Achievement description
// reward: reward gained for earning achievement
//      -- gold: - gold award
//      -- `xp: `- Multo-path
//      -- `xp: <number>` and `xp: { player: <x> }` grants <x> XP to player.
//      -- `xp: { skill: { "<skill>": <x> } }` gives <x> XP to <skill> skill. Skills can be stacked.
// req:    Achievement requirements, multi-path
//      -- `locationsVisited: []` requires the player to have visited all named locations specified
//      -- `combatEnd: {}` -- Multi-path requirements that must be met when a combat encounter ends (all enemys defeated)
//      --- `combatEnd: { healthMaxP: <x> }` max percentage of health remaining
//      --- `combatEnd: { healthMax: <x> }` max health remaining
//      --- `combatEnd: { manaMaxP: <x> }` max percentage of mana remaining
//      --- `combatEnd: { manaMax: <x> }` max mana remaining
//      --- `combatEnd: { enemies: <x> }` enemies defeated during encounter - multi-path
//      --- `combatEnd: { boss: true }` boss subtype enemy defeated during encounter
//      --- `totalEnemies: <x>` - Multi-path, these are the total enemies defeated overall, not just in a single encounter. This is tracked in the 
//                       |        player state and can be used for achievements that require defeating a certain number of enemies over time.
//      --- `totalEnemies: { type: "<enemy_type>", quantity: <x> }` - specific type of enemy defeated overall
//      --- `totalEnemies: { type: "<enemy_type>", subtype: "<enemy_subtype>", quantity: <x> }` - specific subtype of enemy defeated overall
//      --- `totalEnemies: ["<enemy_type>", "<enemy_type>", ...]` - list of enemy types defeated overall.
//      --- `acquireItem:` Acquire a specific item (e.g., `acquireItem: "wood"` | or `acquireItem: { "wood": 5 }` for quantity)
//      --- `sellItem:` Sell a specific item (e.g., `sellItem: { type: "scrap" }` for a type or `sellItem: { type: "scrap", subtype: "raw_scrap" }` for a specific subtype)
//                   | or `sellItem: { type: "scrap", subtype: "raw_scrap", quantity: 5 }` for a specific quantity of a specific subtype
//                   | or `sellItem: { "iron_sword": 5 }` for a specific quantity of a specific item
//                   | or `sellItem: { "iron_sword": 5, "copper_axe": 3 }` for a specific quantity of multiple items
//                   | or `sellItem: ["iron_sword", "copper_axe"]` for a list of items to sell (any quantity)
//      --- `acquireHouse:` Acquire a house (e.g., `acquireHouse: true`)
//      --- `acquireStation:` Acquire a station (e.g., `acquireStation: "forge"` or `acquireStation: ["forge", "cooking_station", "alchemy_table"]`) for your house.
//      --- `defeatEnemy:` Defeat a specific enemy (e.g., `defeatEnemy: { type: "goblin", quantity: 5 }`)
//      --- `reachLocation:` Reach a specific location (e.g., `reachLocation: "town_square"`)
//      --- `craftItem:` Craft a specific item (e.g., `craftItem: { type: "iron_sword", quantity: 1 }`)
//      --- `useSpell:` Use a specific spell (e.g., `useSpell: ["fireball"]`)
//      --- `learnSkill:` Learn a specific skill (e.g., `learnSkill: { type: "smithing", level: 2 }`)
//      --- `learnSpell:` Learn a specific spell (e.g., `learnSpell: ["fireball"]` or `learnSpell: ["fireball", "cure"]` for multiple spells)
export const ACHIEVEMENTS = {
    "welcome_to_apocylta": {
        name: "Welcome to apocylta",
        desc: "You've journeyed through some of the map.",
        reward: { gold: 50, xp: 50 },
        req: {
            // "*_pass" was a typo - the real location ids in data/locations.js
            // are "*_path" (only "mountain_pass" uses "pass"), so this could
            // never have completed. Pinned by achievementsBackboneConsistency.
            locationsVisited: ["town_square", "wilderness", "north_path", "east_path", "west_path", "south_path"],
        },
    },
    "this_is_combat": {
        name: "This is Combat!",
        desc: "Win a combat encouter with less than 50% health remaining",
        reward: { gold: 100, xp: { player: 100, skill: { "fighting": 50, "defense": 50} } },
        req: {
            combatEnd: { healthMaxP: 50 },
        },
    },
    "slayerrr": {
        name: "Slayerrr!",
        desc: "Slayed 5 enemies!",
        reward: { gold: 100, xp: { player: 100, skill: { "fighting": 50, "defense": 50} } },
        req: {
            combatEnd: { enemies: 5 },
        },
    },
    "boss_down": {
        name: "Boss Down!",
        desc: "Defeated a boss enemy!",
        reward: { gold: 200, xp: { player: 200, skill: { "fighting": 100, "defense": 100} } },
        req: {
            combatEnd: { enemies: 1, boss: true },
        },
    },
    "master_crafter": {
        name: "Master Crafter",
        desc: "Crafted 10 items!",
        reward: { gold: 100, xp: { player: 100, skill: { "crafting": 50, "smithing": 50} } },
        req: {
            craftItem: { quantity: 10 },
        },
    },
    "master_merchant": {
        name: "Master Merchant",
        desc: "Sold 10 items!",
        reward: { gold: 100, xp: { player: 100, skill: { "barter": 50} } },
        req: {
            sellItem: { quantity: 10 },
        },
    },
    "beginner_mage": {
        name: "Beginner Mage",
        desc: "Learned 5 spells!",
        reward: { gold: 100, xp: { player: 100, skill: { "magic": 50} } },
        req: {
            learnSpell: { quantity: 5 },
        },
    },

};