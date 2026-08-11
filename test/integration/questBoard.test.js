import { test } from "node:test";
import assert from "node:assert/strict";
import { formatBase } from "../../currency_backbone.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// Scoped to the UI plumbing (Board -> Accept -> Journal -> Claim), not full
// quest completion: "Getting Started"'s acquireHouse objective is blocked by
// shop_housing's openHours (10-16) against the game's seeded 7:38pm start,
// and its acquireItem/sellItem objectives depend on RNG loot rolls not
// guaranteed within a bounded test window. Full completion-logic correctness
// (objectiveStatus/completeQuest/claimCompletedQuests) is covered
// deterministically by test/unit/quests.test.js instead.
test("quest board: accept a quest, see it in the Journal, claim reports nothing ready yet", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const dbPath = path.join(scratchDir, "test.sqlite");
  const logPath = path.join(scratchDir, "test.log");
  const session = tmuxSession(uniqueSessionName("apocylta-questboard"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(`env DB_PATH=${dbPath} LOG_PATH=${logPath} node main.js`, {
    width: 120,
    height: 40,
    cwd: PROJECT_ROOT,
  });

  await bootstrapCharacter(session, { name: "Quester" });

  // --- Quest Board: eligible quests listed, locked quest excluded ---
  session.sendKeys("c"); // Quest Board hub feature ("Q" collides with the global hard-quit binding)
  const boardPane = await session.waitFor("Getting Started");
  assert.match(boardPane, /Getting Started \(Lv\.1\)/);
  assert.match(boardPane, /Mine! Mine! Mine! \(Lv\.1\)/);
  assert.doesNotMatch(boardPane, /Home Decked/, "locked quests must not appear on the board");

  session.sendKeys("a"); // Accept the (default-selected) first row, "Getting Started"
  await session.waitFor("Quest accepted!");

  const afterAccept = session.capture();
  assert.doesNotMatch(afterAccept, /Getting Started \(Lv\.1\)/, "accepted quest should drop off the board");

  session.sendKeys("b"); // Back -> location
  await session.waitFor("wonderful hub");

  // --- Toolbelt -> Journal: accepted quest shows with live objective progress ---
  session.sendKeys("l"); // Toolbelt hub feature
  await session.waitFor("Equipped Tool:");
  session.sendKeys("j"); // Journal
  const journalPane = await session.waitFor("In Progress:");
  assert.match(journalPane, /Getting Started/);
  assert.match(journalPane, /\[ \] Chop some wood \(0\/1\)/);
  assert.match(journalPane, /\[ \] Sell Some scrap \(0\/1\)/);
  assert.match(journalPane, /\[ \] Buy a House \(0\/1\)/);
  // Rewards render denominated now - 100 base units is five silver.
  assert.ok(journalPane.includes(`Reward: ${formatBase(100, { short: true })}, 100xp`));

  // --- Claim: nothing satisfied yet ---
  session.sendKeys("c");
  await session.waitFor("Nothing ready to claim yet.");
  const afterClaim = session.capture();
  assert.doesNotMatch(afterClaim, /Completed:/, "nothing should have moved to Completed");
});
