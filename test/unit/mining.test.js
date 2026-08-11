import { test } from "node:test";
import assert from "node:assert/strict";
import { mineableOres, canMineOre, rollMineBonuses } from "../../data/mining.js";
import { rollLootByType } from "../../data/actions.js";
import { ALL_ITEMS, isMineableAtTier } from "../../item_backbone.js";
import { createInitialState } from "../../state/gameState.js";

test("mineableOres() lists every real ore, sorted by required level ascending", () => {
  const ores = mineableOres();
  const byId = Object.fromEntries(ores.map((o) => [o.id, o.requiredLevel]));

  assert.deepEqual(byId, {
    tin_ore: 1,
    copper_ore: 1,
    iron_ore: 5,
    gold_ore: 8,
    cobalt_ore: 10,
    mithril_ore: 25,
    syllic_ore: 40,
    adamantite_ore: 45,
    runite_ore: 60,
  });
  const levels = ores.map((o) => o.requiredLevel);
  assert.deepEqual(levels, [...levels].sort((a, b) => a - b));
});

// Gemstones and coal aren't ores you choose - they turn up while mining, via
// rollMineBonuses(). Listing them put dead rows on the selector: canMineOre()
// reads SKILL_BLOCKS.mining.ores, which has no gemstone/fuel key, so picking
// one only ever said "That can't be mined."
test("mineableOres() leaves out the bonus-drop subtypes entirely", () => {
  for (const location of [undefined, "cave_mines", "cave_hub", "south_deep_cave"]) {
    const ores = mineableOres(location);
    const subtypes = ores.map((o) => o.item.subtype);
    assert.ok(!subtypes.includes("gemstone"), `gemstones listed at ${location}`);
    assert.ok(!subtypes.includes("fuel"), `fuel listed at ${location}`);
    // And nothing left over is unselectable.
    assert.ok(
      ores.every((o) => o.requiredLevel != null),
      `${location} lists an ore with no mining level, which canMineOre() would refuse`
    );
  }
});

// ------------------------------------------------------- mine tier gating

test("isMineableAtTier() is cumulative - a higher tier keeps everything below it", () => {
  assert.equal(isMineableAtTier(1, "tin_ore", "tin"), true);
  assert.equal(isMineableAtTier(1, "cobalt_ore", "cobalt"), false, "cobalt is mid_tier");
  assert.equal(isMineableAtTier(2, "cobalt_ore", "cobalt"), true);
  assert.equal(isMineableAtTier(2, "tin_ore", "tin"), true, "and still yields basic's metals");
  assert.equal(isMineableAtTier(5, "runite_ore", "runite"), true);
  assert.equal(isMineableAtTier(4, "runite_ore", "runite"), false, "runite is legendary-only");
});

// `advanced` (tier 3) splits the old high_tier in two, on the mining level its
// metals need: syllic 40 below, adamantite 45 above. Since tiers are cumulative
// the split cost the tiers above it nothing - it only gave the Cordura deep
// mines, which name this tier, something real to resolve to.
test("isMineableAtTier() places syllic below adamantite, at the advanced tier", () => {
  assert.equal(isMineableAtTier(3, "syllic_ore", "syllic"), true);
  assert.equal(isMineableAtTier(2, "syllic_ore", "syllic"), false, "syllic needs advanced");
  assert.equal(isMineableAtTier(3, "adamantite_ore", "adamantite"), false, "adamantite is still high_tier");
  assert.equal(isMineableAtTier(4, "adamantite_ore", "adamantite"), true);
  assert.equal(isMineableAtTier(4, "syllic_ore", "syllic"), true, "and high_tier keeps what advanced offered");
});

// Unlisted means unlisted, not forbidden - otherwise adding an ore item would
// silently make it unmineable everywhere until someone filed it under a tier.
test("isMineableAtTier() lets anything absent from every tier through", () => {
  assert.equal(isMineableAtTier(1, "gold_ore", "gold"), true, "gold is in no tier at all");
});

// MINE_LOCK keys metals by subtype but gems and fuel by item id, because every
// gemstone shares the subtype "gemstone" and every fuel shares "fuel".
test("isMineableAtTier() matches on the item id as well as the subtype", () => {
  assert.equal(isMineableAtTier(1, "ruby", "gemstone"), true, "ruby is basic");
  assert.equal(isMineableAtTier(1, "diamond", "gemstone"), false, "diamond is mid_tier");
  assert.equal(isMineableAtTier(2, "diamond", "gemstone"), true);
});

test("mineableOres(locationId) narrows the list to the local mine's tier", () => {
  const basic = mineableOres("cave_mines").map((o) => o.id); // mine: "basic"
  assert.ok(basic.includes("tin_ore"));
  assert.ok(basic.includes("iron_ore"));
  assert.ok(!basic.includes("cobalt_ore"), "cobalt needs a mid_tier mine");
  assert.ok(basic.includes("gold_ore"), "unlisted ores show everywhere");

  const mid = mineableOres("cave_hub").map((o) => o.id); // mine: "mid_tier"
  assert.ok(mid.includes("cobalt_ore"));
  assert.ok(mid.includes("tin_ore"), "and everything basic offered");
  assert.ok(!mid.includes("adamantite_ore"), "adamantite needs high_tier");

  const advanced = mineableOres("cordura_mines_deep").map((o) => o.id); // mine: "advanced"
  assert.ok(advanced.includes("syllic_ore"));
  assert.ok(!advanced.includes("adamantite_ore"), "advanced stops below adamantite");
  assert.ok(!advanced.includes("runite_ore"), "and well below runite");

  const legendary = mineableOres("south_deep_cave").map((o) => o.id);
  assert.ok(legendary.includes("runite_ore"));
});

test("mineableOres() with no location applies no gate at all", () => {
  const everywhere = mineableOres().map((o) => o.id);
  assert.ok(everywhere.includes("runite_ore"));
  assert.ok(everywhere.includes("cobalt_ore"));
  // A location that isn't a mine has no tier, so it behaves the same way.
  assert.deepEqual(mineableOres("town_square").map((o) => o.id), everywhere);
});

// --------------------------------------------------------- bonus drops

// rng is consumed in order: one gate roll per subtype (fuel, then gemstone),
// and rollLootByType() draws twice more for each that fires. 0 always passes a
// `rng() >= chance` gate, 0.99 never does.
const ALWAYS = () => 0;
const NEVER = () => 0.99;

function at(locationId) {
  const state = createInitialState();
  state.currentLocationId = locationId;
  return state;
}

test("rollMineBonuses() yields coal and a gem when the rolls land, nothing when they don't", () => {
  const subtypes = rollMineBonuses(at("cave_mines"), ALWAYS).map((b) => ALL_ITEMS[b.itemId].subtype);
  assert.deepEqual(subtypes, ["fuel", "gemstone"], "one of each, in order");

  assert.deepEqual(rollMineBonuses(at("cave_mines"), NEVER), []);
});

// The bug this whole thing exists to fix: rollLootByType matches on subtype,
// and all seven gems share the subtype "gemstone" - so passing it straight
// through let a tier-1 mine turn up a legendary diamond.
test("rollMineBonuses() gates gems by the mine's tier, cumulatively", () => {
  const basic = new Set();
  const mid = new Set();
  for (let i = 0; i < 300; i++) {
    const roll = () => (Math.random() < 0.5 ? 0 : Math.random());
    for (const b of rollMineBonuses(at("cave_mines"), roll)) basic.add(b.itemId);
    for (const b of rollMineBonuses(at("cave_hub"), roll)) mid.add(b.itemId);
  }

  for (const gem of ["diamond", "amethyst", "topaz", "opal"]) {
    assert.ok(!basic.has(gem), `${gem} is above basic tier and must not drop at cave_mines`);
  }
  assert.ok(["ruby", "sapphire", "emerald"].some((g) => basic.has(g)), "basic gems should drop");

  assert.ok(mid.has("diamond"), "diamond becomes reachable at mid_tier");
  assert.ok(["ruby", "sapphire", "emerald"].some((g) => mid.has(g)), "and basic's gems still are");
  assert.ok(!mid.has("opal"), "opal is high_tier");
});

test("rollMineBonuses() yields nothing outside a mine", () => {
  assert.deepEqual(rollMineBonuses(at("town_square"), ALWAYS), []);
  assert.deepEqual(rollMineBonuses(at("wilderness"), ALWAYS), []);
});

test("rollLootByType(): allowIds narrows the pool, and omitting it changes nothing", () => {
  // The parameter is appended last because data/combat.js reaches `rng` in
  // slot 4 with positional undefined placeholders.
  for (let i = 0; i < 40; i++) {
    assert.equal(rollLootByType("mining", "gemstone", undefined, Math.random, ["ruby"]).itemId, "ruby");
  }
  const unfiltered = rollLootByType("mining", "gemstone", undefined, Math.random);
  assert.equal(ALL_ITEMS[unfiltered.itemId].subtype, "gemstone");
});

test("canMineOre() blocks with no tool equipped", () => {
  const state = createInitialState();
  const result = canMineOre(state, "tin_ore");
  assert.equal(result.ok, false);
  assert.match(result.reason, /pickaxe/i);
});

test("canMineOre() defaults an untiered equipped tool to tier 1", () => {
  const state = createInitialState();
  state.equipment.tool = "pickaxe"; // the plain starter tool, absent from SKILL_BLOCKS.mining.tools
  assert.equal(canMineOre(state, "tin_ore").ok, true);
});

test("canMineOre() blocks on skill level before tool tier", () => {
  const state = createInitialState();
  state.equipment.tool = "pickaxe"; // tier 1 by default
  const result = canMineOre(state, "iron_ore"); // requires mining level 5
  assert.equal(result.ok, false);
  assert.match(result.reason, /mining level 5/i);
});

test("canMineOre() blocks on tool tier once skill level is sufficient", () => {
  const state = createInitialState();
  state.skills.mining.level = 5;
  state.equipment.tool = "pickaxe"; // still tier 1
  const result = canMineOre(state, "iron_ore");
  assert.equal(result.ok, false);
  assert.match(result.reason, /pickaxe/i);
});

test("canMineOre() succeeds with sufficient skill level and tool tier", () => {
  const state = createInitialState();
  state.skills.mining.level = 5;
  state.equipment.tool = "iron_pickaxe"; // tier 5
  assert.equal(canMineOre(state, "iron_ore").ok, true);
});
