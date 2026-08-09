import { LOCATIONS } from "../data/locations.js";
import {
  SKILLS,
  skillLevelCost,
  playerLevelCost,
  playerXpScale,
  PROFICIENCY_XP_MULTIPLIER,
  PLAYER_XP_SHARE_PER_SKILL_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_PLAYER_LEVEL,
} from "../skill_backbone.js";
import { RACES, CLASSES, DIFFICULTY_LEVELS, STARTER_ITEMS } from "../player_backbone.js";
import { player_config } from "../config.js";
import { STARTER_PACKS, ALL_ITEMS } from "../item_backbone.js";
import { logger } from "../logger.js";
import { backpackSlotCap, backpackSlotsUsed, potionSlotCap, potionSlotsUsed } from "../data/toolbelt.js";
import { minutesIntoDay, isOpenAt } from "./clock.js";


function createInitialSkills() {
  return Object.keys(SKILLS).reduce((acc, key) => {
    acc[key] = { level: 1, xp: 0, proficient: false };
    return acc;
  }, {});
}

function createInitialEquipment() {
  return {
    weapon: STARTER_ITEMS.weapons[0] || null,
    tool: null,
    slingshot: null,
    belt: STARTER_ITEMS.belt[0] || null,
    head: null,
    torso: null,
    legs: null,
    boots: null,
    hands: null,
    shield: null,
    // Real slots per item_backbone.js's ARMOR_SLOTS - 10 catalog items equip
    // into these. They were missing here, so equipItem() sprang the keys into
    // existence untracked.
    cloak: null,
    ring: null,
    necklace: null,
  };
}

// Current held amounts only - max caps (water/slingshot ammo/quiver, all
// gated on whether a belt is equipped at all) are derived, not stored; see
// data/toolbelt.js. Water bottle starts full so water-ingredient recipes are
// usable as soon as a belt is equipped; nothing refills it yet.
function createInitialToolbelt() {
  return { waterBottle: 100, slingshotAmmo: 0, quiver: 0 };
}

export function createInitialState() {
  return {
    name: null,
    race: null,
    class: null,
    difficulty: null,
    hp: 100,
    hpMax: 100,
    mp: 100,
    mpMax: 100,
    gold: 0,
    level: 1,
    experience: 0,
    currentLocationId: player_config.startingLocation,
    clock: { totalMinutes: 1178 }, // seeds to 7:38pm
    inventory: {},
    skills: createInitialSkills(),
    equipment: createInitialEquipment(),
    toolbelt: createInitialToolbelt(),
    currentAction: null, // | { id, elapsedSeconds, gatheredThisSession: {} }
    currentTravel: null, // | { fromLocationId, toLocationId, category, totalSeconds, elapsedSeconds }
    currentCombat: null, // | see data/combat.js's buildEncounter(); never persisted, same as the two above
    enemiesDefeated: {}, // lifetime { enemyId: count } tally - drives defeatEnemy quest objectives
    saveSlotId: null, // which numbered slot this session is bound to, so permadeath knows what to delete
    achievements: {}, // { achievementId: { unlockedAt } } - key presence IS the unlocked flag
    locationsVisited: new Set([player_config.startingLocation]), // every location ever stood in - see moveTo()
    // Lifetime id-keyed tallies for the events current state can't reconstruct.
    // Keyed by item/spell id so the by-type and by-subtype achievement shapes
    // derive through ALL_ITEMS/SPELLS instead of needing an index per shape.
    lifetime: { sold: {}, crafted: {}, cast: {}, used: {} },
    toasts: [], // transient unlock banners - see pushToast() below
    currentScreen: "title",
    returnScreen: "location",
    menuOrigin: null,
    lastMessage: null,
    lastDefeat: null, // ephemeral { permadeath, itemsLost, goldLost } for the defeat screen
    characterDraft: null, // ephemeral wizard staging: { name, starterPackId, raceId, classId, proficientSkillIds }
    house: false,
    ownedStations: new Set(),
    spells: new Set(), // learned non-starter spell ids - see data/magic.js's isSpellKnown()
    quests: {}, // keyed by quest id; only entries for quests ever accepted (in-progress or completed)
    // Admin (ui/screens/admin/) live switches. The rule there: progression
    // edits persist, switches don't - so these two are session-only and say so
    // on their screens, while a forced quest objective rides the save.
    adminInfinite: new Set(), // item ids removeItem() won't decrement
    adminAutoAchievements: true, // false pauses the per-tick evaluateAchievements()
    // Seeded from config so `godmode: true` there still means "every character
    // starts invincible"; the Admin stats screen flips it per session. Skips
    // costs only - see removeItem() below for where the line is drawn.
    godmode: player_config.godmode === true,
  };
}

export function getCurrentLocation(state) {
  return LOCATIONS[state.currentLocationId];
}

// The single choke point for changing where the player is. Everything that
// moves them - timed travel completing, an instant exit, a hub feature, a
// teleport spell, the defeat respawn - goes through here so the visited set
// can never drift from reality. Achievements' locationsVisited/reachLocation
// requirements read that set (data/achievements.js).
export function moveTo(state, locationId) {
  state.currentLocationId = locationId;
  state.locationsVisited.add(locationId);
}

const TOAST_TICKS = 6;

// Transient banner shown in the status bar by ui/layout.js's renderChrome().
// Expiry rides on clock.totalMinutes, which state/gameLoop.js already advances
// exactly once per tick - no separate timer, and it stays correct even when
// nothing else re-renders.
export function pushToast(state, text) {
  // Queued back-to-back rather than all expiring together: two achievements
  // can unlock on the same tick, and sharing one window would mean the second
  // is dropped without ever being shown.
  const last = state.toasts[state.toasts.length - 1];
  const startsAt = Math.max(state.clock.totalMinutes, last?.untilMinutes ?? 0);
  state.toasts.push({ text, untilMinutes: startsAt + TOAST_TICKS });
}

// Drops expired entries and returns the oldest still-live one, so a burst of
// unlocks is shown one after another rather than all at once or not at all.
export function activeToast(state) {
  if (!state.toasts?.length) return null;
  while (state.toasts.length && state.toasts[0].untilMinutes <= state.clock.totalMinutes) {
    state.toasts.shift();
  }
  return state.toasts[0] ?? null;
}

export function isSafeZone(state) {
  const location = getCurrentLocation(state);
  return location ? location.safe : true;
}

export function isLocationOpen(state) {
  return isOpenAt(getCurrentLocation(state)?.openHours, state);
}

// Only blocks gaining a item id the backpack doesn't already hold once its
// slot cap (belt-derived - see data/toolbelt.js) is reached; stacking more
// of something already held never costs a slot. Returns whether the item
// was actually added, so callers that care can react to a full backpack.
export function addItem(state, itemId, qty) {
  const isNewSlot = !(itemId in state.inventory);
  if (isNewSlot) {
    const item = ALL_ITEMS[itemId];
    if (item?.type === "potion" && potionSlotsUsed(state) >= potionSlotCap(state)) return false;
    if (item?.type !== "potion" && item?.type !== "tool" && backpackSlotsUsed(state) >= backpackSlotCap(state)) return false;
  }
  state.inventory[itemId] = (state.inventory[itemId] || 0) + qty;
  return true;
}

// Godmode and admin-flagged infinite items skip the decrement here rather than
// at call sites, so every consumer (crafting, spell costs, useItem) honours
// them. `force` is the carve-out for the three callers that aren't spending
// anything: equipping moves an item to the paperdoll, and dropping/selling are
// the player asking for it gone. Without it, godmode would make items
// undroppable and selling would mint gold while keeping the goods.
export function removeItem(state, itemId, qty, { force = false } = {}) {
  if (!force && (state.godmode || state.adminInfinite?.has(itemId))) return;
  const current = state.inventory[itemId] || 0;
  const next = current - qty;
  if (next > 0) {
    state.inventory[itemId] = next;
  } else {
    delete state.inventory[itemId];
  }
}

// Shared by backpack's generic Equip and the dedicated tool/slingshot swap
// screens: swaps itemId into the given equipment slot, returning whatever
// was previously equipped there (if any) to the inventory. Returns the
// previously-equipped item id, or null.
export function equipItem(state, itemId, slot) {
  const previous = state.equipment[slot];
  if (previous) addItem(state, previous, 1);
  state.equipment[slot] = itemId;
  removeItem(state, itemId, 1, { force: true }); // a move, not a cost
  return previous;
}

export function grantSkillXp(state, skillId, amount) {
  const skill = state.skills[skillId];
  if (!skill) return;
  const proficiencyMultiplier = DIFFICULTY_LEVELS[state.difficulty]?.modifiers?.proficiency ?? PROFICIENCY_XP_MULTIPLIER;
  let xpGain = skill.proficient ? amount * proficiencyMultiplier : amount;
  xpGain *= DIFFICULTY_LEVELS[state.difficulty]?.modifiers?.playerXp ?? 1;
  const rounded = Math.round(xpGain);
  skill.xp += rounded;
  logger.full("gameState", `Granted ${rounded} ${skillId} xp (total ${skill.xp}).`);
  // XP past MAX_SKILL_LEVEL keeps accumulating and simply buys nothing - the
  // running total is what the action screen's "gained this session" delta is
  // measured against, so clamping it would make a maxed skill look idle.
  while (skill.level < MAX_SKILL_LEVEL && skill.xp >= skillLevelCost(skill.level + 1)) {
    skill.level += 1;
    logger.info("gameState", `${skillId} leveled up to ${skill.level}.`);
    grantPlayerXp(state, skillLevelCost(skill.level) * PLAYER_XP_SHARE_PER_SKILL_LEVEL);
  }
}

// Player xp/leveling runs on its own curve (skill_backbone.js's
// playerLevelCost), much steeper than a skill's - see the comment there for why
// the two must not share one. The main source is grantSkillXp() above, a share
// of each new skill level's threshold.
//
// This is the RAW pool adder: whatever it's handed goes straight in. Rewards
// from combat/quests/achievements go through grantRewardXp() below instead, so
// they're scaled to the player's level. Neither re-applies difficulty or
// proficiency multipliers - grantSkillXp resolved those before its loop ran,
// and the reward sites apply the difficulty multiplier themselves.
export function grantPlayerXp(state, amount) {
  const rounded = Math.round(amount);
  state.experience += rounded;
  logger.full("gameState", `Granted ${rounded} player xp (total ${state.experience}).`);
  while (state.level < MAX_PLAYER_LEVEL && state.experience >= playerLevelCost(state.level + 1)) {
    state.level += 1;
    logger.info("gameState", `Player leveled up to ${state.level}.`);
  }
}

// Flat rewards - a kill, a quest hand-in, an achievement - scaled so they're
// worth at level 100 roughly what they were worth at level 10. Without this a
// 1000-xp quest goes from most of a level to 0.09% of one across a run.
export function grantRewardXp(state, amount) {
  grantPlayerXp(state, amount * playerXpScale(state.level));
}

// Turns a staged character-creation draft ({name, starterPackId, raceId,
// classId, proficientSkillIds}) into a real playable character, mutating the
// live state object in place. Merges race.starters + the chosen starter
// pack's items + STARTER_ITEMS (given to every character regardless of
// race/class/pack - a "gold" key credits gold instead of adding an
// inventory item); a granted "set"-type item is unpacked into its component
// pieces since sets aren't equippable/usable as-is anywhere in the game yet.
// Nothing here equips anything, but the character isn't empty-handed either:
// createInitialToolbelt()'s sibling above seeds the weapon and belt slots
// straight from STARTER_ITEMS, so the starter dagger and leather belt are worn
// from the first screen - they land in the inventory here and are already on the
// character. Every other starter item stays unequipped.
export function finalizeCharacter(state, draft) {
  const race = RACES[draft.raceId];
  const cls = CLASSES[draft.classId];
  const pack = STARTER_PACKS[draft.starterPackId];
  const starterItemIds = Object.values(STARTER_ITEMS).flat();

  state.name = draft.name.trim();
  state.race = draft.raceId;
  state.class = draft.classId;
  state.difficulty = draft.difficultyId;

  state.gold = 0;
  state.inventory = {};
  for (const [id, qty] of [
    ...Object.entries(race.starters ?? {}),
    ...Object.entries(pack.items ?? {}),
    ...starterItemIds.map((id) => [id, 1]),
  ]) {
    if (id === "gold") {
      state.gold += qty;
      continue;
    }
    const item = ALL_ITEMS[id];
    if (item?.type === "set" && Array.isArray(item.items)) {
      for (const pieceId of item.items) addItem(state, pieceId, 1);
    } else {
      addItem(state, id, qty);
    }
  }

  const proficientIds = new Set([...(race.skillPro ?? []), ...(cls.skillPro ?? []), ...draft.proficientSkillIds]);
  for (const skillId of proficientIds) {
    if (!state.skills[skillId]) continue;
    state.skills[skillId] = { level: 5, xp: skillLevelCost(5), proficient: true };
  }

  state.characterDraft = null;
}

export function formatClock(state) {
  const minutesInDay = minutesIntoDay(state);
  const hours24 = Math.floor(minutesInDay / 60);
  const minutes = minutesInDay % 60;
  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hours12}:${minutesStr}${period}`;
}
