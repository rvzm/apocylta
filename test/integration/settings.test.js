import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("settings: action style and colorize change the live UI and survive a restart", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const env = `DB_PATH=${path.join(dir, "test.sqlite")} LOG_PATH=${path.join(dir, "test.log")}`;
  let session = tmuxSession(uniqueSessionName("apocylta-settings"));

  t.after(() => {
    session.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  session.start(`env ${env} node main.js`, { width: 120, height: 45, cwd: PROJECT_ROOT });

  // --- Title screen: the Exit its body text has always promised ---
  await session.waitFor("APOCYLTA");
  const title = session.capture();
  assert.match(title, /\[E\]xit/, "the command row advertises it, not just the prose");
  assert.match(title, /first run/i, "a brand new database is a first run");

  await bootstrapCharacter(session, { name: "Tweaker" });

  session.sendKeys("m");
  await session.waitFor("[S]ave");
  assert.match(session.capture(), /\[T\] Settings/);

  session.sendKeys("t");
  await session.waitFor("Settings -");
  const settings = session.capture();
  assert.match(settings, /Colorize\s+\[ON \]/);
  assert.match(settings, /Action style\s+\[B\] Boxed Key/);
  assert.match(settings, /Playing since/);
  assert.match(settings, /Last autosave\s+never/, "no autosave has fired yet this session");

  // --- Cycling the action style rewrites the legend everywhere ---
  session.sendKeys("Down"); // colorize -> action style
  await wait(250);
  session.sendKeys("t");
  await session.waitFor("Action style    [P] Prefix");
  // The preview renders the setting through itself.
  assert.match(session.capture(), /e\.g\. \[T\] Travel/);

  session.sendKeys("b"); // back to the Menu, which redraws in the new style
  await session.waitFor("[S] Save");
  const menuPrefixed = session.capture();
  assert.match(menuPrefixed, /\[B\] Backpack/, "the legend flipped to the prefix style");
  assert.doesNotMatch(menuPrefixed, /\[B\]ackpack/, "and away from the boxed-key form");

  // --- It's stored, not just held in memory ---
  session.kill();
  session = tmuxSession(uniqueSessionName("apocylta-settings2"));
  session.start(`env ${env} node main.js`, { width: 120, height: 45, cwd: PROJECT_ROOT });
  await session.waitFor("APOCYLTA");

  const restarted = session.capture();
  assert.match(restarted, /\[E\] Exit/, "the title legend is in the stored style now");
  assert.match(restarted, /Welcome back/, "and the second launch knows it isn't the first");
});
