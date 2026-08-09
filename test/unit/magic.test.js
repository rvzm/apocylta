import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../../state/gameState.js";
import {
  isSpellKnown,
  isSpellUnlocked,
  canLearnSpell,
  learnSpell,
  canCastSpell,
  castSpell,
} from "../../data/magic.js";
import { SPELLS } from "../../magic_backbone.js";

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
