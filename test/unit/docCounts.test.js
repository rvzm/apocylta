// The docs quote a lot of numbers, and numbers rot silently: CLAUDE.md claimed
// 7 achievements against a catalog of 24, 30 screen files against 32, and 12
// mage enemies against 16, all of which read perfectly well while being wrong.
// Nothing was checking them, so nothing failed.
//
// Each row below pairs a documented figure with the live value it describes. The
// pattern has to MATCH as well as agree - a reworded sentence that no longer
// matches fails loudly rather than quietly disabling its own check, which is the
// failure mode a test like this would otherwise have.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ACHIEVEMENTS } from "../../achievements_backbone.js";
import { SKILLS, MAX_SKILL_LEVEL, MAX_PLAYER_LEVEL } from "../../skill_backbone.js";
import { SPELLS } from "../../magic_backbone.js";
import { QUESTS } from "../../quest_backbone.js";
import { ALL_ENEMIES } from "../../enemy_backbone.js";
import { ALL_ITEMS, MINE_LOCK } from "../../item_backbone.js";
import { LOCATIONS } from "../../data/locations.js";
import { game_config } from "../../config.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

const screenFiles = fs.readdirSync(path.join(root, "ui/screens")).filter((f) => f.endsWith(".js"));
const adminScreenFiles = fs.readdirSync(path.join(root, "ui/screens/admin")).filter((f) => f.endsWith(".js"));

// Screens opting into the second header bar, counted the way ui/subHeader.js
// finds them: a `subHeader` property on the exported screen object.
const subHeaderScreens = screenFiles.filter((f) =>
  /^\s*subHeader\s*:/m.test(fs.readFileSync(path.join(root, "ui/screens", f), "utf8"))
);

const mageEnemiesWithoutDps = Object.values(ALL_ENEMIES).filter(
  (e) => e.subtype === "mage" && e.dps === undefined && e.spells
);

const CHECKS = [
  // --- CLAUDE.md ---
  { file: "CLAUDE.md", label: "achievement count", actual: Object.keys(ACHIEVEMENTS).length, pattern: /`ACHIEVEMENTS` \((\d+) entries/ },
  { file: "CLAUDE.md", label: "screen file count", actual: screenFiles.length, pattern: /`ui\/screens\/\*\.js` \((\d+) files/ },
  { file: "CLAUDE.md", label: "admin screen file count", actual: adminScreenFiles.length, pattern: /plus (\d+) more under `ui\/screens\/admin\/`/ },
  { file: "CLAUDE.md", label: "sub-header screen count", actual: subHeaderScreens.length, pattern: /a line of flavour under the main header, currently on (\d+) screens/ },
  { file: "CLAUDE.md", label: "mage enemies without dps", actual: mageEnemiesWithoutDps.length, pattern: /pins: (\d+) mage-subtype enemies carry/ },
  { file: "CLAUDE.md", label: "skill count", actual: Object.keys(SKILLS).length, pattern: /`SKILLS` \(\*\*(\d+)\*\* trainable skills/ },
  { file: "CLAUDE.md", label: "max skill level", actual: MAX_SKILL_LEVEL, pattern: /`MAX_SKILL_LEVEL = (\d+)`/ },
  { file: "CLAUDE.md", label: "max player level", actual: MAX_PLAYER_LEVEL, pattern: /a \*\*derived\*\* `MAX_PLAYER_LEVEL` \((\d+)\)/ },
  { file: "CLAUDE.md", label: "mine tier count", actual: Object.keys(MINE_LOCK).length, pattern: /\*\*There are (?:five|(\d+)) tiers\*\*/, optionalCapture: 5 },

  // --- README.md ---
  { file: "README.md", label: "location count", actual: Object.keys(LOCATIONS).length, pattern: /\*\*A hand-built world\*\* — (\d+) connected locations/ },
  { file: "README.md", label: "item count", actual: Object.keys(ALL_ITEMS).length, pattern: /from a catalog of (\d+) items/ },
  { file: "README.md", label: "skill count", actual: Object.keys(SKILLS).length, pattern: /\*\*(\d+) trainable skills\*\*/ },
  { file: "README.md", label: "enemy count", actual: Object.keys(ALL_ENEMIES).length, pattern: /against (\d+) enemies/ },
  { file: "README.md", label: "spell count", actual: Object.keys(SPELLS).length, pattern: /\*\*(\d+) spells\*\*/ },
  { file: "README.md", label: "achievement count", actual: Object.keys(ACHIEVEMENTS).length, pattern: /(\d+) achievements unlock/ },

  // --- apocylta-guide.md ---
  { file: "apocylta-guide.md", label: "location count", actual: Object.keys(LOCATIONS).length, pattern: /^(\d+) locations, connected by exits/m },
  { file: "apocylta-guide.md", label: "skill count", actual: Object.keys(SKILLS).length, pattern: /^(\d+) skills\. Fifteen of them level/m },
  { file: "apocylta-guide.md", label: "spell count", actual: Object.keys(SPELLS).length, pattern: /^(\d+) spells across attack, healing/m },
  { file: "apocylta-guide.md", label: "achievement count", actual: Object.keys(ACHIEVEMENTS).length, pattern: /^(\d+) of them, and there's nothing to accept/m },
  { file: "apocylta-guide.md", label: "max skill level", actual: MAX_SKILL_LEVEL, pattern: /\*\*Skills cap at (\d+)\.\*\*/ },
  { file: "apocylta-guide.md", label: "max player level", actual: MAX_PLAYER_LEVEL, pattern: /\*\*player level caps at (\d+)\*\*/ },
  { file: "apocylta-guide.md", label: "save slot count", actual: game_config.saveSlots, pattern: /one of \*\*(three|\d+)\*\* numbered slots/, words: { three: 3 } },
];

const sources = new Map();
for (const { file } of CHECKS) if (!sources.has(file)) sources.set(file, read(file));

test("every count quoted in the docs matches the live value", () => {
  const wrong = [];
  for (const { file, label, actual, pattern, words, optionalCapture } of CHECKS) {
    const match = sources.get(file).match(pattern);
    if (!match) {
      wrong.push(`${file}: could not find the ${label} — has the sentence been reworded? (${pattern})`);
      continue;
    }
    // A pattern may spell the number as a word, or hardcode it in an alternation
    // whose capture group is then empty.
    const raw = match[1];
    const found = raw === undefined ? optionalCapture : words?.[raw] ?? Number(raw);
    if (found !== actual) wrong.push(`${file}: ${label} reads ${found}, code says ${actual}`);
  }
  assert.deepEqual(wrong, []);
});

// The two docs contradicted each other on how long the suite takes, which is the
// same class of rot without a number to derive: nothing can check the duration,
// so at least check they agree.
test("README and CLAUDE.md agree the suite runs in about a minute", () => {
  for (const file of ["README.md", "CLAUDE.md"]) {
    assert.match(read(file), /(under a minute|roughly a minute)/, `${file} should state the suite's runtime`);
    assert.doesNotMatch(read(file), /minute and a half/, `${file} still claims the older, longer runtime`);
  }
});
