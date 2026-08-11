import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, pushToast, activeToast, moveTo, walletTotal } from "../../state/gameState.js";
import {
  requirementStatus,
  isUnlocked,
  isEarned,
  achievementRows,
  evaluateAchievements,
  grantAchievementReward,
} from "../../data/achievements.js";
import { recordItemSold, recordItemCrafted, recordSpellCast } from "../../data/quests.js";
import { ACHIEVEMENTS } from "../../achievements_backbone.js";

function player(overrides = {}) {
  const state = createInitialState();
  state.difficulty = "normal";
  Object.assign(state, overrides);
  return state;
}

// Requirement types are exercised against temporary catalog entries so the
// tests cover the documented vocabulary rather than only the shapes the seven
// shipped achievements happen to use.
async function withFakeAchievement(id, definition, fn) {
  ACHIEVEMENTS[id] = definition;
  try {
    await fn();
  } finally {
    delete ACHIEVEMENTS[id];
  }
}

const fake = (req, reward = { gold: 0, xp: 0 }) => ({ name: "Fake", desc: "Fake", reward, req });

// ---------------------------------------------------------------- locations

test("locationsVisited: needs every listed location, and moveTo() is what records them", () => {
  const state = player();
  // A fresh character has already "visited" wherever they start.
  assert.deepEqual(requirementStatus(state, "welcome_to_apocylta", "locationsVisited"), {
    current: 1,
    target: 6,
    complete: false,
  });

  for (const id of ["wilderness", "north_path", "east_path", "west_path"]) moveTo(state, id);
  assert.equal(requirementStatus(state, "welcome_to_apocylta", "locationsVisited").current, 5);

  moveTo(state, "south_path");
  assert.equal(requirementStatus(state, "welcome_to_apocylta", "locationsVisited").complete, true);
});

test("reachLocation: satisfied by having been there, not by standing there now", async () => {
  const state = player();
  await withFakeAchievement("fake_reach", fake({ reachLocation: "wilderness" }), () => {
    assert.equal(requirementStatus(state, "fake_reach", "reachLocation").complete, false);

    moveTo(state, "wilderness");
    assert.equal(requirementStatus(state, "fake_reach", "reachLocation").complete, true);

    // Deliberately unlike the quest version, which is only true in the moment.
    moveTo(state, "town_square");
    assert.equal(requirementStatus(state, "fake_reach", "reachLocation").complete, true);
  });
});

// ---------------------------------------------------------------- combatEnd

test("combatEnd: *Max fields are upper bounds, not floors", async () => {
  const state = player();
  const at = (hp) => ({ combatEnd: { hp, hpMax: 100, mp: 100, mpMax: 100, enemies: 1, boss: false } });

  await withFakeAchievement("fake_hurt", fake({ combatEnd: { healthMaxP: 50 } }), () => {
    // "Win with less than 50% health remaining" - low hp qualifies, full hp doesn't.
    assert.equal(requirementStatus(state, "fake_hurt", "combatEnd", at(40)).complete, true);
    assert.equal(requirementStatus(state, "fake_hurt", "combatEnd", at(50)).complete, true);
    assert.equal(requirementStatus(state, "fake_hurt", "combatEnd", at(60)).complete, false);
  });
});

test("combatEnd: reports incomplete without an event context, so polling can't unlock it", () => {
  const state = player({ hp: 1 });
  // Nearly dead, but no fight just ended - this is the guard that stops
  // this_is_combat from unlocking on an ordinary tick.
  assert.equal(requirementStatus(state, "this_is_combat", "combatEnd").complete, false);
  assert.deepEqual(evaluateAchievements(state), []);
});

test("combatEnd: every listed condition must hold together", async () => {
  const state = player();
  const ctx = (over) => ({
    combatEnd: { hp: 100, hpMax: 100, mp: 100, mpMax: 100, enemies: 1, boss: false, ...over },
  });

  await withFakeAchievement("fake_both", fake({ combatEnd: { enemies: 3, boss: true } }), () => {
    assert.equal(requirementStatus(state, "fake_both", "combatEnd", ctx({ enemies: 3 })).complete, false);
    assert.equal(requirementStatus(state, "fake_both", "combatEnd", ctx({ boss: true })).complete, false);
    assert.equal(
      requirementStatus(state, "fake_both", "combatEnd", ctx({ enemies: 3, boss: true })).complete,
      true
    );
  });
});

test("combatEnd: mana conditions read the snapshot", async () => {
  const state = player();
  await withFakeAchievement("fake_mana", fake({ combatEnd: { manaMaxP: 25 } }), () => {
    const at = (mp) => ({ combatEnd: { hp: 100, hpMax: 100, mp, mpMax: 100, enemies: 1, boss: false } });
    assert.equal(requirementStatus(state, "fake_mana", "combatEnd", at(10)).complete, true);
    assert.equal(requirementStatus(state, "fake_mana", "combatEnd", at(90)).complete, false);
  });
});

// ---------------------------------------------------------------- enemies

test("totalEnemies: all four documented shapes", async () => {
  const state = player();
  state.enemiesDefeated = { weak_goblin: 4, small_dwarf: 2, hubert: 1 };

  await withFakeAchievement("fake_n", fake({ totalEnemies: 7 }), () => {
    assert.deepEqual(requirementStatus(state, "fake_n", "totalEnemies"), { current: 7, target: 7, complete: true });
  });
  await withFakeAchievement("fake_type", fake({ totalEnemies: { type: "goblin", quantity: 4 } }), () => {
    assert.equal(requirementStatus(state, "fake_type", "totalEnemies").complete, true);
  });
  await withFakeAchievement("fake_sub", fake({ totalEnemies: { type: "human", subtype: "boss", quantity: 1 } }), () => {
    // hubert is the only human/boss kill on record.
    assert.equal(requirementStatus(state, "fake_sub", "totalEnemies").complete, true);
  });
  await withFakeAchievement("fake_list", fake({ totalEnemies: ["goblin", "dwarf", "orc"] }), () => {
    // Two of the three types have kills; orc has none.
    assert.deepEqual(requirementStatus(state, "fake_list", "totalEnemies"), {
      current: 2,
      target: 3,
      complete: false,
    });
  });
});

// ---------------------------------------------------------------- ledgers

test("sellItem: the documented shapes, all fed by the lifetime ledger", async () => {
  const state = player();
  recordItemSold(state, "stone", 6);
  recordItemSold(state, "bone", 4);

  await withFakeAchievement("fake_any", fake({ sellItem: { quantity: 10 } }), () => {
    assert.equal(requirementStatus(state, "fake_any", "sellItem").complete, true);
  });
  await withFakeAchievement("fake_ids", fake({ sellItem: ["stone", "bone"] }), () => {
    assert.equal(requirementStatus(state, "fake_ids", "sellItem").complete, true);
  });
  await withFakeAchievement("fake_qty", fake({ sellItem: { stone: 6 } }), () => {
    assert.equal(requirementStatus(state, "fake_qty", "sellItem").complete, true);
  });
  await withFakeAchievement("fake_short", fake({ sellItem: { stone: 99 } }), () => {
    assert.equal(requirementStatus(state, "fake_short", "sellItem").complete, false);
  });
});

test("sellItem: the by-type shape resolves item types through the catalog", async () => {
  const state = player();
  recordItemSold(state, "stone", 3); // type "scrap", subtype "stone"

  await withFakeAchievement("fake_bytype", fake({ sellItem: { type: "scrap", quantity: 3 } }), () => {
    assert.equal(requirementStatus(state, "fake_bytype", "sellItem").complete, true);
  });
  await withFakeAchievement("fake_bysub", fake({ sellItem: { type: "scrap", subtype: "stone", quantity: 3 } }), () => {
    assert.equal(requirementStatus(state, "fake_bysub", "sellItem").complete, true);
  });
  await withFakeAchievement("fake_wrongsub", fake({ sellItem: { type: "scrap", subtype: "plastic", quantity: 1 } }), () => {
    assert.equal(requirementStatus(state, "fake_wrongsub", "sellItem").complete, false);
  });
  await withFakeAchievement("fake_wrongtype", fake({ sellItem: { type: "weapon", quantity: 1 } }), () => {
    assert.equal(requirementStatus(state, "fake_wrongtype", "sellItem").complete, false);
  });
});

test("craftItem: bare quantity counts anything; the typed form is per item id", async () => {
  const state = player();
  recordItemCrafted(state, "iron_sword", 3);
  recordItemCrafted(state, "copper_axe", 2);

  await withFakeAchievement("fake_anycraft", fake({ craftItem: { quantity: 5 } }), () => {
    assert.equal(requirementStatus(state, "fake_anycraft", "craftItem").complete, true);
  });
  await withFakeAchievement("fake_onecraft", fake({ craftItem: { type: "iron_sword", quantity: 3 } }), () => {
    assert.equal(requirementStatus(state, "fake_onecraft", "craftItem").complete, true);
  });
  await withFakeAchievement("fake_othercraft", fake({ craftItem: { type: "iron_sword", quantity: 4 } }), () => {
    assert.equal(requirementStatus(state, "fake_othercraft", "craftItem").complete, false);
  });
});

test("useSpell: both shapes, fed by the cast ledger", async () => {
  const state = player();
  recordSpellCast(state, "fireball");
  recordSpellCast(state, "fireball");
  recordSpellCast(state, "cure");

  await withFakeAchievement("fake_castlist", fake({ useSpell: ["fireball", "cure"] }), () => {
    assert.equal(requirementStatus(state, "fake_castlist", "useSpell").complete, true);
  });
  await withFakeAchievement("fake_castmissing", fake({ useSpell: ["fireball", "shield"] }), () => {
    assert.deepEqual(requirementStatus(state, "fake_castmissing", "useSpell"), {
      current: 1,
      target: 2,
      complete: false,
    });
  });
  await withFakeAchievement("fake_castcount", fake({ useSpell: { quantity: 3 } }), () => {
    assert.equal(requirementStatus(state, "fake_castcount", "useSpell").complete, true);
  });
});

// ---------------------------------------------------------------- live state

test("learnSpell, learnSkill, acquireItem, acquireHouse, acquireStation read live state", async () => {
  const state = player();
  state.spells = new Set(["fireball", "cure", "shield", "weaken", "poison"]);
  state.skills.smithing.level = 4;
  state.inventory = { stone: 10, bone: 1 };
  state.house = true;
  state.ownedStations = new Set(["forge", "anvil"]);

  assert.equal(requirementStatus(state, "beginner_mage", "learnSpell").complete, true);

  await withFakeAchievement("fake_spelllist", fake({ learnSpell: ["fireball", "cure"] }), () => {
    assert.equal(requirementStatus(state, "fake_spelllist", "learnSpell").complete, true);
  });
  await withFakeAchievement("fake_skill", fake({ learnSkill: { type: "smithing", level: 4 } }), () => {
    assert.equal(requirementStatus(state, "fake_skill", "learnSkill").complete, true);
  });
  await withFakeAchievement("fake_skillhigh", fake({ learnSkill: { type: "smithing", level: 9 } }), () => {
    assert.deepEqual(requirementStatus(state, "fake_skillhigh", "learnSkill"), {
      current: 4,
      target: 9,
      complete: false,
    });
  });
  await withFakeAchievement("fake_item", fake({ acquireItem: { stone: 10 } }), () => {
    assert.equal(requirementStatus(state, "fake_item", "acquireItem").complete, true);
  });
  await withFakeAchievement("fake_itemstr", fake({ acquireItem: "bone" }), () => {
    assert.equal(requirementStatus(state, "fake_itemstr", "acquireItem").complete, true);
  });
  await withFakeAchievement("fake_house", fake({ acquireHouse: true }), () => {
    assert.equal(requirementStatus(state, "fake_house", "acquireHouse").complete, true);
  });
  await withFakeAchievement("fake_stations", fake({ acquireStation: ["forge", "anvil"] }), () => {
    assert.equal(requirementStatus(state, "fake_stations", "acquireStation").complete, true);
  });
  await withFakeAchievement("fake_stationmissing", fake({ acquireStation: "alchemy_table" }), () => {
    assert.equal(requirementStatus(state, "fake_stationmissing", "acquireStation").complete, false);
  });
});

test("an unrecognised requirement type reports incomplete rather than passing by default", async () => {
  const state = player();
  await withFakeAchievement("fake_unknown", fake({ somethingUnimplemented: { quantity: 1 } }), () => {
    assert.equal(requirementStatus(state, "fake_unknown", "somethingUnimplemented").complete, false);
    assert.equal(isEarned(state, "fake_unknown"), false);
  });
});

test("isEarned(): multiple requirement keys are ANDed", async () => {
  const state = player({ house: true });
  await withFakeAchievement("fake_and", fake({ acquireHouse: true, reachLocation: "wilderness" }), () => {
    assert.equal(isEarned(state, "fake_and"), false, "only one of the two holds");
    moveTo(state, "wilderness");
    assert.equal(isEarned(state, "fake_and"), true);
  });
});

// ---------------------------------------------------------------- unlocking

test("evaluateAchievements(): unlocks, pays out, toasts, and never repeats", () => {
  const state = player();
  for (const id of ["wilderness", "north_path", "east_path", "west_path", "south_path"]) moveTo(state, id);

  const unlocked = evaluateAchievements(state);

  assert.deepEqual(unlocked.map((a) => a.id), ["welcome_to_apocylta"]);
  assert.equal(isUnlocked(state, "welcome_to_apocylta"), true);
  assert.equal(walletTotal(state), 50);
  assert.equal(state.experience, 50);
  assert.match(activeToast(state).text, /Welcome to apocylta/);
  assert.ok(state.achievements.welcome_to_apocylta.unlockedAt > 0);

  // Idempotence: the reward must not be paid twice on the next tick.
  assert.deepEqual(evaluateAchievements(state), []);
  assert.equal(walletTotal(state), 50);
  assert.equal(state.experience, 50);
});

test("grantAchievementReward(): handles the {player, skill} xp shape quests never use", () => {
  const state = player();
  grantAchievementReward(state, ACHIEVEMENTS.this_is_combat);

  assert.equal(walletTotal(state), 100);
  assert.equal(state.experience > 0, true, "the player portion is granted");
  assert.equal(state.skills.fighting.xp, 50);
  assert.equal(state.skills.defense.xp, 50);
});

test("grantAchievementReward(): handles a plain numeric xp reward", async () => {
  const state = player();
  await withFakeAchievement("fake_flat", fake({ acquireHouse: true }, { gold: 7, xp: 11 }), () => {
    grantAchievementReward(state, ACHIEVEMENTS.fake_flat);
    assert.equal(walletTotal(state), 7);
    assert.equal(state.experience, 11);
  });
});

test("evaluateAchievements(): a combatEnd context unlocks only on that pass", () => {
  const state = player();
  const ctx = { combatEnd: { hp: 30, hpMax: 100, mp: 100, mpMax: 100, enemies: 1, boss: false } };

  assert.deepEqual(evaluateAchievements(state).map((a) => a.id), [], "no unlock without the event");
  assert.deepEqual(evaluateAchievements(state, ctx).map((a) => a.id), ["this_is_combat"]);
});

test("evaluateAchievements(): tolerates a state with no achievements field", () => {
  const state = player();
  delete state.achievements;
  // An autosave written before achievements existed loads via Object.assign,
  // so the tick must not throw on it.
  assert.deepEqual(evaluateAchievements(state), []);
});

test("achievementRows(): reports every achievement with its unlock state and progress", () => {
  const state = player();
  moveTo(state, "wilderness");

  const rows = achievementRows(state);
  assert.equal(rows.length, Object.keys(ACHIEVEMENTS).length);

  const welcome = rows.find((r) => r.id === "welcome_to_apocylta");
  assert.equal(welcome.unlocked, false);
  assert.equal(welcome.unlockedAt, null);
  assert.deepEqual(welcome.requirements, [
    { key: "locationsVisited", current: 2, target: 6, complete: false },
  ]);
});

// ---------------------------------------------------------------- toasts

test("toasts: expire on the clock the game loop already advances", () => {
  const state = player();
  pushToast(state, "first");

  assert.equal(activeToast(state).text, "first");

  state.clock.totalMinutes += 5;
  assert.equal(activeToast(state)?.text, "first", "still live just before expiry");

  state.clock.totalMinutes += 1;
  assert.equal(activeToast(state), null);
  assert.deepEqual(state.toasts, [], "expired entries are dropped, not left to pile up");
});

test("toasts: a burst is shown oldest-first rather than all at once", () => {
  const state = player();
  pushToast(state, "first");
  pushToast(state, "second");

  assert.equal(activeToast(state).text, "first");
  state.clock.totalMinutes += 6;
  assert.equal(activeToast(state).text, "second");
});

test("activeToast(): null when nothing is queued", () => {
  assert.equal(activeToast(player()), null);
});
