import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState, effectiveSkillLevel, activeAidBuffs } from "../../state/gameState.js";
import {
  isSpellKnown,
  isSpellUnlocked,
  canLearnSpell,
  learnSpell,
  canCastSpell,
  castSpell,
} from "../../data/magic.js";
import { SPELLS, aidSkillBonuses } from "../../magic_backbone.js";

// Picked out of the catalog rather than named: which spells carry a `learn`
// cost is tuning data that has already been re-pitched once (cure lost its cost
// and frost_spike gained one when every spell got a rarity), and these tests
// are about the mechanics, not about any particular spell.
const COSTED = Object.keys(SPELLS).find((id) => SPELLS[id].learn && !SPELLS[id].starter);
const FREE = Object.keys(SPELLS).find((id) => !SPELLS[id].learn && !SPELLS[id].starter);

// Enough magic level to be allowed to learn anything these tests reach for.
function mage(spellId) {
  const state = createInitialState();
  state.skills.magic.level = SPELLS[spellId]?.level ?? 1;
  return state;
}

test("isSpellKnown(): the starter spell is known from the start regardless of magic level", () => {
  const state = createInitialState();
  assert.equal(state.skills.magic.level, 1);
  assert.equal(isSpellKnown(state, "magic_missle"), true);
  assert.equal(isSpellKnown(state, "cure"), false);
});

test("isSpellUnlocked(): gated by magic skill level against the spell's own `level` field", () => {
  const state = createInitialState();
  assert.equal(isSpellUnlocked(state, "cure"), true); // level 1
  assert.equal(isSpellUnlocked(state, "fireball"), false); // level 2
  state.skills.magic.level = 2;
  assert.equal(isSpellUnlocked(state, "fireball"), true);
});

test("canLearnSpell()/learnSpell(): spends the learn cost, adds to state.spells, refuses without ingredients", () => {
  const state = mage(COSTED);
  const cost = SPELLS[COSTED].learn;
  assert.equal(canLearnSpell(state, COSTED), false, "no ingredients yet");

  // One spare of each, so the spend is visible in what's left.
  state.inventory = Object.fromEntries(Object.entries(cost).map(([id, qty]) => [id, qty + 1]));
  assert.equal(canLearnSpell(state, COSTED), true);

  const message = learnSpell(state, COSTED);
  assert.match(message, new RegExp(SPELLS[COSTED].name));
  assert.equal(state.spells.has(COSTED), true);
  for (const id of Object.keys(cost)) {
    assert.equal(state.inventory[id], 1, `${id} should be spent down to the spare`);
  }
  assert.equal(isSpellKnown(state, COSTED), true);
});

test("learnSpell(): a spell with no `learn` cost only needs the level gate", () => {
  const state = mage(FREE);
  assert.equal(canLearnSpell(state, FREE), true);
  assert.ok(learnSpell(state, FREE));
  assert.equal(state.spells.has(FREE), true);
});

test("learnSpell(): refuses (returns null) once already known, doesn't double-spend", () => {
  const state = mage(COSTED);
  const cost = SPELLS[COSTED].learn;
  state.inventory = Object.fromEntries(Object.entries(cost).map(([id, qty]) => [id, qty * 2]));

  learnSpell(state, COSTED);
  assert.equal(learnSpell(state, COSTED), null);
  for (const [id, qty] of Object.entries(cost)) {
    assert.equal(state.inventory[id], qty, "only spent once");
  }
});

test("canCastSpell()/castSpell(): heal clamps at hpMax and spends mp", () => {
  const state = createInitialState();
  state.inventory = { ley_crystals: 1, arcane_shard: 1 };
  learnSpell(state, "cure");
  state.hp = state.hpMax - 5;

  assert.equal(canCastSpell(state, "cure"), true);
  const message = castSpell(state, "cure");
  assert.match(message, /recover 5 HP/);
  assert.equal(state.hp, state.hpMax);
  assert.equal(state.mp, 100 - 6); // cure costs 6 mp
});

test("castSpell(): teleport moves state.currentLocationId instantly", () => {
  const state = createInitialState();
  state.skills.magic.level = 2;
  state.inventory = { ley_crystals: 10, arcane_shard: 10 };
  learnSpell(state, "wilderness_teleport"); // has both a level and an item cost
  state.currentLocationId = "town_square";

  const message = castSpell(state, "wilderness_teleport");
  assert.equal(state.currentLocationId, "wilderness");
  assert.match(message, /teleport to wilderness/);
});

// Casting an enemy-facing spell from the spellbook (no target) is a no-op
// rather than an error - and critically must NOT charge for it, since the
// spell never went off.
test("castSpell(): enemy-facing spells with no target refuse without spending mp/xp", () => {
  const state = createInitialState();
  const before = state.mp;
  const message = castSpell(state, "magic_missle"); // attack type, starter, always known
  assert.match(message, /nothing here to hit/);
  assert.equal(state.mp, before);
  assert.equal(state.skills.magic.xp, 0);
});

test("castSpell(): attack spell damages the supplied target and spends mp/xp", () => {
  const state = createInitialState();
  const before = state.mp;
  const target = { id: "weak_goblin", name: "Weak Goblin", hp: 30, hpMax: 30 };

  const message = castSpell(state, "magic_missle", target); // damage: 10
  assert.equal(target.hp, 20);
  assert.match(message, /Magic Missle at Weak Goblin for 10/);
  assert.equal(state.mp, before - 6);
  assert.equal(state.skills.magic.xp, 3);
});

test("castSpell(): debuff and poison land on the target rather than the caster", () => {
  const state = createInitialState();
  state.skills.magic.level = 10;
  state.spells = new Set(["weaken", "poison"]);
  const target = { id: "weak_goblin", name: "Weak Goblin", hp: 30, hpMax: 30 };

  castSpell(state, "weaken", target);
  assert.equal(target.attackDebuff, SPELLS.weaken.debuff.attack);

  castSpell(state, "poison", target);
  assert.deepEqual(target.poison, { dps: SPELLS.poison.poison.dps, remaining: SPELLS.poison.poison.duration });
  assert.equal(state.hp, state.hpMax, "the caster should be untouched");
});

test("canCastSpell()/castSpell(): refuses when known but out of mp", () => {
  const state = createInitialState();
  state.mp = 2;
  assert.equal(canCastSpell(state, "magic_missle"), false); // needs 6
  assert.equal(castSpell(state, "magic_missle"), null);
});

test("canCastSpell()/castSpell(): refuses an unknown spell even with enough mp", () => {
  const state = createInitialState();
  assert.equal(canCastSpell(state, "cure"), false);
  assert.equal(castSpell(state, "cure"), null);
});

// ----- Aid spells (the Blessed line) -----
//
// Aid was the one spell type castSpell() had no branch for, so all eight of
// them charged their mana and returned "but nothing happens". They now raise
// the EFFECTIVE skill level for a timed window.

// Knows `spellId`, has the magic level for it, and enough mana to cast.
function blessed(spellId) {
  const state = mage(spellId);
  state.spells.add(spellId);
  state.mp = state.mpMax = 500;
  return state;
}

test("castSpell(): an aid spell raises the effective skill level, not the trained one", () => {
  const state = blessed("blessed pickaxe");
  const trainedBefore = state.skills.mining.level;

  const message = castSpell(state, "blessed pickaxe");
  assert.match(message, /Mining is sharpened/);
  assert.equal(effectiveSkillLevel(state, "mining"), trainedBefore + SPELLS["blessed pickaxe"].buff.mining);
  // The rule that keeps quests and achievements honest: they read the trained
  // number, so a 24-mana spell must not complete "reach mining level 10".
  assert.equal(state.skills.mining.level, trainedBefore);
});

test("castSpell(): an aid spell expires on the clock and takes its bonus with it", () => {
  const state = blessed("blessed pickaxe");
  const trained = state.skills.mining.level;
  castSpell(state, "blessed pickaxe");
  assert.ok(effectiveSkillLevel(state, "mining") > trained);

  state.clock.totalMinutes += SPELLS["blessed pickaxe"].duration - 1;
  assert.ok(effectiveSkillLevel(state, "mining") > trained, "still live one minute short");

  state.clock.totalMinutes += 1;
  assert.equal(effectiveSkillLevel(state, "mining"), trained);
  assert.deepEqual(activeAidBuffs(state), []);
});

test("castSpell(): recasting the same blessing refreshes it rather than stacking it", () => {
  const state = blessed("blessed pickaxe");
  const trained = state.skills.mining.level;
  const bonus = SPELLS["blessed pickaxe"].buff.mining;

  castSpell(state, "blessed pickaxe");
  state.clock.totalMinutes += 500;
  castSpell(state, "blessed pickaxe");

  assert.equal(activeAidBuffs(state).length, 1, "one entry, not two");
  assert.equal(effectiveSkillLevel(state, "mining"), trained + bonus, "and one bonus, not two");

  // Refreshed: the first cast's window would have closed by now.
  state.clock.totalMinutes += 200;
  assert.equal(effectiveSkillLevel(state, "mining"), trained + bonus);
});

test("castSpell(): two different blessings stack, which is what the godlike ones are for", () => {
  const state = blessed("blessed pickaxe");
  state.spells.add("zions blessing");
  const trained = state.skills.mining.level;

  castSpell(state, "blessed pickaxe");
  castSpell(state, "zions blessing");

  assert.equal(activeAidBuffs(state).length, 2);
  assert.equal(
    effectiveSkillLevel(state, "mining"),
    trained + SPELLS["blessed pickaxe"].buff.mining + SPELLS["zions blessing"].buff.mining
  );
});

test("aidSkillBonuses(): `gathering` is not a skill id and fans out to the four hand-gathering skills", () => {
  const bonuses = aidSkillBonuses(SPELLS["blessed satchel"]);
  assert.deepEqual(Object.keys(bonuses).sort(), ["fishing", "foraging", "trapping", "woodcutting"]);
  for (const value of Object.values(bonuses)) assert.equal(value, SPELLS["blessed satchel"].buff.gathering);
  // Mining is deliberately excluded - Blessed Pickaxe covers it, and the
  // godlike blessings buff mining and gathering as separate entries.
  assert.equal(bonuses.mining, undefined);
});

test("aidSkillBonuses(): a non-aid spell resolves to nothing, so a stray save row can't grant a combat buff", () => {
  // haste carries buff: { speed: 5 }, which is a combat stat and not a skill
  // level. state.aidBuffs is rebuilt from stored spell ids on load, so this
  // guard is what stops a hand-edited row from granting a timed +5 speed.
  assert.deepEqual(aidSkillBonuses(SPELLS.haste), {});
  const state = createInitialState();
  state.aidBuffs = [{ spellId: "haste", untilMinutes: state.clock.totalMinutes + 999 }];
  assert.equal(effectiveSkillLevel(state, "speed"), state.skills.speed.level);
});

test("castSpell(): a blessing works out of combat, unlike a buff", () => {
  const state = blessed("blessed hammer");
  assert.equal(state.currentCombat, null);
  assert.match(castSpell(state, "blessed hammer"), /Smithing is sharpened/);
  assert.equal(activeAidBuffs(state).length, 1);
});
