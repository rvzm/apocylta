# apocylta
![Version 0.0.1](https://img.shields.io/badge/Version:-0.0.1-blue)
![TermSize](https://img.shields.io/badge/terminal_size-^30x150-red)

## post-apocalypse rpg, for your terminal.

## Project Status
#### apocylta is tested and built for a 35x150 terminal window. Smaller than this is not recommended.

Early and actively in development (`0.0.1`). Gathering, mining, crafting, skills, the toolbelt/belt system, shops, quests, timed travel, turn-based combat, spellcasting, achievements, and save/load are all playable today. Achievements unlock and pay out on their own as you play; browse them from the Menu, or on the Achievements tab of the companion web view.


Dependencies:

![NodeJS](https://img.shields.io/badge/NodeJS_version-%3E%3D18-green)
![Neo-Blessed](https://img.shields.io/badge/neo--blessed-^0.2.0-green)
![SQLite](https://img.shields.io/badge/better--sqlite3-^13.0.3-green)

---

# Welcome to apocylta.
The land is harsh, but you can make your way well enough. Travel around, and gather, forage, mine, and fight for the materials you need to survive.

In this world, you can level up your skills, yourself, and live whatever life you want.


## Features

- **Character creation** - pick a race, class, and difficulty (Casual through Nightmare), each with their own starting proficiencies, gear, and modifiers. Difficulty controls how many skills you get to pick as proficient at creation and how much of an edge that proficiency actually gives you.
- **A hand-built world to explore** - dozens of connected locations across town, wilderness, mountains, caves, a coastal city, and more, each with their own shops, gatherable resources, and day/night opening hours.
- **Timed travel** - getting somewhere takes real time now. Longer trips show a dedicated countdown screen with a little ASCII animation - a traveler moving along a road, or a glider cruising across the sky for airboat routes - and grant Speed skill XP on arrival. Quick hops (stepping into a shop, walking back out of one) stay instant.
- **Gathering** - scavenge scraps, forage, fish, chop wood, and mine ore, all as timed actions that roll loot and grant skill XP over time.
- **Mining** - a dedicated ore selector gated by both your mining skill level and the tier of pickaxe you have equipped.
- **Crafting** - smith, cook, and brew at dedicated stations using gathered materials and recipes.
- **18 trainable skills** - from mining and smithing to barter, luck, and speed, each leveling independently as you use them, and each contributing toward your overall player level as you go.
- **Quests** - pick up quests from a Quest Board, track objectives and rewards in your Journal, and claim rewards once everything's checked off.
- **A Toolbelt with real capacity** - your equipped belt determines how much you can carry (backpack slots, potion pouch, slingshot ammo), and some resources (water, ammo, arrows) are only usable with a belt equipped at all.
- **Shops** - buy, sell, and browse goods gated by your barter skill and the shop's opening hours.
- **A colorized terminal UI** - a dark, terminal-green look throughout, with HP/MP/XP bars that shift color as they fill or drain, a safe-zone/danger indicator on your current location, and a live status readout of whatever you're currently doing.
- **Save/load** - multiple save slots to a local SQLite database, plus a separate autosave that runs on a timer and shows up as an extra loadable entry alongside your manual saves.
- **A companion web view** - the game also serves a live, read-only "playercard" web page alongside the terminal UI, with tabs for your stats, toolbelt, backpack, quest progress, and a browsable achievements catalog, all from any browser on the same machine.

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
npm start        # play
npm run dev       # play, auto-restarting on file changes
```
The game takes over your terminal window. The companion playercard web view is available at `http://localhost:4000/` once the game has started (configurable in `config.js`).

## How to Play

Everything is hotkey-driven - each screen shows a legend of available commands at the bottom (e.g. `[T]ravel | [1] Gather scraps | [M]enu`). A new game walks you through naming your character and choosing a difficulty, starter pack, race, class, and a handful of proficient skills before dropping you into the world. From there, `[T]ravel` to get around (quick hops are instant, longer trips take real time), act on whatever a location offers, pick up work from a Quest Board where available, and check `[M]enu` for your character sheet, backpack, and save/load. See [`apocylta-gui.md`](./apocylta-gui.md) for what the actual screens look like.

## Testing

```sh
npm test              # everything
npm run test:unit     # fast, no tmux required
npm run test:integration  # drives the actual terminal UI via tmux
```
The integration suite launches the real game inside a `tmux` session and drives it with real keystrokes, so `tmux` needs to be installed to run it (not required for `test:unit`).
