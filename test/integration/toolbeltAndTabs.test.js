import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MAX_TAB_PRESSES = 8;

// Cycles Right until the given tab label shows active (e.g. "[armor]") -
// robust to however many tabs exist (STARTER_ITEMS/gathered loot can add
// more over time), rather than hardcoding a press count.
async function cycleToTab(session, label) {
  for (let i = 0; i < MAX_TAB_PRESSES; i++) {
    const pane = session.capture();
    if (pane.includes(`[${label}]`)) return pane;
    session.sendKeys("Right");
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Never reached tab [${label}] after ${MAX_TAB_PRESSES} presses`);
}

test("backpack tabs (dynamic, arrow-key driven) and the Toolbelt screen", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const dbPath = path.join(scratchDir, "test.sqlite");
  const logPath = path.join(scratchDir, "test.log");
  const session = tmuxSession(uniqueSessionName("apocylta-toolbelt"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(`env DB_PATH=${dbPath} LOG_PATH=${logPath} node main.js`, {
    width: 120,
    height: 40,
    cwd: PROJECT_ROOT,
  });

  // Default wizard picks (race index 0 = human) grant a starter "hammer"
  // (type: tool) - useful later to prove tools are excluded from the
  // backpack. STARTER_ITEMS additionally grants a leather_belt (armor) and
  // wooden_dagger (weapon) to every character, regardless of race/class.
  await bootstrapCharacter(session, { name: "Tabby" });

  // Gather at least one scrap item too, so the backpack has weapon/armor/scrap
  // tabs to cycle through.
  session.sendKeys("1"); // "Gather scraps" - town_square's first interactive action
  await session.waitFor(/gathered: (?!\(nothing yet\))/);
  session.sendKeys("s"); // Stop action -> back to location
  await session.waitFor("town square");

  // --- Backpack: dynamic tabs ---
  session.sendKeys("m"); // Menu
  await session.waitFor("[B]ackpack");
  session.sendKeys("b"); // Backpack
  await session.waitFor("[All]");

  const allTabPane = session.capture();
  assert.doesNotMatch(allTabPane, /Hammer/, "tools must not appear in the backpack anymore");
  assert.match(allTabPane, /\bweapon\b/, "a weapon tab should exist (starter wooden_dagger)");
  assert.match(allTabPane, /\barmor\b/, "an armor tab should exist (starter leather_belt)");
  assert.match(allTabPane, /\bscrap\b/, "a scrap tab should exist (gathered loot)");

  const scrapTabPane = await cycleToTab(session, "scrap");
  assert.doesNotMatch(scrapTabPane, /Nothing here\./);

  // --- Equip the starter belt from the armor tab ---
  const armorTabPane = await cycleToTab(session, "armor");
  assert.match(armorTabPane, /Leather Belt/);
  session.sendKeys("e"); // Equip (only entry on this tab, so it's pre-selected)
  await session.waitFor(/Equipped Leather Belt/);

  session.sendKeys("b"); // Backpack's Back -> menu
  await session.waitFor("[S]ave");
  session.sendKeys("Escape"); // menu's ESCAPE -> location (menuOrigin)
  await session.waitFor("town square");

  // --- Toolbelt: belt now equipped, caps should reflect it ---
  session.sendKeys("l"); // Toolbelt hub feature hotkey
  await session.waitFor("Equipped Tool:");
  const toolbeltPane = session.capture();
  assert.match(toolbeltPane, /Equipped Belt:\s+Leather Belt/);
  assert.match(toolbeltPane, /Equipped Tool:\s+none/);
  assert.match(toolbeltPane, /Water Bottle:\s+100\/100/);
  assert.match(toolbeltPane, /Slingshot Ammo:\s+0\/10/);
  assert.match(toolbeltPane, /Equipped Slingshot:\s+none/);
  assert.match(toolbeltPane, /Quiver:\s+0/);
  assert.match(toolbeltPane, /Backpack:\s+\d+\/100/);
  assert.match(toolbeltPane, /Potions:\s+0\/5/);

  session.sendKeys("s"); // Swap Tool
  await session.waitFor("Hammer");
  session.sendKeys("c"); // Choose the (only/default-selected) hammer
  await session.waitFor(/Equipped Tool:\s+Hammer/);

  session.sendKeys("c"); // Change Slingshot
  await session.waitFor("No slingshots in your backpack.");
  session.sendKeys("b"); // Back -> toolbelt
  await session.waitFor("Equipped Tool:");

  session.sendKeys("Escape"); // Toolbelt's ESCAPE -> location directly
  await session.waitFor("town square");
});
