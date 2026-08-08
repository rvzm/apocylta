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

const TO_HOUSING = travelDigit("town_square", "housing_district"); // time: 5
const TO_WILDERNESS = travelDigit("town_square", "wilderness"); // time: 15
const TO_WEAPONS = travelDigit("town_square", "weapons_shop"); // shop, instant

test("timed travel: countdown screen, speed xp on arrival, shops stay instant, cancel returns to origin, background completion", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const dbPath = path.join(scratchDir, "test.sqlite");
  const logPath = path.join(scratchDir, "test.log");
  const session = tmuxSession(uniqueSessionName("apocylta-travel"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  // Taller than the usual 40 rows - the Menu screen's skill grid has 9 rows
  // (18 skills, 2 per row) plus the equipment/header lines above it, and
  // this test needs the "Speed" row to actually be visible in the captured
  // pane rather than scrolled out of a shorter window's mainContent box.
  session.start(`env DB_PATH=${dbPath} LOG_PATH=${logPath} node main.js`, {
    width: 120,
    height: 70,
    cwd: PROJECT_ROOT,
  });

  await bootstrapCharacter(session, { name: "Traveler" });

  // --- Timed trip: traveling screen shows up with the road animation ---
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(TO_HOUSING); // housing district, time: 5
  const travelingPane = await session.waitFor("Leaving town square, heading to housing district.");
  assert.match(travelingPane, /Traveling\.\.\./);
  // A countdown within this 5s trip's range, not the exact opening value:
  // waitFor() polls every 100ms and the clock ticks once a second, so under
  // load the first capture can already read 4s. The range still pins that
  // this is the 5s trip and that it's counting down.
  assert.match(travelingPane, /[1-5]s remaining/);
  assert.match(travelingPane, /[oO]/); // road marker present somewhere on the track

  // --- Arrival: back on location, speed xp granted equal to the trip's time ---
  await session.waitFor("What would you like to do?", 15000);
  const arrivedPane = session.capture();
  assert.match(arrivedPane, /\[housing district\]/);

  session.sendKeys("m");
  await session.waitFor(/Speed Lv\.\d/);
  assert.match(session.capture(), /Speed Lv\.1 \(5xp\)/);
  session.sendKeys("Escape");
  await session.waitFor("What would you like to do?");

  // --- Shop exits (no `time` field) stay instant - no traveling screen ---
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys("1"); // housing_district's only exit -> town square, no time field
  await session.waitFor("What would you like to do?");
  assert.match(session.capture(), /\[town square\]/);

  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(TO_WEAPONS); // weapons shop, category "shop", no time field
  const shopPane = await session.waitFor("What would you like to do?");
  assert.match(shopPane, /\[weapons shop\]/);
  assert.doesNotMatch(shopPane, /Traveling\.\.\./);

  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys("1"); // weapons_shop's only exit -> town square, no time field
  await session.waitFor("What would you like to do?");
  assert.match(session.capture(), /\[town square\]/);

  // --- Cancel ("Back") mid-trip: returns to origin, no speed xp granted ---
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(TO_WILDERNESS); // out of town/wilderness, time: 15
  await session.waitFor("Traveling...");
  session.sendKeys("b"); // Back -> cancel
  await session.waitFor("What would you like to do?");
  assert.match(session.capture(), /\[town square\]/);

  session.sendKeys("m");
  await session.waitFor(/Speed Lv\.\d/);
  assert.match(session.capture(), /Speed Lv\.1 \(5xp\)/); // unchanged from the first, completed trip
  session.sendKeys("Escape");
  await session.waitFor("What would you like to do?");

  // --- Background completion: travel finishes while on the Menu screen,
  // then Menu's Escape (menuOrigin="traveling") must land cleanly on
  // location, not crash on a stale/null currentTravel. Only "action" and
  // "traveling" get a per-tick re-render (main.js's game-loop callback), so
  // the Menu screen's own body won't live-update while sitting on it - wait
  // out the real trip duration with a plain timer, not a waitFor on stale
  // screen content. ---
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(TO_HOUSING); // housing district, time: 5
  await session.waitFor("Traveling...");
  session.sendKeys("m"); // Menu, mid-trip
  await session.waitFor(/Speed Lv\.1 \(5xp\)/); // confirms Menu rendered once, still showing the pre-trip value
  await new Promise((resolve) => setTimeout(resolve, 6000)); // let the trip complete in the background while sitting on Menu
  session.sendKeys("Escape"); // menuOrigin="traveling" -> traveling.js's null-guard -> location, no crash
  const finalPane = await session.waitFor("What would you like to do?");
  assert.match(finalPane, /\[housing district\]/);

  // Confirm the xp grant actually happened (not just that we landed
  // somewhere plausible) via a fresh Menu visit.
  session.sendKeys("m");
  await session.waitFor("Speed Lv.1 (10xp)"); // 5 (first trip) + 5 (this one)
});
