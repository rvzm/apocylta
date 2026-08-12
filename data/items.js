// apocylta world data - consumables
//
// The one place an item is consumed. Both the backpack's [U]se and combat's
// usePotion() route through useItem(), so the CONSUME economy (skill xp and
// byproducts, item_backbone.js) applies wherever a consumable is used - the
// same "one hook where it actually happens" reasoning that keeps
// recordSpellCast inside data/magic.js's castSpell().

import { ALL_ITEMS, consumeRewardFor } from "../item_backbone.js";
import { addItem, removeItem, grantSkillXp } from "../state/gameState.js";
import { recordItemUsed } from "./quests.js";

// Buff potions in item_backbone.js carry a `duration` but no magnitude
// ({ stat: "attack", duration: 30 }), so the engine supplies one. Moved here
// from data/combat.js along with the buff branch that was its only reader.
const POTION_BUFF_MAGNITUDE = 5;

// Resolves an item id to what consuming it does, or null if it isn't
// consumable at all - the classifier half of this module, and the symmetric
// sibling of item_backbone.js's equipSlotOf().
//
// Food is gated on `health_boost` rather than on type alone: the ten
// `subtype: "ingredient"` foods (flour, yeast, bread_dough...) are pure
// crafting inputs that carry no boost, and offering them as edible would be
// wrong. Potions and aids are keyed by subtype, which is what already
// distinguishes their effect fields.
export function consumeEffectOf(itemId) {
  const item = ALL_ITEMS[itemId];
  if (!item) return null;

  if (item.type === "food") {
    return item.health_boost != null ? { kind: "heal", amount: item.health_boost } : null;
  }

  if (item.type === "potion") {
    if (item.subtype === "heal") return { kind: "heal", amount: item.heal ?? 0 };
    if (item.subtype === "mana") return { kind: "mana", amount: item.mana_restore ?? 0 };
    // Two shapes for the same idea in item_backbone.js: a flat
    // `poison_damage`, or a nested `poison: { stat, damage }`.
    if (item.subtype === "poison") return { kind: "poison", amount: item.poison_damage ?? item.poison?.damage ?? 0 };
    if (item.subtype === "buff" && item.buff?.stat) return { kind: "buff", stat: item.buff.stat };
    if (item.subtype === "revive") return { kind: "revive", amount: reviveFraction(item) };
    return null;
  }

  if (item.type === "aid") {
    if (item.subtype === "heal") return { kind: "heal", amount: item.heal ?? 0 };
    if (item.subtype === "restore") return { kind: "restore", targets: item.restore ?? [] };
    if (item.subtype === "cure") return { kind: "cure", targets: item.cure ?? [] };
    if (item.subtype === "revive") return { kind: "revive", amount: reviveFraction(item) };
    return null;
  }

  return null;
}

// How much of hpMax a revive brings you back with. The only revive item today
// declares a bare `revive: true`, which reads as "you simply don't die" - full
// health. A number is honoured as a fraction instead, so a weaker revive is a
// data change rather than a code change.
function reviveFraction(item) {
  return typeof item.revive === "number" ? item.revive : 1;
}

const VERBS = { food: "eat", potion: "drink", aid: "apply" };

// Subtype wins where the type's verb is wrong for it: the teas and brews are
// `food`, and "you eat the Herbal Tea" reads badly next to the thermos it hands
// back. Same broad-then-narrow shape as CONSUME's own tiers.
const SUBTYPE_VERBS = { brewed: "drink" };

function verbFor(item) {
  return SUBTYPE_VERBS[item.subtype] ?? VERBS[item.type] ?? "use";
}

// Pays out the CONSUME economy - skill xp, plus whatever the thing came in.
// What that is comes from consumeRewardFor(), which resolves item_backbone.js's
// three tiers (type -> subtype -> item) so the rule lives with the data rather
// than being re-derived here: a potion leaves a bottle, a tea a thermos, a
// medic bag an empty bag, an AEGIS kit nothing at all.
//
// addItem can refuse on a full pack, so a lost byproduct is reported rather
// than silently voided. Returns a suffix for the use message.
function payConsumeReward(state, itemId) {
  const reward = consumeRewardFor(itemId);
  if (!reward) return "";
  grantSkillXp(state, reward.skill, reward.xp);
  if (!reward.output) return "";
  const name = ALL_ITEMS[reward.output]?.name ?? reward.output;
  // addItem returns the amount taken, so 0 is "no room" - explicit rather than
  // leaning on 0 being falsy.
  return addItem(state, reward.output, 1) > 0 ? ` You keep the ${name}.` : ` The ${name} won't fit in your backpack.`;
}

// The pre-death hook: called the instant hp hits 0, before anything treats it
// as a death. Spends one revive item from the backpack and returns the
// { used, message } of doing so, or null when there's nothing to spend - in
// which case the caller proceeds with the death it was going to handle.
//
// Weakest revive first, so a stack of mixed revives burns the cheapest one
// rather than whichever the inventory happens to list first. `revive` is a
// subtype, not a type, so a revive potion works here as readily as the aid
// item does without this needing to know about either.
export function attemptRevive(state) {
  const candidates = Object.keys(state.inventory)
    .filter((id) => state.inventory[id] > 0 && consumeEffectOf(id)?.kind === "revive")
    .sort((a, b) => consumeEffectOf(a).amount - consumeEffectOf(b).amount);

  if (!candidates.length) return null;
  return useItem(state, candidates[0], { dying: true });
}

// Consumes one of `itemId` and applies its effect. `ctx` carries what only
// combat can supply - { target } for thrown poisons, { combat } for buffs
// that live on the encounter, { dying } for a revive - and is empty when used
// from the backpack.
//
// Returns { used, message } rather than the string-or-null shape of
// learnSpell()/castSpell(): every refusal here has a distinct reason
// ("you're already at full health" vs "you're not poisoned" vs "that isn't
// usable"), and collapsing them into null would force each caller to guess.
export function useItem(state, itemId, ctx = {}) {
  const item = ALL_ITEMS[itemId];
  if (!item) return { used: false, message: "You don't have that." };
  if (!(state.inventory[itemId] > 0)) return { used: false, message: `You have no ${item.name}.` };

  const effect = consumeEffectOf(itemId);
  if (!effect) return { used: false, message: `${item.name} can't be used.` };

  const { target = null, combat = null, dying = false } = ctx;
  let line;

  if (effect.kind === "heal") {
    if (state.hp >= state.hpMax) return { used: false, message: "You're already at full health." };
    const healed = Math.min(effect.amount, state.hpMax - state.hp);
    state.hp += healed;
    line = `You ${verbFor(item)} the ${item.name} and recover ${healed} HP.`;
  } else if (effect.kind === "mana") {
    if (state.mp >= state.mpMax) return { used: false, message: "Your mana is already full." };
    const restored = Math.min(effect.amount, state.mpMax - state.mp);
    state.mp += restored;
    line = `You ${verbFor(item)} the ${item.name} and recover ${restored} MP.`;
  } else if (effect.kind === "restore") {
    if (state.hp >= state.hpMax && state.mp >= state.mpMax) {
      return { used: false, message: "You're already at full health and mana." };
    }
    state.hp = state.hpMax;
    state.mp = state.mpMax;
    line = `You ${verbFor(item)} the ${item.name}. Health and mana restored.`;
  } else if (effect.kind === "poison") {
    if (!target) return { used: false, message: "There's nothing to throw that at." };
    const dealt = Math.max(1, Math.round(effect.amount));
    target.hp = Math.max(0, target.hp - dealt);
    line = `You hurl the ${item.name} at ${target.name} for ${dealt}.`;
  } else if (effect.kind === "buff") {
    // Buffs land on the encounter, not the player - combat-scoped and
    // deliberately never persisted, exactly like castSpell()'s buff branch.
    // Out of combat there's nothing to hold them.
    if (!combat) return { used: false, message: `You ${verbFor(item)} the ${item.name}, but it fades with nothing to fight.` };
    combat.buffs[effect.stat] = (combat.buffs[effect.stat] ?? 0) + POTION_BUFF_MAGNITUDE;
    line = `You ${verbFor(item)} the ${item.name}. Your ${effect.stat} rises.`;
  } else if (effect.kind === "cure") {
    // The player carries no status effects - only enemies do (see the poison
    // tick in data/combat.js) - so there is nothing for a cure to remove yet.
    // Refuse without consuming rather than burning the item on a no-op.
    return { used: false, message: "You're not poisoned." };
  } else if (effect.kind === "revive") {
    // A revive is never used on purpose - it fires from attemptRevive() at the
    // one moment it means anything, which is why `dying` isn't something any
    // screen passes. Using one off the backpack stays a refusal.
    if (!dying) return { used: false, message: "Nothing to come back from." };
    state.hp = Math.max(1, Math.round(state.hpMax * effect.amount));
    line = `The ${item.name} burns out and pulls you back from the brink. ${state.hp} HP.`;
  } else {
    return { used: false, message: `${item.name} can't be used.` };
  }

  removeItem(state, itemId, 1);
  const bonus = payConsumeReward(state, itemId);
  recordItemUsed(state, itemId, 1);
  return { used: true, message: line + bonus };
}
