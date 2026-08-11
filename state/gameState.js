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
import { STARTER_PACKS, ALL_ITEMS, ENHANCEMENT_SLOTS } from "../item_backbone.js";
import { logger } from "../logger.js";
import { backpackSlotCap, backpackSlotsUsed, potionSlotCap, potionSlotsUsed } from "../data/toolbelt.js";
import { minutesIntoDay, isOpenAt } from "./clock.js";
import { emptyPurse, purseTotal, addToPurse, spendFrom, purseFromBase } from "../currency_backbone.js";


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

// The black market's charm/talisman/beads/ring/bangle ladder, one worn item per
// tier. Deliberately NOT folded into createInitialEquipment(): the enhancement
// "ring" tier and the armor "ring" slot are different things that would
// otherwise overwrite each other. equipItem() routes between the two maps.
function createInitialEnhancements() {
  return ENHANCEMENT_SLOTS.reduce((acc, slot) => {
    acc[slot] = null;
    return acc;
  }, {});
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
    cur: emptyPurse(), // the purse: one coin count per metal - see currency_backbone.js
    level: 1,
    experience: 0,
    currentLocationId: player_config.startingLocation,
    clock: { totalMinutes: 1178 }, // seeds to 7:38pm
    inventory: {},
    skills: createInitialSkills(),
    equipment: createInitialEquipment(),
    enhancements: createInitialEnhancements(),
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

// --- The purse --------------------------------------------------------------
//
// Item ids that mean MONEY rather than a thing. There is no such item, and
// there never was: STARTER_PACKS.deep_pockets grants `{ gold: 5000 }` and the
// races grant `{ gold: 500 }`, both of which mean the purse. `"money"` is the
// unambiguous spelling to use in new data - now that gold is one metal of four,
// `{ gold: N }` reads like N gold coins when it has always meant N base units.
// Both are accepted so the catalogs can be migrated at their own pace, and both
// mean BASE UNITS.
export const MONEY_IDS = new Set(["money", "gold"]);
//
// state.cur holds one coin count per metal and `amount` is always in base units
// (copper coins) - currency_backbone.js does the denomination arithmetic. These
// three are the only places the purse is written, for the same reason addItem/
// removeItem are the only places the inventory is: the godmode carve-out has to
// live somewhere both halves of a purchase can see it. Refusing to charge while
// still refusing the sale would be worse than either.

// What the purse is worth, which is what every price comparison is against.
export function walletTotal(state) {
  return purseTotal(state.cur);
}

// Earnings. `curType` is the metal it's paid in - the purse holds what it was
// given, so being paid in syllic leaves syllic rather than a tidy breakdown.
export function addCurrency(state, amount, curType = "copper") {
  if (amount <= 0) return;
  state.cur = addToPurse(state.cur, Math.round(amount), curType);
}

// The affordability half. Free under godmode, which has to agree with
// spendCurrency below or the purchase is refused before the free spend runs.
export function canAffordCurrency(state, amount) {
  return state.godmode === true || walletTotal(state) >= amount;
}

// The paying half. Returns false without touching the purse when it's short, so
// a caller that skipped the check can't quietly go negative.
export function spendCurrency(state, amount) {
  if (state.godmode) return true;
  const next = spendFrom(state.cur, Math.round(amount));
  if (!next) return false;
  state.cur = next;
  return true;
}

// Shared by backpack's generic Equip and the dedicated tool/slingshot swap
// screens: swaps itemId into the given equipment slot, returning whatever
// was previously equipped there (if any) to the inventory. Returns the
// previously-equipped item id, or null.
export function equipItem(state, itemId, slot) {
  // Enhancements wear in their own five slots rather than on the armor
  // paperdoll - one branch here is what keeps the backpack's E, the admin
  // equipment editor and the swap screens working unchanged for both.
  //
  // Routed on the ITEM, not on the slot name: "ring" is both an ARMOR_SLOTS
  // entry and an enhancement tier, so a name-based check filed ring_of_eternity
  // as an enhancement and let a 100,000gp Luck Ring evict it.
  const worn = ALL_ITEMS[itemId]?.type === "enhancement" ? state.enhancements : state.equipment;
  const previous = worn[slot];
  if (previous) addItem(state, previous, 1);
  worn[slot] = itemId;
  removeItem(state, itemId, 1, { force: true }); // a move, not a cost
  return previous;
}

// The skill level the game should ACT on: the trained level plus whatever the
// worn enhancements add. Every enhancement's effect is authored as
// `{ <skillId>Up: n }`, so the skill id is all this needs to look one up.
//
// Deliberately not clamped to MAX_SKILL_LEVEL: the cap is on what training can
// buy, and a 500,000gp bangle whose bonus silently evaporates at the ceiling is
// a worse surprise than one that pushes past it.
export function enhancementBonus(state, skillId) {
  let bonus = 0;
  for (const itemId of Object.values(state.enhancements ?? {})) {
    bonus += ALL_ITEMS[itemId]?.effect?.[`${skillId}Up`] ?? 0;
  }
  return bonus;
}

// Use this wherever a skill level GATES or SCALES something in play - combat
// maths, mining/fishing/magic requirements, gather odds, shop stock.
//
// Do NOT use it where the level is the thing being measured: quest and
// achievement progress read the trained level directly, because a bought charm
// must not complete "reach mining level 10", and the same goes for xp grants,
// the action screen's session delta, and every display of the number.
export function effectiveSkillLevel(state, skillId) {
  const base = state.skills[skillId]?.level ?? 1;
  return base + enhancementBonus(state, skillId);
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

  let money = 0; // base units, settled into coins once the loop is done
  state.inventory = {};
  for (const [id, qty] of [
    ...Object.entries(race.starters ?? {}),
    ...Object.entries(pack.items ?? {}),
    ...starterItemIds.map((id) => [id, 1]),
  ]) {
    if (MONEY_IDS.has(id)) {
      // A money grant, not an item - see MONEY_IDS.
      money += qty;
      continue;
    }
    const item = ALL_ITEMS[id];
    if (item?.type === "set" && Array.isArray(item.items)) {
      for (const pieceId of item.items) addItem(state, pieceId, 1);
    } else {
      addItem(state, id, qty);
    }
  }
  // Settled once, canonically: a starting purse is money conjured from a
  // number, not money earned, so it arrives as sensible coins rather than as
  // five and a half thousand coppers.
  state.cur = purseFromBase(money);

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
