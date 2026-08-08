import { getAction, rollLootByType } from "../data/actions.js";
import { tickTravel } from "../data/travel.js";
import { rollMineBonuses } from "../data/mining.js";
import { spawnEncounter, beginCombat } from "../data/combat.js";
import { evaluateAchievements } from "../data/achievements.js";
import { addItem, grantSkillXp, isSafeZone } from "./gameState.js";
import { DIFFICULTY_LEVELS } from "../player_backbone.js";
import { combat_config } from "../config.js";
import { logger } from "../logger.js";

const TICK_MS = 1000;
const MINUTES_PER_TICK = 1;
const LOOT_ROLL_EVERY_N_TICKS = 3;
const SKILL_XP_PER_GRANT = 5;

// Gathering out in the open can get you jumped. Rolled on the same cadence as
// the loot roll rather than every tick, so enemySpawnRate reads as "per loot
// interval" - at one roll per 3s, a per-tick rate would be relentless.
// Travel is deliberately exempt: a trip you can't interrupt shouldn't be able
// to dump you into a fight you never chose to be near.
export function shouldAmbush(state, rng = Math.random) {
  if (state.currentCombat || isSafeZone(state)) return false;
  const spawnScale = DIFFICULTY_LEVELS[state.difficulty]?.logic?.enemySpawn ?? 1;
  return rng() < (combat_config.enemySpawnRate ?? 0) * spawnScale;
}

// Starts the tick loop. onTick(state) is called after every mutation so the
// caller can decide what/how to re-render. Returns a stop() function.
export function startGameLoop(state, onTick) {
  const interval = setInterval(() => {
    state.clock.totalMinutes += MINUTES_PER_TICK;

    if (state.currentAction) {
      state.currentAction.elapsedSeconds += 1;

      if (state.currentAction.elapsedSeconds % LOOT_ROLL_EVERY_N_TICKS === 0) {
        const action = getAction(state.currentAction.id);
        const rolled = [rollLootByType(action.lootType, state.currentAction.lootSubtype ?? action.lootSubtype)];
        // Coal and gemstones aren't chosen on the mine selector - they turn up
        // while you work, tier-gated by the mine you're standing in. Rolled
        // separately so they add to the ore rather than competing with it.
        if (action.id === "mine") rolled.push(...rollMineBonuses(state));

        for (const loot of rolled) {
          if (!loot) continue;
          addItem(state, loot.itemId, loot.qty);
          state.currentAction.gatheredThisSession[loot.itemId] =
            (state.currentAction.gatheredThisSession[loot.itemId] || 0) + loot.qty;
          logger.full("gameLoop", `Looted ${loot.qty}x ${loot.itemId} from ${action.id}.`);
        }

        if (action.skill) {
          grantSkillXp(state, action.skill, SKILL_XP_PER_GRANT);
        }

        // beginCombat() clears currentAction, so the gather stops here. The
        // loop has no ui handle to switch screens with - main.js's onTick
        // notices currentCombat and routes there.
        if (shouldAmbush(state)) {
          const encounter = spawnEncounter(state);
          if (encounter) {
            logger.info("gameLoop", `Ambushed at ${state.currentLocationId} while ${action.id}.`);
            beginCombat(state, encounter);
          }
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
