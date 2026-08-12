// apocylta world data - the travel map, derived from data/locations.js
//
// buildWorldMap() renders the whole map block that apocylta-guide.md carries
// between its `worldmap:begin`/`worldmap:end` sentinels. The map is GENERATED
// and committed rather than hand-written: locations.js is ~2000 lines and moves
// (Vetron and Kooz went from two dangling exits to eight real locations in one
// sitting), and a hand-drawn map would have been wrong within the hour.
// tools/buildGuideMap.js does the splicing; test/unit/worldMap.test.js asserts
// the committed block still matches what this file builds.
//
// Nothing in here touches ui/ - same layering rule data/flavor.js follows.

import { LOCATIONS } from "./locations.js";
import { HUB_FEATURES } from "./hubFeatures.js";
import { getEnemy } from "../enemy_backbone.js";

// Declaration order is render order: the regions roughly in the order a run
// meets them, with your house last since it's a destination rather than a place
// you pass through.
export const REGIONS = {
  haven: { name: "Apocylta Haven", root: "town_square" },
  zenthal: { name: "Zenthal", root: "zenthal_airport" },
  hub: { name: "Apocylta Regional Hub", root: "regional_hub" },
  cordura: { name: "Cordura", root: "cordura_outpost" },
  vetron: { name: "Vetron", root: "vetron_station" },
  kooz: { name: "Kooz", root: "kooz_station" },
  azari: { name: "Azari", root: "azari_town" },
  castle: { name: "Apocyltia Castle", root: "apocyltia_castle" },
  home: { name: "Your Home", root: "playerhome" },
};

// Exit categories you can walk (or ride a cart through). Pass 1 of the tree
// walk follows only these, so the shape that comes out is the one you'd get on
// foot; teleports and airboats are shortcuts laid over it, not its skeleton.
//
// A category missing from here still gets drawn - pass 2 accepts anything - but
// it lands wherever the shortcut pass happens to reach it rather than where you
// would actually walk to it from, so a new walkable category belongs in this
// set. `inside` (the Apocyltia Castle wings) arrived that way.
const OVERLAND = new Set(["path", "cave", "in_cave", "shop", "inside"]);

// How an exit reads on a row. An unlisted category falls back to its own name,
// which renders rather than crashing - the same forgiving treatment
// ui/screens/traveling.js gives an unrecognised category.
const TITLE = {
  path: "road",
  cave: "cave",
  in_cave: "tunnel",
  inside: "hallway",
  teleport: "teleport",
  airboat: "airboat",
  shop: "door",
};

const label = (id) => LOCATIONS[id]?.name ?? id;

// Title Case, for the overview diagram - location names are stored lowercase
// ("town square") but read as proper nouns when they're the whole label.
function titled(id) {
  return label(id).replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// An exit list with duplicate destinations collapsed. cave_mines listed
// south_deep_cave twice for a while, which drew the same subtree in two places.
function exitsOf(locationId) {
  const seen = new Set();
  return (LOCATIONS[locationId]?.exits ?? []).filter((exit) => {
    if (seen.has(exit.to)) return false;
    seen.add(exit.to);
    return true;
  });
}

// Every location you reach by opening a shop door rather than by travelling.
// These never get their own row on a tree - they collapse into the region's
// "Shops:" line, since a shop interior is a counter, not a place.
export function shopInteriorIds() {
  const ids = new Set();
  for (const id of Object.keys(LOCATIONS)) {
    for (const exit of exitsOf(id)) if (exit.category === "shop") ids.add(exit.to);
  }
  return ids;
}

export function regionMembers(regionId) {
  return Object.keys(LOCATIONS).filter((id) => LOCATIONS[id].region === regionId);
}

// Locations linked by something other than an exit - the Safehouse and your
// house hang off HUB_FEATURES' `to`, and nothing in `exits` points at either.
// Without these, safehouse is an orphan on the Haven tree.
function featureLinks(locationId) {
  return (LOCATIONS[locationId]?.hubFeatures ?? [])
    .map((featureId) => HUB_FEATURES[featureId])
    .filter((feature) => feature?.to)
    .map((feature) => ({ to: feature.to, category: "feature", hotkey: feature.hotkey, label: feature.label }));
}

// What gets printed after a location's name. Order is fixed so a column of them
// reads down the page: how safe, what's underground, what's in the water, who
// lives there.
function annotationsFor(locationId) {
  const location = LOCATIONS[locationId];
  const notes = [];
  if (location.safe) notes.push("safe");
  if (location.mine) notes.push(`mine: ${location.mine.replace(/_/g, " ")}`);
  if (location.water) notes.push(location.water);
  // `boss` is an id list where there is one, but nine locations spell "none" as
  // `boss: false` rather than by omitting the field.
  const bosses = Array.isArray(location.boss) ? location.boss.map((id) => getEnemy(id)?.name ?? id) : [];
  if (bosses.length) notes.push(`boss: ${bosses.join(", ")}`);
  return notes;
}

// The shortcuts that don't define the tree but are worth knowing about from the
// row they leave: portal_room's four teleports, mountain_peak's airboat.
//
// Run as a post-pass, once the tree exists, because what counts as a shortcut
// depends on the shape: town_square teleports to the portal room, but the
// portal room is the row directly beneath it, so saying so twice is noise.
// Anything already adjacent on the tree is dropped for that reason.
function attachShortcuts(node) {
  const adjacent = new Set([node.parent, ...node.children.map((child) => child.id)]);
  node.shortcuts = exitsOf(node.id)
    .filter((exit) => exit.category === "teleport" || exit.category === "airboat")
    .filter((exit) => LOCATIONS[exit.to] && !adjacent.has(exit.to))
    .map((exit) => `${label(exit.to)} ${exit.time ?? 0}s`);
  node.children.forEach(attachShortcuts);
}

// Builds one region's tree, breadth-first from its root, in two passes.
//
// Pass 1 walks overland exits and hub-feature links only. Pass 2 picks up
// whatever is left using teleports and airboats. The split is what makes the
// result read like a map instead of a graph dump: portal_room teleports
// straight to mountain_peak and cave_entrance, so a single-pass BFS files both
// of them under the portal room - true, but useless to someone working out how
// to walk there. With the split they hang off west_path where they belong, and
// portal_room joins last as the shortcut it is.
export function buildRegionTree(regionId) {
  const region = REGIONS[regionId];
  if (!region) throw new Error(`unknown region "${regionId}"`);

  const members = new Set(regionMembers(regionId));
  const shops = shopInteriorIds();
  const claimable = new Set([...members].filter((id) => !shops.has(id)));
  if (!claimable.has(region.root)) throw new Error(`region "${regionId}" root ${region.root} is not one of its own`);

  const nodes = new Map();
  const addNode = (id, parent, edge) => {
    const node = { id, parent, edge, children: [], annotations: annotationsFor(id), shortcuts: [] };
    nodes.set(id, node);
    if (parent) nodes.get(parent).children.push(node);
    return node;
  };

  addNode(region.root, null, null);

  const walk = (accept) => {
    const queue = [region.root];
    while (queue.length) {
      const current = queue.shift();
      const edges = [...exitsOf(current), ...featureLinks(current)];
      for (const edge of edges) {
        if (!claimable.has(edge.to) || nodes.has(edge.to)) continue;
        if (!accept(edge)) continue;
        addNode(edge.to, current, edge);
        queue.push(edge.to);
      }
    }
  };

  walk((edge) => OVERLAND.has(edge.category) || edge.category === "feature");
  walk(() => true);
  attachShortcuts(nodes.get(region.root));

  const unreached = [...claimable].filter((id) => !nodes.has(id));
  return { id: regionId, ...region, root: nodes.get(region.root), nodes, unreached, memberCount: members.size };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const ANNOTATION_COLUMN = 44;
const FENCE_WIDTH = 118;

function edgeText(edge) {
  if (!edge) return "";
  if (edge.category === "feature") return `[${edge.hotkey}] ${edge.label}`;
  const how = TITLE[edge.category] ?? edge.category;
  return edge.time ? `${edge.time}s ${how}` : `instant ${how}`;
}

function renderNode(node, prefix, isLast, rows) {
  const connector = node.parent === null ? "" : isLast ? "`- " : "|- ";
  const head = `${prefix}${connector}${label(node.id)}`.padEnd(ANNOTATION_COLUMN);
  const trailer = (notes) => [edgeText(node.edge), notes.join(", ")].filter(Boolean).join("   ");
  const facts = trailer(node.annotations);

  // The Regional Hub has seven shortcuts and your house five, which as one
  // trailer runs past 180 columns and turns the code fence into a horizontal
  // scrollbar. Overlong shortcut lists drop to their own continuation rows,
  // indented to the annotation column so they still read as that row's.
  const oneLine = node.shortcuts.length
    ? trailer([...node.annotations, `-> ${node.shortcuts.join(", ")}`])
    : facts;

  if (`${head}${oneLine}`.length <= FENCE_WIDTH) {
    rows.push(oneLine ? `${head}${oneLine}` : head.trimEnd());
  } else {
    rows.push(facts ? `${head}${facts}` : head.trimEnd());
    const pad = " ".repeat(ANNOTATION_COLUMN);
    let row = "->";
    for (const target of node.shortcuts) {
      const next = `${row} ${target},`;
      if (`${pad}${next}`.length > FENCE_WIDTH) {
        rows.push(`${pad}${row}`);
        row = `   ${target},`;
        continue;
      }
      row = next;
    }
    rows.push(`${pad}${row.replace(/,$/, "")}`);
  }

  const childPrefix = node.parent === null ? "" : prefix + (isLast ? "   " : "|  ");
  node.children.forEach((child, i) => renderNode(child, childPrefix, i === node.children.length - 1, rows));
}

// One line per region naming every shop counter in it. Interiors are named by
// the door you go through; counters that sit on an ordinary location - which is
// how Vetron and Kooz are built - are named by where they stand.
//
// Two exclusions. A feature carrying a `message` is a stub that prints "Not
// implemented yet" (shop_ammo, shop_repair, shop_ingredients), and a guide that
// lists those is lying to the reader. shop_sell is dropped because it's on
// practically every counter in the game, so naming it each time says nothing -
// the guide covers selling once, in the Money section.
const SHOP_LIST_SKIP = new Set(["shop_sell"]);

function shopLabelsAt(locationId) {
  return (LOCATIONS[locationId].hubFeatures ?? [])
    .map((featureId) => HUB_FEATURES[featureId])
    .filter((feature) => feature?.id.startsWith("shop_") && !feature.message && !SHOP_LIST_SKIP.has(feature.id))
    .map((feature) => feature.label.toLowerCase());
}

function renderShops(regionId) {
  const shops = shopInteriorIds();
  const interiors = [];
  const counters = [];

  for (const id of regionMembers(regionId)) {
    const labels = shopLabelsAt(id);
    if (!labels.length) continue;
    (shops.has(id) ? interiors : counters).push(`${label(id)} (${labels.join(", ")})`);
  }

  const parts = [];
  if (interiors.length) parts.push(interiors.join("; "));
  if (counters.length) parts.push(`${interiors.length ? "plus counters" : "counters"} at ${counters.join("; ")}`);
  return wrap(parts.length ? `**Shops:** ${parts.join("; ")}.` : "**Shops:** none.");
}

// The guide wraps its prose at 110 columns; a region with eight counters blows
// well past that as one line.
const PROSE_WIDTH = 110;

function wrap(text) {
  const rows = [];
  let row = "";
  for (const word of text.split(" ")) {
    if (row && row.length + 1 + word.length > PROSE_WIDTH) {
      rows.push(row);
      row = word;
      continue;
    }
    row = row ? `${row} ${word}` : word;
  }
  if (row) rows.push(row);
  return rows.join("\n");
}

// Every exit whose far end is in another region.
export function crossRegionLinks() {
  const links = [];
  for (const [id, location] of Object.entries(LOCATIONS)) {
    for (const exit of exitsOf(id)) {
      const target = LOCATIONS[exit.to];
      if (!target || target.region === location.region) continue;
      links.push({ from: id, to: exit.to, time: exit.time ?? 0, category: exit.category });
    }
  }
  return links;
}

const FAN_MINIMUM = 3;

// Draws the long hauls. Anywhere with FAN_MINIMUM or more outbound cross-region
// links becomes a fan; whatever is left is listed underneath as pairs. The fan
// centres are found by counting, never named: playerhome went from two links to
// five the day this was written, and regional_hub is only the busiest node by
// happening to be.
function renderOverview() {
  const links = crossRegionLinks();
  const byOrigin = new Map();
  for (const link of links) {
    if (!byOrigin.has(link.from)) byOrigin.set(link.from, []);
    byOrigin.get(link.from).push(link);
  }

  const centres = [...byOrigin.entries()]
    .filter(([, group]) => group.length >= FAN_MINIMUM)
    .sort((a, b) => b[1].length - a[1].length);
  const fanned = new Set(centres.map(([id]) => id));

  const rows = [];
  for (const [centre, group] of centres) {
    const head = `${titled(centre).toUpperCase()} `;
    const spokeWidth = Math.max(...group.map((l) => `${l.time}s ${TITLE[l.category] ?? l.category}`.length));
    group.forEach((link, i) => {
      const how = `${link.time}s ${TITLE[link.category] ?? link.category}`.padEnd(spokeWidth);
      const stem = i === Math.floor((group.length - 1) / 2) ? head.padEnd(head.length, " ") : " ".repeat(head.length);
      const rail = i === Math.floor((group.length - 1) / 2) ? "-".repeat(4) : " ".repeat(4);
      rows.push(`  ${stem}${rail}+-- ${how} --> ${titled(link.to)}`);
    });
    rows.push("");
  }

  // What's left: the point-to-point hauls, deduplicated so a route that exists
  // in both directions is one line rather than two.
  //
  // A fan spoke covers its own return leg. Six of the seven regions exit back
  // to the Regional Hub, and without this every one of them was drawn a second
  // time down here as a "(one way)" row pointing at a hub the diagram above had
  // just drawn pointing the other way.
  const covered = new Set();
  for (const [centre, group] of centres) for (const link of group) covered.add([centre, link.to].sort().join("|"));

  const pairs = new Map();
  for (const link of links) {
    const key = [link.from, link.to].sort().join("|");
    if (covered.has(key)) continue;
    const existing = pairs.get(key);
    if (existing) existing.both = true;
    else pairs.set(key, { ...link, both: false });
  }

  // "Apocylta Regional Hub (Apocylta Regional Hub)" - a region named after its
  // only real location doesn't need saying twice.
  const place = (id) => {
    const region = REGIONS[LOCATIONS[id].region].name;
    return region.toLowerCase() === label(id).toLowerCase() ? titled(id) : `${titled(id)} (${region})`;
  };

  if (pairs.size) {
    const entries = [...pairs.values()];
    const width = Math.max(...entries.map((link) => place(link.from).length));
    for (const link of entries) {
      const arrow = link.both ? "<-->" : " -->";
      const oneWay = link.both ? "" : "   (one way)";
      rows.push(
        `  ${place(link.from).padEnd(width)}  ${arrow}  ${link.time}s ${TITLE[link.category] ?? link.category}  ${place(link.to)}${oneWay}`
      );
    }
  }

  return rows;
}

export function buildWorldMap() {
  const out = [];

  out.push("### The long hauls", "");
  out.push(
    "Every route that crosses from one region into another. Everything else is local, and shows up on the",
    "region maps below."
  );
  out.push("", "```");
  out.push(...renderOverview());
  out.push("```", "");

  out.push(
    "Read the region maps as *how you'd walk it*: each location hangs off the one you'd reach it from, with",
    "the trip time and the kind of route beside it. `->` on a row lists the shortcuts leaving that location",
    "that the tree doesn't need — teleports and airboats. Shop interiors aren't drawn; they're gathered into",
    "the `Shops:` line under each region."
  );
  out.push("");

  for (const regionId of Object.keys(REGIONS)) {
    const tree = buildRegionTree(regionId);
    // The count is every location in the region; the tree draws all but the
    // shop interiors, so say how many are missing rather than leaving a reader
    // to count rows and conclude the map dropped some.
    const hidden = tree.memberCount - tree.nodes.size;
    const plural = tree.memberCount === 1 ? "location" : "locations";
    const behindDoors = hidden ? ` (${hidden} behind shop doors)` : "";
    out.push(`### ${tree.name} — ${tree.memberCount} ${plural}${behindDoors}`, "");
    out.push("```");
    const rows = [];
    renderNode(tree.root, "", true, rows);
    out.push(...rows);
    out.push("```", "");
    out.push(renderShops(regionId));
    if (tree.unreached.length) {
      out.push("", `Not reachable from ${label(tree.root.id)}: ${tree.unreached.map(label).join(", ")}.`);
    }
    out.push("");
  }

  return out.join("\n").replace(/\n+$/, "\n");
}
