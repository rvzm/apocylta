import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// town_square -[6]-> wilderness -[5]-> west_path -[3]-> cave_entrance -[2]-> cave_mines
// (exit indices from data/locations.js's exits arrays, shops listed before paths).
// Every hop on this route now has a `time` value, so the digit press lands
// on the "traveling" screen first, not the destination - waiting for the
// destination's own name would match instantly on that screen's "Leaving X,
// heading to Y" text instead of actual arrival. location.js unconditionally
// sets promptRow to this literal string, and only once switchScreen(...,
// "location") has really happened, so it's an arrival-exclusive signal
// regardless of whether a given hop turns out to be instant or timed. 20s
// comfortably covers this route's longest single hop (15s).
async function travelTo(session, digit, waitForText) {
  session.sendKeys("t");
  await session.waitFor("Where would you like to go?");
  session.sendKeys(digit);
  await session.waitFor("What would you like to do?", 20000);
  assert.match(session.capture(), waitForText);
}

test("mine hub feature: ore selector renders gated rows, blocks with no pickaxe", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const dbPath = path.join(scratchDir, "test.sqlite");
  const logPath = path.join(scratchDir, "test.log");
  const session = tmuxSession(uniqueSessionName("apocylta-mining"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(`env DB_PATH=${dbPath} LOG_PATH=${logPath} node main.js`, {
    width: 120,
    height: 40,
    cwd: PROJECT_ROOT,
  });

  await bootstrapCharacter(session, { name: "Miner" });

  await travelTo(session, "6", /wilderness/i);
  await travelTo(session, "5", /west path/i);
  await travelTo(session, "3", /cave entrance/i);
  await travelTo(session, "2", /cave mines/i);

  await session.waitFor("Mine"); // command legend picked up HUB_FEATURES.mine

  session.sendKeys("n");
  await session.waitFor("Tin Ore");

  // cave_mines is `mine: "basic"`, the lowest MINE_LOCK tier - so it yields
  // basic's own metals and nothing from higher tiers. This is the end-to-end
  // proof the tier gate is live; before it worked, every ore showed here.
  const oreListPane = session.capture();
  assert.match(oreListPane, /Tin Ore \(requires mining lvl 1\)/);
  assert.match(oreListPane, /Copper Ore \(requires mining lvl 1\)/);
  assert.match(oreListPane, /Iron Ore \(requires mining lvl 5\)/);
  assert.doesNotMatch(oreListPane, /Cobalt Ore/, "cobalt is mid_tier - not in a basic mine");
  assert.doesNotMatch(oreListPane, /Mithril Ore/, "mithril is mid_tier too");
  assert.doesNotMatch(oreListPane, /Adamantite Ore/, "adamantite is high_tier");
  // Ores listed in no tier aren't gated, only ungraded - they show anywhere.
  assert.match(oreListPane, /Gold Ore \(requires mining lvl 8\)/);

  // Coal and gemstones are bonus drops, not choices - they used to sit here as
  // dead rows that only ever answered "That can't be mined."
  assert.doesNotMatch(oreListPane, /Coal/, "fuel is a bonus drop, not a selectable ore");
  assert.doesNotMatch(oreListPane, /Ruby|Sapphire|Emerald/, "gemstones likewise");

  // Default selection is the first row (Tin Ore) - choosing it with no
  // pickaxe equipped must block on the tool check, not start mining.
  session.sendKeys("c");
  await session.waitFor("pickaxe equipped");

  const blockedPane = session.capture();
  assert.match(blockedPane, /You need a better pickaxe equipped to mine that\./);
});
