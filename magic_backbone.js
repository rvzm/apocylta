// apocylta magic
import { MAGIC_ITEMS } from "./item_backbone.js";
export const SPELL_TYPES = ["heal", "attack", "buff", "debuff", "poison", "aid", "teleport"];
export const SPELL_RARITIES = ["starter", "common", "uncommon", "rare", "legendary", "mythic", "godlike"];
// SPELLS
// `learn` is the recipe for learning it, which is a map of itemId -> quantity.
// `teleport` is the locationId to teleport to, which is a key in data/locations.js.
// `buff` and `debuff` are maps of stat -> amount, which are applied to the target
export const SPELLS = {
    // Attack Spells
    "magic_missle": { name: "Magic Missle", type: "attack", starter: true, rarity: "starter", damage: 10, xp: 3, mp: 6 },
    "fireball": { name: "Fireball", type: "attack", rarity: "common", level: 2, learn: { "ley_crystals": 2, "arcane_shard": 2 }, damage: 20, xp: 5, mp: 10 },
    "frost_spike": { name: "Frost Spike", type: "attack", rarity: "uncommon", level: 3, learn: { "arcane_essence": 2, "arcane_shard": 4 }, damage: 30, xp: 7, mp: 14 },
    "lightning_bolt": { name: "Lightning Bolt", type: "attack", rarity: "rare", level: 4, learn: { "arcane_essence": 2, "ley_crystals": 4 }, damage: 40, xp: 10, mp: 20 },
    "magic_storm": { name: "Magic Storm", type: "attack", rarity: "legendary", level: 5, learn: { "arcane_essence": 3, "mystic_dust": 2 }, damage: 50, xp: 12, mp: 24 },
    "incinerate": { name: "Incinerate", type: "attack", rarity: "mythic", level: 6, learn: { "arcane_essence": 4, "mystic_dust": 3 }, damage: 60, xp: 15, mp: 30 },
    "explosion": { name: "Explosion", type: "attack", rarity: "godlike", level: 7, learn: { "arcane_essence": 5, "void_shard": 2, "mystic_dust": 3, "arcane_shard": 5 }, damage: 175, xp: 20, mp: 40 },

    // Healing Spells
    "cure":         { name: "Cure", type: "heal", rarity: "starter", level: 1, heal: 15, xp: 3, mp: 6 },
    "hi cure":      { name: "Hi Cure", type: "heal", rarity: "common", level: 3, learn: { "ley_crystals": 1, "arcane_shard": 3 }, heal: 45, xp: 8, mp: 16 },
    "super cure": { name: "Super Cure", type: "heal", rarity: "uncommon", level: 5, learn: { "ley_crystals": 2, "arcane_shard": 4 }, heal: 75, xp: 12, mp: 24 },
    "mega cure": { name: "Mega Cure", type: "heal", rarity: "rare", level: 7, learn: { "ley_crystals": 3, "arcane_shard": 5 }, heal: 100, xp: 15, mp: 30 },
    "full cure": { name: "Full Cure", type: "heal", rarity: "legendary", level: 10, learn: { "arcane_essence": 2, "mystic_dust": 2 }, heal: 250, xp: 20, mp: 40 },
    "ultimate cure": { name: "Ultimate Cure", type: "heal", rarity: "mythic", level: 15, learn: { "arcane_essence": 3, "mystic_dust": 3 }, heal: 500, xp: 30, mp: 60 },
    "divine cure": { name: "Divine Cure", type: "heal", rarity: "godlike", level: 20, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, heal: 1000, xp: 50, mp: 100 },

    // Buff Spells
    "shield":      { name: "Shield", type: "buff", rarity: "common", level: 2, learn: { "ley_crystals": 2, "arcane_shard": 1 }, buff: { defense: 5 }, xp: 5, mp: 10 },
    "haste":       { name: "Haste", type: "buff", rarity: "uncommon", level: 3, learn: { "ley_crystals": 2, "arcane_shard": 2 }, buff: { speed: 5 }, xp: 7, mp: 14 },
    "strength":    { name: "Strength", type: "buff", rarity: "rare", level: 4, learn: { "ley_crystals": 3, "arcane_shard": 2 }, buff: { attack: 5 }, xp: 10, mp: 20 },
    "protection": { name: "Protection", type: "buff", rarity: "legendary", level: 5, learn: { "arcane_essence": 2, "mystic_dust": 1 }, buff: { defense: 10 }, xp: 12, mp: 24 },
    "fortitude": { name: "Fortitude", type: "buff", rarity: "mythic", level: 6, learn: { "arcane_essence": 3, "mystic_dust": 2 }, buff: { defense: 15 }, xp: 15, mp: 30 },
    "gods_hand": { name: "God's Hand", type: "buff", rarity: "godlike", level: 7, learn: { "arcane_essence": 4, "mystic_dust": 3, "void_shard": 1 }, buff: { attack: 25, defense: 20 }, xp: 20, mp: 40 },

    // Debuff Spells
    "weaken":      { name: "Weaken", type: "debuff", rarity: "uncommon", level: 4, learn: { "ley_crystals": 2, "arcane_shard": 2 }, debuff: { attack: -5 }, xp: 7, mp: 14 },
    "slow":        { name: "Slow", type: "debuff", rarity: "rare", level: 5, learn: { "ley_crystals": 3, "arcane_shard": 2 }, debuff: { speed: -5 }, xp: 10, mp: 20 },
    "cripple":     { name: "Cripple", type: "debuff", rarity: "legendary", level: 6, learn: { "arcane_essence": 2, "mystic_dust": 1 }, debuff: { attack: -10, defense: -5 }, xp: 12, mp: 24 },
    "curse":       { name: "Curse", type: "debuff", rarity: "mythic", level: 7, learn: { "arcane_essence": 3, "mystic_dust": 2 }, debuff: { attack: -15, defense: -10 }, xp: 15, mp: 30 },
    "doom":        { name: "Doom", type: "debuff", rarity: "godlike", level: 8, learn: { "arcane_essence": 4, "mystic_dust": 3, "void_shard": 1 }, debuff: { attack: -25, defense: -20 }, xp: 20, mp: 40 },

    // Poison Spells
    "poison":      { name: "Poison", type: "poison", rarity: "rare", level: 6, learn: { "ley_crystals": 3, "arcane_shard": 3 }, poison: { dps: 3, duration: 3 }, xp: 10, mp: 20 },
    "deadly poison": { name: "Deadly Poison", type: "poison", rarity: "mythic", level: 8, learn: { "arcane_essence": 3, "mystic_dust": 2 }, poison: { dps: 5, duration: 5 }, xp: 15, mp: 30 },
    "toxic poison": { name: "Toxic Poison", type: "poison", rarity: "godlike", level: 10, learn: { "arcane_essence": 4, "mystic_dust": 3, "void_shard": 1 }, poison: { dps: 10, duration: 10 }, xp: 20, mp: 40 },

    // Aid Spells
    //
    // `duration` is in GAME minutes, and the clock runs one game minute per real
    // second (state/gameLoop.js) - so 600 is ten real minutes and 1800 is thirty.
    // The five rare blessings get the short window and the three godlike ones the
    // long, which is the only thing separating them: they cost void shards to
    // learn and buff five skills at 25 apiece rather than one at 10.
    //
    // Aid was the one spell type castSpell() had no branch for, so all eight of
    // these used to fall through to "but nothing happens" - see data/magic.js.
    "blessed hammer": { name: "Blessed Hammer", type: "aid", rarity: "rare", level: 8, learn: { "ley_crystals": 3, "arcane_shard": 3 }, buff: { smithing: 10 }, duration: 600, xp: 12, mp: 24 },
    "blessed pickaxe": { name: "Blessed Pickaxe", type: "aid", rarity: "rare", level: 8, learn: { "ley_crystals": 3, "arcane_shard": 3 }, buff: { mining: 10 }, duration: 600, xp: 12, mp: 24 },
    "blessed hands": { name: "Blessed Hands", type: "aid", rarity: "rare", level: 8, learn: { "ley_crystals": 3, "arcane_shard": 3 }, buff: { crafting: 10 }, duration: 600, xp: 12, mp: 24 },
    "blessed satchel": { name: "Blessed Satchel", type: "aid", rarity: "rare", level: 8, learn: { "ley_crystals": 3, "arcane_shard": 3 }, buff: { gathering: 10 }, duration: 600, xp: 12, mp: 24 },
    "blessed alchemy": { name: "Blessed Alchemy", type: "aid", rarity: "rare", level: 8, learn: { "ley_crystals": 3, "arcane_shard": 3 }, buff: { alchemy: 10 }, duration: 600, xp: 12, mp: 24 },
    "zions blessing": { name: "Zion's Blessing", type: "aid", rarity: "godlike", level: 40, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, buff: { smithing: 25, mining: 25, crafting: 25, gathering: 25, alchemy: 25 }, duration: 1800, xp: 20, mp: 40 },
    "kratchs blessing": { name: "K'ratch's Blessing", type: "aid", rarity: "godlike", level: 60, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, buff: { smithing: 25, mining: 25, crafting: 25, gathering: 25, alchemy: 25 }, duration: 1800, xp: 20, mp: 40 },
    "blessing of apocylta": { name: "Blessing of Apocylta", type: "aid", rarity: "godlike", level: 100, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, buff: { smithing: 25, mining: 25, crafting: 25, gathering: 25, alchemy: 25 }, duration: 1800, xp: 20, mp: 40 },

    // Teleport Spells
    "wilderness_teleport": { name: "Wilderness Teleport", type: "teleport", rarity: "common", level: 2, learn: { "ley_crystals": 2, "arcane_shard": 2 }, teleport: "wilderness", xp: 5, mp: 10 },
    "mine_teleport": { name: "Mine Teleport", type: "teleport", rarity: "uncommon", level: 3, learn: { "ley_crystals": 2, "arcane_shard": 2 }, teleport: "cave_mines", xp: 7, mp: 14 },
    // - Town Teleport - Rare/Legendary
    "town_teleport": { name: "Town Teleport", type: "teleport", rarity: "rare", level: 5, learn: { "ley_crystals": 3, "green_herbs": 3, "arcane_shard": 2 }, teleport: "town_square", xp: 10, mp: 20 },
    "apocylta_hub_teleport": { name: "Apocylta Hub Teleport", type: "teleport", rarity: "rare", level: 10, learn: { "arcane_essence": 2, "mystic_dust": 2 }, teleport: "regional_hub", xp: 20, mp: 40 },
    "zenthal_city_teleport": { name: "Zenthal City Teleport", type: "teleport", rarity: "rare", level: 15, learn: { "arcane_essence": 3, "mystic_dust": 3 }, teleport: "zenthal_city", xp: 30, mp: 60 },
    "azari_town_teleport": { name: "Azari Town Teleport", type: "teleport", rarity: "rare", level: 15, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, teleport: "azari_town", xp: 50, mp: 100 },
    "cordura_outpost_teleport": { name: "Cordura Outpost Teleport", type: "teleport", rarity: "rare", level: 20, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, teleport: "cordura_outpost", xp: 50, mp: 100 },
    "vetron_station_teleport": { name: "Vetron Station Teleport", type: "teleport", rarity: "rare", level: 20, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, teleport: "vetron_station", xp: 50, mp: 100 },
    "kooz_station_teleport": { name: "Kooz Station Teleport", type: "teleport", rarity: "rare", level: 20, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, teleport: "kooz_station", xp: 50, mp: 100 },
    // Castle Teleport - Godlike
    "apocyltia_castle_teleport": { name: "Apocylta Castle Teleport", type: "teleport", rarity: "godlike", level: 20, learn: { "arcane_essence": 5, "mystic_dust": 5, "void_shard": 2 }, teleport: "apocyltia_castle", xp: 50, mp: 100 },
};

// ----- Aid spells -----
//
// An aid spell's `buff` is authored in SPELL vocabulary, not in skill ids, and
// one of its keys isn't a skill at all: "gathering". Translated here, once, for
// the same reason item_backbone.js's withFishingDefaults() translates rod/bait
// into canonical item types at the catalog rather than leaving every consumer
// to work it out.
//
// Mining is deliberately NOT part of gathering: Blessed Pickaxe already covers
// it, and the godlike blessings buff `mining` and `gathering` as separate
// entries, so the catalog itself says they're different things.
export const AID_SKILL_ALIASES = {
    gathering: ["foraging", "woodcutting", "trapping", "fishing"],
};

export const DEFAULT_AID_DURATION_MINUTES = 600;

// An AID spell's buff resolved to { skillId: bonus }. An alias fans out to
// several skills at the same magnitude; anything else is already a skill id and
// passes straight through. Takes the max on a collision rather than summing, so
// Zion's Blessing (mining 25 + gathering 25) can't be read as stacking with
// itself if "gathering" ever gains mining.
//
// Non-aid spells resolve to nothing on purpose. Combat buffs use the same
// `buff` field for a completely different thing (Haste's { speed: 5 } is a
// combat stat, not a skill level), and state.aidBuffs is rebuilt from stored
// spell ids on load - so without this guard a hand-edited or corrupted save row
// naming "haste" would grant a timed +5 speed that nothing ever intended.
export function aidSkillBonuses(spell) {
    if (spell?.type !== "aid") return {};
    const bonuses = {};
    for (const [key, amount] of Object.entries(spell?.buff ?? {})) {
        for (const skillId of AID_SKILL_ALIASES[key] ?? [key]) {
            bonuses[skillId] = Math.max(bonuses[skillId] ?? 0, amount);
        }
    }
    return bonuses;
}

export function aidDurationMinutes(spell) {
    return spell?.duration ?? DEFAULT_AID_DURATION_MINUTES;
}

// Magic Helpers
export function getSpell(spellId) {
    return SPELLS[spellId] || null;
}

export const getSpellByType = (type) => Object.keys(SPELLS).filter(key => SPELLS[key].type === type).map(key => ({ key, ...SPELLS[key] }));
export const getSpellByRarity = (rarity) => Object.keys(SPELLS).filter(key => SPELLS[key].rarity === rarity).map(key => ({ key, ...SPELLS[key] }));
export const getSpellByLevel = (level) => Object.keys(SPELLS).filter(key => SPELLS[key].level <= level).map(key => ({ key, ...SPELLS[key] }));


export function listSpells() {
    return Object.keys(SPELLS).map(key => ({ key, ...SPELLS[key] }));
}

export function listSpellsByType(type) {
    return Object.keys(SPELLS)
        .filter(key => SPELLS[key].type === type)
        .map(key => ({ key, ...SPELLS[key] }));
}

export function listSpellsByRarity(rarity) {
    return Object.keys(SPELLS)
        .filter(key => SPELLS[key].rarity === rarity)
        .map(key => ({ key, ...SPELLS[key] }));
}

export function listSpellsByLevel(level) {
    return Object.keys(SPELLS)
        .filter(key => SPELLS[key].level <= level)
        .map(key => ({ key, ...SPELLS[key] }));
}

export function getSpellLearnCost(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.learn) return null;
    return spell.learn;
}

export function getSpellTeleportLocation(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.teleport) return null;
    return spell.teleport;
}

export function getSpellBuff(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.buff) return null;
    return spell.buff;
}

export function getSpellDebuff(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.debuff) return null;
    return spell.debuff;
}

export function getSpellPoison(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.poison) return null;
    return spell.poison;
}

export function getSpellHeal(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.heal) return null;
    return spell.heal;
}

export function getSpellDamage(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.damage) return null;
    return spell.damage;
}

export function getSpellXP(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.xp) return null;
    return spell.xp;
}

export function getSpellMP(spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.mp) return null;
    return spell.mp;
}

export function checkSpellLearnCost(playerInventory, spellId) {
    const spell = getSpell(spellId);
    if (!spell || !spell.learn) return false;
    const learnCost = spell.learn;
    for (const itemId in learnCost) {
        const requiredQty = learnCost[itemId];
        const playerQty = playerInventory[itemId] || 0;
        if (playerQty < requiredQty) {
            return false; // Not enough of this item
        }
    }
    return true; // Player has enough of all required items
}