import { test } from "node:test";
import assert from "node:assert/strict";
import { profSkillsFor } from "../../player_backbone.js";

test("profSkillsFor() returns each difficulty tier's manual-pick count", () => {
  assert.equal(profSkillsFor("casual"), 5);
  assert.equal(profSkillsFor("easy"), 3);
  assert.equal(profSkillsFor("normal"), 2);
  assert.equal(profSkillsFor("hard"), 1);
  assert.equal(profSkillsFor("survival"), 0);
  assert.equal(profSkillsFor("nightmare"), 0);
});

test("profSkillsFor() falls back to 5 for an unknown or unset difficulty id", () => {
  assert.equal(profSkillsFor("not_a_real_difficulty"), 5);
  assert.equal(profSkillsFor(undefined), 5);
  assert.equal(profSkillsFor(null), 5);
});
