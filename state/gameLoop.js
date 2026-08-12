import { getAction, rollLootByType, rollGatherAttempt } from "../data/actions.js";
import { ALL_ITEMS } from "../item_backbone.js";
import { tickTravel } from "../data/travel.js";
import { rollMineBonuses } from "../data/mining.js";
import { spendBait } from "../data/fishing.js";
import { spawnEncounter, beginCombat } from "../data/combat.js";
import { evaluateAchievements } from "../data/achievements.js";
import { addItem, grantSkillXp, isSafeZone, pushToast } from "./gameState.js";
import { DIFFICULTY_LEVELS, gatherTimeFor, encounterTicFor } from "../player_backbone.js";
import { combat_config } from "../config.js";
import { logger } from "../logger.js";

const TICK_MS = 1000;
const MINUTES_PER_TICK = 1;
const SKILL_XP_PER_GRANT = 5;
// How many attempts the action screen can show. Kept short because it's a
// scrolling record of the last few seconds, not a log.
const ATTEMPT_HISTORY = 5;

// Gathering out in the open can get you jumped. Rolled on its own cadence
// (DIFFICULTY_LEVELS' logic.actionTic) rather than with the gather attempt:
// when the two shared a cadence, slowing gathering down made the game safer,
// and made the HARDEST difficulties the safest of all, since those wait longest
// between attempts. enemySpawnRate now reads as "per actionTic seconds".
// Travel is deliberately exempt: a trip you can't interrupt shouldn't be able
// to dump you into a fight you never chose to be near.
export function shouldAmbush(state, rng = Math.random) {
  if (state.currentCombat || isSafeZone(state)) return false;
  const spawnScale = DIFFICULTY_LEVELS[state.difficulty]?.logic?.enemySpawn ?? 1;
  return rng() < (combat_config.enemySpawnRate ?? 0) * spawnScale;
}

// One line for the action screen's rolling attempt log, oldest dropped.
function recordAttempt(state, line) {
  state.currentAction.attempts = [...(state.currentAction.attempts ?? []), line].slice(-ATTEMPT_HISTORY);
}

// One gather attempt: bait, then the success roll, then loot + xp. Pulled out
// of the tick body because it grew three branches deep and is the piece worth
// reading on its own. rng is injectable for tests, as everywhere else.
export function resolveGatherAttempt(state, rng = Math.random) {
  const action = getAction(state.currentAction.id);

  // Bait is spent per attempt - a miss costs one too - so running out ends the
  // trip. Charged before the roll: no bait, no cast. Nets and hooks are
  // reusable and never fail here. Clearing currentAction is all it takes to
  // stop; the action screen re-routes on seeing it gone, as it does after an
  // ambush.
  if (action.id === "fish" && !spendBait(state, state.currentAction.species)) {
    logger.info("gameLoop", `Fishing stopped at ${state.currentLocationId}: out of bait.`);
    state.currentAction = null;
    pushToast(state, "You're out of bait.");
    return;
  }

  // An attempt can simply come up empty now - see gatherSuccessChance(). A miss
  // pays no skill xp at all, which is the other half of the pacing brake.
  if (!rollGatherAttempt(state, action, state.currentAction.targetLevel, rng)) {
    recordAttempt(state, action.missLine ?? "You didn't find anything.");
    logger.full("gameLoop", `Missed a ${action.id} attempt at ${state.currentLocationId}.`);
    return;
  }

  // lootIds is the fish selector's chosen species (data/fishing.js) - it rides
  // the same allowIds parameter the mine's gem pool uses.
  const rolled = [
    rollLootByType(
      action.lootType,
      state.currentAction.lootSubtype ?? action.lootSubtype,
      undefined,
      rng,
      state.currentAction.lootIds ?? null
    ),
  ];
  // Coal and gemstones aren't chosen on the mine selector - they turn up while
  // you work, tier-gated by the mine you're standing in. Rolled separately so
  // they add to the ore rather than competing with it, and only on a success:
  // they're extras on top of an ore, not a consolation prize for missing one.
  if (action.id === "mine") rolled.push(...rollMineBonuses(state, rng));

  const taken = [];
  let leftBehind = 0;
  for (const loot of rolled) {
    if (!loot) continue;
    // addItem takes what fits and reports how much - report what you actually
    // got, not what the roll produced, or the log claims ore you never carried.
    const got = addItem(state, loot.itemId, loot.qty);
    leftBehind += loot.qty - got;
    if (got <= 0) continue;
    state.currentAction.gatheredThisSession[loot.itemId] =
      (state.currentAction.gatheredThisSession[loot.itemId] || 0) + got;
    taken.push(`${got} ${ALL_ITEMS[loot.itemId]?.name ?? loot.itemId}`);
    logger.full("gameLoop", `Looted ${got}x ${loot.itemId} from ${action.id}.`);
  }

  // An empty pool still counts as a miss to the player - there's nothing to
  // show them either way - so it reads as one rather than as a silent success.
  // A roll that produced something you had no room for is a different failure
  // and says so, since dropping something would fix it.
  if (!taken.length) {
    recordAttempt(
      state,
      leftBehind > 0
        ? "You've no room for it - you leave it where it lies."
        : action.missLine ?? "You didn't find anything."
    );
    return;
  }

  const shortfall = leftBehind > 0 ? ` You leave ${leftBehind} behind - no room.` : "";
  recordAttempt(state, `You ${action.attemptVerb ?? "found"} ${taken.join(" and ")}.${shortfall}`);
  if (action.skill) {
    grantSkillXp(state, action.skill, SKILL_XP_PER_GRANT);
  }
}

// Starts the tick loop. onTick(state) is called after every mutation so the
// caller can decide what/how to re-render. Returns a stop() function.
export function startGameLoop(state, onTick) {
  const interval = setInterval(() => {
    state.clock.totalMinutes += MINUTES_PER_TICK;

    if (state.currentAction) {
      state.currentAction.elapsedSeconds += 1;

      if (state.currentAction.elapsedSeconds % gatherTimeFor(state.difficulty) === 0) {
        resolveGatherAttempt(state);
      }

      // Its own cadence, and checked after the attempt so an ambush interrupts
      // a gather that already paid out rather than swallowing it. currentAction
      // may have just been cleared (out of bait), hence the re-check.
      if (
        state.currentAction &&
        state.currentAction.elapsedSeconds % encounterTicFor(state.difficulty) === 0 &&
        shouldAmbush(state)
      ) {
        // beginCombat() clears currentAction, so the gather stops here. The
        // loop has no ui handle to switch screens with - main.js's onTick
        // notices currentCombat and routes there.
        const encounter = spawnEncounter(state);
        if (encounter) {
          logger.info("gameLoop", `Ambushed at ${state.currentLocationId} while ${state.currentAction.id}.`);
          beginCombat(state, encounter);
        }
      }
    }

    if (state.currentTravel) {
      tickTravel(state);
    }

    // Polled rather than hooked at every mutation site: all but one
    // requirement type is derivable from live state, so one cheap sweep per
    // second covers them without scattering hooks. combatEnd is the exception
    // and is evaluated with an explicit context from data/combat.js.
    evaluateAchievements(state);

    onTick(state);
  }, TICK_MS);

  return () => clearInterval(interval);
}
