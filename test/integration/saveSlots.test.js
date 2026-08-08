import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));

test("save-slot picker: save from the Menu, Continue from title, and delete with two-press confirm", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const dbPath = path.join(scratchDir, "test.sqlite");
  const logPath = path.join(scratchDir, "test.log");
  const autosavePath = path.join(scratchDir, "autosave.json");
  const env = `env DB_PATH=${dbPath} LOG_PATH=${logPath} AUTOSAVE_PATH=${autosavePath}`;

  let session = tmuxSession(uniqueSessionName("apocylta-saveslots"));
  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(`${env} node main.js`, { width: 120, height: 40, cwd: PROJECT_ROOT });

  await bootstrapCharacter(session, { name: "Saver" });

  // --- Save to Slot 1 from the Menu ---
  session.sendKeys("m"); // Menu
  await session.waitFor("[S]ave");
  session.sendKeys("s"); // Save -> saveSlots (mode: save)
  await session.waitFor("Slot 1: Empty");
  session.sendKeys("c"); // Choose the (default-selected) Slot 1 -> empty, saves immediately
  await session.waitFor("Saved to Slot 1.");

  session.sendKeys("b"); // Back -> menu
  await session.waitFor("[S]ave");
  session.sendKeys("Escape"); // menu's ESCAPE -> location (menuOrigin)
  // The header's location field always shows "town square" regardless of
  // which screen is active, so it can't prove we actually reached the
  // location screen - wait for the location body text instead.
  await session.waitFor("wonderful hub");

  // --- Quit out and relaunch, simulating a player returning to the title
  // screen fresh - apocylta has no in-game "return to title" hotkey, so
  // this is the only real way to exercise Continue against a real save. ---
  session.kill();
  session = tmuxSession(uniqueSessionName("apocylta-saveslots"));
  session.start(`${env} node main.js`, { width: 120, height: 40, cwd: PROJECT_ROOT });

  await session.waitFor("APOCYLTA");
  session.sendKeys("c"); // Continue -> saveSlots (mode: load)
  const loadPane = await session.waitFor("Slot 1:");
  assert.match(loadPane, /Slot 1: Saver - Lv\.1 Human\/Warrior @ town square/);
  assert.match(loadPane, /Autosave: Empty/);

  session.sendKeys("c"); // Choose Slot 1 -> loads -> location
  // Also proves ui.inventoryList actually got hidden (regression coverage
  // for a real bug: Object.assign(state, loaded) was clobbering
  // state.currentScreen with loadGame()'s createInitialState() default,
  // which made switchScreen() skip saveSlotsScreen.onExit and leave the
  // slot rows stuck on screen).
  await session.waitFor("wonderful hub");

  // --- Confirm the loaded state actually reflects the saved character ---
  session.sendKeys("m"); // Menu
  await session.waitFor(/Name:\s+Saver/);
  session.sendKeys("Escape");
  await session.waitFor("wonderful hub");

  // --- Delete Slot 1 via the Load screen's two-press confirm ---
  session.sendKeys("m");
  await session.waitFor("[L]oad");
  session.sendKeys("l"); // Load -> saveSlots (mode: load)
  await session.waitFor(/Slot 1: Saver/);

  session.sendKeys("d"); // First press -> arms the confirm
  await session.waitFor("Press D again to permanently delete Slot 1.");
  const stillThere = session.capture();
  assert.match(stillThere, /Slot 1: Saver/, "slot should still show its contents before the second press");

  session.sendKeys("d"); // Second press -> actually deletes
  await session.waitFor("Deleted Slot 1.");
  const afterDelete = session.capture();
  assert.match(afterDelete, /Slot 1: Empty/);
});
