// apocylta player backbone
import { SKILLS, listSkills } from "./skill_backbone.js";

// Races: Human, Dwarf, Elf, Orc, Goblin
// Each race has its own skill proficiencies
export const RACES = {
    "human": { name: "Human", skillPro: ["mining", "barter"], starters: { gold: 500, "hammer": 1 }, desc: "A Simple Human. Proficiant at Mining and Barter. Starts with some extra gold and a hammer." },
    "dwarf": { name: "Dwarf", skillPro: ["smithing", "mining"], starters: { gold: 300, "iron_pickaxe": 1 }, desc: "A Stout Dwarf. Proficiant at Smithing and Mining. Starts with some extra gold and a pickaxe." },
    "elf": { name: "Elf", skillPro: ["fishing", "foraging"], starters: { gold: 400, "fishing_rod": 1 }, desc: "A Graceful Elf. Proficiant at Fishing and Foraging. Starts with some extra gold and a fishing rod." },
    "orc": { name: "Orc", skillPro: ["fighting", "survival"], starters: { gold: 200, "axe": 1 }, desc: "A Fierce Orc. Proficiant at Fighting and Survival. Starts with some extra gold and an axe." },
    "goblin": { name: "Goblin", skillPro: ["trapping", "woodcutting"], starters: { gold: 150, "iron_dagger": 1 }, desc: "A Cunning Goblin. Proficiant at Trapping and Woodcutting. Starts with some extra gold and a dagger." },

}

// Classes: Warrior, Mage, Ranger, Attacker, Tank
// Each class has its own skill proficiencies
export const CLASSES = {
    "warrior": { name: "Warrior", skillPro: ["fighting", "defense"], desc: "A Brave Warrior. Proficiant at Fighting and Defense." },
    "mage": { name: "Mage", skillPro: ["magic", "alchemy"], desc: "A Wise Mage. Proficiant at Magic and Alchemy." },
    "ranger": { name: "Ranger", skillPro: ["fishing", "foraging"], desc: "A Skilled Ranger. Proficiant at Fishing and Foraging." },
    "attacker": { name: "Attacker", skillPro: ["fighting", "trapping"], desc: "A Fierce Attacker. Proficiant at Fighting and Trapping." },
    "tank": { name: "Tank", skillPro: ["defense", "smithing"], desc: "A Sturdy Tank. Proficiant at Defense and Smithing." },
}

// Difficulty Levels: Casual, Easy, Normal, Hard, Survival, Nightmare
// Each difficulty level has its own modifiers
export const DIFFICULTY_LEVELS = {
    "casual": { name: "Casual", logic: { actionTic: 10, enemyAi: 0.5, enemySpawn: 0.5, profSkills: 5, gatherTime: 1 }, modifiers: { enemyHp: 0.5, enemyDps: 0.5, playerXp: 1.5, groupSpawn: 0.25 }, desc: "A Relaxed Difficulty. Enemies have less HP and deal less damage. Players gain more XP." },
    "easy": { name: "Easy", logic: { actionTic: 5, enemyAi: 0.75, enemySpawn: 0.75, profSkills: 3, gatherTime: 5 }, modifiers: { enemyHp: 0.75, enemyDps: 0.75, playerXp: 1.25, groupSpawn: .5 }, desc: "An Easy Difficulty. Enemies have less HP and deal less damage. Players gain more XP." },
    "normal": { name: "Normal", logic: { actionTic: 3, enemyAi: 1, enemySpawn: 1, profSkills: 2, gatherTime: 10 }, modifiers: { enemyHp: 1, enemyDps: 1, playerXp: 1, groupSpawn: 1 }, desc: "A Standard Difficulty. Enemies have normal HP and deal normal damage. Players gain normal XP." },
    "hard": { name: "Hard", logic: { actionTic: 2, enemyAi: 1.25, enemySpawn: 1.25, profSkills: 1, gatherTime: 15 }, modifiers: { enemyHp: 1.25, enemyDps: 1.25, playerXp: 0.75, groupSpawn: 1.25 }, desc: "A Challenging Difficulty. Enemies have more HP and deal more damage. Players gain less XP." },
    // Ultra hard - No skill proficiencies, enemies have more HP and deal more damage, players gain less XP.
    "survival": { name: "Survival", logic: { actionTic: 2, enemyAi: 1.5, enemySpawn: 1.5, profSkills: 0, gatherTime: 20 }, modifiers: { enemyHp: 1.5, enemyDps: 1.5, playerXp: 0.5, proficiency: 0.5, groupSpawn: 2 }, desc: "A Survival Difficulty. Enemies have much more HP and deal much more damage. Players gain much less XP." },
    "nightmare": { name: "Nightmare", logic: { actionTic: 1, enemyAi: 2, enemySpawn: 2, profSkills: 0, gatherTime: 30 }, modifiers: { enemyHp: 2, enemyDps: 2, playerXp: 0.25, proficiency: 0, groupSpawn: 2.5 }, desc: "A Nightmare Difficulty. Enemies have extreme HP and deal extreme damage. Players gain extreme less XP." },
    "demon_lord": { name: "Demon Lord", logic: { actionTic: 1, enemyAi: 5, enemySpawn: 5, profSkills: 0, gatherTime: 60 }, modifiers: { enemyHp: 5, enemyDps: 5, playerXp: 0.1, proficiency: 0, groupSpawn: 3.5 }, desc: "A Demon Lord Difficulty. Enemies have insane HP and deal insane damage. Players gain insane less XP." },
}


// Player Starter Items, given for every new character, regardless of race or class
export const STARTER_ITEMS = {
    belt: ["leather_belt"],
    weapons: ["wooden_dagger"],
};

export const NEWGAMEPLUS_STARTER_ITEMS = {
    armor: ["adventurer_belt", "steel_armor_set"],
    weapons: ["iron_sword", "steel_weapon_set"],
    gold: 5000,
    skills: { "survival": 5, "fighting": 5, "magic": 5, "crafting": 5 },
};

export const LEVELUP_REWARDS = {
    all: { hpUp: 10, mpUp: 5, skillPoints: 1 },
    1: { gold: 50, items: ["healing_potion"] },
    5: { gold: 100, items: ["healing_potion"], skillPoints: 5 },
    10: { gold: 200, items: ["mana_potion"], skillPoints: 2 },
    15: { gold: 300, items: ["strength_potion"], skillPoints: 2 },
    20: { gold: 400, items: ["defense_potion"], skillPoints: 2 },
    25: { gold: 500, items: ["speed_potion"], skillPoints: 2 },
    30: { gold: 600, items: ["survival_potion"], skillPoints: 4 },
    35: { gold: 700, items: ["fishing_potion"], skillPoints: 3 },
    40: { gold: 800, items: ["smithing_potion"], skillPoints: 3 },
    45: { gold: 900, items: ["mining_potion"], skillPoints: 3 },
    50: { gold: 1000, items: ["crafting_potion"], skillPoints: 4 },
};
// Levelup helpers
export function getLevelUpRewards(level) {
    const rewards = { ...LEVELUP_REWARDS.all };
    if (LEVELUP_REWARDS[level]) {
        Object.assign(rewards, LEVELUP_REWARDS[level]);
    }
    return rewards;
}
export function applyLevelUpRewards(player, level) {
    const rewards = getLevelUpRewards(level);
    if (rewards.hpUp) player.hp += rewards.hpUp;
    if (rewards.mpUp) player.mp += rewards.mpUp;
    if (rewards.skillPoints) player.skillPoints += rewards.skillPoints;
    if (rewards.gold) player.gold += rewards.gold;
    if (rewards.items) {
        for (const item of rewards.items) {
            if (!player.inventory.items[item]) {
                player.inventory.items[item] = 0;
            }
            player.inventory.items[item] += 1;
        }
    }
}





// How many skills a player manually picks as proficient during character
// creation, per difficulty - falls back to the pre-difficulty-aware flat
// pick count (5) for an unknown/undefined difficulty id.
export function profSkillsFor(difficultyId) {
  return DIFFICULTY_LEVELS[difficultyId]?.logic?.profSkills ?? 5;
};

// Seconds between gather attempts while a timed action runs (state/gameLoop.js).
// The whole pacing brake: at the old flat 3s every difficulty handed out twenty
// guaranteed items a minute. Floored at 1 because it's used as a modulo against
// a per-second tick - a 0 would divide the loop by zero and fire every tick.
export function gatherTimeFor(difficultyId) {
  return Math.max(1, DIFFICULTY_LEVELS[difficultyId]?.logic?.gatherTime ?? 3);
};

// Seconds between ambush rolls while gathering. Deliberately its own cadence
// rather than riding the gather attempt: tying the two together made the
// hardest difficulties the SAFEST, since they wait longest between attempts.
export function encounterTicFor(difficultyId) {
  return Math.max(1, DIFFICULTY_LEVELS[difficultyId]?.logic?.actionTic ?? 3);
};

// How much more likely a spawn roll is to turn up a group than a lone enemy
// (data/combat.js's spawnEncounter weights the pool by it). 1 is neutral - the
// uniform pick it used to be - and 0 keeps groups out of a difficulty entirely.
export function groupSpawnFor(difficultyId) {
  return DIFFICULTY_LEVELS[difficultyId]?.modifiers?.groupSpawn ?? 1;
};


// ** Future Feature: Skill Trees **

export const SKILL_TREES = {
    // Warforger: A skill tree focused on combat, survival, and smithing.
    warforger: {
        name: "Warforger",
        description: "A skill tree focused on combat, survival, and smithing.",
        abilities: {
            combat: {
                "heavystrike": { name: "Heavy Strike", effect: { damageUp: 10 }, cooldown: 10, desc: "Increases damage dealt by 10%. Cooldown: 10s" },
                "shieldwall": { name: "Shield Wall", effect: { defenseUp: 10 }, cooldown: 15, desc: "Increases defense by 10%. Cooldown: 15s" },
            },
            survival: {
                "forager": { name: "Forager", effect: { gatherUp: 10 }, cooldown: 20, desc: "Increases gathering efficiency by 10%. Cooldown: 20s" },
                "hunter": { name: "Hunter", effect: { trapUp: 10 }, cooldown: 25, desc: "Increases trapping efficiency by 10%. Cooldown: 25s" },
            },
            smithing: {
                "blacksmith": { name: "Blacksmith", effect: { smithUp: 10 }, cooldown: 30, desc: "Increases Smithing efficiency by 10%. Cooldown: 30s" },
                "hastenedforge": { name: "Hastened Forge", effect: { smithSpeedUp: 10 }, cooldown: 35, desc: "Increases Smithing speed by 10%. Cooldown: 35s" },
            },
        },
        static_skills: {
            combat: {
                "hearculean_strength": { name: "Herculean Strength", effect: { damageUp: 5 }, maxlevel: 5, desc: "Increases damage dealt by 5% per level, up to 25%." },
                "iron_skin": { name: "Iron Skin", effect: { defenseUp: 5 }, maxlevel: 5, desc: "Increases defense by 5% per level, up to 25%." },
                "impactful_force": { name: "Impactful Force", effect: { combatAOEchanceUp: 5 }, maxlevel: 5, desc: "5% per level, up to 25% chance to deal equal damage to all enemies durring group encounters." },
                "battle_frenzy": { name: "Battle Frenzy", effect: { combatCritChanceUp: 5 }, maxlevel: 5, desc: "Increases critical hit chance by 5% per level, up to 25%." },
                "adrenaline_rush": { name: "Adrenaline Rush", effect: { combatCritDmgUp: 5 }, maxlevel: 5, desc: "Increases critical hit damage by 5% per level, up to 25%." },
                "berserker_rage": { name: "Berserker Rage", effect: { combatDmgVsLowHpUp: 5 }, maxlevel: 5, desc: "Increases damage dealt to enemies with low HP by 5% per level, up to 25%." },
                "warrior_spirit": { name: "Warrior Spirit", effect: { combatDmgVsHighHpUp: 5 }, maxlevel: 5, desc: "Increases damage dealt to enemies with high HP by 5% per level, up to 25%." },
                "battle_meditation": { name: "Battle Meditation", effect: { combatHpRegenUp: 5 }, maxlevel: 5, desc: "Increases health regeneration during combat by 5% per level, up to 25%." },
                "tactical_mastery": { name: "Tactical Mastery", effect: { combatDmgVsMultipleUp: 5 }, maxlevel: 5, desc: "Increases damage dealt to multiple enemies by 5% per level, up to 25%." },
                "overdive": { name: "Overdrive", effect: { combatDmgVsBossUp: 5 }, maxlevel: 5, desc: "Increases 'extra health' that can be stored beyond maximum health by 5% per level, up to 25%." },
            },
            survival: {
                "keen_eyesight": { name: "Keen Eyesight", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "trap_mastery": { name: "Trap Mastery", effect: { trapUp: 5 }, maxlevel: 5, desc: "Increases trapping efficiency by 5% per level, up to 25%." },
                "forager": { name: "Forager", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "hunter": { name: "Hunter", effect: { trapUp: 5 }, maxlevel: 5, desc: "Increases trapping efficiency by 5% per level, up to 25%." },
                "survivalist": { name: "Survivalist", effect: { survivalUp: 5 }, maxlevel: 5, desc: "Increases Survival by 5% per level, up to 25%." },
                "endurance": { name: "Endurance", effect: { healthRegenUp: 5 }, maxlevel: 5, desc: "Increases health regeneration by 5% per level, up to 25%." },
                "resourcefulness": { name: "Resourcefulness", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "adaptability": { name: "Adaptability", effect: { survivalUp: 5 }, maxlevel: 5, desc: "Increases Survival by 5% per level, up to 25%." },
            },
            smithing: {
                "master_smith": { name: "Master Smith", effect: { smithUp: 5 }, maxlevel: 5, desc: "Increases Smithing efficiency by 5% per level, up to 25%." },
                "quick_forge": { name: "Quick Forge", effect: { smithSpeedUp: 5 }, maxlevel: 5, desc: "Increases Smithing speed by 5% per level, up to 25%." },
                "durable_tools": { name: "Durable Tools", effect: { toolDurabilityUp: 5 }, maxlevel: 5, desc: "Increases tool durability by 5% per level, up to 25%." },
                "efficient_crafting": { name: "Efficient Crafting", effect: { craftingUp: 5 }, maxlevel: 5, desc: "Increases crafting efficiency by 5% per level, up to 25%." },
                "resourceful_crafting": { name: "Resourceful Crafting", effect: { craftingUp: 5 }, maxlevel: 5, desc: "Increases crafting efficiency by 5% per level, up to 25%." },
                "crafting_mastery": { name: "Crafting Mastery", effect: { craftingUp: 5 }, maxlevel: 5, desc: "Increases crafting efficiency by 5% per level, up to 25%." },
                "smithing_mastery": { name: "Smithing Mastery", effect: { smithUp: 5 }, maxlevel: 5, desc: "Increases Smithing efficiency by 5% per level, up to 25%." },
                "forging_mastery": { name: "Forging Mastery", effect: { smithUp: 5 }, maxlevel: 5, desc: "Increases Smithing efficiency by 5% per level, up to 25%." },
            },
        },
    },
    // Mercenary: A skill tree focused on combat, defense, and barter.
    mercenary: {
        name: "Mercenary",
        description: "A skill tree focused on combat, defense, and barter.",
        abilities: {
            combat: {
                "berserker": { name: "Berserker", effect: { damageUp: 15 }, cooldown: 10, desc: "Increases damage dealt by 15%. Cooldown: 10s" },
                "dualwield": { name: "Dual Wield", effect: { attackSpeedUp: 10 }, cooldown: 15, desc: "Increases attack speed by 10%. Cooldown: 15s" },
            },
            defense: {
                "fortitude": { name: "Fortitude", effect: { defenseUp: 15 }, cooldown: 20, desc: "Increases defense by 15%. Cooldown: 20s" },
                "resilience": { name: "Resilience", effect: { healthRegenUp: 5 }, cooldown: 25, desc: "Increases health regeneration by 5%. Cooldown: 25s" },
            },
            barter: {
                "negotiator": { name: "Negotiator", effect: { goldGainUp: 10 }, cooldown: 30, desc: "Increases gold gained from selling items by 10%. Cooldown: 30s" },
                "appraiser": { name: "Appraiser", effect: { itemValueUp: 10 }, cooldown: 35, desc: "Increases item value by 10%. Cooldown: 35s" },
            },
        },
        static_skills: {
            combat: {
                "battle_hardened": { name: "Battle Hardened", effect: { damageUp: 5 }, maxlevel: 5, desc: "Increases damage dealt by 5% per level, up to 25%." },
                "shield_mastery": { name: "Shield Mastery", effect: { defenseUp: 5 }, maxlevel: 5, desc: "Increases defense by 5% per level, up to 25%." },
                "critical_strike": { name: "Critical Strike", effect: { critChanceUp: 5 }, maxlevel: 5, desc: "Increases critical hit chance by 5% per level, up to 25%." },
                "dual_wielding": { name: "Dual Wielding", effect: { attackSpeedUp: 5 }, maxlevel: 5, desc: "Increases attack speed by 5% per level, up to 25%." },
                "berserker_rage": { name: "Berserker Rage", effect: { damageVsLowHpUp: 5 }, maxlevel: 5, desc: "Increases damage dealt to enemies with low HP by 5% per level, up to 25%." },
                "adrenaline_rush": { name: "Adrenaline Rush", effect: { critDmgUp: 5 }, maxlevel: 5, desc: "Increases critical hit damage by 5% per level, up to 25%." },
                "battle_meditation": { name: "Battle Meditation", effect: { combatHpRegenUp: 5 }, maxlevel: 5, desc: "Increases health regeneration during combat by 5% per level, up to 25%." },
            },
            defense: {
                "iron_will": { name: "Iron Will", effect: { healthRegenUp: 2 }, maxlevel: 5, desc: "Increases health regeneration by 2% per level, up to 10%." },
                "armor_mastery": { name: "Armor Mastery", effect: { armorUp: 5 }, maxlevel: 5, desc: "Increases armor effectiveness by 5% per level, up to 25%." },
                "resilient": { name: "Resilient", effect: { damageReductionUp: 5 }, maxlevel: 5, desc: "Reduces damage taken by 5% per level, up to 25%." },
                "fortified": { name: "Fortified", effect: { defenseUp: 5 }, maxlevel: 5, desc: "Increases defense by 5% per level, up to 25%." },
                "stalwart": { name: "Stalwart", effect: { healthUp: 5 }, maxlevel: 5, desc: "Increases maximum health by 5% per level, up to 25%." },
                "vigilant": { name: "Vigilant", effect: { dodgeChanceUp: 5 }, maxlevel: 5, desc: "Increases dodge chance by 5% per level, up to 25%." },
                "unbreakable": { name: "Unbreakable", effect: { damageReductionVsMultipleUp: 5 }, maxlevel: 5, desc: "Reduces damage taken from multiple enemies by 5% per level, up to 25%." },
            },
            barter: {
                "merchant": { name: "Merchant", effect: { goldGainUp: 5 }, maxlevel: 5, desc: "Increases gold gained from selling items by 5% per level, up to 25%." },
                "treasure_hunter": { name: "Treasure Hunter", effect: { itemValueUp: 5 }, maxlevel: 5, desc: "Increases item value by 5% per level, up to 25%." },
                "bargainer": { name: "Bargainer", effect: { barterUp: 5 }, maxlevel: 5, desc: "Increases barter efficiency by 5% per level, up to 25%." },
                "appraiser": { name: "Appraiser", effect: { itemValueUp: 5 }, maxlevel: 5, desc: "Increases item value by 5% per level, up to 25%." },
                "negotiator": { name: "Negotiator", effect: { goldGainUp: 5 }, maxlevel: 5, desc: "Increases gold gained from selling items by 5% per level, up to 25%." },
                "wealthy": { name: "Wealthy", effect: { goldGainUp: 5 }, maxlevel: 5, desc: "Increases gold gained from selling items by 5% per level, up to 25%." },
                "prosperous": { name: "Prosperous", effect: { goldGainUp: 5 }, maxlevel: 5, desc: "Increases gold gained from selling items by 5% per level, up to 25%." },
                "affluent": { name: "Affluent", effect: { goldGainUp: 5 }, maxlevel: 5, desc: "Increases gold gained from selling items by 5% per level, up to 25%." },
            },
        },
    },
    // Survivalist: A skill tree focused on survival, foraging, and fishing.
    survivalist: {
        name: "Survivalist",
        description: "A skill tree focused on survival, foraging, and fishing.",
        abilities: {
            survival: {
                "scavenger": { name: "Scavenger", effect: { gatherUp: 15 }, cooldown: 10, desc: "Increases gathering efficiency by 15%. Cooldown: 10s" },
                "tracker": { name: "Tracker", effect: { trapUp: 15 }, cooldown: 15, desc: "Increases trapping efficiency by 15%. Cooldown: 15s" },
            },
            foraging: {
                "herbalist": { name: "Herbalist", effect: { herbGatherUp: 10 }, cooldown: 20, desc: "Increases herb gathering efficiency by 10%. Cooldown: 20s" },
                "botanist": { name: "Botanist", effect: { plantGatherUp : 10 }, cooldown: 25, desc: "Increases plant gathering efficiency by 10%. Cooldown: 25s" },
            },
            fishing: {
                "angler": { name: "Angler", effect: { fishGatherUp: 10 }, cooldown: 30, desc: "Increases fish gathering efficiency by 10%. Cooldown: 30s" },
                "fisherman": { name: "Fisherman", effect: { fishCatchUp: 10 }, cooldown: 35, desc: "Increases fish catch rate by 10%. Cooldown: 35s" },
            },
        },
        static_skills: {
            survival: {
                "endurance": { name: "Endurance", effect: { healthRegenUp: 5 }, maxlevel: 5, desc: "Increases health regeneration by 5% per level, up to 25%." },
                "resilience": { name: "Resilience", effect: { damageReductionUp: 5 }, maxlevel: 5, desc: "Reduces damage taken by 5% per level, up to 25%." },
                "resourcefulness": { name: "Resourcefulness", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "adaptability": { name: "Adaptability", effect: { survivalUp: 5 }, maxlevel: 5, desc: "Increases Survival by 5% per level, up to 25%." },
                "survivalist": { name: "Survivalist", effect: { survivalUp: 5 }, maxlevel: 5, desc: "Increases Survival by 5% per level, up to 25%." },
                "hunter": { name: "Hunter", effect: { trapUp: 5 }, maxlevel: 5, desc: "Increases trapping efficiency by 5% per level, up to 25%." },
                "scavenger": { name: "Scavenger", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "tracker": { name: "Tracker", effect: { trapUp: 5 }, maxlevel: 5, desc: "Increases trapping efficiency by 5% per level, up to 25%." },
            },
            foraging: {
                "forager": { name: "Forager", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "herbalist": { name: "Herbalist", effect: { herbGatherUp: 5 }, maxlevel: 5, desc: "Increases herb gathering efficiency by 5% per level, up to 25%." },
                "botanist": { name: "Botanist", effect: { plantGatherUp : 5 }, maxlevel: 5, desc: "Increases plant gathering efficiency by 5% per level, up to 25%." },
                "foraging_mastery": { name: "Foraging Mastery", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "herbalism_mastery": { name: "Herbalism Mastery", effect: { herbGatherUp: 5 }, maxlevel: 5, desc: "Increases herb gathering efficiency by 5% per level, up to 25%." },
                "botany_mastery": { name: "Botany Mastery", effect: { plantGatherUp : 5 }, maxlevel: 5, desc: "Increases plant gathering efficiency by 5% per level, up to 25%." },
                "foraging_expert": { name: "Foraging Expert", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
            },
            fishing: {
                "angler": { name: "Angler", effect: { fishGatherUp: 5 }, maxlevel: 5, desc: "Increases fish gathering efficiency by 5% per level, up to 25%." },
                "fisherman": { name: "Fisherman", effect: { fishCatchUp: 5 }, maxlevel: 5, desc: "Increases fish catch rate by 5% per level, up to 25%." },
                "fishing_mastery": { name: "Fishing Mastery", effect: { fishGatherUp: 5 }, maxlevel: 5, desc: "Increases fish gathering efficiency by 5% per level, up to 25%." },
                "fishing_expert": { name: "Fishing Expert", effect: { fishCatchUp: 5 }, maxlevel: 5, desc: "Increases fish catch rate by 5% per level, up to 25%." },
                "fishing_legend": { name: "Fishing Legend", effect: { fishGatherUp: 5 }, maxlevel: 5, desc: "Increases fish gathering efficiency by 5% per level, up to 25%." },
                "fishing_master": { name: "Fishing Master", effect: { fishCatchUp: 5 }, maxlevel: 5, desc: "Increases fish catch rate by 5% per level, up to 25%." },
                "fishing_king": { name: "Fishing King", effect: { fishGatherUp: 5 }, maxlevel: 5, desc: "Increases fish gathering efficiency by 5% per level, up to 25%." },
                "fishing_legendary": { name: "Fishing Legendary", effect: { fishCatchUp: 5 }, maxlevel: 5, desc: "Increases fish catch rate by 5% per level, up to 25%." },
            },
        },

    },
    // Monk: A skill tree focused on magic, alchemy, and survival.
    monk: {
        name: "Monk",
        description: "A skill tree focused on magic, alchemy, and survival.",
        abilities: {
            magic: {
                "manaflow": { name: "Mana Flow", effect: { manaRegenUp: 10 }, cooldown: 10, desc: "Increases mana regeneration by 10%. Cooldown: 10s" },
                "spellweaver": { name: "Spell Weaver", effect: { spellDamageUp: 10 }, cooldown: 15, desc: "Increases spell damage by 10%. Cooldown: 15s" },
            },
            alchemy: {
                "potionmaster": { name: "Potion Master", effect: { potionEffectUp: 10 }, cooldown: 20, desc: "Increases potion effects by 10%. Cooldown: 20s" },
                "elixirmaker": { name: "Elixir Maker", effect: { elixirEffectUp : 10 }, cooldown: 25, desc: "Increases elixir effects by 10%. Cooldown: 25s" },
            },
            survival: {
                "endurance": { name: "Endurance", effect: { healthRegenUp : 10 }, cooldown: 30, desc: "Increases health regeneration by 10%. Cooldown: 30s" },
                "resilience": { name: "Resilience", effect: { damageReductionUp : 10 }, cooldown: 35, desc: "Reduces damage taken by 10%. Cooldown: 35s" },
            },
        },
        static_skills: {
            magic: {
                "arcane_mastery": { name: "Arcane Mastery", effect: { spellDamageUp: 5 }, maxlevel: 5, desc: "Increases spell damage by 5% per level, up to 25%." },
                "mana_efficiency": { name: "Mana Efficiency", effect: { manaCostReductionUp: 5 }, maxlevel: 5, desc: "Reduces mana cost of spells by 5% per level, up to 25%." },
                "mana_regeneration": { name: "Mana Regeneration", effect: { manaRegenUp: 5 }, maxlevel: 5, desc: "Increases mana regeneration by 5% per level, up to 25%." },
                "spell_mastery": { name: "Spell Mastery", effect: { spellDamageUp: 5 }, maxlevel: 5, desc: "Increases spell damage by 5% per level, up to 25%." },
                "elemental_mastery": { name: "Elemental Mastery", effect: { elementalDamageUp: 5 }, maxlevel: 5, desc: "Increases elemental damage by 5% per level, up to 25%." },
                "arcane_mastery": { name: "Arcane Mastery", effect: { spellDamageUp: 5 }, maxlevel: 5, desc: "Increases spell damage by 5% per level, up to 25%." },
                "mana_surge": { name: "Mana Surge", effect: { manaRegenUp: 5 }, maxlevel: 5, desc: "Increases mana regeneration by 5% per level, up to 25%." },
                "spell_focus": { name: "Spell Focus", effect: { spellDamageUp: 5 }, maxlevel: 5, desc: "Increases spell damage by 5% per level, up to 25%." },
                "arcane_focus": { name: "Arcane Focus", effect: { spellDamageUp: 5 }, maxlevel: 5, desc: "Increases spell damage by 5% per level, up to 25%." },
            },
            alchemy: {
                "potion_mastery": { name: "Potion Mastery", effect: { potionEffectUp: 5 }, maxlevel: 5, desc: "Increases potion effects by 5% per level, up to 25%." },
                "elixir_mastery": { name: "Elixir Mastery", effect: { elixirEffectUp: 5 }, maxlevel: 5, desc: "Increases elixir effects by 5% per level, up to 25%." },
                "herbalism_mastery": { name: "Herbalism Mastery", effect: { herbGatherUp: 5 }, maxlevel: 5, desc: "Increases herb gathering efficiency by 5% per level, up to 25%." },
                "alchemy_mastery": { name: "Alchemy Mastery", effect: { potionEffectUp: 5 }, maxlevel: 5, desc: "Increases potion effects by 5% per level, up to 25%." },
                "elixir_mastery": { name: "Elixir Mastery", effect: { elixirEffectUp: 5 }, maxlevel: 5, desc: "Increases elixir effects by 5% per level, up to 25%." },
                "herbalism_mastery": { name: "Herbalism Mastery", effect: { herbGatherUp: 5 }, maxlevel: 5, desc: "Increases herb gathering efficiency by 5% per level, up to 25%." },
                "alchemy_expert": { name: "Alchemy Expert", effect: { potionEffectUp: 5 }, maxlevel: 5, desc: "Increases potion effects by 5% per level, up to 25%." },
                "elixir_expert": { name: "Elixir Expert", effect: { elixirEffectUp: 5 }, maxlevel: 5, desc: "Increases elixir effects by 5% per level, up to 25%." },
                "herbalism_expert": { name: "Herbalism Expert", effect: { herbGatherUp: 5 }, maxlevel: 5, desc: "Increases herb gathering efficiency by 5% per level, up to 25%." },
            },
            survival: {
                "endurance": { name: "Endurance", effect: { healthRegenUp : 5 }, maxlevel: 5, desc: "Increases health regeneration by 5% per level, up to 25%." },
                "resilience": { name: "Resilience", effect: { damageReductionUp : 5 }, maxlevel: 5, desc: "Reduces damage taken by 5% per level, up to 25%." },
                "resourcefulness": { name: "Resourcefulness", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "adaptability": { name: "Adaptability", effect: { survivalUp: 5 }, maxlevel: 5, desc: "Increases Survival by 5% per level, up to 25%." },
                "survivalist": { name: "Survivalist", effect: { survivalUp: 5 }, maxlevel: 5, desc: "Increases Survival by 5% per level, up to 25%." },
                "hunter": { name: "Hunter", effect: { trapUp: 5 }, maxlevel: 5, desc: "Increases trapping efficiency by 5% per level, up to 25%." },
                "scavenger": { name: "Scavenger", effect: { gatherUp: 5 }, maxlevel: 5, desc: "Increases gathering efficiency by 5% per level, up to 25%." },
                "tracker": { name: "Tracker", effect: { trapUp: 5 }, maxlevel: 5, desc: "Increases trapping efficiency by 5% per level, up to 25%." },
            },
        },
    },
    // Additional skill trees can be added here in the future
};

// Skill Tree Helpers
export function getSkillTree(skillTreeId) {
    return SKILL_TREES[skillTreeId] || null;
}

export function getSkill(skillTreeId, skillId) {
    const skillTree = getSkillTree(skillTreeId);
    if (!skillTree) return null;

    // Check in abilities
    for (const category in skillTree.abilities) {
        if (skillTree.abilities[category][skillId]) {
            return skillTree.abilities[category][skillId];
        }
    }

    // Check in static skills
    for (const category in skillTree.static_skills) {
        if (skillTree.static_skills[category][skillId]) {
            return skillTree.static_skills[category][skillId];
        }
    }

    return null; // Skill not found
}
export function getSkillTreeAbilities(skillTreeId) {
    const skillTree = getSkillTree(skillTreeId);
    if (!skillTree) return null;

    return skillTree.abilities || null;
}

export function getSkillTreeStaticSkills(skillTreeId) {
    const skillTree = getSkillTree(skillTreeId);
    if (!skillTree) return null;

    return skillTree.static_skills || null;
}

export function getSkillTreeAbility(skillTreeId, abilityId) {
    const abilities = getSkillTreeAbilities(skillTreeId);
    if (!abilities) return null;

    for (const category in abilities) {
        if (abilities[category][abilityId]) {
            return abilities[category][abilityId];
        }
    }

    return null; // Ability not found
}

export function getSkillTreeStaticSkill(skillTreeId, skillId) {
    const staticSkills = getSkillTreeStaticSkills(skillTreeId);
    if (!staticSkills) return null;

    for (const category in staticSkills) {
        if (staticSkills[category][skillId]) {
            return staticSkills[category][skillId];
        }
    }

    return null; // Static skill not found
}

// Skill-specific helpers
export function getSkillEffect(skillTreeId, skillId) {
    const skill = getSkill(skillTreeId, skillId);
    return skill ? skill.effect : null;
}

export function getSkillCooldown(skillTreeId, skillId) {
    const skill = getSkill(skillTreeId, skillId);
    return skill ? skill.cooldown : null;
}

export function getSkillMaxLevel(skillTreeId, skillId) {
    const skill = getSkill(skillTreeId, skillId);
    return skill ? skill.maxlevel : null;
}
export function getSkillDescription(skillTreeId, skillId) {
    const skill = getSkill(skillTreeId, skillId);
    return skill ? skill.desc : null;
}

// Skill Effect Application
export function applySkillEffect(player, skillTreeId, skillId) {
    const effect = getSkillEffect(skillTreeId, skillId);
    if (!effect) return;

    for (const key in effect) {
        if (player.hasOwnProperty(key)) {
            player[key] += effect[key];
        }
    }
}

// Skill Cooldown Management
export function setSkillCooldown(player, skillTreeId, skillId) {
    const cooldown = getSkillCooldown(skillTreeId, skillId);
    if (!cooldown) return;

    player.skillCooldowns[skillId] = Date.now() + cooldown * 1000; // Store the timestamp when the skill will be available again
}

export function isSkillOnCooldown(player, skillId) {
    const cooldownEnd = player.skillCooldowns[skillId];
    if (!cooldownEnd) return false;

    return Date.now() < cooldownEnd;
}
