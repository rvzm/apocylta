// apocylta enemies
export const ENEMY_TYPES = ["goblin", "dwarf", "human", "acolyte", "orc", "raider"];
// No "group" here: a GROUP_ENEMIES entry isn't an enemy, it's a header naming
// which enemies spawned together (see below), so it has no type or subtype of
// its own to classify.
export const ENEMY_SUBTYPES = ["warrior", "mage", "ranger", "attacker", "boss"];
export const BASIC_ENEMIES = {
    // Goblins
    "weak_goblin":      { name: "Weak Goblin", type: "goblin", subtype: "warrior", hp: 10, dps: 3, xp: 10 },
    "mage_goblin":      { name: "Goblin Mage", type: "goblin", subtype: "mage", hp: 20, spells: ["magic_missle", "weaken"], xp: 12 },
    "bow_goblin":       { name: "Goblin Ranger", type: "goblin", subtype: "ranger", hp: 20, dps: 8, xp: 15 },
    "rage_goblin":      { name: "Rage Goblin", type: "goblin", subtype: "attacker", hp: 18, dps: 10, xp: 20 },
    "sneaky_goblin":    { name: "Sneaky Goblin", type: "goblin", subtype: "ranger", hp: 15, dps: 8, xp: 15 },
    "berserker_goblin": { name: "Berserker Goblin", type: "goblin", subtype: "attacker", hp: 20, dps: 12, xp: 25 },
    "assassin_goblin":  { name: "Assassin Goblin", type: "goblin", subtype: "ranger", hp: 15, dps: 10, xp: 20 },
    "necromancer_goblin": { name: "Necromancer Goblin", type: "goblin", subtype: "mage", hp: 18, spells: ["magic_missle", "weaken"], xp: 25 },
    "cultist_goblin":  { name: "Cultist Goblin", type: "goblin", subtype: "mage", hp: 15, spells: ["magic_missle", "weaken"], xp: 20 },

    // Dwarves
    "small_dwarf":      { name: "Small Dwarf", type: "dwarf", subtype: "attacker", hp: 25, dps: 10, xp: 20 },
    "mage_dwarf":       { name: "Dwarf Mage", type: "dwarf", subtype: "mage", hp: 30, spells: ["magic_missle", "weaken"], xp: 25 },
    "axe_dwarf":       { name: "Axe Dwarf", type: "dwarf", subtype: "warrior", hp: 35, dps: 12, xp: 30 },
    "bow_dwarf":       { name: "Bow Dwarf", type: "dwarf", subtype: "ranger", hp: 30, dps: 10, xp: 25 },
    "berserker_dwarf": { name: "Berserker Dwarf", type: "dwarf", subtype: "attacker", hp: 40, dps: 15, xp: 35 },
    "assassin_dwarf":  { name: "Assassin Dwarf", type: "dwarf", subtype: "ranger", hp: 30, dps: 12, xp: 30 },
    "necromancer_dwarf": { name: "Necromancer Dwarf", type: "dwarf", subtype: "mage", hp: 35, spells: ["magic_missle", "weaken"], xp: 40 },
    "cultist_dwarf":  { name: "Cultist Dwarf", type: "dwarf", subtype: "mage", hp: 30, spells: ["magic_missle", "weaken"], xp: 35 },

    // Humans
    "weak_human":       { name: "Weak Human", type: "human", subtype: "warrior", hp: 20, dps: 5, xp: 15 },
    "mage_human":       { name: "Human Mage", type: "human", subtype: "mage", hp: 25, spells: ["magic_missle", "weaken"], xp: 20 },
    "bow_human":        { name: "Human Ranger", type: "human", subtype: "ranger", hp: 20, dps: 8, xp: 15 },
    "axe_human":        { name: "Human Attacker", type: "human", subtype: "attacker", hp: 25, dps: 10, xp: 20 },
    "psycho":           { name: "Psycho", type: "human", subtype: "warrior", hp: 25, dps: 8, xp: 15 },
    "madman":          { name: "Madman", type: "human", subtype: "attacker", hp: 30, dps: 12, xp: 20 },
    "sneaky":          { name: "Sneaky", type: "human", subtype: "ranger", hp: 20, dps: 10, xp: 15 },
    "wizard":          { name: "Wizard", type: "human", subtype: "mage", hp: 20, spells: ["magic_missle", "weaken"], xp: 20 },
    "rogue":          { name: "Rogue", type: "human", subtype: "ranger", hp: 20, dps: 10, xp: 15 },
    "berserker":          { name: "Berserker", type: "human", subtype: "attacker", hp: 30, dps: 15, xp: 25 },
    "assassin":          { name: "Assassin", type: "human", subtype: "ranger", hp: 20, dps: 12, xp: 20 },
    "necromancer":          { name: "Necromancer", type: "human", subtype: "mage", hp: 25, spells: ["magic_missle", "weaken"], xp: 25 },
    "cultist":          { name: "Cultist", type: "human", subtype: "mage", hp: 20, spells: ["magic_missle", "weaken"], xp: 20 },
    "fanatic":          { name: "Fanatic", type: "human", subtype: "attacker", hp: 30, dps: 15, xp: 25 },

    // Acolytes
    "helpless_acolyte":   { name: "Helpless Acolyte", type: "acolyte", subtype: "mage", hp: 10, dps: 5, xp: 10 },
    "novice_acolyte":     { name: "Novice Acolyte", type: "acolyte", subtype: "mage", hp: 15, dps: 7, xp: 12 },
    "apprentice_acolyte": { name: "Apprentice Acolyte", type: "acolyte", subtype: "mage", hp: 20, dps: 10, spells: ["magic_missle"], xp: 15 },
    "weak_acolyte":     { name: "Weak Acolyte", type: "acolyte", subtype: "mage", hp: 20, spells: ["magic_missle"], xp: 15 },
    "strong_acolyte":   { name: "Strong Acolyte", type: "acolyte", subtype: "mage", hp: 30, spells: ["magic_missle", "fireball"], xp: 25 },
    "wise_acolyte":     { name: "Wise Acolyte", type: "acolyte", subtype: "mage", hp: 40, spells: ["magic_missle", "fireball", "weaken"], xp: 35 },
    "archmage":        { name: "Archmage", type: "acolyte", subtype: "mage", hp: 50, spells: ["magic_missle", "fireball", "weaken", "cure"], xp: 50 },

    // Orcs
    "small_orc":        { name: "Small Orc", type: "orc", subtype: "warrior", hp: 30, dps: 12, xp: 25 },
    "big_orc":          { name: "Big Orc", type: "orc", subtype: "warrior", hp: 50, dps: 20, xp: 40 },
    "sneaky_orc":      { name: "Sneaky Orc", type: "orc", subtype: "ranger", hp: 25, dps: 15, xp: 30 },
    "angry_orc":      { name: "Angry Orc", type: "orc", subtype: "attacker", hp: 35, dps: 20, xp: 35 },
    "berserker_orc":   { name: "Berserker Orc", type: "orc", subtype: "attacker", hp: 40, dps: 25, xp: 35 },
    "shaman_orc":      { name: "Shaman Orc", type: "orc", subtype: "mage", hp: 30, spells: ["magic_missle", "weaken"], xp: 30 },
    "orc_warrior":      { name: "Orc Warrior", type: "orc", subtype: "warrior", hp: 60, dps: 30, xp: 50 },
    "orc_chieftain":    { name: "Orc Chieftain", type: "orc", subtype: "boss", hp: 100, dps: 40, spells: ["magic_missle", "weaken"], xp: 100 },
    "orc_bowman":       { name: "Orc Bowman", type: "orc", subtype: "ranger", hp: 40, dps: 15, xp: 30 },

    // Raiders
    "dumb_raider":       { name: "Dumb Raider", type: "raider", subtype: "warrior", hp: 30, dps: 15, xp: 40 },
    "smart_raider":      { name: "Smart Raider", type: "raider", subtype: "mage", hp: 25, spells: ["magic_missle", "weaken"], xp: 35 },
    "sneaky_raider":     { name: "Sneaky Raider", type: "raider", subtype: "ranger", hp: 20, dps: 10, xp: 30 },
    "berserker_raider": { name: "Berserker Raider", type: "raider", subtype: "attacker", hp: 35, dps: 20, xp: 45 },
    "angry_raider":     { name: "Angry Raider", type: "raider", subtype: "attacker", hp: 40, dps: 25, xp: 50 },
    "psycho_raider":     { name: "Psycho Raider", type: "raider", subtype: "attacker", hp: 45, dps: 30, xp: 55 },
    "crazy_raider":     { name: "Crazy Raider", type: "raider", subtype: "attacker", hp: 50, dps: 35, xp: 60 },
    "mad_raider":     { name: "Mad Raider", type: "raider", subtype: "attacker", hp: 55, dps: 40, xp: 65 },
    "insane_raider":     { name: "Insane Raider", type: "raider", subtype: "attacker", hp: 60, dps: 45, xp: 70 },
    "deranged_raider":     { name: "Deranged Raider", type: "raider", subtype: "attacker", hp: 65, dps: 50, xp: 75 },

};

// A group is NOT an enemy - it's a header saying "a pack spawned, and here's
// who's in it". It never fights, never takes damage, and is never recorded as
// a kill; only its members are. So a group declares exactly three things:
//
//   members - who spawned. Either a plain list, or a { id: count } map when
//             the same enemy shows up more than once. data/combat.js queues
//             them in this order and you fight them one at a time.
//   name    - shown above the current enemy on the combat screen.
//   xp      - a completion BONUS, granted on top of each member's own xp once
//             the whole pack is cleared. Sized at roughly 30% of the members'
//             combined xp, so clearing a pack beats picking off singles
//             without overshadowing the kills themselves.
//
// Deliberately no hp/dps/type/subtype - those belong to the members. Note also
// that no pack may contain orc_chieftain: it's a `subtype: "boss"` entry in
// BASIC_ENEMIES, and data/combat.js's combatEnd check would hand out the
// boss_down achievement for an ordinary fight.
export const GROUP_ENEMIES = {
    // Basic Groups - two members at the weak tier, three above it
    "weak_goblin_group": { members: ["weak_goblin", "sneaky_goblin"], name: "Weak Goblin Group", xp: 8 },
    "weak_dwarf_group": { members: ["small_dwarf", "bow_dwarf"], name: "Weak Dwarf Group", xp: 14 },
    "weak_human_group": { members: ["weak_human", "rogue"], name: "Weak Human Group", xp: 9 },
    "weak_acolyte_group": { members: ["helpless_acolyte", "novice_acolyte"], name: "Weak Acolyte Group", xp: 7 },
    "weak_orc_group": { members: ["small_orc", "sneaky_orc"], name: "Weak Orc Group", xp: 17 },
    "weak_raider_group": { members: ["sneaky_raider", "dumb_raider"], name: "Weak Raider Group", xp: 21 },
    "goblin_group": { members: ["weak_goblin", "bow_goblin", "sneaky_goblin"], name: "Goblin Group", xp: 12 },
    "dwarf_group": { members: ["small_dwarf", "axe_dwarf", "mage_dwarf"], name: "Dwarf Group", xp: 23 },
    "human_group": { members: ["axe_human", "psycho", "mage_human"], name: "Human Group", xp: 17 },
    "acolyte_group": { members: ["novice_acolyte", "apprentice_acolyte", "weak_acolyte"], name: "Acolyte Group", xp: 13 },
    "orc_group": { members: ["small_orc", "big_orc", "shaman_orc"], name: "Orc Group", xp: 29 },
    "raider_group": { members: ["dumb_raider", "berserker_raider", "smart_raider"], name: "Raider Group", xp: 36 },
    // The strong tier is strong by composition - more attackers and casters -
    // rather than raw hp, since per-faction hp ceilings are low (goblins cap at 20).
    "strong_goblin_group": { members: ["berserker_goblin", "rage_goblin", "necromancer_goblin"], name: "Strong Goblin Group", xp: 21 },
    "strong_dwarf_group": { members: ["berserker_dwarf", "assassin_dwarf", "necromancer_dwarf"], name: "Strong Dwarf Group", xp: 32 },
    "strong_human_group": { members: ["berserker", "fanatic", "necromancer"], name: "Strong Human Group", xp: 23 },
    "strong_acolyte_group": { members: ["strong_acolyte", "wise_acolyte", "archmage"], name: "Strong Acolyte Group", xp: 33 },
    "strong_orc_group": { members: ["orc_warrior", "berserker_orc", "angry_orc"], name: "Strong Orc Group", xp: 36 },
    "strong_raider_group": { members: ["psycho_raider", "crazy_raider", "mad_raider"], name: "Strong Raider Group", xp: 54 },
    // Complex Groups
    "acolyte_party": { members: ["helpless_acolyte", "novice_acolyte", "apprentice_acolyte"], name: "Acolyte Party", xp: 11 },
    "orc_warband": { members: ["small_orc", "big_orc", "sneaky_orc"], name: "Orc Warband", xp: 29 },
    "raider_squad": { members: ["dumb_raider", "smart_raider", "sneaky_raider"], name: "Raider Squad", xp: 32 },
    "mixed_group": { members: ["weak_goblin", "small_dwarf", "weak_human"], name: "Mixed Group", xp: 14 },
    "acolyte_orc_group": { members: ["helpless_acolyte", "small_orc", "sneaky_orc"], name: "Acolyte Orc Group", xp: 20 },
    "raider_goblin_group": { members: ["dumb_raider", "weak_goblin", "sneaky_goblin"], name: "Raider Goblin Group", xp: 20 },
    // "sneaky_dwarf"/"sneaky_human" were never defined in BASIC_ENEMIES - repointed
    // at the real ids filling those roles (the dwarf ranger, and the human ranger
    // literally named "sneaky") when combat started actually reading `members`.
    "human_dwarf_group": { members: ["weak_human", "small_dwarf", "assassin_dwarf"], name: "Human Dwarf Group", xp: 20 },
    "acolyte_human_group": { members: ["helpless_acolyte", "weak_human", "sneaky"], name: "Acolyte Human Group", xp: 12 },
    // Larger groups for higher level areas
    "goblin_raider_group": { members: ["weak_goblin", "sneaky_goblin", "dumb_raider", "smart_raider"], name: "Goblin Raider Group", xp: 30 },
    "orc_acolyte_group": { members: ["small_orc", "shaman_orc", "helpless_acolyte"], name: "Orc Acolyte Group", xp: 20 },
    "human_dwarf_acolyte_group": { members: ["weak_human", "small_dwarf", "helpless_acolyte"], name: "Human Dwarf Acolyte Group", xp: 14 },
    "orc_raider_group": { members: ["small_orc", "dumb_raider", "smart_raider"], name: "Orc Raider Group", xp: 30 },
    // Larger packs for the far regions - these use the { id: count } form so the
    // same enemy can show up more than once.
    "large_mixed_group": { members: { "weak_goblin": 2, "small_dwarf": 2, "weak_human": 2 }, name: "Large Mixed Group", xp: 27 },
    "large_orc_group": { members: { "small_orc": 2, "shaman_orc": 1, "berserker_orc": 2, "angry_orc": 1 }, name: "Large Orc Group", xp: 56 },
    "epic_mixed_group": { members: { "weak_goblin": 2, "small_dwarf": 2, "weak_human": 2, "helpless_acolyte": 1, "small_orc": 1, "dumb_raider": 1, "sneaky_goblin": 1, "shaman_orc": 1, "smart_raider": 1 }, name: "Epic Mixed Group", xp: 74 },
    "ultimate_mixed_group": { members: { "weak_goblin": 2, "small_dwarf": 2, "weak_human": 2, "helpless_acolyte": 1, "small_orc": 1, "dumb_raider": 1, "sneaky_goblin": 1, "shaman_orc": 1, "smart_raider": 1, "berserker_orc": 1, "angry_raider": 1 }, name: "Ultimate Mixed Group", xp: 99 },
    "legendary_mixed_group": { members: { "weak_goblin": 2, "small_dwarf": 2, "weak_human": 2, "helpless_acolyte": 1, "small_orc": 1, "dumb_raider": 1, "sneaky_goblin": 1, "shaman_orc": 1, "smart_raider": 1, "berserker_orc": 1, "angry_raider": 1, "mad_raider": 1 }, name: "Legendary Mixed Group", xp: 119 },
};

// Keys are lowercase snake_case, same as BASIC_ENEMIES/GROUP_ENEMIES - the
// boss lists in data/locations.js and the defeatEnemy objectives in
// quest_backbone.js both look ids up here directly, so a capitalised key
// would silently never resolve.
export const NAMED_ENEMIES = {
    "hubert":         { name: "Hubert", type: "human", subtype: "boss", hp: 100, dps: 25, spells: ["magic_missle", "fireball", "weaken"], xp: 145, desc: "Hubert, The Vile Kid" },
    "gilbert":          { name: "Gilbert", type: "human", subtype: "boss", hp: 150, dps: 27, spells: ["magic_missle", "fireball", "weaken"], xp: 155, desc: "Gilbert, Huberts older brother." },
    "hilbert":          { name: "Hilbert", type: "human", subtype: "boss", hp: 200, dps: 30, spells: ["magic_missle", "fireball", "weaken"], xp: 200, desc: "Hilbert, The Mad King" },
    "fatom":            { name: "Fatom", type: "acolyte", subtype: "boss", hp: 250, dps: 35, spells: ["magic_missle", "fireball", "weaken"], xp: 235, desc: "The Dead Queen" },
    "kovetch":          { name: "Kovetch", type: "orc", subtype: "boss", hp: 300, dps: 40, spells: ["magic_missle", "fireball", "weaken"], xp: 300, desc: "Kovetch, The Orc Chieftain" },
    "goblin_king":     { name: "Goblin King", type: "goblin", subtype: "boss", hp: 200, dps: 30, spells: ["magic_missle", "fireball", "weaken"], xp: 250, desc: "The Goblin King" },
    "vortigern":         { name: "Vortigern", type: "human", subtype: "boss", hp: 400, dps: 50, spells: ["magic_missle", "fireball", "weaken"], xp: 400, desc: "Vortigern, The Mad King" },
    "zarathustra":      { name: "Zarathustra", type: "acolyte", subtype: "boss", hp: 500, dps: 60, spells: ["magic_missle", "fireball", "weaken"], xp: 500, desc: "Zarathustra, The Dark Sorcerer" },
    "morgoth":          { name: "Morgoth", type: "orc", subtype: "boss", hp: 600, dps: 70, spells: ["magic_missle", "fireball", "weaken"], xp: 600, desc: "Morgoth, The Orc Warlord" },
    "azrael":          { name: "Azrael", type: "goblin", subtype: "boss", hp: 700, dps: 80, spells: ["magic_missle", "fireball", "weaken"], xp: 700, desc: "Azrael, The Goblin Overlord" },
    "lilith":          { name: "Lilith", type: "human", subtype: "boss", hp: 800, dps: 90, spells: ["magic_missle", "fireball", "weaken"], xp: 800, desc: "Lilith, The Dark Queen" },
    "beelzebub":          { name: "Beelzebub", type: "acolyte", subtype: "boss", hp: 900, dps: 100, spells: ["magic_missle", "fireball", "weaken"], xp: 900, desc: "Beelzebub, The Lord of the Flies" },
    "mephistopheles":          { name: "Mephistopheles", type: "orc", subtype: "boss", hp: 1000, dps: 110, spells: ["magic_missle", "fireball", "weaken"], xp: 1000, desc: "Mephistopheles, The Demon Prince" },
    "lucifer":          { name: "Lucifer", type: "goblin", subtype: "boss", hp: 1100, dps: 120, spells: ["magic_missle", "fireball", "weaken"], xp: 1100, desc: "Lucifer, The Fallen Angel" },
    "solas":          { name: "Solas", type: "human", subtype: "boss", hp: 1200, dps: 130, spells: ["magic_missle", "fireball", "weaken"], xp: 1200, desc: "Solas, The Dark Lord" },
};

// One flat lookup across all three catalogs, mirroring item_backbone.js's
// ALL_ITEMS. Location spawn pools, boss lists and quest defeatEnemy objectives
// all reference enemies by bare id without caring which table they live in.
export const ALL_ENEMIES = { ...BASIC_ENEMIES, ...GROUP_ENEMIES, ...NAMED_ENEMIES };

export function getEnemy(id) {
  return ALL_ENEMIES[id];
}

// A group is a header, not a combatant - see the GROUP_ENEMIES comment above.
export function isGroup(id) {
  return !!ALL_ENEMIES[id]?.members;
}

// Returns the ids an encounter should queue up for the given enemy id: a lone
// enemy is just itself, while a group resolves to its members (repeated by
// count for the { id: count } form).
//
// A group with no usable members returns [] rather than falling back to [id].
// That matters: a group carries no hp, so queueing one as a fighter would give
// it `Math.max(1, NaN)` hp - an enemy that can never be reduced to 0 and a
// fight that can never end. An empty queue instead makes buildEncounter()
// return null and the spawn simply not happen.
export function expandEnemy(id) {
  const enemy = ALL_ENEMIES[id];
  if (!enemy) return [];
  if (!enemy.members) return [id];

  const pairs = Array.isArray(enemy.members)
    ? enemy.members.map((memberId) => [memberId, 1])
    : Object.entries(enemy.members);

  const queue = [];
  for (const [memberId, count] of pairs) {
    if (!ALL_ENEMIES[memberId]) continue;
    for (let i = 0; i < count; i++) queue.push(memberId);
  }
  return queue;
}