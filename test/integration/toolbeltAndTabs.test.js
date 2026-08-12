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
  // Attempts are gatherTime seconds apart (10 on Normal, which bootstrapCharacter
  // confirms) and can miss, so this needs room for several tries - the default
  // 5s wait predates both and would now time out on cadence alone.
  await session.waitFor(/gathered: (?!\(nothing yet\))/, 60000);
  session.sendKeys("s"); // Stop action -> back to location
  await session.waitFor("town square");

  // --- Backpack: dynamic tabs ---
  session.sendKeys("m"); // Menu
  await session.waitFor("[B]ackpack");
  session.sendKeys("b"); // Backpack
  await session.waitFor("[All]");

  const allTabPane = session.capture();
  // Belt items are NOT here - they're the Pouch's (Toolbelt -> [P]), which is
  // walked further down. This exclusion was briefly a real bug: tools were
  // hidden while this was the only screen with Drop, so they couldn't be got
  // rid of at all. It's safe now because the Pouch drops and equips them.
  assert.doesNotMatch(allTabPane, /Hammer/, "tools belong to the Pouch now");
  assert.doesNotMatch(allTabPane, /\bscrap\b/, "and so does scrap");
  assert.match(allTabPane, /Wooden Dagger\s+[\d.]+/, "pack rows carry their stack weight");
  assert.match(allTabPane, /\bweapon\b/, "a weapon tab should exist (starter wooden_dagger)");
  assert.match(allTabPane, /\barmor\b/, "an armor tab should exist (starter leather_belt)");

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
  // Two weight budgets and one slot count. The caps aren't pinned exactly: the
  // leather belt's 15/100 both get + 2 per strength level, and bootstrapCharacter
  // picks its proficiencies by walking the list, so whether this character has
  // strength at 1 or 5 isn't this test's business.
  assert.match(toolbeltPane, /Toolbelt Load:\s+[\d.]+\/\d+/);
  assert.match(toolbeltPane, /Backpack Load:\s+[\d.]+\/1\d\d/, "the pack budget is the belt's 100 plus strength");
  assert.match(toolbeltPane, /Potions:\s+0\/5/);
  assert.match(toolbeltPane, /\[P\]\s*Pouch|\[P\]ouch/, "the Pouch is reachable from here");

  // --- Pouch: the belt's contents, which the backpack no longer shows ---
  session.sendKeys("p");
  await session.waitFor("[All]");
  const pouchPane = session.capture();
  // Sectioned by subtype, with the section's own count - so the hammer sits
  // under a "Hammer" heading rather than loose in a flat list.
  assert.match(pouchPane, /Hammer \(1\)/, "sections are headed and counted");
  assert.match(pouchPane, /- \[1\] Hammer\s+[\d.]+/, "and rows carry their stack weight");
  assert.match(pouchPane, /On your belt:\s*[\d.]+ of [\d.]+/, "the sub-header shows the belt's load");
  assert.match(pouchPane, /\bscrap\b/, "the gathered scrap is here, not in the backpack");

  session.sendKeys("b"); // Pouch's Back -> toolbelt
  await session.waitFor("Equipped Tool:");

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
