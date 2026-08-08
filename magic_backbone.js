// apocylta magic
export const SPELL_TYPES = ["heal", "attack", "buff", "debuff", "poison", "aid", "teleport"];
export const SPELLS = {
    // Attack Spells
    "magic_missle": { name: "Magic Missle", type: "attack", starter: true, damage: 10, xp: 3, mp: 6 },
    "fireball": { name: "Fireball", type: "attack", level: 2, learn: { "ley_crystals": 1, "arcane_shard": 1 }, damage: 20, xp: 5, mp: 10 },
    "frost_spike": { name: "Frost Spike", type: "attack", level: 3, damage: 30, xp: 7, mp: 14 },
    "lightning_bolt": { name: "Lightning Bolt", type: "attack", level: 4, damage: 40, xp: 10, mp: 20 },

    // Healing Spells
    "cure":         { name: "Cure", type: "heal", level: 1, learn: { "ley_crystals": 1, "arcane_shard": 1 }, heal: 15, xp: 3, mp: 6 },
    "hi cure":      { name: "Hi Cure", type: "heal", level: 3, heal: 45, xp: 8, mp: 16 },

    // Buff Spells
    "shield":      { name: "Shield", type: "buff", level: 2, learn: { "ley_crystals": 2, "arcane_shard": 1 }, buff: { defense: 5 }, xp: 5, mp: 10 },
    "haste":       { name: "Haste", type: "buff", level: 3, buff: { speed: 5 }, xp: 7, mp: 14 },

    // Debuff Spells
    "weaken":      { name: "Weaken", type: "debuff", level: 4, debuff: { attack: -5 }, xp: 7, mp: 14 },

    // Poison Spells
    "poison":      { name: "Poison", type: "poison", level: 6, poison: { dps: 5, duration: 3 }, xp: 10, mp: 20 },

    // Aid Spells
    "blessed hammer": { name: "Blessed Hammer", type: "aid", level: 8, buff: { smithing: 10 }, xp: 12, mp: 24 },
    "blessed pickaxe": { name: "Blessed Pickaxe", type: "aid", level: 8, buff: { mining: 10 }, xp: 12, mp: 24 },
    "blessed hands": { name: "Blessed Hands", type: "aid", level: 8, buff: { crafting: 10 }, xp: 12, mp: 24 },

    // Teleport Spells
    "town_teleport": { name: "Town Teleport", type: "teleport", level: 5, learn: { "ley_crystals": 3, "green_herbs": 3, "arcane_shard": 2 }, teleport: "town_square", xp: 10, mp: 20 },
    "wilderness_teleport": { name: "Wilderness Teleport", type: "teleport", level: 2, learn: { "ley_crystals": 2, "arcane_shard": 2 }, teleport: "wilderness", xp: 5, mp: 10 },
    "mine_teleport": { name: "Mine Teleport", type: "teleport", level: 3, learn: { "ley_crystals": 2, "arcane_shard": 2 }, teleport: "cave_mines", xp: 7, mp: 14 },
};
