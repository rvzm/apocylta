import { SPELLS } from "../magic_backbone.js";
import { LOCATIONS } from "./locations.js";
import { grantSkillXp, moveTo } from "../state/gameState.js";
import { hasIngredients, spendIngredients } from "./stations.js";
// Deliberate import cycle: quests.js imports isSpellKnown() from this file.
// Safe because both modules only export hoisted function declarations and do
// no work at module-evaluation time, so neither needs the other resolved at
// import. It would break if either ever calls across at the top level.
// Worth it to keep the cast hook at the one place a cast succeeds - see
// castSpell() below for the bug that a call-site hook caused.
import { recordSpellCast } from "./quests.js";

// The starter spell is known from character creation regardless of magic
// skill level - everything else is added to state.spells by learnSpell().
export function isSpellKnown(state, spellId) {
  const spell = SPELLS[spellId];
  return !!spell && (spell.starter === true || state.spells.has(spellId));
}

// The visibility gate for the spellbook: your magic skill level unlocks a
// spell's existence, regardless of whether you can currently afford to
// learn it (mirrors shopBuy.js's barter-level gate, not station crafting's
// "hide until affordable" rule - a spell you're eligible for but can't pay
// for yet should still show what it'll cost).
export function isSpellUnlocked(state, spellId) {
  const spell = SPELLS[spellId];
  return !!spell && state.skills.magic.level >= (spell.level ?? 1);
}

export function canLearnSpell(state, spellId) {
  const spell = SPELLS[spellId];
  if (!spell || isSpellKnown(state, spellId) || !isSpellUnlocked(state, spellId)) return false;
  return !spell.learn || hasIngredients(state, spell.learn);
}

export function learnSpell(state, spellId) {
  const spell = SPELLS[spellId];
  if (!canLearnSpell(state, spellId)) return null;
  if (spell.learn) spendIngredients(state, spell.learn);
  state.spells.add(spellId);
  return `You learn ${spell.name}.`;
}

// Godmode waives the mp requirement but not the "do you know it" one - the
// gate has to give way as well as the spend below, or a spell you can't afford
// is refused before it ever reaches the point of not costing anything.
export function canCastSpell(state, spellId) {
  const spell = SPELLS[spellId];
  return !!spell && isSpellKnown(state, spellId) && (state.godmode === true || state.mp >= spell.mp);
}

// `target` is the live enemy object from state.currentCombat, supplied by
// data/combat.js's resolveRound(). It stays an explicit parameter rather than
// being read off state so this module never has to import the combat engine
// (which imports this one). Casting from the spellbook out of combat passes
// no target, so enemy-facing spells politely no-op.
//
// SPELLS entries carry no targeting field - `type` is what decides who a
// spell hits: heal/buff/teleport/aid are self-cast, attack/debuff/poison need
// an enemy.
export function castSpell(state, spellId, target = null) {
  const spell = SPELLS[spellId];
  if (!canCastSpell(state, spellId)) return null;

  const needsTarget = spell.type === "attack" || spell.type === "debuff" || spell.type === "poison";
  if (needsTarget && !target) return `You cast ${spell.name}, but there's nothing here to hit.`;

  if (!state.godmode) state.mp -= spell.mp;
  grantSkillXp(state, "magic", spell.xp);
  // Recorded here rather than at the call sites: it used to live only in
  // ui/screens/spellbook.js, so every spell cast in combat (data/combat.js's
  // playerCast) went unrecorded and useSpell quest objectives silently missed
  // every attack spell. One hook at the single place a cast actually succeeds.
  recordSpellCast(state, spellId);

  if (spell.type === "heal") {
    const healed = Math.min(spell.heal, state.hpMax - state.hp);
    state.hp += healed;
    return `You cast ${spell.name} and recover ${healed} HP.`;
  }
  if (spell.type === "teleport") {
    moveTo(state, spell.teleport);
    return `You cast ${spell.name} and teleport to ${LOCATIONS[spell.teleport]?.name ?? spell.teleport}.`;
  }
  if (spell.type === "attack") {
    const dealt = Math.max(1, Math.round(spell.damage ?? 0));
    target.hp = Math.max(0, target.hp - dealt);
    return `You cast ${spell.name} at ${target.name} for ${dealt}.`;
  }
  if (spell.type === "debuff") {
    // e.g. weaken's { attack: -5 } - stacks onto the target for the rest of
    // the encounter (enemies live only as long as the fight does).
    const amount = spell.debuff?.attack ?? 0;
    target.attackDebuff = (target.attackDebuff ?? 0) + amount;
    return `You cast ${spell.name}. ${target.name} looks weaker.`;
  }
  if (spell.type === "poison") {
    target.poison = { dps: spell.poison?.dps ?? 0, remaining: spell.poison?.duration ?? 0 };
    return `You cast ${spell.name}. ${target.name} is poisoned.`;
  }
  if (spell.type === "buff") {
    // Buffs land on the encounter, not the player - they're combat-scoped and
    // deliberately never persisted. Out of combat there's nothing to hold them.
    const combat = state.currentCombat;
    if (!combat) return `You cast ${spell.name}, but it fades with nothing to fight.`;
    for (const [stat, amount] of Object.entries(spell.buff ?? {})) {
      combat.buffs[stat] = (combat.buffs[stat] ?? 0) + amount;
    }
    return `You cast ${spell.name}. You feel it take hold.`;
  }
  return `You cast ${spell.name}, but nothing happens.`;
}
