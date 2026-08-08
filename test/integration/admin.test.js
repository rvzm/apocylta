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

function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  return {
    dir,
    env: `DB_PATH=${path.join(dir, "test.sqlite")} LOG_PATH=${path.join(dir, "test.log")}`,
  };
}

// The Menu and the Admin screens share the "What would you like to do?" prompt,
// so every wait here keys off a legend or body string unique to one screen.
async function openMenu(session) {
  session.sendKeys("m");
  await session.waitFor("[S]ave");
}

test("admin: gated off by default, and unreachable even by hotkey", async (t) => {
  const { dir, env } = scratch();
  const session = tmuxSession(uniqueSessionName("apocylta-admin-off"));
  t.after(() => {
    session.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  // No ALLOW_ADMIN, and config.js ships allow_admin: false.
  session.start(`env ${env} node main.js`, { width: 120, height: 50, cwd: PROJECT_ROOT });
  await bootstrapCharacter(session, { name: "Nobody" });

  await openMenu(session);
  assert.doesNotMatch(session.capture(), /\[V\] ?Admin/, "the Menu must not advertise Admin");

  // The handler no-ops rather than merely being unlisted.
  session.sendKeys("v");
  await new Promise((resolve) => setTimeout(resolve, 400));
  const pane = session.capture();
  assert.match(pane, /\[S\]ave/, "still on the Menu");
  assert.doesNotMatch(pane, /What would you like to edit/);
});

test("admin: hub, stat editing, infinite items and a forced quest objective", async (t) => {
  const { dir, env } = scratch();
  const session = tmuxSession(uniqueSessionName("apocylta-admin-on"));
  t.after(() => {
    session.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  session.start(`env ${env} ALLOW_ADMIN=true node main.js`, { width: 120, height: 50, cwd: PROJECT_ROOT });
  await bootstrapCharacter(session, { name: "Admin" });

  // --- The gate is open, and the hub lists every editor ---
  await openMenu(session);
  assert.match(session.capture(), /\[V\] ?Admin/);

  session.sendKeys("v");
  await session.waitFor("What would you like to edit?");
  const hub = session.capture();
  for (const editor of ["Player stats", "Skills", "Inventory", "Equipment", "Toolbelt", "Quests", "Achievements"]) {
    assert.match(hub, new RegExp(editor), `hub should list ${editor}`);
  }

  // --- Player stats: step size applies, and the header reflects the edit ---
  session.sendKeys("1"); // jump straight to Player stats
  await session.waitFor("Max Health");

  session.sendKeys("3"); // step 100
  await session.waitFor("step: 100");
  // Rows 0 and 1 are the godmode switch and a spacer, so the numeric fields
  // start at row 2: Health, then Max Health.
  for (let i = 0; i < 3; i++) session.sendKeys("Down");
  await new Promise((resolve) => setTimeout(resolve, 250));
  session.sendKeys("+");
  await session.waitFor(/Max Health\s+\[\s*200 \]/);

  // Health is capped by the max, so filling proves both fields moved together.
  session.sendKeys("f");
  await session.waitFor("Refilled health and mana.");
  assert.match(session.capture(), /hp: 200 \|/, "the status bar shows the raised max");

  session.sendKeys("b"); // -> hub
  await session.waitFor("What would you like to edit?");

  // --- Inventory: give, then mark infinite ---
  session.sendKeys("3");
  await session.waitFor("[G]ive");
  session.sendKeys("g");
  await session.waitFor(/Gave 1x /);
  session.sendKeys("i");
  await session.waitFor(/is now infinite \(this session\)/);
  assert.match(session.capture(), /∞/, "infinite items are marked in the list");

  session.sendKeys("b");
  await session.waitFor("What would you like to edit?");

  // --- Quests: force an objective that has no counter to write ---
  session.sendKeys("6");
  await session.waitFor("[T]oggle objective");
  session.sendKeys("a"); // accept the selected (first) quest
  await session.waitFor(/Accepted /);

  session.sendKeys("Down"); // first objective row
  await new Promise((resolve) => setTimeout(resolve, 200));
  session.sendKeys("t");
  await session.waitFor("<- forced");
  assert.match(session.capture(), /\[x\].*<- forced/, "the forced objective reads as complete");

  session.sendKeys("b");
  await session.waitFor("What would you like to edit?");
  session.sendKeys("b");
  await session.waitFor("[S]ave");
});

// Picks fights until the log shows an enemy hit landing, and returns that
// capture. "for 0." is the proof godmode is doing its job - a fight won without
// being swung at proves nothing at all.
async function fightUntilStruck(session, maxFights = 4, maxRounds = 12) {
  for (let fight = 0; fight < maxFights; fight++) {
    session.sendKeys(FIGHT);
    await session.waitFor(/round 0/);

    for (let round = 0; round < maxRounds; round++) {
      const pane = session.capture();
      if (/for 0\./.test(pane)) return pane;
      if (/\[X\] ?Continue/.test(pane)) break; // won before being touched - go again
      session.sendKeys("a");
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    if (/\[X\] ?Continue/.test(session.capture())) {
      session.sendKeys("x");
      await session.waitFor("What would you like to do?");
    }
  }
  throw new Error(`No enemy landed a hit in ${maxFights} fights. Last capture:\n${session.capture()}`);
}

test("admin: godmode survives a real fight without losing a point of health", async (t) => {
  const { dir, env } = scratch();
  const session = tmuxSession(uniqueSessionName("apocylta-godmode"));
  t.after(() => {
    session.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  session.start(`env ${env} ALLOW_ADMIN=true node main.js`, { width: 120, height: 50, cwd: PROJECT_ROOT });
  await bootstrapCharacter(session, { name: "Deity" });

  // --- Toggle it on, and confirm it announces itself outside the editor ---
  await openMenu(session);
  session.sendKeys("v");
  await session.waitFor("What would you like to edit?");
  session.sendKeys("1");
  await session.waitFor("godmode: [OFF]");

  session.sendKeys("g");
  await session.waitFor("godmode: [ON]");
  assert.match(session.capture(), /\[ GOD \]/, "the status bar badge shows on every screen");

  session.sendKeys("b"); // -> hub
  await session.waitFor("What would you like to edit?");
  session.sendKeys("b"); // -> menu
  await session.waitFor("[S]ave");
  session.sendKeys("Escape"); // -> location
  await session.waitFor("town square");
  assert.match(session.capture(), /\[ GOD \]/, "and it's still there off the admin screens");

  // --- A real fight: the enemy connects, and nothing happens ---
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(TO_WILDERNESS);
  await session.waitFor("What would you like to do?", 25000);

  // Keep fighting until an enemy actually connects. Bounded rather than fixed:
  // the player still deals normal damage under godmode, so an enemy can die
  // before it ever swings, and a dodge produces no damage line at all.
  const pane = await fightUntilStruck(session);
  assert.match(pane, /for 0\./, "the log shows hits landing for zero");
  // The status bar's "hp: N | mp:" is drawn by renderChrome on every screen,
  // unlike the combat screen's own "hp: N/M" which is gone once a fight ends.
  const hp = pane.match(/hp: (\d+) \|/);
  assert.ok(hp, "the status bar draws an hp readout");
  assert.equal(hp[1], "100", `expected untouched health, got ${hp[1]}`);
});
