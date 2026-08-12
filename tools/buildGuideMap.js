#!/usr/bin/env node
// Regenerates the world map in apocylta-guide.md. Run it with `npm run docs:map`
// after anything in data/locations.js moves.
//
// The map lives between two sentinel comments in the guide and is replaced
// wholesale. test/unit/worldMap.test.js asserts the committed block matches
// what data/worldMap.js builds, so forgetting to run this fails the suite
// rather than leaving the guide quietly describing a world that changed.
//
// This is the only piece of the map that touches the filesystem - data/ stays
// pure, the same way it stays free of ui/ imports.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildWorldMap } from "../data/worldMap.js";

export const GUIDE = "apocylta-guide.md";
export const BEGIN = "<!-- worldmap:begin -->";
export const END = "<!-- worldmap:end -->";

// Exported so the test can splice with exactly the same rules the tool writes
// with, rather than a second implementation that agrees by coincidence.
export function spliceWorldMap(source, map) {
  const start = source.indexOf(BEGIN);
  const end = source.indexOf(END);
  if (start === -1 || end === -1) {
    throw new Error(`${GUIDE} is missing the ${BEGIN} / ${END} sentinels`);
  }
  if (end < start) throw new Error(`${GUIDE} has its worldmap sentinels the wrong way round`);

  const head = source.slice(0, start + BEGIN.length);
  const tail = source.slice(end);
  return `${head}\n\n${map}\n${tail}`;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const guidePath = path.join(root, GUIDE);

// Only run the write when invoked directly - the test imports spliceWorldMap.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = fs.readFileSync(guidePath, "utf8");
  const updated = spliceWorldMap(source, buildWorldMap());
  if (updated === source) {
    console.log(`${GUIDE}: world map already up to date`);
  } else {
    fs.writeFileSync(guidePath, updated);
    console.log(`${GUIDE}: world map regenerated`);
  }
}
