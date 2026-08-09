import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";
import { LOCATIONS } from "../../data/locations.js";
import { validActionsAt } from "../../ui/screens/location.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// Which digit the Fish action sits on at a location - derived rather than
// hardcoded, the same reason travel.js exports orderedExits(): the numbering
// comes from interactiveActions order and shifts whenever that list is edited.
function fishDigit(locationId) {
  const index = validActionsAt(LOCATIONS[locationId]).findIndex((a) => a.id === "fish");
  assert.ok(index >= 0, `${locationId} should offer the fish action`);
  return String(index + 1);
}

// Same hop the mining test uses: town_square -[6]-> wilderness, which is
// `water: "freshwater"`. Waiting on the location screen's own prompt is the
// arrival-exclusive signal (the traveling screen never sets it).
async function travelTo(session, digit, waitForText) {
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(digit);
  await session.waitFor("What would you like to do?", 20000);
  assert.match(session.capture(), waitForText);
}

test("fish action: species selector is gated by the local water, and blocks with no rod", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const dbPath = path.join(scratchDir, "test.sqlite");
  const logPath = path.join(scratchDir, "test.log");
  const session = tmuxSession(uniqueSessionName("apocylta-fishing"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(`env DB_PATH=${dbPath} LOG_PATH=${logPath} node main.js`, {
    width: 120,
    height: 40,
    cwd: PROJECT_ROOT,
  });

  await bootstrapCharacter(session, { name: "Anglr" });

  await travelTo(session, "6", /wilderness/i);

  session.sendKeys(fishDigit("wilderness"));
  await session.waitFor("What would you like to fish for?");

  // wilderness is freshwater, so it holds the freshwater species and the
  // both-waters ones (`water: true`), and none of the saltwater catches. This
  // is the end-to-end proof the water gate is live.
  const speciesPane = session.capture();
  assert.match(speciesPane, /Pike \(bait, requires fishing lvl 1\)/);
  assert.match(speciesPane, /Trout \(rod, requires fishing lvl 1\)/);
  assert.match(speciesPane, /Salmon \(rod, requires fishing lvl 5\)/, "water: true shows in freshwater too");
  assert.doesNotMatch(speciesPane, /Tuna/, "tuna is saltwater");
  assert.doesNotMatch(speciesPane, /Kraken/, "kraken is saltwater");

  // The first row with no rod equipped must block on the gear check rather
  // than starting a gather that can never land a fish.
  session.sendKeys("c");
  await session.waitFor("fishing rod equipped");

  assert.match(session.capture(), /You need a better fishing rod equipped to catch that\./);
});
