// skill_backbone.js
// ----- Skills -----
// Trainable skills; each has s_<key>_lvl / s_<key>_xp columns on players.
// Skill XP comes from location actions and is SPENT on skill levels (same
// philosophy as the main level): buy the next level when xp >= skillLevelCost.
export const SKILLS = {
  magic: { name: "Magic", actions: ["spells"], description: "Harness the arcane forces to cast spells and enchantments." },
  defense: { name: "Defense", actions: ["block", "combat"], description: "Improve your ability to withstand attacks and reduce damage taken." },
  fighting: { name: "Fighting", actions: ["attack", "combat"], description: "Enhance your combat skills to deal more damage and defeat enemies." },
  strength: { name: "Strength", actions: ["lift", "carry"], description: "Increase your physical power to lift heavier objects and carry more weight." },
  speed: { name: "Speed", actions: ["run", "dodge"], description: "Boost your agility and quickness to move faster and evade attacks." },
  survival: { name: "Survival", actions: ["foraging", "camping", "eat"], description: "Develop skills to endure harsh environments and sustain yourself." },
  woodcutting: { name: "Woodcutting", actions: ["chop"], description: "Chop down trees to gather wood for crafting and building." },
  fishing: { name: "Fishing", actions: ["fish"], description: "Catch fish from rivers, lakes, and oceans." },
  mining: { name: "Mining", actions: ["mine"], description: "Extract valuable ores and minerals from the earth." },
  smithing: { name: "Smithing", actions: ["forge"], description: "Forge weapons, armor, and tools from raw materials." },
  crafting: { name: "Crafting", actions: ["craft"], description: "Create various items and equipment using gathered resources." },
  cooking: { name: "Cooking", actions: ["cook"], description: "Prepare meals to restore health and provide various buffs." },
  foraging: { name: "Foraging", actions: ["gather"], description: "Gather wild plants, herbs, and other natural resources." },
  trapping: { name: "Trapping", actions: ["set_trap", "hunt"], description: "Set traps to catch animals for food and materials." },
  alchemy: { name: "Alchemy", actions: ["brew"], description: "Combine ingredients to create potions and magical elixirs." },
  cooking: { name: "Cooking", actions: ["cook"], description: "Prepare meals to restore health and provide various buffs." },
  barter: { name: "Barter", actions: ["trade", "buy", "sell"], description: "Negotiate and trade with merchants." },
  luck: { name: "Luck", actions: ["gamble"], description: "Affects the outcome of random events and increases chances of finding rare items." },
};
export function skillLevelCost(targetLevel) { return Math.round(50 * Math.pow(targetLevel, 1.4)); }
export function listSkills() { return Object.keys(SKILLS).map(key => ({ key, ...SKILLS[key] })); }
// Ongoing xp-gain bonus for skills marked "proficient" at character creation
// (immediate level 5 + faster leveling thereafter).
export const PROFICIENCY_XP_MULTIPLIER = 1.5;

// Skill blocks
// These are designators for what skill-related items require what level to use. For example, a 
// "copper" ore requires mining level 1 to mine, and a "steel" ore requires mining level 10 to mine.

export const SKILL_BLOCKS = {
  magic: {
    weapons: { type: "staff",  subtypes: { "copper": 1, "iron": 5, "steel": 10, "mithril": 25, "adamantite": 45 } },
    armor: { type: "mage_robe", robetype: { "basic": 3, "advanced": 10, "mythic": 25, "unique": 30, "godlike": 50 } },
    potions: { "heal": 1, "mana": 1, "teleport": 3, "buff": 5, "debuff": 8, "poison": 10, "aid": 10 },
    magitems: { "scroll": 1, "wand": 5, "crystal": 10, "rune": 15, "talisman": 20, "orb": 25, "book": 35, "focus": 40 },
  },
  defense: {
    armor: { "copper": 1, "iron": 5, "steel": 10, "mithril": 25, "adamantite": 45 },
    shields: { "copper": 1, "iron": 5, "steel": 10, "mithril": 25, "adamantite": 45 }
  },
  fighting: {
    weapons: { "copper": 1, "iron": 5, "steel": 10, "mithril": 25, "adamantite": 45 },
    boss: { all: { level: 20 } }
  },
  survival: {
    food: { "raw_food": 1, "raw_meat": 3, "raw_fish": 5, "raw_fungi": 7, "raw_herbs": 9, "raw_vegetables": 11 },
    traps: { "basic_trap": 1, "advanced_trap": 5 }
  },
  woodcutting: {
    tools: { "copper_axe": 1, "iron_axe": 5, "steel_axe": 10, "mithril_axe": 25, "adamantite_axe": 45 }
  },
  fishing: {
    tools: { "copper_fishing_rod": 1, "tin_fishing_rod": 2, "bronze_fishing_rod": 3, "iron_fishing_rod": 5, "steel_fishing_rod": 10, "mithril_fishing_rod": 25, "adamantite_fishing_rod": 45 }
  },
  smithing: {
    tools: { "copper_hammer": 1, "iron_hammer": 5, "steel_hammer": 10, "mithril_hammer": 25, "adamantite_hammer": 45 }
  },
  // An ore missing from `ores` can't be mined at all (data/mining.js's
  // canMineOre refuses it), and canMineOre also wants an equipped pickaxe
  // whose `tools` tier is >= the ore's level - so every ore level here needs
  // a pickaxe that can reach it. gold/syllic/runic are placed to match their
  // MINE_LOCK tier; syllic_pickaxe is what makes runic reachable at all.
  mining: {
    ores: { "tin": 1, "copper": 1, "iron": 5, "gold": 8, "cobalt": 10, "mithril": 25, "syllic": 40, "adamantite": 45, "runic": 60 },
    tools: { "copper_pickaxe": 1, "iron_pickaxe": 5, "steel_pickaxe": 10, "mithril_pickaxe": 25, "adamantite_pickaxe": 45, "syllic_pickaxe": 60 }
  },
  luck: {
    gambling: { "slot_machine": 1, "dice_game": 5, "card_game": 5, "lottery": 10, "raffle": 10 },
    tools: {  metal: { "syllic": 25 } },
  },
  cooking: {
    food: { "raw_food": 1, "raw_meat": 1, "raw_fish": 2, "raw_fungi": 2, "raw_herbs": 1, "raw_vegetables": 1, subtypes: { "stew": 2, "brewed": 3, "baked": 5} },
    
  }
};