// The travel map in apocylta-guide.md is generated from data/locations.js by
// data/worldMap.js and spliced in by tools/buildGuideMap.js. Nothing forces the
// two to stay together, so this file does: change a location and forget to run
// `npm run docs:map`, and the last test here fails with that instruction.
//
// The same shape test/unit/playerPage.test.js uses for the regions shared
// between the two web pages - assert the committed text is byte-identical to
// what the generator produces, rather than trusting a habit.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LOCATIONS } from "../../data/locations.js";
import { REGIONS, buildRegionTree, buildWorldMap, regionMembers, shopInteriorIds } from "../../data/worldMap.js";
import { BEGIN, END, GUIDE, spliceWorldMap } from "../../tools/buildGuideMap.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const guide = fs.readFileSync(path.join(root, GUIDE), "utf8");

// A region nothing recognises would silently drop its locations off the map
// entirely - buildWorldMap only iterates REGIONS, so an unmapped location is
// invisible rather than an error. Same guard shape as locations.test.js's
// mine/water checks, and the same failure mode it exists to prevent.
test("every location names a region the map knows", () => {
  const unknown = Object.entries(LOCATIONS)
    .filter(([, location]) => !(location.region in REGIONS))
    .map(([id, location]) => `${id}: region ${JSON.stringify(location.region)}`);
  assert.deepEqual(unknown, [], `known regions are ${Object.keys(REGIONS).join(", ")}`);
});

test("every region's root is one of its own members", () => {
  for (const [id, region] of Object.entries(REGIONS)) {
    assert.equal(LOCATIONS[region.root]?.region, id, `${id}'s root ${region.root} belongs elsewhere`);
  }
});

// The two-pass walk in buildRegionTree can leave a location stranded if it is
// only reachable by something the walk doesn't follow - which is exactly what
// happened to `safehouse` before hub-feature links were included, since no
// exit anywhere points at it.
test("every location outside a shop door lands on exactly one tree", () => {
  const shops = shopInteriorIds();
  const placements = new Map();

  for (const regionId of Object.keys(REGIONS)) {
    for (const id of buildRegionTree(regionId).nodes.keys()) {
      placements.set(id, (placements.get(id) ?? 0) + 1);
    }
  }

  const expected = Object.keys(LOCATIONS).filter((id) => !shops.has(id));
  const missing = expected.filter((id) => !placements.has(id));
  const duplicated = [...placements.entries()].filter(([, count]) => count > 1).map(([id]) => id);

  assert.deepEqual(missing, [], "unreachable from their own region's root");
  assert.deepEqual(duplicated, [], "drawn on more than one region tree");
});

test("every region accounts for all of its members", () => {
  for (const regionId of Object.keys(REGIONS)) {
    const tree = buildRegionTree(regionId);
    const shops = shopInteriorIds();
    const drawn = tree.nodes.size;
    const hidden = regionMembers(regionId).filter((id) => shops.has(id)).length;
    assert.equal(drawn + hidden, tree.memberCount, `${regionId}: ${drawn} drawn + ${hidden} shops != ${tree.memberCount}`);
    assert.deepEqual(tree.unreached, [], `${regionId} has locations its root can't reach`);
  }
});

// The splice is positional, so a duplicated sentinel would cut the guide in the
// wrong place and quietly delete whatever sat between the two copies.
test("the guide carries exactly one pair of worldmap sentinels", () => {
  for (const sentinel of [BEGIN, END]) {
    const count = guide.split(sentinel).length - 1;
    assert.equal(count, 1, `${GUIDE} has ${count} copies of ${sentinel}, expected 1`);
  }
  assert.ok(guide.indexOf(BEGIN) < guide.indexOf(END), "sentinels are the wrong way round");
});

test("the map committed to the guide is the map the code builds", () => {
  assert.equal(
    guide,
    spliceWorldMap(guide, buildWorldMap()),
    `${GUIDE}'s world map is stale - run \`npm run docs:map\``
  );
});
