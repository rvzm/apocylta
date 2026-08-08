import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";
import { travelDigit } from "../helpers/hotkeys.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// No shipped achievement is cheaply reachable end-to-end - welcome_to_apocylta
// needs six locations of real timed travel, master_crafter ten crafts - so the
// unlock logic is proven in test/unit/achievements.test.js. What needs a real
// game is that the screen is reachable, renders the catalog, and comes back
// cleanly (an inventoryList screen that forgets onExit leaves its list
// covering whatever comes next).
test("achievements: reachable from the Menu, renders the catalog, returns cleanly", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const session = tmuxSession(uniqueSessionName("apocylta-achievements"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(
    `env DB_PATH=${path.join(scratchDir, "test.sqlite")} LOG_PATH=${path.join(scratchDir, "test.log")} ` +
      `AUTOSAVE_PATH=${path.join(scratchDir, "autosave.json")} node main.js`,
    { width: 120, height: 50, cwd: PROJECT_ROOT }
  );

  await bootstrapCharacter(session, { name: "Collector" });

  // --- Menu advertises the screen ---
  // Waits on a Menu-only line, not its prompt row: "What would you like to
  // do?" is also the location screen's prompt, so waiting on that returns
  // before the Menu has actually rendered.
  session.sendKeys("m");
  const menuPane = await session.waitFor(/Race\/Class/);
  assert.match(menuPane, /\[A\]chievements/);

  // --- The screen lists the catalog, everything locked on a fresh character ---
  session.sendKeys("a");
  const pane = await session.waitFor("Achievements -");
  assert.match(pane, /0 unlocked/);
  assert.match(pane, /Locked \(\d+\)/);
  assert.doesNotMatch(pane, /Unlocked \(/, "nothing is earned yet");
  assert.match(pane, /Welcome to apocylta/);
  // Progress is shown per requirement: the starting location already counts.
  assert.match(pane, /locationsVisited \(1\/6\)/);

  // --- Back to the Menu, with the list properly torn down ---
  session.sendKeys("b");
  const backPane = await session.waitFor(/Race\/Class/);
  assert.doesNotMatch(backPane, /Welcome to apocylta/, "the achievements list must not bleed through");

  // --- ESCAPE works as the same exit, from a second visit ---
  session.sendKeys("a");
  await session.waitFor("Achievements -");
  session.sendKeys("Escape");
  await session.waitFor(/Race\/Class/);
});

// locationsVisited is the one requirement cheap enough to move in a real game:
// one 15s trip is a second location. This proves the moveTo() choke point
// actually records arrivals through the live travel path.
test("achievements: travelling records a visited location and advances progress", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const session = tmuxSession(uniqueSessionName("apocylta-visited"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(
    `env DB_PATH=${path.join(scratchDir, "test.sqlite")} LOG_PATH=${path.join(scratchDir, "test.log")} ` +
      `AUTOSAVE_PATH=${path.join(scratchDir, "autosave.json")} node main.js`,
    { width: 120, height: 50, cwd: PROJECT_ROOT }
  );

  await bootstrapCharacter(session, { name: "Walker" });

  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(travelDigit("town_square", "wilderness")); // time: 15
  await session.waitFor("What would you like to do?", 25000);
  assert.match(session.capture(), /\[wilderness\]/);

  session.sendKeys("m");
  await session.waitFor(/Race\/Class/);
  session.sendKeys("a");
  const pane = await session.waitFor("Achievements -");
  assert.match(pane, /locationsVisited \(2\/6\)/, "the wilderness arrival was recorded");
});
