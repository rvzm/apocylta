import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, walletTotal } from "../../state/gameState.js";
import { purseFromBase } from "../../currency_backbone.js";
import {
  buildEncounter,
  spawnEncounter,
  beginCombat,
  endCombat,
  currentEnemy,
  resolveRound,
  resolveDefeat,
  attemptFlee,
  usePotion,
  playerAttackPower,
  playerDefensePower,
  damageReduction,
  enemyStrike,
  canChallengeBoss,
  BOSS_LEVEL_REQUIREMENT,
} from "../../data/combat.js";
import { BASIC_ENEMIES } from "../../enemy_backbone.js";
import { DIFFICULTY_LEVELS } from "../../player_backbone.js";
import { player_config } from "../../config.js";

// Every rolling function in data/combat.js takes an rng last, so these fix it
// rather than stubbing Math.random. 0.99 never triggers a chance-gated branch
// (crit/dodge/block/flee all compare rng() < chance); 0.0 always does.
const NEVER = () => 0.99;
const ALWAYS = () => 0.0;

// A sequence rng for the cases that need specific successive rolls.
function seq(...values) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

function fighter({ difficulty = "normal", ...overrides } = {}) {
  const state = createInitialState();
  state.difficulty = difficulty;
  state.currentLocationId = "wilderness";
  Object.assign(state, overrides);
  return state;
}

// ---------------------------------------------------------------- stat math

test("playerAttackPower(): unarmed base plus fighting level, with an empty weapon slot", () => {
  const state = fighter();
  // A new character starts with the starter dagger equipped, so the unarmed
  // path has to be reached by taking it off rather than by not having one.
  state.equipment.weapon = null;
  assert.equal(playerAttackPower(state), 2 + 1); // UNARMED_DAMAGE + fighting level 1

  state.skills.fighting.level = 10;
  assert.equal(playerAttackPower(state), 2 + 10);
});

test("playerAttackPower(): reads the weapon slot, and falls back to the separate slingshot slot", () => {
  const state = fighter();
  state.equipment.weapon = "iron_sword"; // damage 10
  assert.equal(playerAttackPower(state), 10 + 1);

  // A slingshot build leaves equipment.weapon null - it lives in its own slot.
  state.equipment.weapon = null;
  state.equipment.slingshot = "wooden_slingshot"; // damage 5
  assert.equal(playerAttackPower(state), 5 + 1);
});

test("playerDefensePower(): sums defense across every equipped slot plus the defense skill", () => {
  const state = fighter();
  assert.equal(playerDefensePower(state), 1); // defense level 1, nothing equipped

  state.equipment.torso = "tin_chestplate"; // defense 20
  state.equipment.head = "simple_hood"; // defense 2
  state.equipment.weapon = "iron_sword"; // no defense - must not contribute
  assert.equal(playerDefensePower(state), 1 + 20 + 2);
});

test("damageReduction(): diminishing returns, capped so no build becomes untouchable", () => {
  const state = fighter();

  // Flat subtraction would zero out incoming damage at these armor totals -
  // this is the check that mitigation stays a fraction.
  state.skills.defense.level = 1;
  const light = damageReduction(state);
  assert.ok(light > 0 && light < 0.05, `expected a small reduction, got ${light}`);

  state.skills.defense.level = 9999;
  assert.equal(damageReduction(state), 0.8, "must clamp at MAX_MITIGATION");
});

test("enemyStrike(): mage enemies with no dps derive damage from their best attack spell", () => {
  assert.deepEqual(enemyStrike(BASIC_ENEMIES.weak_goblin), { power: 3, spell: null });

  // mage_goblin carries spells but no dps at all.
  assert.equal(BASIC_ENEMIES.mage_goblin.dps, undefined);
  const cast = enemyStrike(BASIC_ENEMIES.mage_goblin);
  assert.equal(cast.power, 10); // magic_missle
  assert.equal(cast.spell, "Magic Missle");

  // strong_acolyte knows fireball (20) as well as magic_missle (10) - takes the best.
  assert.equal(enemyStrike(BASIC_ENEMIES.strong_acolyte).power, 20);
});

// ---------------------------------------------------------------- encounters

test("buildEncounter(): scales enemy hp by the difficulty's enemyHp modifier", () => {
  const normal = buildEncounter(fighter({ difficulty: "normal" }), "weak_goblin");
  assert.equal(normal.enemies[0].hp, 10);
  assert.equal(normal.enemies[0].hpMax, 10);

  assert.equal(buildEncounter(fighter({ difficulty: "casual" }), "weak_goblin").enemies[0].hp, 5); // x0.5
  assert.equal(buildEncounter(fighter({ difficulty: "nightmare" }), "weak_goblin").enemies[0].hp, 20); // x2
});

test("buildEncounter(): a group becomes a queue of its members, never the group itself", () => {
  const state = fighter();

  const pack = buildEncounter(state, "mixed_group");
  assert.deepEqual(
    pack.enemies.map((e) => e.id),
    ["weak_goblin", "small_dwarf", "weak_human"]
  );
  // The group is a header - it must never be queued as a combatant, since it
  // carries no hp of its own to fight with.
  assert.ok(!pack.enemies.some((e) => e.id === "mixed_group"));
  assert.equal(pack.sourceId, "mixed_group", "the group id survives as the header");

  const counted = buildEncounter(state, "large_mixed_group"); // { id: count } form
  assert.equal(counted.enemies.length, 6);
  assert.deepEqual(counted.enemies.slice(0, 2).map((e) => e.id), ["weak_goblin", "weak_goblin"]);
});

test("buildEncounter(): a lone enemy is a queue of one", () => {
  const solo = buildEncounter(fighter(), "weak_goblin");
  assert.equal(solo.enemies.length, 1);
  assert.equal(solo.enemies[0].id, "weak_goblin");
  assert.equal(solo.sourceId, "weak_goblin");
});

test("spawnEncounter(): draws from the location's pool, and from boss lists when asked", () => {
  const state = fighter({ currentLocationId: "abandoned_village" });

  const normal = spawnEncounter(state, {}, ALWAYS);
  assert.ok(normal, "abandoned_village has a spawn pool");
  assert.equal(normal.boss, false);

  const boss = spawnEncounter(state, { boss: true }, ALWAYS);
  assert.equal(boss.enemies[0].id, "hubert"); // the location's only boss
  assert.equal(boss.boss, true);
});

test("spawnEncounter(): returns null in a location with no pool, rather than throwing", () => {
  const state = fighter({ currentLocationId: "town_square" });
  assert.equal(spawnEncounter(state, {}, ALWAYS), null);
  assert.equal(spawnEncounter(state, { boss: true }, ALWAYS), null);
});

// Groups sit in the same `enemies` pool as lone enemies, so a uniform pick made
// a whole pack exactly as likely as one goblin - at every difficulty.
// DIFFICULTY_LEVELS' modifiers.groupSpawn weights them instead.
test("spawnEncounter(): groupSpawn weights how often a pack turns up", () => {
  // wilderness's pool is four lone goblins/humans plus weak_goblin_group.
  const sample = (difficulty) => {
    const state = fighter({ currentLocationId: "wilderness" });
    state.difficulty = difficulty;
    const seen = { group: 0, solo: 0 };
    for (let i = 0; i < 600; i++) {
      const encounter = spawnEncounter(state, {}, Math.random);
      seen[encounter.sourceId === "weak_goblin_group" ? "group" : "solo"] += 1;
    }
    return seen;
  };

  const casual = sample("casual"); // groupSpawn 0.25
  const nightmare = sample("nightmare"); // groupSpawn 2.5
  assert.ok(
    nightmare.group > casual.group * 2,
    `nightmare should turn up far more packs (casual ${casual.group}, nightmare ${nightmare.group})`
  );
  assert.ok(casual.solo > 0 && nightmare.solo > 0, "lone enemies never stop appearing");
});

test("spawnEncounter(): a groupSpawn of 0 keeps packs out entirely", () => {
  const state = fighter({ currentLocationId: "wilderness" });
  state.difficulty = "no_groups_here";
  DIFFICULTY_LEVELS.no_groups_here = { logic: {}, modifiers: { groupSpawn: 0 } };

  try {
    for (let i = 0; i < 200; i++) {
      assert.notEqual(spawnEncounter(state, {}, Math.random).sourceId, "weak_goblin_group");
    }
  } finally {
    delete DIFFICULTY_LEVELS.no_groups_here;
  }
});

test("beginCombat(): interrupts whatever action was running", () => {
  const state = fighter();
  state.currentAction = { id: "gather_scraps", elapsedSeconds: 4, gatheredThisSession: {} };

  beginCombat(state, buildEncounter(state, "weak_goblin"));
  assert.equal(state.currentAction, null, "you can't keep gathering mid-fight");
  assert.ok(state.currentCombat);

  endCombat(state);
  assert.equal(state.currentCombat, null);
});

test("canChallengeBoss(): gated on the fighting level SKILL_BLOCKS already declared", () => {
  const state = fighter();
  state.skills.fighting.level = BOSS_LEVEL_REQUIREMENT - 1;
  assert.equal(canChallengeBoss(state), false);
  state.skills.fighting.level = BOSS_LEVEL_REQUIREMENT;
  assert.equal(canChallengeBoss(state), true);
});

// ---------------------------------------------------------------- rounds

test("resolveRound(): an attack damages the enemy and grants fighting xp", () => {
  const state = fighter();
  state.equipment.weapon = "iron_sword"; // 10 + level 1 = 11
  beginCombat(state, buildEncounter(state, "small_dwarf")); // 25 hp

  const lines = resolveRound(state, { type: "attack" }, NEVER);

  assert.equal(currentEnemy(state.currentCombat).hp, 14);
  assert.ok(state.skills.fighting.xp > 0);
  assert.match(lines.join(" "), /You strike Small Dwarf with your Iron Sword for 11/);
  assert.equal(state.currentCombat.round, 1);
});

test("resolveRound(): a critical hit multiplies damage by the configured multiplier", () => {
  const state = fighter();
  state.equipment.weapon = "iron_sword";
  beginCombat(state, buildEncounter(state, "kovetch")); // 300 hp, survives either way

  // First roll gates the crit; later rolls gate dodge/block, which stay off.
  const lines = resolveRound(state, { type: "attack" }, seq(0.0, 0.99, 0.99));
  assert.match(lines.join(" "), /for 22 \(critical!\)/); // 11 x2
});

test("resolveRound(): the enemy answers, damage is mitigated, and defense xp is granted", () => {
  const state = fighter();
  beginCombat(state, buildEncounter(state, "bow_goblin")); // dps 8

  const lines = resolveRound(state, { type: "attack" }, NEVER); // no crit, no dodge, no block

  assert.ok(state.hp < state.hpMax, "the enemy should have connected");
  assert.ok(state.skills.defense.xp > 0);
  assert.match(lines.join(" "), /Goblin Ranger hits you for/);
});

test("resolveRound(): dodging costs the enemy its hit and grants speed xp", () => {
  const state = fighter();
  beginCombat(state, buildEncounter(state, "bow_goblin"));

  // rng order in a round: crit gate, then dodge gate. Miss the crit, hit the dodge.
  const lines = resolveRound(state, { type: "attack" }, seq(0.99, 0.0));

  assert.equal(state.hp, state.hpMax, "a dodge should take no damage at all");
  assert.ok(state.skills.speed.xp > 0);
  assert.match(lines.join(" "), /You dodge/);
});

test("resolveRound(): blocking reduces the hit", () => {
  const blocked = fighter();
  beginCombat(blocked, buildEncounter(blocked, "berserker_raider")); // dps 20
  resolveRound(blocked, { type: "attack" }, seq(0.99, 0.99, 0.0)); // no crit, no dodge, block

  const unblocked = fighter();
  beginCombat(unblocked, buildEncounter(unblocked, "berserker_raider"));
  resolveRound(unblocked, { type: "attack" }, NEVER);

  assert.ok(
    blocked.hp > unblocked.hp,
    `blocking should hurt less (blocked ${blocked.hp} vs unblocked ${unblocked.hp})`
  );
});

test("resolveRound(): difficulty scales incoming damage via enemyDps", () => {
  const damageOn = (difficulty) => {
    const state = fighter({ difficulty });
    beginCombat(state, buildEncounter(state, "berserker_raider"));
    resolveRound(state, { type: "attack" }, NEVER);
    return state.hpMax - state.hp;
  };

  assert.ok(damageOn("casual") < damageOn("normal"), "casual halves enemy dps");
  assert.ok(damageOn("nightmare") > damageOn("normal"), "nightmare doubles it");
});

test("resolveRound(): a downed enemy yields xp/gold, is tallied, and ends the encounter", () => {
  const state = fighter();
  state.skills.fighting.level = 50; // one-shots a 10hp goblin
  beginCombat(state, buildEncounter(state, "weak_goblin"));

  const lines = resolveRound(state, { type: "attack" }, NEVER);

  assert.equal(state.currentCombat.outcome, "victory");
  assert.equal(state.enemiesDefeated.weak_goblin, 1);
  assert.deepEqual(state.currentCombat.defeated, ["weak_goblin"]);
  assert.ok(walletTotal(state) > 0, "kills pay out money");
  assert.ok(state.experience > 0, "kills grant player xp");
  assert.match(lines.join(" "), /Weak Goblin goes down/);
});

test("resolveRound(): a group is fought one enemy at a time, in order", () => {
  const state = fighter();
  state.skills.fighting.level = 50; // one-shot each member
  beginCombat(state, buildEncounter(state, "mixed_group"));

  assert.equal(currentEnemy(state.currentCombat).id, "weak_goblin");
  resolveRound(state, { type: "attack" }, NEVER);
  assert.equal(currentEnemy(state.currentCombat).id, "small_dwarf");
  assert.equal(state.currentCombat.outcome, null, "the fight isn't over yet");

  resolveRound(state, { type: "attack" }, NEVER);
  assert.equal(currentEnemy(state.currentCombat).id, "weak_human");

  resolveRound(state, { type: "attack" }, NEVER);
  assert.equal(state.currentCombat.outcome, "victory");
  assert.deepEqual(state.currentCombat.defeated, ["weak_goblin", "small_dwarf", "weak_human"]);
});

test("resolveRound(): is inert once the encounter has an outcome", () => {
  const state = fighter();
  state.skills.fighting.level = 50;
  beginCombat(state, buildEncounter(state, "weak_goblin"));
  resolveRound(state, { type: "attack" }, NEVER);

  const roundAfterVictory = state.currentCombat.round;
  assert.deepEqual(resolveRound(state, { type: "attack" }, NEVER), []);
  assert.equal(state.currentCombat.round, roundAfterVictory, "no further rounds may be spent");
});

test("resolveRound(): poison ticks down over subsequent rounds and then wears off", () => {
  const state = fighter();
  state.skills.magic.level = 10;
  state.spells = new Set(["poison"]);
  beginCombat(state, buildEncounter(state, "kovetch")); // big enough to outlive the poison

  resolveRound(state, { type: "spell", spellId: "poison" }, NEVER); // dps 5, duration 3
  const enemy = currentEnemy(state.currentCombat);
  assert.equal(enemy.poison.remaining, 2, "the cast round applies the first tick");

  resolveRound(state, { type: "attack" }, NEVER);
  assert.equal(enemy.poison.remaining, 1);
  resolveRound(state, { type: "attack" }, NEVER);
  assert.equal(enemy.poison, undefined, "poison should wear off");
});

// ---------------------------------------------------------------- flee

test("attemptFlee(): succeeds or fails on the roll, and grants speed xp only on success", () => {
  const escaped = fighter();
  assert.equal(attemptFlee(escaped, ALWAYS), true);
  assert.ok(escaped.skills.speed.xp > 0);

  const trapped = fighter();
  assert.equal(attemptFlee(trapped, NEVER), false);
  assert.equal(trapped.skills.speed.xp, 0);
});

test("resolveRound(): a successful flee ends the encounter with no rewards", () => {
  const state = fighter();
  beginCombat(state, buildEncounter(state, "weak_goblin"));

  resolveRound(state, { type: "flee" }, ALWAYS);

  assert.equal(state.currentCombat.outcome, "fled");
  assert.equal(walletTotal(state), 0, "fleeing pays nothing");
  assert.deepEqual(state.enemiesDefeated, {});
});

test("resolveRound(): a failed flee still costs you the round and takes a hit", () => {
  const state = fighter();
  beginCombat(state, buildEncounter(state, "bow_goblin"));

  const lines = resolveRound(state, { type: "flee" }, NEVER);

  assert.equal(state.currentCombat.outcome, null);
  assert.ok(state.hp < state.hpMax, "failing to flee leaves you exposed");
  assert.match(lines.join(" "), /cut you off/);
});

// ---------------------------------------------------------------- potions

test("usePotion(): heal and mana potions restore and are consumed", () => {
  const state = fighter();
  state.hp = 50;
  state.mp = 50;
  state.inventory = { healing_potion: 2, mana_potion: 1 };
  beginCombat(state, buildEncounter(state, "kovetch"));

  usePotion(state, "healing_potion"); // heal 20
  assert.equal(state.hp, 70);
  assert.equal(state.inventory.healing_potion, 1);

  usePotion(state, "mana_potion"); // mana_restore 20
  assert.equal(state.mp, 70);
  assert.equal(state.inventory.mana_potion, undefined, "the last one is removed outright");
});

// usePotion() delegates to data/items.js's useItem(), so drinking mid-fight
// pays item_backbone.js's CONSUME economy exactly like drinking from the
// backpack does - the point of routing both through one function.
test("usePotion(): honours CONSUME - alchemy xp and the empty bottle back", () => {
  const state = fighter();
  state.hp = 50;
  state.inventory = { healing_potion: 1 };
  beginCombat(state, buildEncounter(state, "kovetch"));

  const xpBefore = state.skills.alchemy.xp;
  usePotion(state, "healing_potion");

  assert.ok(state.skills.alchemy.xp > xpBefore, "drinking a potion trains alchemy");
  assert.equal(state.inventory.empty_bottle, 1);
  assert.equal(state.lifetime.used.healing_potion, 1);
});

test("usePotion(): refuses a heal potion at full hp instead of wasting it", () => {
  const state = fighter();
  state.hp = state.hpMax;
  state.inventory = { healing_potion: 1 };
  beginCombat(state, buildEncounter(state, "kovetch"));

  assert.equal(usePotion(state, "healing_potion"), null);
  assert.deepEqual(state.inventory, { healing_potion: 1 }, "not consumed, no bottle");
});

test("usePotion(): refuses items that aren't potions or aren't held", () => {
  const state = fighter();
  state.inventory = { stone: 5 };
  beginCombat(state, buildEncounter(state, "weak_goblin"));

  assert.equal(usePotion(state, "stone"), null);
  assert.equal(usePotion(state, "healing_potion"), null, "not in the inventory");
  assert.deepEqual(state.inventory, { stone: 5 });
});

test("usePotion(): a buff potion raises the stat for the encounter only", () => {
  const state = fighter();
  state.inventory = { attack_potion: 1 };
  beginCombat(state, buildEncounter(state, "kovetch"));

  const before = playerAttackPower(state);
  usePotion(state, "attack_potion");

  assert.ok(playerAttackPower(state) > before);
  endCombat(state);
  assert.equal(playerAttackPower(state), before, "buffs die with the encounter");
});

// ---------------------------------------------------------------- defeat

test("resolveDefeat(): standard difficulty drops the backpack and wakes you at the start", () => {
  const state = fighter({ difficulty: "normal" });
  state.cur = purseFromBase(900);
  state.inventory = { stone: 40, iron_sword: 2 };
  state.equipment.torso = "tin_chestplate";
  state.currentLocationId = "desert";
  state.skills.fighting.level = 12;
  state.level = 7;
  beginCombat(state, buildEncounter(state, "angry_raider"));

  const result = resolveDefeat(state);

  assert.equal(result.permadeath, false);
  assert.equal(result.itemsLost, 42);
  assert.equal(result.goldLost, 900);
  assert.equal(state.currentLocationId, player_config.startingLocation);
  assert.equal(walletTotal(state), player_config.startingGold);
  assert.equal(state.hp, state.hpMax);
  assert.equal(state.equipment.torso, "tin_chestplate", "equipment is kept");
  assert.equal(state.skills.fighting.level, 12, "skills are kept");
  assert.equal(state.level, 7, "player level is kept");
  // STARTER_ITEMS are handed back - the belt matters, addItem() is belt-gated.
  assert.deepEqual(state.inventory, { leather_belt: 1, wooden_dagger: 1 });
  assert.equal(state.currentCombat.outcome, "defeat");
});

test("resolveDefeat(): survival/nightmare flag permadeath and leave the character untouched", () => {
  for (const difficulty of ["survival", "nightmare"]) {
    const state = fighter({ difficulty });
    state.cur = purseFromBase(900);
    state.inventory = { stone: 40 };
    state.currentLocationId = "desert";
    beginCombat(state, buildEncounter(state, "angry_raider"));

    const result = resolveDefeat(state);

    assert.equal(result.permadeath, true, difficulty);
    assert.equal(state.currentCombat.permadeath, true, difficulty);
    // Nothing is reset here - ui/screens/defeat.js owns deleting the save.
    assert.deepEqual(state.inventory, { stone: 40 }, difficulty);
    assert.equal(walletTotal(state), 900, difficulty);
    assert.equal(state.currentLocationId, "desert", difficulty);
  }
});

test("resolveRound(): hp hitting zero resolves defeat and records it for the defeat screen", () => {
  const state = fighter({ difficulty: "normal" });
  state.hp = 1;
  state.inventory = { stone: 3 };
  beginCombat(state, buildEncounter(state, "deranged_raider")); // dps 50

  const lines = resolveRound(state, { type: "attack" }, NEVER);

  assert.equal(state.currentCombat.outcome, "defeat");
  assert.deepEqual(state.lastDefeat, { permadeath: false, itemsLost: 3, goldLost: 0 });
  assert.match(lines.join(" "), /You collapse/);
  // The same round that kills you also revives you back at the start - hp is
  // restored, so "did I die" is answered by the outcome, never by hp === 0.
  assert.equal(state.hp, state.hpMax);
  assert.equal(state.currentLocationId, player_config.startingLocation);
});

test("resolveRound(): a revive item in the backpack is spent instead of dying", () => {
  const state = fighter({ difficulty: "normal" });
  state.hp = 1;
  state.cur = purseFromBase(900);
  state.inventory = { stone: 3, revive: 1 };
  beginCombat(state, buildEncounter(state, "deranged_raider")); // dps 50

  const lines = resolveRound(state, { type: "attack" }, NEVER);

  assert.equal(state.currentCombat.outcome, null, "the fight carries on");
  assert.equal(state.lastDefeat, null, "no defeat was recorded");
  assert.match(lines.join(" "), /pulls you back from the brink/);
  assert.doesNotMatch(lines.join(" "), /You collapse/);

  assert.equal(state.hp, state.hpMax);
  assert.equal(state.inventory.revive, undefined, "the revive is spent");
  assert.equal(state.inventory.stone, 3, "the backpack survives intact");
  assert.equal(walletTotal(state), 900);
  assert.equal(state.currentLocationId, "wilderness", "you stay where you fell");
});

// The whole point of a revive on survival/nightmare: permadeath is what
// resolveDefeat() hangs off, so intercepting before it is what saves the run.
test("resolveRound(): a revive prevents permadeath too", () => {
  const state = fighter({ difficulty: "nightmare" });
  state.hp = 1;
  state.inventory = { revive: 1 };
  beginCombat(state, buildEncounter(state, "deranged_raider"));

  resolveRound(state, { type: "attack" }, NEVER);

  assert.equal(state.currentCombat.outcome, null);
  assert.equal(state.currentCombat.permadeath, undefined);
  assert.equal(state.lastDefeat, null);
  assert.ok(state.hp > 0);
});

test("resolveRound(): with the revive already spent, the next killing blow lands", () => {
  const state = fighter({ difficulty: "normal" });
  state.hp = 1;
  state.inventory = { revive: 1 };
  beginCombat(state, buildEncounter(state, "deranged_raider"));

  resolveRound(state, { type: "attack" }, NEVER); // revived, backpack now empty of revives
  state.hp = 1;
  const lines = resolveRound(state, { type: "attack" }, NEVER);

  assert.equal(state.currentCombat.outcome, "defeat");
  assert.match(lines.join(" "), /You collapse/);
});

// ---------------------------------------------------------------- ambush trigger

test("shouldAmbush(): never fires in a safe zone or when already in combat", async () => {
  const { shouldAmbush } = await import("../../state/gameLoop.js");

  const safe = fighter({ currentLocationId: "town_square" });
  assert.equal(shouldAmbush(safe, ALWAYS), false);

  const busy = fighter();
  beginCombat(busy, buildEncounter(busy, "weak_goblin"));
  assert.equal(shouldAmbush(busy, ALWAYS), false, "one fight at a time");
});

test("shouldAmbush(): fires in an unsafe zone on a low roll, not a high one", async () => {
  const { shouldAmbush } = await import("../../state/gameLoop.js");
  const state = fighter({ currentLocationId: "wilderness" });

  assert.equal(shouldAmbush(state, ALWAYS), true);
  assert.equal(shouldAmbush(state, NEVER), false);
});

test("shouldAmbush(): difficulty scales the spawn rate via logic.enemySpawn", async () => {
  const { shouldAmbush } = await import("../../state/gameLoop.js");
  const { combat_config } = await import("../../config.js");
  const base = combat_config.enemySpawnRate;

  // A roll between the casual (x0.5) and nightmare (x2) thresholds separates them.
  const between = () => base * 1.5;
  assert.equal(shouldAmbush(fighter({ difficulty: "casual", currentLocationId: "wilderness" }), between), false);
  assert.equal(shouldAmbush(fighter({ difficulty: "nightmare", currentLocationId: "wilderness" }), between), true);
});

// ---------------------------------------------------------------- screen helper

test("formatEnemyBar(): fills proportionally and never overruns its width", async () => {
  const { formatEnemyBar } = await import("../../ui/screens/combat.js");

  assert.equal(formatEnemyBar(10, 10, 10), "##########");
  assert.equal(formatEnemyBar(5, 10, 10), "#####-----");
  assert.equal(formatEnemyBar(0, 10, 10), "----------");
  // Guards against a divide-by-zero or a negative hp producing a ragged bar.
  assert.equal(formatEnemyBar(0, 0, 10).length, 10);
  assert.equal(formatEnemyBar(-5, 10, 10), "----------");
});

// ---------------------------------------------------------------- group bonus

test("clearing a pack grants the group's xp bonus once, on top of the members'", async () => {
  const { GROUP_ENEMIES, ALL_ENEMIES } = await import("../../enemy_backbone.js");
  const group = GROUP_ENEMIES.mixed_group;
  const memberXp = group.members.reduce((sum, id) => sum + ALL_ENEMIES[id].xp, 0);

  const state = fighter();
  state.skills.fighting.level = 50; // one-shot each member
  beginCombat(state, buildEncounter(state, "mixed_group"));

  let lines = [];
  while (!state.currentCombat.outcome) lines = resolveRound(state, { type: "attack" }, NEVER);

  assert.equal(state.currentCombat.outcome, "victory");
  assert.match(lines.join(" "), /You cleared the Mixed Group\. \+14 bonus xp\./);
  // Player xp also rises from fighting-skill level-ups (grantSkillXp cascades),
  // so assert the bonus is included rather than pinning an exact total.
  assert.ok(state.experience >= memberXp + group.xp, `expected at least ${memberXp + group.xp}, got ${state.experience}`);
});

test("the group bonus is granted once per encounter, not once per member", () => {
  const state = fighter();
  state.skills.fighting.level = 50;
  beginCombat(state, buildEncounter(state, "large_mixed_group")); // 6 members

  const bonusLines = [];
  while (!state.currentCombat.outcome) {
    bonusLines.push(...resolveRound(state, { type: "attack" }, NEVER).filter((l) => /bonus xp/.test(l)));
  }
  assert.equal(bonusLines.length, 1);
});

test("a lone enemy pays no group bonus", () => {
  const state = fighter();
  state.skills.fighting.level = 50;
  beginCombat(state, buildEncounter(state, "weak_goblin"));

  const lines = resolveRound(state, { type: "attack" }, NEVER);
  assert.equal(state.currentCombat.outcome, "victory");
  assert.doesNotMatch(lines.join(" "), /bonus xp/);
});

test("fleeing a pack pays no group bonus", () => {
  const state = fighter();
  beginCombat(state, buildEncounter(state, "mixed_group"));

  const lines = resolveRound(state, { type: "flee" }, ALWAYS);
  assert.equal(state.currentCombat.outcome, "fled");
  assert.doesNotMatch(lines.join(" "), /bonus xp/);
  assert.equal(state.experience, 0);
});

test("only members are recorded as kills - never the group", () => {
  const state = fighter();
  state.skills.fighting.level = 50;
  beginCombat(state, buildEncounter(state, "large_mixed_group"));
  while (!state.currentCombat.outcome) resolveRound(state, { type: "attack" }, NEVER);

  // A group is a header, not an enemy, so it must never reach the lifetime
  // tally that drives defeatEnemy/totalEnemies objectives.
  assert.deepEqual(state.enemiesDefeated, { weak_goblin: 2, small_dwarf: 2, weak_human: 2 });
  assert.ok(!("large_mixed_group" in state.enemiesDefeated));
  assert.deepEqual(state.currentCombat.defeated, [
    "weak_goblin",
    "weak_goblin",
    "small_dwarf",
    "small_dwarf",
    "weak_human",
    "weak_human",
  ]);
});

test("the combat screen's group header counts position, and stops counting once cleared", async () => {
  const { buildGroupHeader } = await import("../../ui/screens/combat.js");
  const state = fighter();
  state.skills.fighting.level = 50;
  beginCombat(state, buildEncounter(state, "weak_goblin_group")); // 2 members

  assert.equal(buildGroupHeader(state.currentCombat), "Weak Goblin Group  -  1 of 2");
  resolveRound(state, { type: "attack" }, NEVER);
  assert.equal(buildGroupHeader(state.currentCombat), "Weak Goblin Group  -  2 of 2");

  // index runs past the end on the final kill - it must not read "3 of 2".
  resolveRound(state, { type: "attack" }, NEVER);
  assert.equal(state.currentCombat.outcome, "victory");
  assert.equal(buildGroupHeader(state.currentCombat), "Weak Goblin Group  -  cleared");
});

test("a lone enemy gets no group header", () => {
  const state = fighter();
  beginCombat(state, buildEncounter(state, "weak_goblin"));
  return import("../../ui/screens/combat.js").then(({ buildGroupHeader }) => {
    assert.equal(buildGroupHeader(state.currentCombat), null);
  });
});
