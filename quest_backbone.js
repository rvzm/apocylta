// apocylta quest backbone

// QUESTS
// Here we list quests in the game. These are visible at the Quest Board in the town square, and can be completed by the player.
// name: Quest name
// locked: Whether the quest is locked (true) or unlocked (false)
// level: The level required to unlock the quest
// skill: The skill required to unlock the quest (if any) (e.g. `skill: { "smithing": 2 }` means the player must have smithing skill level 2 to unlock the quest)
// completor: This is a unique tag for the quest that marks the game as completed when the quest is completed. This is used for New Game Plus mode.
// reward: The reward for completing the quest.
//    - gold: - gold award
//    - `xp: `- Multo-path
//    - `xp: <number>` and `xp: { player: <x> }` grants <x> XP to player.
//    - `xp: { skill: { "<skill>": <x> } }` gives <x> XP to <skill> skill. Skills can be stacked.
// objectives: The objectives of the quest
//    objectives can be of the following types:
//    - acquireItem: Acquire a specific item (e.g., `acquireItem: "wood"` | or `acquireItem: { "wood": 5 }` for quantity)
//    - sellItem: Sell a specific item (e.g., `sellItem: { type: "scrap" }`)
//    - acquireHouse: Acquire a house (e.g., `acquireHouse: true`)
//    - acquireStation: Acquire a station (e.g., `acquireStation: "forge"` or `acquireStation: ["forge", "cooking_station", "alchemy_table"]`) for your house.
//    - defeatEnemy: Defeat a specific enemy (e.g., `defeatEnemy: { type: "goblin", quantity: 5 }`)
//    - reachLocation: Reach a specific location (e.g., `reachLocation: "town_square"`)
//    - craftItem: Craft a specific item (e.g., `craftItem: { type: "iron_sword", quantity: 1 }`)
//    - useSpell: Use a specific spell (e.g., `useSpell: ["fireball"]`)
//    - learnSkill: Learn a specific skill (e.g., `learnSkill: { type: "smithing", level: 2 }`)
//    - learnSpell: Learn a specific spell (e.g., `learnSpell: ["fireball"]`)
export const QUESTS = {
    "getting_started": {
         name: "Getting Started",
         locked: false,
         level: 1,
         reward: { gold: 100, xp: 100 },
         objectives: {
            "Chop some wood": { acquireItem: "wood" },
            "Sell Some scrap": { sellItem: { type: "scrap" } },
            "Buy a House": { acquireHouse: true }
         }
    },
    "home_decked": {
        name: "Home Decked",
        locked: true,
        level: 2,
        reward: { gold: 500, xp: 250 },
        // purchase all home stations
        objectives: {
            acquireStation: ["forge", "cooking_station", "alchemy_table", "crafting_table", "anvil" ],
        }
    },
    "mine_mine_mine": {
        name: "Mine! Mine! Mine!",
        locked: false,
        level: 1,
        reward: { gold: 100, xp: 100 },
        objectives: {
            "Acquire 5 Tin Ore": { acquireItem: { "tin_ore": 5 } },
            "Acquire 5 Copper Ore": { acquireItem: { "copper_ore": 5 } },
        }
    },

    // Completor
    "youve_done_it": {
        name: "You've Done It!",
        locked: true,
        level: 85,
        completor: true,
        reward: { gold: 1000, xp: 1000 },
        objectives: {
            "Acquire a Mythic Weapon": { acquireItem: { "mythic_weapon": 1 } },
            "Acquire a Godlike Armor": { acquireItem: { "godlike_armor": 1 } },
            "Acquire a Legendary Spell": { learnSpell: ["legendary_spell"] },
            "Acquire a bunch of gold": { acquireItem: { "gold": 10000 } },
            "Acquire a bunch of stuff": { acquireItem: { "gold_bar": 50, "mithril_ore": 50, "adamantite_ore": 50, "stone": 300 } },
            "Defeat a bunch of enemies": { defeatEnemy: { type: "goblin", quantity: 50 } },
            // "hilbert" was a typo for "hubert" - there is no such enemy id in
            // enemy_backbone.js, so this objective could never have completed.
            "Defeat Hubert and Gilbert": { defeatEnemy: ["hubert", "gilbert"] },
            "Defeat Solas": { defeatEnemy: ["solas"] },
        }
    }
};
