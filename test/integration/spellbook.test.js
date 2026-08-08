import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmuxSession, uniqueSessionName } from "../helpers/tmux.js";
import { bootstrapCharacter } from "../helpers/bootstrapCharacter.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// The list's top border carries the tab strip as its label, so the row right
// below it is selection index 0 (nothing has scrolled yet on entry). Walks the
// selection down to the first row matching `pattern` and returns its text.
// Deliberately finds the row by content rather than by a hardcoded press
// count - which spells are learnable depends on the character wizard's default
// skill allocation, which this test has no business pinning.
async function selectRow(session, pattern) {
  const lines = session.capture().split("\n");
  const border = lines.findIndex((line) => /\[(Learned|Unlearned) \(\d+\)\]/.test(line));
  assert.notEqual(border, -1, "no tab strip on the list border");
  const target = lines.findIndex((line, i) => i > border && pattern.test(line));
  assert.notEqual(target, -1, `no visible row matching ${pattern}`);

  for (let i = 0; i < target - (border + 1); i++) session.sendKeys("Down");
  await new Promise((resolve) => setTimeout(resolve, 200));
  return lines[target];
}

test("spellbook Learned/Unlearned tabs, learnability grouping and reagent counts", async (t) => {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
  const dbPath = path.join(scratchDir, "test.sqlite");
  const logPath = path.join(scratchDir, "test.log");
  const session = tmuxSession(uniqueSessionName("apocylta-spellbook"));

  t.after(() => {
    session.kill();
    fs.rmSync(scratchDir, { recursive: true, force: true });
  });

  session.start(`env DB_PATH=${dbPath} LOG_PATH=${logPath} node main.js`, {
    width: 120,
    height: 40,
    cwd: PROJECT_ROOT,
  });

  await bootstrapCharacter(session, { name: "Mage" });

  // The spellbook is reached through the backpack (its C hotkey).
  session.sendKeys("m"); // Menu
  await session.waitFor("[B]ackpack");
  session.sendKeys("b"); // Backpack
  await session.waitFor("[All]");
  session.sendKeys("c"); // Spellbook
  await session.waitFor("[Learned");

  // --- Learned tab: only the starter spell ---
  const learnedPane = session.capture();
  assert.match(learnedPane, /\[Learned \(1\)\]/, "the tab label carries a live count");
  assert.match(learnedPane, /Unlearned \(15\)/);
  assert.match(learnedPane, /Magic Missle \(known \| cast: 6 mp\)/);
  assert.doesNotMatch(learnedPane, /Unlearnable/, "learnability groups belong to the other tab");

  // --- Unlearned tab: both groups, reagent counts, level reasons ---
  session.sendKeys("Right");
  await session.waitFor("[Unlearned");
  const unlearnedPane = session.capture();
  assert.match(unlearnedPane, /\[Learnable\] \(\d+\):/);
  assert.match(unlearnedPane, /\[Unlearnable\] \(\d+\):/);
  assert.match(
    unlearnedPane,
    /Cure \(learn: Ley Crystals \(0\/1\), Arcane Shard \(0\/1\) \| cast: 6 mp\)/,
    "owned/required reagent counts, with an empty pack"
  );
  assert.match(unlearnedPane, /req: magic lv \d+/, "level-locked spells are listed, not hidden");
  assert.doesNotMatch(unlearnedPane, /Magic Missle/, "a known spell is not in the Unlearned tab");

  // Learning a level-locked spell blames the level, not the reagents.
  const lockedRow = await selectRow(session, /req: magic lv \d+/);
  const requiredLevel = lockedRow.match(/req: magic lv (\d+)/)[1];
  session.sendKeys("l");
  await session.waitFor(new RegExp(`requires magic level ${requiredLevel}\\.`));

  // Two tabs, so Right wraps back around to Learned.
  session.sendKeys("Right");
  await session.waitFor("[Learned");

  // Both screens share ui.inventoryList, so the spellbook has to hand it back
  // clean. (Backpack sets its own label immediately, so this can't prove the
  // setLabel("") in onExit by itself - that only shows on a screen that
  // renders no label of its own, which nothing routes to from here.)
  session.sendKeys("b"); // Back -> backpack
  await session.waitFor("[All]");
  assert.doesNotMatch(session.capture(), /Unlearned|Learnable/, "no spellbook rows left in the list");
});
