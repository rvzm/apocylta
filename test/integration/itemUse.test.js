import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";
import { travelDigit, actionDigit } from "../helpers/hotkeys.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const TO_WILDERNESS = travelDigit("town_square", "wilderness");
const FIGHT = actionDigit("wilderness", "fight");
const MAX_ROW_PRESSES = 12;

// The inverse-video highlight doesn't survive a tmux capture, so row position
// is tracked rather than read: rows are located by counting down from the
// list's top border, and the cursor remembers where it left off (the selection
// persists between keypresses, and only resets when the screen is re-entered).
function listCursor() {
  let index = 0;
  return {
    reset: () => {
      index = 0;
    },
    async to(session, label) {
      const lines = session.capture().split("\n");
      const border = lines.findIndex((line) => /\[All\]/.test(line));
      assert.notEqual(border, -1, "no tab strip on the list border");
      const target = lines.findIndex((line, i) => i > border && line.includes(label));
      assert.notEqual(target, -1, `no visible row for ${label}`);

      const want = target - (border + 1);
      assert.ok(want >= 0 && want < MAX_ROW_PRESSES, `unexpected row offset ${want}`);
      const key = want > index ? "Down" : "Up";
      for (let i = 0; i < Math.abs(want - index); i++) session.sendKeys(key);
      index = want;
      await new Promise((resolve) => setTimeout(resolve, 200));
    },
  };
}

const cursor = listCursor();

// backpack's onEnter sets _resetSelection, so every entry starts at row 0.
async function openBackpack(session) {
  session.sendKeys("m"); // Menu
  await session.waitFor("[B]ackpack");
  session.sendKeys("b");
  await session.waitFor("[All]");
  cursor.reset();
}

function currentHp(session) {
  const match = session.capture().match(/hp: (\d+) \|/);
  assert.ok(match, "no hp readout in the status bar");
  return Number(match[1]);
}

// Combat draws hp as "hp: n/max" rather than the status bar's "hp: n | mp: n".
function combatHp(pane) {
  const match = pane.match(/hp: (\d+)\/(\d+)/);
  return match ? { hp: Number(match[1]), max: Number(match[2]) } : null;
}

const OVER = /\[X\] ?Continue/;

// Picks fights until one leaves a scratch, then disengages. Deliberately never
// fights to the finish: dying would hand the test a full-health character with
// an empty backpack (resolveDefeat() restores hp and wipes the inventory), and
// bailing at the very first point of damage keeps that nowhere near reachable.
// Returns once the location screen is back.
async function takeAScratch(session, maxFights = 4, maxRounds = 12) {
  for (let fight = 0; fight < maxFights; fight++) {
    session.sendKeys(FIGHT);
    await session.waitFor(/round 0/);

    for (let round = 0; round < maxRounds; round++) {
      const pane = session.capture();
      if (OVER.test(pane)) break; // won it without a scratch - go again
      const bar = combatHp(pane);
      if (bar && bar.hp < bar.max) {
        await disengage(session);
        return;
      }
      session.sendKeys("a");
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    await disengage(session);
    if (currentHp(session) < 100) return;
  }
  throw new Error(`Never took damage in ${maxFights} fights. Last capture:\n${session.capture()}`);
}

// Leaves the encounter whichever way it's available: [F]lee is a roll, so it
// may take a few tries, and the fight can end on its own in the meantime.
async function disengage(session, maxTries = 15) {
  for (let i = 0; i < maxTries; i++) {
    const pane = session.capture();
    if (OVER.test(pane)) {
      session.sendKeys("x");
      await session.waitFor("What would you like to do?");
      return;
    }
    if (!/round \d+/.test(pane)) return; // already back at the location
    session.sendKeys("f");
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Couldn't leave the fight. Last capture:\n${session.capture()}`);
}

test("using items from the backpack: refusals at full health, then a real heal", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const dbPath = path.join(scratchDir, "test.sqlite");
  const logPath = path.join(scratchDir, "test.log");
  const session = tmuxSession(uniqueSessionName("apocylta-itemuse"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(`env DB_PATH=${dbPath} LOG_PATH=${logPath} node main.js`, {
    width: 120,
    height: 40,
    cwd: PROJECT_ROOT,
  });

  // starter_kit: healing_potion x5, mana_potion x5, bread x10 - a deterministic
  // backpack to consume from, rather than gathering and hoping for the loot.
  await bootstrapCharacter(session, { name: "Eater", starterPack: 2 });

  // --- At full health, every consumable refuses with its own reason ---
  await openBackpack(session);
  const pane = session.capture();
  assert.match(pane, /\[10\] Bread/, "starter_kit granted the food");
  assert.match(pane, /\[5\] Healing Potion/);

  await cursor.to(session, "Bread");
  session.sendKeys("u");
  await session.waitFor("You're already at full health.");
  assert.match(session.capture(), /\[10\] Bread/, "a refused item is not consumed");

  await cursor.to(session, "Mana Potion");
  session.sendKeys("u");
  await session.waitFor("Your mana is already full.");

  // Equipment isn't consumable, and says so by name rather than generically.
  await cursor.to(session, "Wooden Dagger");
  session.sendKeys("u");
  await session.waitFor("Wooden Dagger can't be used.");

  session.sendKeys("b"); // -> menu
  await session.waitFor("[S]ave");
  session.sendKeys("Escape"); // -> location
  await session.waitFor("town square");

  // --- Take real damage (15s trip out, then a fight) ---
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(TO_WILDERNESS);
  await session.waitFor("What would you like to do?", 25000);

  await takeAScratch(session);

  const hurtHp = currentHp(session);
  assert.ok(hurtHp < 100, `expected to be damaged after a fight, still at ${hurtHp}`);

  // --- Drinking now works, and pays CONSUME's byproduct back ---
  await openBackpack(session);
  await cursor.to(session, "Healing Potion");
  session.sendKeys("u");
  await session.waitFor(/You drink the Healing Potion and recover \d+ HP\./);

  const afterPane = session.capture();
  assert.match(afterPane, /You keep the Empty Bottle\./);
  assert.match(afterPane, /\[4\] Healing Potion/, "one potion consumed");
  assert.match(afterPane, /\[1\] Empty Bottle/, "the bottle came back into the backpack");
  assert.ok(currentHp(session) > hurtHp, "the status bar reflects the heal");
});
