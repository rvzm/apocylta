# apocylta
![Version 0.0.1](https://img.shields.io/badge/Version:-0.0.1-blue)
![TermSize](https://img.shields.io/badge/terminal_size-%3E%3D120x40-red)

## post-apocalypse rpg, for your terminal.

## Project Status

Early and actively in development (`0.0.1`), but genuinely playable end to end: make a character, travel a
world of 66 locations, gather and mine and fish for materials, cook and smith and brew them into something
better, take quests, fight things, learn spells, and save your run — or lose it permanently, if you picked
a difficulty that plays for keeps.

Built and tested for a **120x40** terminal or larger. It will run smaller, but screens with long lists
(the spellbook, the crafting bench) start scrolling sooner than they should.

Dependencies:

![NodeJS](https://img.shields.io/badge/NodeJS_version-%3E%3D18-green)
![Neo-Blessed](https://img.shields.io/badge/neo--blessed-^0.2.0-green)
![SQLite](https://img.shields.io/badge/better--sqlite3-^13.0.3-green)

---

# Welcome to apocylta.

The land is harsh, but you can make your way well enough. Travel around, and gather, forage, mine, and
fight for the materials you need to survive.

In this world, you can level up your skills, yourself, and live whatever life you want.

## Features

- **Character creation** — five races, five classes, seven difficulties (Casual through Demon Lord) and
  seven starter packs. Your difficulty sets far more than enemy stats: it decides how many skills you may
  call proficient, how fast the world gives up its materials, how often something jumps you, and whether
  death is recoverable.
- **A hand-built world** — 66 connected locations across town, wilderness, mountains, caves, coastal
  cities and the deep chambers beyond, each with its own shops, resources, opening hours and dangers.
- **Timed travel** — longer trips run a countdown with a category-appropriate ASCII animation (a walker on
  a road, a glider over the sky, a cart in a tunnel) and pay Speed xp on arrival. Stepping into a shop
  stays instant.
- **Gathering that makes you wait** — scavenging, foraging, chopping, trapping, mining and fishing all run
  as attempts spaced by your difficulty, and an attempt can come up empty. Your skill against what you're
  after sets the odds.
- **Mining and fishing, each with a picker** — mining lists the ores the local seam holds, gated by your
  level and your pickaxe's tier. Fishing lists what's swimming in the local water, gated by your level,
  your rod, and whether you're carrying the bait, net or hook that species takes.
- **Crafting** — smith, cook, grill, smoke, pickle and brew at stations, from a catalog of 905 items. Buy
  a house and you can build your own bench rather than borrowing the safehouse's.
- **17 trainable skills** — each levels independently as you use it, and each feeds your overall level.
- **Turn-based combat** — one keypress per exchange, against 107 enemies from lone goblins to packs to
  named bosses. Armor mitigates by percentage with diminishing returns rather than flat subtraction.
- **46 spells** — learned with reagents, from starter cantrips to godlike, cast in or out of a fight.
- **Quests and achievements** — take work from a Quest Board, track it in your Journal (objectives can
  nest into groups, and some are optional), and claim rewards when it's done. 24 achievements unlock and
  pay out on their own as you play.
- **A Toolbelt with real capacity** — your belt sets backpack slots, potion pouch and ammo, and some
  resources aren't usable without one at all.
- **Save/load** — multiple SQLite save slots plus a timed autosave that shows up as an extra loadable
  entry. On Survival and Nightmare, dying deletes both.
- **A companion web view** — a live read-only playercard at `localhost:4000` with tabs for stats,
  toolbelt, backpack, quests and achievements. Export it as a standalone HTML file that keeps working
  offline, or as raw JSON that the reader page at `/apocylta_player.html` draws back into the same card.

## Getting Started

### Requirements
- [Node.js](https://nodejs.org/) 18 or later

### Install
```sh
npm install
```
(`better-sqlite3` compiles a native module on install.)

### Run
```sh
npm start         # play
npm run dev       # play, auto-restarting on file changes
```
The game takes over your terminal window. The companion playercard is at `http://localhost:4000/` once
it's running (configurable in `config.js`).

### Environment variables

All optional — mostly for running a second copy without disturbing your real save.

| variable | what it does |
| --- | --- |
| `DB_PATH` | where the SQLite save file lives |
| `AUTOSAVE_PATH` | where the autosave JSON lives |
| `LOG_PATH` | where the log file is written |
| `DEBUG_LEVEL` | overrides `game_config.debugLevel` |
| `ALLOW_ADMIN` | overrides `game_config.allow_admin` both ways — `true` unlocks the in-game state editors (see below), anything else locks them out |

## Documentation

- **[apocylta-guide.md](./apocylta-guide.md)** — the player's manual: how every system actually works.
- **[apocylta-gui.md](./apocylta-gui.md)** — every screen, drawn, with what its keys do.
- **[CLAUDE.md](./CLAUDE.md)** — the architecture, for anyone working on the code.

Everything is hotkey-driven, and each screen prints its own legend along the bottom
(`[T]ravel | [1] Gather scraps | [M]enu`), so you can find your way without either document.

## Admin tools

With `ALLOW_ADMIN=true`, the Menu grows a `[V] Admin` entry: eight editors for stats, skills, inventory,
equipment, toolbelt, quests and achievements, plus a godmode toggle. They write state directly, skipping
every gate the game has — useful for testing a screen you'd otherwise need forty levels to reach. Off by
default, and the gate is enforced both on the menu entry and on every editor.

## Testing

```sh
npm test                  # everything
npm run test:unit         # fast, no tmux required
npm run test:integration  # drives the actual terminal UI via tmux
```
The integration suite launches the real game inside a `tmux` session and drives it with real keystrokes,
so `tmux` needs to be installed to run it (not required for `test:unit`). Several tests exercise real
timed travel and take tens of real seconds; the full suite is roughly a minute and a half.
