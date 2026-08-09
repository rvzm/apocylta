import { test } from "node:test";
import assert from "node:assert/strict";
import { catchableFish, canCatchFish, equippedRodTier, fishingGearFor, spendBait } from "../../data/fishing.js";
import { rollLootByType } from "../../data/actions.js";
import { ALL_ITEMS, FISH, catchItemsFor } from "../../item_backbone.js";
import { createInitialState } from "../../state/gameState.js";

function at(locationId) {
  const state = createInitialState();
  state.currentLocationId = locationId;
  return state;
}

// A character who can catch anything the tests point at, minus whatever the
// test then takes away - the gating tests each remove one requirement.
function angler({ level = 99, rod = "godlike_fishing_rod", gear = ["fishing_bait", "fishing_net", "fishing_hook"] } = {}) {
  const state = at("wilderness");
  state.skills.fishing.level = level;
  state.equipment.tool = rod;
  for (const id of gear) state.inventory[id] = 5;
  return state;
}

// ------------------------------------------------------------ species listing

test("catchableFish() sorts by required level ascending and carries the catch items", () => {
  const fish = catchableFish();
  const levels = fish.map((f) => f.requiredLevel);
  assert.deepEqual(levels, [...levels].sort((a, b) => a - b));
  assert.ok(
    fish.every((f) => f.itemIds.length > 0),
    "a species with nothing to put in the backpack must not be offered"
  );

  const pike = fish.find((f) => f.id === "pike");
  assert.deepEqual(pike.itemIds, ["raw_pike"]);
  assert.equal(pike.requiredLevel, 1);
});

// The ancients have no "raw_" form - they yield the parts named after them, and
// the whole part set rides lootIds so the roll picks one.
test("catchableFish() gives the ancients their body parts as catch items", () => {
  const leviathan = catchableFish().find((f) => f.id === "leviathan");
  assert.deepEqual(leviathan.itemIds.sort(), ["leviathan_bone", "leviathan_flesh", "leviathan_scale", "leviathan_tooth"]);
  // ...and the king's parts stay with the king, not with the leviathan.
  assert.ok(!leviathan.itemIds.some((id) => id.startsWith("leviathan_king")));
});

// ------------------------------------------------------------- water gating

test("catchableFish(locationId) narrows the list to the local water type", () => {
  const fresh = catchableFish("wilderness").map((f) => f.id); // water: "freshwater"
  assert.ok(fresh.includes("pike"));
  assert.ok(fresh.includes("catfish_king"));
  assert.ok(!fresh.includes("tuna"), "tuna is saltwater");
  assert.ok(!fresh.includes("kraken"), "kraken is saltwater");

  const salt = catchableFish("zenthal_docks").map((f) => f.id); // water: "saltwater"
  assert.ok(salt.includes("tuna"));
  assert.ok(!salt.includes("pike"), "pike is freshwater");
});

// `water: true` means the species doesn't care which water it is.
test("catchableFish() treats `water: true` as both waters", () => {
  const bothWater = Object.keys(FISH).filter((id) => FISH[id].water === true);
  assert.ok(bothWater.length > 0, "the fixture assumes at least one both-waters species");

  const fresh = catchableFish("wilderness").map((f) => f.id);
  const salt = catchableFish("zenthal_docks").map((f) => f.id);
  for (const id of bothWater) {
    assert.ok(fresh.includes(id), `${id} should show in freshwater`);
    assert.ok(salt.includes(id), `${id} should show in saltwater`);
  }
});

test("catchableFish() lists nothing where there's no water, and everything with no location at all", () => {
  assert.deepEqual(catchableFish("town_square"), []);
  assert.deepEqual(catchableFish("cave_mines"), []);

  const everywhere = catchableFish().map((f) => f.id);
  assert.ok(everywhere.includes("pike"));
  assert.ok(everywhere.includes("tuna"));
});

// --------------------------------------------------------------- rod tiers

test("equippedRodTier() reads the rod's tier, defaults an untiered rod to 1, and refuses a non-rod", () => {
  assert.equal(equippedRodTier(angler({ rod: "godlike_fishing_rod" })), 75);
  assert.equal(equippedRodTier(angler({ rod: "iron_fishing_rod" })), 5, "the metal ladder counts too");
  assert.equal(equippedRodTier(angler({ rod: "iron_pickaxe" })), null, "a pickaxe cannot fish");
  assert.equal(equippedRodTier(at("wilderness")), null, "nothing equipped");
});

// ---------------------------------------------------------------- gating

test("canCatchFish() blocks with no rod equipped", () => {
  const state = angler({ rod: null });
  state.equipment.tool = null;
  const result = canCatchFish(state, "pike");
  assert.equal(result.ok, false);
  assert.match(result.reason, /rod/i);
});

test("canCatchFish() blocks on skill level before rod tier", () => {
  const state = angler({ level: 1, rod: "fishing_rod" }); // tier 1
  const result = canCatchFish(state, "tuna"); // difficulty 3 -> level 10
  assert.equal(result.ok, false);
  assert.match(result.reason, /fishing level 10/i);
});

test("canCatchFish() blocks on rod tier once the skill level is sufficient", () => {
  const state = angler({ level: 99, rod: "fishing_rod" }); // tier 1
  const result = canCatchFish(state, "tuna");
  assert.equal(result.ok, false);
  assert.match(result.reason, /rod/i);
});

test("canCatchFish() blocks on the missing bait/net/hook the species is caught with", () => {
  // pike is caught on bait, shrimp in a net, clam on a hook.
  const noBait = angler({ gear: ["fishing_net", "fishing_hook"] });
  assert.match(canCatchFish(noBait, "pike").reason, /bait/i);

  const noNet = angler({ gear: ["fishing_bait", "fishing_hook"] });
  assert.match(canCatchFish(noNet, "shrimp").reason, /net/i);

  const noHook = angler({ gear: ["fishing_bait", "fishing_net"] });
  assert.match(canCatchFish(noHook, "clam").reason, /hook/i);
});

test("canCatchFish() needs no carried gear for a rod-caught species", () => {
  const state = angler({ gear: [] });
  assert.equal(canCatchFish(state, "trout").ok, true, "trout is caught on the rod alone");
});

test("canCatchFish() succeeds with the level, the rod tier and the gear", () => {
  assert.equal(canCatchFish(angler(), "pike").ok, true);
  assert.equal(canCatchFish(angler(), "leviathan").ok, true);
});

test("canCatchFish() refuses a species that isn't one", () => {
  assert.equal(canCatchFish(angler(), "kettle").ok, false);
});

// ------------------------------------------------------------------- bait

test("fishingGearFor() picks the highest tier bait in the pack", () => {
  const state = angler({ gear: [] });
  state.inventory.fishing_bait = 3;
  state.inventory.mythic_fishing_bait = 1;
  assert.equal(fishingGearFor(state, "bait"), "mythic_fishing_bait");
  assert.equal(fishingGearFor(state, "net"), null, "no net in the pack");
});

test("spendBait() charges one bait per catch and stops the run when it's gone", () => {
  const state = angler({ gear: [] });
  state.inventory.fishing_bait = 2;

  assert.equal(spendBait(state, "pike"), true);
  assert.equal(state.inventory.fishing_bait, 1);
  assert.equal(spendBait(state, "pike"), true);
  assert.equal(spendBait(state, "pike"), false, "out of bait ends the trip");
});

test("spendBait() charges nothing for rod-, net- and hook-caught species", () => {
  const state = angler({ gear: [] });
  state.inventory.fishing_net = 1;
  for (const species of ["trout", "shrimp", "clam"]) {
    assert.equal(spendBait(state, species), true);
  }
  assert.equal(state.inventory.fishing_net, 1, "nets are reusable");
});

// ------------------------------------------------------------- the payoff

// What the selector actually hands the game loop: lootIds, which reaches
// rollLootByType's allowIds - so the gather only ever turns up what was chosen.
test("a chosen species' lootIds constrain the loot roll to that species", () => {
  const ids = catchItemsFor("tuna");
  for (let i = 0; i < 40; i++) {
    const loot = rollLootByType("food", "raw_fish", undefined, Math.random, ids);
    assert.equal(loot.itemId, "raw_tuna");
  }

  const partIds = catchItemsFor("leviathan");
  for (let i = 0; i < 40; i++) {
    const loot = rollLootByType("crafting", "fishing", undefined, Math.random, partIds);
    assert.ok(partIds.includes(loot.itemId));
    assert.equal(ALL_ITEMS[loot.itemId].fishingTier, "ancient");
  }
});
