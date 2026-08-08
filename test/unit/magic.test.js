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
  const state = createInitialState();
  assert.equal(canLearnSpell(state, "cure"), false, "no ingredients yet");

  state.inventory = { ley_crystals: 2, arcane_shard: 2 };
  assert.equal(canLearnSpell(state, "cure"), true);

  const message = learnSpell(state, "cure");
  assert.match(message, /Cure/);
  assert.equal(state.spells.has("cure"), true);
  assert.equal(state.inventory.ley_crystals, 1); // cure needs 1 of each
  assert.equal(state.inventory.arcane_shard, 1);
  assert.equal(isSpellKnown(state, "cure"), true);
});

test("learnSpell(): a spell with no `learn` cost only needs the level gate", () => {
  const state = createInitialState();
  state.skills.magic.level = 3;
  assert.equal(canLearnSpell(state, "frost_spike"), true);
  assert.ok(learnSpell(state, "frost_spike"));
  assert.equal(state.spells.has("frost_spike"), true);
});

test("learnSpell(): refuses (returns null) once already known, doesn't double-spend", () => {
  const state = createInitialState();
  state.inventory = { ley_crystals: 5, arcane_shard: 5 };
  learnSpell(state, "cure");
  assert.equal(learnSpell(state, "cure"), null);
  assert.equal(state.inventory.ley_crystals, 4); // only spent once
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

  castSpell(state, "weaken", target); // debuff: { attack: -5 }
  assert.equal(target.attackDebuff, -5);

  castSpell(state, "poison", target); // poison: { dps: 5, duration: 3 }
  assert.deepEqual(target.poison, { dps: 5, remaining: 3 });
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
