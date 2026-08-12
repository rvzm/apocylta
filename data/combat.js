// apocylta world data - combat
//
// Turn-based: nothing resolves on the game-loop tick. One call to
// resolveRound() is one full exchange (the player's action, then the current
// enemy's answer), driven entirely by keypresses on ui/screens/combat.js.
//
// Every function that rolls takes an `rng` last parameter defaulting to
// Math.random, so tests can inject a deterministic sequence.

import { getEnemy, expandEnemy, isGroup } from "../enemy_backbone.js";
import { SPELLS } from "../magic_backbone.js";
import { ALL_ITEMS } from "../item_backbone.js";
import { DIFFICULTY_LEVELS, STARTER_ITEMS, groupSpawnFor } from "../player_backbone.js";
import { SKILL_BLOCKS } from "../skill_backbone.js";
import { combat_config, player_config } from "../config.js";
import { rollLootByType } from "./actions.js";
import { recordEnemyDefeated } from "./quests.js";
import { evaluateAchievements } from "./achievements.js";
import { castSpell } from "./magic.js";
import { useItem, attemptRevive } from "./items.js";
import {
  addItem, removeItem, grantSkillXp, grantRewardXp, getCurrentLocation, moveTo, effectiveSkillLevel,
  addCurrency, walletTotal,
} from "../state/gameState.js";
import { purseFromBase, formatBase } from "../currency_backbone.js";
import { logger } from "../logger.js";

const UNARMED_DAMAGE = 2;
// Weapon damage spans 3 (wooden dagger) to 70 (syllic), so a full point of
// damage per fighting level keeps the skill - and the race/class choices that
// seed it at level 5 - meaningful without ever eclipsing the gear.
const FIGHTING_DAMAGE_PER_LEVEL = 1;

// Armor `defense` values stack past 300 across six slots, so flat subtraction
// would zero out every incoming hit. Mitigation is a percentage with
// diminishing returns instead: total/(total+K), hard-capped so no build ever
// becomes untouchable.
const ARMOR_SOFTENING = 100;
const MAX_MITIGATION = 0.8;

// Chance bonuses are per skill level, on top of the combat_config baselines,
// and capped so late-game skills don't trivialise the loop.
const CHANCE_PER_LEVEL = 0.005;
const MAX_CRIT_CHANCE = 0.5;
const MAX_DODGE_CHANCE = 0.5;
const MAX_BLOCK_CHANCE = 0.6;

const FIGHTING_XP_PER_SWING = 4;
const DEFENSE_XP_PER_HIT = 3;
const SPEED_XP_PER_DODGE = 3;
// Strength trains by hauling (state/gameState.js's addItem) and by the two
// fights that actually take something out of you: clearing a whole pack, and
// putting down a boss. A routine kill pays nothing - it's fighting xp that
// tracks how much killing you do.
const STRENGTH_XP_PER_BOSS = 25;
const STRENGTH_XP_PER_GROUP_XP = 0.1;
const FLEE_BASE_CHANCE = 0.4;

const GOLD_PER_XP = 0.6;
const LOOT_TYPES = ["scrap", "crafting", "treasure"];

const PERMADEATH_DIFFICULTIES = new Set(["survival", "nightmare", "demon_lord"]);

const MAX_LOG_LINES = 40;

function modifiersFor(state) {
  return DIFFICULTY_LEVELS[state.difficulty]?.modifiers ?? {};
}

// ---------------------------------------------------------------- enemy stats

// 12 of the mage-subtype enemies carry no `dps` at all - only `spells`. Rather
// than backfill fake dps into the catalog, their damage is read off their best
// attack spell, which also gives the log its "casts Fireball" flavour.
export function enemyStrike(enemyDef) {
  if (typeof enemyDef?.dps === "number") return { power: enemyDef.dps, spell: null };
  const best = (enemyDef?.spells ?? [])
    .map((id) => SPELLS[id])
    .filter((spell) => spell?.damage)
    .sort((a, b) => b.damage - a.damage)[0];
  return best ? { power: best.damage, spell: best.name } : { power: 1, spell: null };
}

// ---------------------------------------------------------------- player stats

export function equippedWeapon(state) {
  // weapon and slingshot are separate equipment slots (item_backbone.js's
  // equipSlotOf), so a slingshot-only build has equipment.weapon === null.
  const id = state.equipment.weapon ?? state.equipment.slingshot;
  return id ? ALL_ITEMS[id] ?? null : null;
}

export function playerAttackPower(state) {
  // finalizeCharacter() never auto-equips the starter wooden_dagger, so a
  // brand-new character really can walk into a fight bare-handed.
  const base = equippedWeapon(state)?.damage ?? UNARMED_DAMAGE;
  const buff = state.currentCombat?.buffs?.attack ?? 0;
  return base + effectiveSkillLevel(state, "fighting") * FIGHTING_DAMAGE_PER_LEVEL + buff;
}

// Sums `defense` across every equipped item rather than a fixed slot list, so
// slots added later (cloak/ring/necklace exist in ARMOR_SLOTS but not yet in
// state.equipment) start counting the moment they're wired up.
export function playerDefensePower(state) {
  let total = effectiveSkillLevel(state, "defense") + (state.currentCombat?.buffs?.defense ?? 0);
  for (const itemId of Object.values(state.equipment)) {
    if (itemId) total += ALL_ITEMS[itemId]?.defense ?? 0;
  }
  return total;
}

export function damageReduction(state) {
  const total = playerDefensePower(state);
  return Math.min(MAX_MITIGATION, total / (total + ARMOR_SOFTENING));
}

export function critChance(state) {
  return Math.min(MAX_CRIT_CHANCE, (combat_config.criticalHitChance ?? 0.1) + effectiveSkillLevel(state, "luck") * CHANCE_PER_LEVEL);
}

// The speed a fight should use: trained + enhancements + whatever Haste is
// contributing. buffs.attack and buffs.defense were already read this way by
// playerAttackPower/playerDefensePower above; buffs.speed was written by
// castSpell() and read by nothing, so Haste was a mana cost with no effect.
function combatSpeed(state) {
  return effectiveSkillLevel(state, "speed") + (state.currentCombat?.buffs?.speed ?? 0);
}

export function dodgeChance(state) {
  return Math.min(MAX_DODGE_CHANCE, (combat_config.dodgeChance ?? 0.05) + combatSpeed(state) * CHANCE_PER_LEVEL);
}

export function blockChance(state) {
  return Math.min(MAX_BLOCK_CHANCE, (combat_config.blockChance ?? 0.1) + effectiveSkillLevel(state, "defense") * CHANCE_PER_LEVEL);
}

// ---------------------------------------------------------------- encounters

export function currentEnemy(combat) {
  return combat?.enemies?.[combat.index] ?? null;
}

// A GROUP_ENEMIES entry either lists explicit `members` (fought one after
// another) or is a single stat-blob standing in for the whole pack -
// expandEnemy() resolves both into the ids this encounter should queue up.
export function buildEncounter(state, enemyId, { boss = false } = {}) {
  const ids = expandEnemy(enemyId);
  if (!ids.length) return null;

  const mods = modifiersFor(state);
  const hpScale = (mods.enemyHp ?? 1) * (combat_config.enemyDifficulty ?? 1);

  return {
    sourceId: enemyId,
    boss,
    enemies: ids.map((id) => {
      const def = getEnemy(id);
      const hp = Math.max(1, Math.round(def.hp * hpScale));
      return { id, name: def.name, hp, hpMax: hp };
    }),
    index: 0,
    round: 0,
    log: [],
    buffs: {},
    defeated: [],
    outcome: null, // null | "victory" | "fled" | "defeat"
    hpAtStart: state.hp,
    // Trained level, not effectiveSkillLevel: this is the baseline for the
    // "gained this session" delta, and an enhancement isn't progress.
    fightingLevelAtStart: state.skills.fighting.level,
    fightingXpAtStart: state.skills.fighting.xp,
  };
}

// Groups and lone enemies sit side by side in a location's `enemies` pool, so a
// uniform pick made a pack exactly as likely as a single goblin at every
// difficulty. DIFFICULTY_LEVELS' modifiers.groupSpawn weights the group entries
// instead: 1 is the old uniform behaviour, and 0 keeps packs out entirely.
export function spawnEncounter(state, { boss = false } = {}, rng = Math.random) {
  const location = getCurrentLocation(state);
  const pool = boss ? (Array.isArray(location?.boss) ? location.boss : []) : location?.enemies ?? [];
  const valid = pool.filter((id) => getEnemy(id));
  if (!valid.length) return null;

  const groupWeight = Math.max(0, groupSpawnFor(state.difficulty));
  const weights = valid.map((id) => (isGroup(id) ? groupWeight : 1));
  const total = weights.reduce((sum, w) => sum + w, 0);
  // Every entry weighing 0 (a groupSpawn of 0 in a pool of nothing but packs)
  // would leave nothing to pick - no encounter is the honest answer there.
  if (total <= 0) return null;

  let roll = rng() * total;
  let picked = valid[valid.length - 1];
  for (let i = 0; i < valid.length; i++) {
    roll -= weights[i];
    if (roll < 0) {
      picked = valid[i];
      break;
    }
  }
  return buildEncounter(state, picked, { boss });
}

// Bosses are gated on a rule skill_backbone.js already declares
// (SKILL_BLOCKS.fighting.boss.all.level) but nothing previously read.
export const BOSS_LEVEL_REQUIREMENT = SKILL_BLOCKS.fighting?.boss?.all?.level ?? 20;

export function canChallengeBoss(state) {
  return effectiveSkillLevel(state, "fighting") >= BOSS_LEVEL_REQUIREMENT;
}

// Combat always interrupts whatever else was running - you can't keep
// gathering while something is hitting you.
export function beginCombat(state, encounter) {
  state.currentAction = null;
  state.currentCombat = encounter;
  logger.info("combat", `Encounter started: ${encounter.enemies.map((e) => e.id).join(", ")}.`);
  return encounter;
}

export function endCombat(state) {
  state.currentCombat = null;
}

function pushLog(combat, lines) {
  combat.log.push(...lines);
  if (combat.log.length > MAX_LOG_LINES) combat.log.splice(0, combat.log.length - MAX_LOG_LINES);
  return lines;
}

// ---------------------------------------------------------------- round parts

function applyPoisonTick(combat, enemy) {
  if (!enemy?.poison || enemy.hp <= 0) return [];
  const dealt = Math.max(1, Math.round(enemy.poison.dps));
  enemy.hp = Math.max(0, enemy.hp - dealt);
  enemy.poison.remaining -= 1;
  const lines = [`${enemy.name} takes ${dealt} poison damage.`];
  if (enemy.poison.remaining <= 0) delete enemy.poison;
  return lines;
}

function playerAttack(state, rng) {
  const enemy = currentEnemy(state.currentCombat);
  let damage = playerAttackPower(state);

  const crit = rng() < critChance(state);
  if (crit) damage *= combat_config.criticalHitMultiplier ?? 2;

  // Enemies carry no defense stat in enemy_backbone.js, so player damage lands raw.
  const dealt = Math.max(1, Math.round(damage));
  enemy.hp = Math.max(0, enemy.hp - dealt);
  grantSkillXp(state, "fighting", FIGHTING_XP_PER_SWING);

  const weapon = equippedWeapon(state);
  const withWhat = weapon ? ` with your ${weapon.name}` : " bare-handed";
  return [`You strike ${enemy.name}${withWhat} for ${dealt}${crit ? " (critical!)" : ""}.`];
}

// Casting routes through data/magic.js so mp spend, magic xp and the
// known-spell check stay in one place; combat only supplies the target.
function playerCast(state, spellId) {
  const result = castSpell(state, spellId, currentEnemy(state.currentCombat));
  return [result ?? "You don't have the mana for that."];
}

// Combat's door onto the shared consumable path in data/items.js, kept to the
// string-or-null shape resolveRound() expects (a refusal must not cost the
// player their turn). Potions only: ui/screens/combatSelect.js offers nothing
// else mid-fight, so food and aid stay a backpack affair.
export function usePotion(state, itemId) {
  if (ALL_ITEMS[itemId]?.type !== "potion") return null;
  const { used, message } = useItem(state, itemId, {
    target: currentEnemy(state.currentCombat),
    combat: state.currentCombat,
  });
  return used ? message : null;
}

export function attemptFlee(state, rng = Math.random) {
  const chance = Math.min(0.9, FLEE_BASE_CHANCE + combatSpeed(state) * CHANCE_PER_LEVEL * 2);
  const escaped = rng() < chance;
  if (escaped) grantSkillXp(state, "speed", SPEED_XP_PER_DODGE);
  return escaped;
}

function enemyAttack(state, enemy, rng) {
  const def = getEnemy(enemy.id);
  const { power, spell } = enemyStrike(def);
  const mods = modifiersFor(state);
  const debuff = enemy.attackDebuff ?? 0;

  let damage = Math.max(1, power + debuff) * (mods.enemyDps ?? 1) * (combat_config.enemyDifficulty ?? 1);

  if (rng() < dodgeChance(state)) {
    grantSkillXp(state, "speed", SPEED_XP_PER_DODGE);
    return [`You dodge ${enemy.name}'s attack.`];
  }

  const blocked = rng() < blockChance(state);
  if (blocked) damage *= 1 - (combat_config.blockReduction ?? 0.5);
  damage *= 1 - damageReduction(state);

  let dealt = Math.max(1, Math.round(damage));
  if (state.godmode) dealt = 0;

  state.hp = Math.max(0, state.hp - dealt);
  grantSkillXp(state, "defense", DEFENSE_XP_PER_HIT);

  const verb = spell ? `casts ${spell} at you` : "hits you";
  return [`${enemy.name} ${verb} for ${dealt}${blocked ? " (blocked)" : ""}.`];
}

// ---------------------------------------------------------------- resolution

function rollDrops(state, enemyDef, rng) {
  const roll = rng();
  const count = roll < 0.35 ? 0 : roll < 0.8 ? 1 : 2;
  const drops = [];
  for (let i = 0; i < count; i++) {
    const type = LOOT_TYPES[Math.floor(rng() * LOOT_TYPES.length)];
    const loot = rollLootByType(type, undefined, undefined, rng);
    // addItem() returns how much actually fit - don't claim a drop the player
    // never received, and report the amount they really got.
    if (!loot) continue;
    const got = addItem(state, loot.itemId, loot.qty);
    if (got > 0) drops.push({ ...loot, qty: got });
  }
  return drops;
}

function killEnemy(state, enemy, rng) {
  const combat = state.currentCombat;
  const def = getEnemy(enemy.id);
  const mods = modifiersFor(state);
  const lines = [`${enemy.name} goes down.`];

  // grantSkillXp applies the difficulty multiplier itself, so the direct award
  // gets it here. grantRewardXp then scales it against the player's level, so a
  // kill is worth as much at 100 as it was at 10 (see gameState.js).
  grantRewardXp(state, def.xp * (mods.playerXp ?? 1));
  grantSkillXp(state, "fighting", Math.round(def.xp / 2));

  // Keyed off the CATALOG's own idea of a boss, the same one the combat-end
  // achievement hook uses - deliberately not combat.boss, which merely records
  // that the player picked the boss action and would pay out for choosing a
  // boss fight and then fleeing it.
  if (def.subtype === "boss") {
    grantSkillXp(state, "strength", STRENGTH_XP_PER_BOSS);
  }

  // Base units, paid as loose copper - what you loot off a body is small change.
  const gold = Math.max(1, Math.round(def.xp * GOLD_PER_XP));
  addCurrency(state, gold);
  lines.push(`  +${def.xp} xp, +${formatBase(gold, { short: true })}.`);

  for (const drop of rollDrops(state, def, rng)) {
    lines.push(`  looted ${drop.qty}x ${ALL_ITEMS[drop.itemId]?.name ?? drop.itemId}.`);
  }

  state.enemiesDefeated[enemy.id] = (state.enemiesDefeated[enemy.id] ?? 0) + 1;
  recordEnemyDefeated(state, enemy.id);
  combat.defeated.push(enemy.id);
  logger.info("combat", `Defeated ${enemy.id}.`);
  return lines;
}

// Marks the encounter lost and, on standard difficulties, applies the penalty:
// the whole backpack is gone, gold resets, and you wake up back at the start
// with the same STARTER_ITEMS a new character gets. Equipment is kept.
//
// On survival/nightmare this only flags `permadeath` - deleting the save is
// left to ui/screens/defeat.js, so this module never has to import
// state/persistence.js (and with it, db_backbone.js's import-time DB open).
export function resolveDefeat(state) {
  const combat = state.currentCombat;
  const permadeath = PERMADEATH_DIFFICULTIES.has(state.difficulty);
  const itemsLost = Object.values(state.inventory).reduce((sum, qty) => sum + qty, 0);
  const goldLost = walletTotal(state); // base units, for the defeat screen's summary

  if (combat) {
    combat.outcome = "defeat";
    combat.permadeath = permadeath;
  }
  logger.info("combat", permadeath ? "Player died (permadeath)." : "Player died.");

  // Stashed on state so ui/screens/defeat.js can render the summary without
  // resolveRound() having to thread a return value up through the keymap.
  state.lastDefeat = { permadeath, itemsLost, goldLost };

  if (permadeath) return state.lastDefeat;

  state.inventory = {};
  state.cur = purseFromBase(player_config.startingGold ?? 0);
  // Re-granted before anything else so the starter belt is back in hand -
  // addItem()'s backpack capacity is belt-gated (data/toolbelt.js).
  for (const itemId of Object.values(STARTER_ITEMS).flat()) addItem(state, itemId, 1);

  moveTo(state, player_config.startingLocation);
  state.hp = state.hpMax;
  state.mp = state.mpMax;
  state.currentAction = null;
  state.currentTravel = null;

  return state.lastDefeat;
}

// A group's own xp is a completion bonus for clearing the whole pack, paid on
// top of what each member already granted through killEnemy(). Scaled by the
// difficulty's playerXp modifier the same way killEnemy's direct award is,
// since grantRewardXp scales for level but not for difficulty (see gameState.js).
// combat.sourceId is the only place the group id survives into the encounter.
function awardGroupBonus(state, combat) {
  const group = getEnemy(combat.sourceId);
  if (!group?.members || !group.xp) return [];

  const mods = modifiersFor(state);
  grantRewardXp(state, group.xp * (mods.playerXp ?? 1));
  // Scaled off the pack's own xp, so a fifteen-strong horde is worth more than
  // three goblins. grantSkillXp applies the difficulty multiplier itself.
  grantSkillXp(state, "strength", Math.max(1, Math.round(group.xp * STRENGTH_XP_PER_GROUP_XP)));
  logger.info("combat", `Cleared ${combat.sourceId}: +${group.xp} bonus xp.`);
  return [`  You cleared the ${group.name}. +${group.xp} bonus xp.`];
}

// Fired the instant an encounter is WON, not when the combat screen is left.
// Two reasons: achievements_backbone.js scopes combatEnd to "when a combat
// encounter ends (all enemys defeated)", so a flee or a death shouldn't
// qualify; and resolveDefeat() restores hp/mp and wipes the inventory before
// the defeat screen ever runs, so a hook at endCombat() would read
// post-revival values.
//
// `boss` is whether a boss-SUBTYPE enemy actually died, per the catalog's own
// wording - deliberately not combat.boss, which merely records that the player
// picked the boss action and would credit choosing a boss fight then fleeing.
function awardCombatEndAchievements(state, combat) {
  evaluateAchievements(state, {
    combatEnd: {
      hp: state.hp,
      hpMax: state.hpMax,
      mp: state.mp,
      mpMax: state.mpMax,
      enemies: combat.defeated.length,
      boss: combat.defeated.some((id) => getEnemy(id)?.subtype === "boss"),
    },
  });
}

// One full exchange. `action` is one of:
//   { type: "attack" } | { type: "spell", spellId } |
//   { type: "potion", itemId } | { type: "flee" }
// Returns the log lines produced this round (also appended to combat.log).
export function resolveRound(state, action, rng = Math.random) {
  const combat = state.currentCombat;
  if (!combat || combat.outcome) return [];

  combat.round += 1;
  const lines = [];

  if (action.type === "flee") {
    if (attemptFlee(state, rng)) {
      combat.outcome = "fled";
      return pushLog(combat, [...lines, "You break off and escape."]);
    }
    lines.push("You try to escape, but they cut you off.");
  } else if (action.type === "attack") {
    lines.push(...playerAttack(state, rng));
  } else if (action.type === "spell") {
    lines.push(...playerCast(state, action.spellId));
  } else if (action.type === "potion") {
    const used = usePotion(state, action.itemId);
    if (!used) return pushLog(combat, ["You can't use that right now."]);
    lines.push(used);
  }

  lines.push(...applyPoisonTick(combat, currentEnemy(combat)));

  const enemy = currentEnemy(combat);
  if (enemy && enemy.hp <= 0) {
    lines.push(...killEnemy(state, enemy, rng));
    combat.index += 1;
    if (combat.index >= combat.enemies.length) {
      combat.outcome = "victory";
      lines.push(...awardGroupBonus(state, combat));
      lines.push("The fight is over. You're still standing.");
      awardCombatEndAchievements(state, combat);
    } else {
      // A downed enemy costs the pack its counterattack this round; the next
      // one steps up and swings from the following round.
      lines.push(`${currentEnemy(combat).name} steps up.`);
    }
    return pushLog(combat, lines);
  }

  if (enemy) lines.push(...enemyAttack(state, enemy, rng));

  // The godmode guard isn't redundant with the zeroed damage above: hp can't be
  // reduced to 0 while it's on, but the Admin stats editor can set it there
  // directly, and the next round would otherwise walk straight into defeat.
  if (state.hp <= 0 && !state.godmode) {
    // Pre-death: a revive item in the backpack is spent here instead, and the
    // fight simply carries on. Checked before resolveDefeat() rather than
    // inside it because defeat is also what permadeath hangs off - by the time
    // that function runs, the run is already being written off.
    const revived = attemptRevive(state);
    if (revived) {
      lines.push(revived.message);
      logger.info("combat", "Player revived from a killing blow.");
    } else {
      const result = resolveDefeat(state);
      lines.push(result.permadeath ? "You collapse. This run is over." : "You collapse.");
    }
  }

  return pushLog(combat, lines);
}
