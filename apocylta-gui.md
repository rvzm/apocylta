# apocylta GUI

This document shows the various GUI layouts.


## The Game Itself

The game runs inside the terminal, and looks kinda like this:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  The Town square - a wonderful hub for various shops.                 |
|                                                                       |
|    Shopfronts line three sides of the square, and a road runs        |
|    north out of town.                                                 |
|    The light is going orange, and the shadows are getting long.       |
|    Rain is coming down steadily, drumming on everything metal.        |
|                                                                       |
|    A handful of people are about, none looking at each other.         |
|    The quest board is up against the far wall, thick with paper.      |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                    |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to do? |__________________________________________|
|                                                                       |
| [T]ravel            | [1] Gather scraps   | [2] Look for food         |
| [C] Quest Board      | [S]afehouse         | [L] Toolbelt              |
| [J] Go Home          | [K] Stations        | [M]enu                    |
|_______________________________________________________________________|
```

The header is three columns: who you are, where you are and what you're carrying on the left, whatever you're currently doing (or `[idle]`) centered, and the clock hugging the right edge. The whole UI is colorized against a dark terminal-green theme - `apocylta` is bold blue, your name is bold white with the level beside it, the location name is bracketed and bolded with the brackets themselves flipping green/red to match the safe-zone badge, gold and the location name are a yellow-orange, and HP/MP are bold and shift color by percentage (HP: green → white → blue → orange → red; MP: light blue → blue → dark blue → red) as they drop. Plain-text mockups in this doc obviously can't show the colors themselves, just the layout.

Your name and level only appear once you have a character - on the title screen and all the way through creation the header simply doesn't show that segment. Very long names are shortened with an `…` so the gold readout doesn't get pushed off the end; the full name is still on the Menu. The app version used to sit in the header where the name is now, and lives on the title screen instead.

Below the one-line description, a location's flavour text fills out the pane. Some of those lines are fixed and some are worked out as you're looking at them - the light changes as the clock moves, the weather drifts over a few hours, a shop tells you whether anyone's behind the counter, and lines about being hurt or nearly out of pack space only turn up when they apply. The location screen redraws every second, so you'll see dusk turn into night while standing still.

Every location builds its own command legend dynamically - actions available there (numbered), hub features present there (lettered), plus the fixed `[T]ravel`/`[K]Stations`/`[M]enu`. `[C] Quest Board` above happens to land on the same letter as this doc's older `[C]heck the quest board` mockup, but it's a coincidence of which letters were free, not a naming convention - see [Quests](#quests) below for what's actually behind it now.

**`q`, `Q` and `Ctrl-C` quit from anywhere**, immediately and without a confirmation. They're bound on the blessed screen itself rather than in any screen's keymap, so they fire even where the legend offers nothing of the kind - which is also why no screen may use `Q` for anything else.


## The Title Screen

Where every run starts. It carries the app version (the header gave up that space to the player's name), a short pitch, and a line that knows whether you've played before - a first launch reads "Welcome to the wasteland. This is your first run.", a return reads "Welcome back. You last played 3 hours ago.", counted from the stamp the settings row keeps.
```
_________________________________________________________________________
| apocylta |                                        [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| APOCYLTA                                                              |
|                                                                       |
|     post-apocalypse rpg, for your terminal.  v0.0.1                   |
|                                                                       |
| The land is harsh, but you can make your way well enough. Travel       |
| around, and gather, forage, mine, and fight for the materials you      |
| need to survive.                                                      |
|                                                                       |
| Press N to start a new game                                           |
| Press C to continue an existing one.                                  |
|                                                                       |
| Press E to exit.                                                      |
|                                                                       |
| Welcome back. You last played 3 hours ago.                            |
|_______________________________________________________________________|
| hp: 100 | mp: 100 |                                                   |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to do? |__________________________________________|
|                                                                       |
| [N]ew Game           | [C]ontinue           | [E]xit                  |
|_______________________________________________________________________|
```
Note the header with no identity segment at all - there's no character yet. `[C]ontinue` opens the same save-slot picker the Menu's `[L]oad` uses (see [Save & Load](#save--load)).


## The Menu

`[M]enu` from anywhere, and it doubles as your character sheet: who you are, what you're wearing across all ten visible slots, and every skill with its level and banked xp in two columns. This is where a long name shows in full.
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Name:       Rae                                                       |
| Race/Class: Human Warrior                                             |
| Difficulty: Normal                                                    |
| Level:      4                                                         |
| Experience: 1240 XP                                                   |
|                                                                       |
| Equipment:                                                            |
|   Weapon : Wooden Dagger        Belt   : Leather Belt                 |
|   Tool   : empty                Head   : empty                        |
|   ...                                                                 |
|                                                                       |
| Skills:                                                               |
|   Magic Lv.1 (0xp)        | Defense Lv.5 (312xp)                      |
|   Fighting Lv.5 (400xp)   | Speed Lv.2 (95xp)                         |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                     |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to do? |__________________________________________|
|                                                                       |
| [B]ackpack       | [A]chievements   | [S]ave                          |
| [L]oad           | [T] Settings     | [E]xit                          |
|_______________________________________________________________________|
```
Seventeen skills over two columns is more than the pane holds, so the list scrolls. `[V] Admin` appears as a seventh entry only when the editors are unlocked (see [Admin](#admin)). `[E]xit` quits the same way `q` does. `[ESC]` returns you to whichever screen opened the Menu - the location screen, an action, a fight, or the backpack - rather than always to the location.


## Character Creation

`[N]ew Game` from the title runs a wizard: name, difficulty, starter pack, race, class, then proficient
skills. Every step after the name is a list you move through with the arrow keys and confirm with `[C]`,
and `[B]ack` steps to the previous one, so nothing is committed until the last screen:
```
_________________________________________________________________________
| apocylta | [town square] | 0c                      [idle]      7:40pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   - Casual: A Relaxed Difficulty. Enemies have less HP and deal less  |
|     damage. Players gain more XP.                                     |
|   - Easy: An Easy Difficulty...                                       |
|   - Normal: A Standard Difficulty...                                  |
|   - Hard: A Challenging Difficulty...                                 |
|   - Survival: A Survival Difficulty...                                |
|   - Nightmare: A Nightmare Difficulty...                              |
|   - Demon Lord: A Demon Lord Difficulty...                            |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                     |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Name: Rae - choose your difficulty: |_________________________________|
|                                                                       |
| [C]onfirm | [B]ack                                                    |
|_______________________________________________________________________|
```
The header is already drawing during creation, which is why it shows a location and a clock before you
have a character - it just leaves the name and level segment out until there's one to show.

The last step is different: skills are a multi-select. `[T]oggle` marks one, and the prompt counts you in
(`Pick 2 skills to be Proficient in (0/2 selected):`) - `[C]onfirm` refuses until the count is exact,
because how many you get is set by the difficulty you picked two screens earlier. Confirming there is what
actually creates the character and drops you into the world.

## Movement

Players move around using the travel menu to visit places within the world. Picking a destination is a single numbered keypress - no typing, no confirm step:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  Travel from town square                                              |
|                                                                       |
|   weapons            armor              out of town                   |
|     town square        town square        wilderness                  |
|                                           mountain path               |
|   potions            general store        river crossing              |
|     town square        town square                                    |
|                                         park                          |
|   black market         housing district   town square                 |
|     town square          town square                                  |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                    |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Where would you like to go? |_________________________________________|
|                                                                       |
| [1] weapons          | [2] armor            | [3] potions              |
| [4] general store    | [5] black market     | [6] out of town          |
| [7] housing district | [8] park             | [B]ack                   |
|_______________________________________________________________________|
```
The pane isn't just a heading: each exit gets a column showing where *it* leads next, so you can see one hop past the choice you're making - useful for deciding whether "out of town" is the direction you actually want. Columns stack into groups when the terminal is too narrow to sit them side by side.

Shops always come first, followed by every other exit (paths, and airboat routes where available) in whatever order the location defines them. Shop hops are always instant; anything past a shop counter can take real time to get there - see below.


## Traveling

Longer trips take real time now instead of landing you there instantly. Picking a destination like "out of town" above drops you on a dedicated traveling screen with a countdown and a little ASCII animation of your progress along the route - a traveler moving down a road for ordinary paths:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         out of town  7:41pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  Leaving town square, heading to wilderness.                          |
|                                                                       |
|  [town square] ------+[]------------------------------ [wilderness]  |
|                                                                       |
|     12s remaining                                                    |
|                                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                    |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Traveling... |_________________________________________________________|
|                                                                       |
| [B]ack               | [M]enu                                         |
|_______________________________________________________________________|
```
...or a glider cruising over open sky for airboat routes, a cart rattling down a tunnel inside the cave network, or a shimmer for a teleport:
```
|  [zenthal airport] >[@@@]->~~~~~~~~~~~~~~~~~~~~~~~~ [mountain peak]  |
```
The marker moves left to right as the trip progresses and lands you at your destination automatically once the countdown hits zero, granting Speed skill XP equal to however many seconds the trip took. The clock keeps advancing and the trip keeps counting down in the background even if you duck into `[M]enu` mid-trip - coming back out lands you wherever the countdown actually is by then. `[B]ack` gives up on the trip early and returns you to where you started, with no XP for the partial trip. Short hops (stepping into a shop, or the walk straight back out of one) never show this screen at all - they're still instant, exactly like before.


## Actions

Players complete actions, which looks like this:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy     Gather scraps    7:58pm |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  The Town square - a wonderful hub for various shops. | elapsed: 46s  |
|                                                                       |
|    You are searching for scraps along the streets of the              |
|    town square.                                                       |
|                                                                       |
|    You found 1 Bottle.                                                |
|    You turn over some rubble and find nothing worth taking.           |
|    You found 2 Stone.                                                 |
|    You found 2 Scrap Metal.                                           |
|    next attempt in 4s                                                 |
|                                                                       |
|    gathered: [1] Bottle | [1] Plastic | [2] Stone | [2] Scrap Metal   |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ] | foraging: 1 xp: +++------------ |  |
| +25 xp so far (0 levels)                                             |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| You are doing things. |_______________________________________________|
|                                                                       |
| [S]top action | [B]ackpack                                            |
| [J] Toolbelt  | [M]enu                                                |
|_______________________________________________________________________|
```
While an action is running, the header center shows its name (`Gather scraps` above) instead of `[idle]`, and the status bar grows a live skill/xp readout: the acting skill's level, a color-banded progress bar toward its next level (white → blue → yellow → green → gold as it fills, bold from yellow on), and how much xp and how many levels you've picked up this session.

You don't gather continuously - you make an **attempt** every so often, and attempts can come up empty. The last few show in the middle of the pane, newest at the bottom, with a countdown to the next one so a long wait doesn't look like the game has stopped. A miss costs you the attempt and pays no skill xp at all; only what you actually take adds to the `gathered:` line at the bottom, which is the running total for the whole session.

How long you wait between attempts is set by your **difficulty**, and it's the main thing separating a relaxed run from a punishing one: one second on Casual, ten on Normal, thirty on Nightmare, a full minute on Demon Lord. Your odds improve with the skill you're using and get worse the further above you the thing you're after is - a tin seam gives itself up readily at mining level 1, while a mithril one at that level almost never will. Skill in fishing, mining or foraging is worth having for the hit rate alone, quite apart from what it unlocks.

Difficulty drives the danger too, on its own clock rather than the gathering one: harder difficulties roll for an ambush more often *and* are likelier to turn up a whole pack rather than a single enemy.


## Combat

Any location flagged as dangerous offers a `[Fight]` action alongside its gathering ones, and picking it starts an encounter. Combat is **turn-based**: nothing at all happens until you press a key, and each press resolves one full round - your action first, then the enemy's answer.

```
______________________________________________________________________________
| apocylta | Rae Lv.4 | [wilderness] | 55sy     fighting Goblin Ranger 8:04pm|
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  Goblin Ranger    hp: 12/20                                                |
|  [################------------]                                            |
|                                                                            |
|      round 3                                                               |
|                                                                            |
|    > You strike Goblin Ranger with your Iron Sword for 11.                 |
|    > Goblin Ranger hits you for 8.                                         |
|    > You strike Goblin Ranger with your Iron Sword for 22 (critical!).     |
|    > You dodge Goblin Ranger's attack.                                     |
|____________________________________________________________________________|
| hp: 84 | mp: 46 | [ DANGER ]                                               |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Fighting Goblin Ranger. |__________________________________________________|
|                                                                            |
| [A]ttack       | [C]ast        | [P]otion                                  |
| [F]lee         | [B]ackpack    | [M]enu                                    |
|____________________________________________________________________________|
```

The header center names your current opponent instead of showing `[idle]`. `[C]ast` and `[P]otion` open a picker listing only what's actually usable right now - combat spells you know and can afford the mana for, and the potions in your belt. Using either still costs you the round.

Your damage comes from your equipped weapon (or your bare hands, if you never equipped that starter dagger) plus your fighting level. Incoming damage is reduced by the total `defense` of everything you're wearing plus your defense skill, as a percentage with diminishing returns - stacking armor always helps, but never makes you untouchable. Critical hits, dodges and blocks are all rolls, nudged upward by your luck, speed and defense levels respectively. Difficulty scales enemy HP and damage on top of all of it.

Some enemies come as a pack. You fight them one at a time, in the order they're listed, and the pack is named above whoever you're currently swinging at:

```
|  Orc Warband  -  2 of 3                                               |
|                                                                       |
|  Big Orc              hp: 34/50                                       |
|  [###################---------]                                       |
```

Packs run from two enemies out in the starter wilderness up to fifteen in the far regions. Clearing an entire one pays a **bonus** on top of what each member was worth individually - the deeper the region, the bigger the pack and the bigger the bonus.

Winning grants xp, gold and a chance at loot, and counts toward any `defeatEnemy` quest objectives. Only the individual enemies count toward those - a pack is a label for who showed up, not an enemy in its own right. `[F]lee` gets you out with nothing - the chance scales with your speed. A few locations hold a named boss, which needs fighting level 20 before the `[Challenge boss]` action will let you near it.

Gathering in a dangerous location can also get you jumped: an ambush cancels whatever you were doing and drops you straight into the fight. Travel is exempt - a trip you can't interrupt won't spring a fight on you.

### Losing

If your HP reaches zero you get a screen of your own, and it's the one screen with a single key on it:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 0c           [idle]      7:58pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Everything goes dark.                                                 |
|                                                                       |
|     You come to back at the town square, stripped of everything you   |
|     carried.                                                          |
|                                                                       |
|     Lost: 21 items and 17sy.                                          |
|     Kept: whatever you had equipped, your skills, and your levels.    |
|                                                                       |
|     You've been handed the basics again: a belt and a wooden dagger.  |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                     |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| You survived. Barely. |_______________________________________________|
|                                                                       |
| [X] Continue                                                          |
|_______________________________________________________________________|
```
Your backpack and your purse are gone; your equipment, skills and levels survive, and you're handed the
same basics a new character gets. `[X]` puts you back at the town square at full health.

On `survival` and `nightmare` there is no waking up. The same screen says so plainly, and `[X]` returns
you to the title rather than to the world:
```
| You are dead.                                                         |
|                                                                       |
|     Rae fell on nightmare difficulty. There is no waking up from that.|
|                                                                       |
|     Everything is gone: 21 items, 17sy, and the save itself.          |
|                                                                       |
|     Press X to return to the title screen.                            |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| This run is over. |___________________________________________________|
```
The deletion is real and happens here, not earlier: both the numbered save slot the run was bound to and
the autosave file are removed. If you were carrying a revive when you dropped, it was spent automatically
before any of this - you never see this screen while one is in your pack.


## Mining

Locations with an ore vein (like the cave mines) carry `[N] Mine` among their hub features - unlike fishing, which is a numbered action - and it opens an ore selector rather than starting anything directly. Each mine has one of five tiers and only lists the ores that tier reaches, cumulatively: `basic` (tin, copper, iron), `mid_tier` (cobalt, mithril), `advanced` (syllic), `high_tier` (adamantite), `legendary` (runite), with gold turning up in all of them. Picking one starts the same kind of timed action shown above, gated by both your mining skill level and the tier of pickaxe you have equipped:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [cave mines] | 10sy           [idle]     7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   - Tin Ore (requires mining lvl 1)                                   |
|   - Copper Ore (requires mining lvl 1)                                |
|   - Iron Ore (requires mining lvl 5)                                  |
|   - Gold Ore (requires mining lvl 8)                                  |
|                                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ DANGER ] |                                      |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Which ore would you like to mine? |___________________________________|
|                                                                       |
| [B]ack | [C]hoose                                                     |
|_______________________________________________________________________|
```
Picking an ore you're not geared up for doesn't crash or block the screen - it just tells you why ("Requires mining level 5." or "You need a better pickaxe equipped to mine that.") and lets you try something else.

Coal and gemstones aren't on the list, because they aren't things you go looking for - they turn up while you work, on top of whatever ore you picked:
```
|    gathered: [23] Tin Ore | [4] Coal Chunks | [3] Coal | [1] Emerald   |
```
Coal is common enough to be reliable; a gem is a genuine find, roughly once every forty seconds of digging. Which gems can appear depends on the mine - a basic mine turns up rubies, sapphires and emeralds, and you have to get down to the deeper caves before a diamond or an opal is possible.

## Fishing

Fishing works the same way, and reads the same on screen - but you reach it through the numbered `Fish` action rather than a hub feature, since fishing is something you do at a place with water rather than somewhere you go. What's swimming depends on the water: a riverbank lists the freshwater species, the docks list the saltwater ones, and a few species live in both and show up wherever there's water at all. Each row says how it's caught, because that decides what you need on you:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [riverbank] | 10sy             [idle]     7:38pm |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   Something breaks the surface further out, then doesn't again.       |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   - Pike (bait, requires fishing lvl 1)                               |
|   - Trout (rod, requires fishing lvl 1)                               |
|   - Shrimp (net, requires fishing lvl 1)                              |
|   - Salmon (rod, requires fishing lvl 5)                              |
|   - Tilapia (bait, requires fishing lvl 5)                            |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ DANGER ] |                                      |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to fish for? |____________________________________|
|                                                                       |
| [B]ack | [C]hoose                                                     |
|_______________________________________________________________________|
```
Three things have to line up before a fish will bite, and picking one you're not ready for says which is missing rather than blocking the screen: your fishing level ("Requires fishing level 10."), the rod you have equipped ("You need a better fishing rod equipped to catch that.") - a starter rod won't land a tuna no matter how good you've got - and, for anything not caught on the rod alone, the right gear in your backpack ("You need a fishing net in your backpack to catch that.").

Bait is the one thing fishing uses up: a bait species costs one per catch, while nets and hooks are yours for good. Run the pouch dry mid-session and the trip simply ends, with a note in the header to say why:
```
| You're out of bait.                                                   |
```
The far end of the list is a different kind of fishing. The ancients - the leviathan, the kraken, the things that live where the water stops being water - don't come up as a fish you can cook. What you haul in is a scale, a tooth, a bone; materials rather than dinner. Everything else can be cooked six ways at a campfire or cooking station, and how you prepare it matters: raw is barely worth eating, cooked is honest food, and smoking or baking a rare catch puts it near the best stew in the game.

## Inventory

Players can view their inventory (or backpack). Tools don't live here anymore - they've moved to the Toolbelt (below). The backpack sorts itself into tabs by item type automatically (only types you're actually carrying show up), and the left/right arrow keys switch between them - the active tab is shown in brackets in the border:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 10sy          [idle]     7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  Your Backpack                                                        |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| [All]| weapon | armor | scrap                                         |
|   - [10] Bottle                                                       |
|   - [15] Plastic                                                      |
|   - [8]  Scrap Metal                                                  |
|   - [2]  Healing Potion                                               |
|   - [5]  Mana Potion                                                  |
|   - [1]  Wooden Dagger                                                |
|   - [1]  Leather Belt                                                 |
|                                                                       |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ] |                                   |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to do? |__________________________________________|
|                                                                       |
| [B]ack                | [<>] Switch tab                               |
| [D]rop                | [E]quip                                       |
| [C] Spellbook         | [U]se                                         |
|_______________________________________________________________________|
```
`[M]` reaches the Menu from here as well, though the legend doesn't advertise it. [U]se consumes whatever's selected: food restores health, potions heal or restore mana, aid patches you up. Cooking pays off here - a raw rabbit is worth 5 health, a cooked one 15, and a good stew far more. Drinking a potion leaves you the empty bottle back (worth keeping - alchemy needs them), and both eating and drinking train a skill: survival for food, alchemy for potions.

Nothing is ever wasted on a no-op. Using something you can't benefit from tells you why and leaves the item alone - "You're already at full health.", "Your mana is already full.", "You're not poisoned." for an antidote when nothing ails you, and "Iron Sword can't be used." for anything that isn't a consumable at all. Ingredients like flour and yeast count as "not a consumable" despite being food; they're for cooking with, not eating.

A Revive is the one thing you never use on purpose - try it from the backpack and it tells you there's nothing to come back from. It spends itself the moment a blow would have killed you, and the fight simply carries on:
```
| The raider hits you for 34.                                           |
| The Revive burns out and pulls you back from the brink. 100 HP.       |
```
That check happens before anything treats the blow as a death, so on Survival, Nightmare and Demon Lord a Revive is the difference between a close call and the end of the run. Carry more than one and the weakest goes first. They're apothecary stock, sold alongside potions.

Potions work the same way mid-fight (the [P]otion pick on the combat screen), down to the empty bottle and the alchemy xp - it's the same code either way.

## Shops

Shops are locations rather than screens you open from anywhere - you travel into the blacksmith, and its
hub features are what's behind the counter. Buying tabs the shop's stock and groups it into sections:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [blacksmith]  | 55sy        [idle]      9:12am  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   The racks are picked over, but there's steel here if you can pay.   |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|_ All |[sword]| dagger | battleaxe | staff | bow | slingshot _________ _|
|   - Copper Sword - 3g                                                 |
|   - Iron Sword - 1g 4c                                                |
|   - Mithril Sword - 2sy 4g                                            |
|   - Steel Sword - 1sy 1g                                              |
|   - Tin Sword - 1s                                                    |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                     |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to buy? (55sy)     |______________________________|
|                                                                       |
| [B]ack | [<>] Switch tab | [P]urchase                                 |
|_______________________________________________________________________|
```

**Each shop tabs by whatever axis suits it**, declared as `tabBy` in `data/shops.js`. The weapon and magic
shops tab by kind, the armoury by slot (head, torso, legs - materials would be 23 tabs and wrap the strip),
the potion and general stores by type. The crafting and food shops have too many subtypes for a strip at
all, so they get no tab row and lean on sections instead:
```
|_____________________________________________________________________ _|
|  Baked (52)                                                           |
|    - Bread - 4c                                                       |
|    - Cake - 1s 2c                                                     |
|                                                                       |
|  Brewed (26)                                                          |
|    - Herbal Tea - 8c                                                  |
|_______________________________________________________________________|
```
Where the tabs already cut by subtype there are no section headings - the strip has said it already. The
sell screen works identically, tabbed by type, and its tick marks are keyed by item id so they survive
switching tabs: tick ore on one, bread on another, and `[S]ell` takes the lot.
Stock above your barter level simply isn't offered - the skill decides what a trader is willing to put in
front of you, so the same shop grows better inventory as you get better at haggling.

Shops keep **hours**. Turn up outside them and the door doesn't open at all: the location tells you when
to come back, and the shop hotkeys refuse rather than showing an empty counter.

Selling is a multi-select, so you can clear out a haul in one pass. `[T]oggle` ticks a line, `[S]ell`
commits the lot:
```
| Food:                                                                 |
|   [ ] [2] Raw Pike - 4gp ea                                           |
| Scrap:                                                                |
|   [x] [12] Stone - 4gp ea                                             |
|   [x] [4] Wood Plank - 4gp ea                                         |
| Weapon:                                                               |
|   [ ] [1] Iron Dagger - 4gp ea                                        |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Select items to sell, then confirm. |_________________________________|
|                                                                       |
| [B]ack | [T]oggle | [S]ell                                            |
|_______________________________________________________________________|
```
Selling returns 40% of what buying the same thing would cost, and pays barter xp scaled by what went
across the counter.

The housing district sells one thing, and it's the one that unlocks a home of your own:
```
|   - House Deed - 1000gp                                               |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Buy a house (55sy)     |______________________________________________|
|                                                                       |
| [B]ack | [P]urchase                                                   |
|_______________________________________________________________________|
```
Once you own one, the same screen starts listing stations to build in it, and `[J] Go Home` appears at
locations that offer it.

## Crafting

`[K] Stations` at any location with a bench lists what's available there. At your own house the list is
whatever you've bought; everywhere else it's whatever the location happens to have:
```
|   - Cooking Station                                                   |
|   - Crafting Table                                                    |
|   - Alchemy Table                                                     |
|   - Anvil                                                             |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Which station would you like to use? |________________________________|
|                                                                       |
| [B]ack | [C]hoose                                                     |
|_______________________________________________________________________|
```
Choosing one opens its recipes, tabbed by what they produce and grouped inside each tab. Every line lists
what it needs, so you can see what you're short of without leaving the bench:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [safehouse] | 55sy           [idle]      9:20am  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   Someone has kept this fire going. The pot is still warm.            |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾ [All]| Food ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Baked:                                                                |
|   - Baked Pike (needs: 1x Raw Pike, 1x Flour)                         |
|   - Bread (needs: 2x Flour, 1x water)                                 |
| Cooked food:                                                          |
|   - Cooked Pike (needs: 1x Raw Pike)                                  |
|   - Cooked Rabbit (needs: 1x Raw Rabbit)                              |
| Grilled:                                                              |
|   - Grilled Pike (needs: 1x Raw Pike, 1x Firewood)                    |
| Pickled:                                                              |
|   - Pickled Pike (needs: 1x Raw Pike, 1x Vinegar)                     |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                     |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Cooking Station - what would you like to craft? |_____________________|
|                                                                       |
| [B]ack | [<>] Switch tab | [C]raft                                    |
|_______________________________________________________________________|
```
Only recipes you can actually afford are listed, which is why the list grows as your pack fills. `water`
is the one ingredient with no item behind it - it comes off the water bottle on your belt, so recipes
needing it are unavailable with no belt equipped.

Crafting pays xp scaled by the rarity of what you made, and counts toward `craftItem` quest objectives.

## Spellbook

The Spellbook is reached from the backpack with `[C]`, and splits into two arrow-key tabs: what you already know, and what you don't. Learned spells are listed green, grouped by spell type:
```
________________________________________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 10sy        [idle]     7:38pm                                  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| | [Learned (3)]| Unlearned (13) |                                                                    |
|   Heal:                                                                                              |
|     - Cure (known | cast: 6 mp)                                                                      |
|   Attack:                                                                                            |
|     - Magic Missle (known | cast: 6 mp)                                                              |
|   Teleport:                                                                                          |
|     - Wilderness Teleport (known | cast: 10 mp)                                                      |
|                                                                                                      |
|                                                                                                      |
|______________________________________________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ] |                                                                  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Spellbook - mp: 100/100 |____________________________________________________________________________|
|                                                                                                      |
| [B]ack                | [<>] Switch tab                                                              |
| [L]earn               | [C]ast                                                                       |
|______________________________________________________________________________________________________|
```
The Unlearned tab splits again, into what you can learn right now (green) and what you can't yet (red) - then by spell type inside each. Nothing is hidden from you: a spell beyond your magic level is still listed, with the level it wants. Learn costs show what you're carrying against what the spell needs, so you can see how close you are rather than just what it'll take:
```
________________________________________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 10sy        [idle]     7:38pm                                  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| |  Learned (3) |[Unlearned (13)]|                                                                    |
|   [Learnable] (2):                                                                                   |
|     Heal:                                                                                            |
|       - Hi Cure (no cost | cast: 16 mp)                                                              |
|     Buff:                                                                                            |
|       - Shield (learn: Ley Crystals (2/2), Arcane Shard (2/1) | cast: 10 mp)                         |
|                                                                                                      |
|   [Unlearnable] (11):                                                                                |
|     Attack:                                                                                          |
|       - Fireball (req: magic lv 2 | learn: Ley Crystals (0/1), Arcane Shard (0/1) | cast: 10 mp)     |
|     Poison:                                                                                          |
|       - Poison (req: magic lv 6 | no cost | cast: 20 mp)                                             |
|______________________________________________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ] |                                                                  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Spellbook - mp: 100/100 |____________________________________________________________________________|
|                                                                                                      |
| [B]ack                | [<>] Switch tab                                                              |
| [L]earn               | [C]ast                                                                       |
|______________________________________________________________________________________________________|
```
Trying to learn something you can't doesn't block the screen, it just tells you why - "Poison requires magic level 6." for the level gate, or "You don't have the ingredients for that." when it's the reagents you're short on.

## Toolbelt

The Toolbelt is where your equipped tool and slingshot live, alongside everything that only works with a belt equipped at all - water bottle, slingshot ammo, and quiver. Your equipped belt also sets how much your backpack and potion pouch can hold; a stronger belt means more of both. It's also the entry point to your [Journal](#quests):
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [cave mines] | 10sy           [idle]     7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  Your Toolbelt                                                        |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  Equipped Belt:      Leather Belt                                     |
|  Equipped Tool:      Iron Pickaxe                                     |
|  Water Bottle:       100/100                                          |
|  Slingshot Ammo:     0/10                                             |
|  Equipped Slingshot: none                                             |
|  Quiver:             0                                                |
|  Toolbelt Load:      12.4/17                                          |
|  Backpack Load:      41.6/102                                         |
|  Potions:            2/5                                              |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ DANGER ] |                                      |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to do? |__________________________________________|
|                                                                       |
| [P] Pouch              | [S]wap Tool                                  |
| [C]hange Slingshot     | [X] Spellbook                                |
| [B]ackpack             | [J]ournal                                    |
| [ESC] Back             |                                              |
|_______________________________________________________________________|
```
`[ESC]` goes back to wherever you came from rather than always to the location screen. Most screens that offer `[B]ack` accept `[ESC]` for it too, even where the legend only prints the letter - Settings, Achievements, the Admin hub and the combat Cast/Potion picker all do. You start out wearing the leather belt; take it off and the water bottle, slingshot ammo and quiver caps all drop to 0 (unusable until you put one back on), while the backpack and potion pouch fall back to a small baseline instead of going away entirely - any belt is a strict upgrade. `[S]wap Tool` opens a picker just like the mining one above, grouped into tabs by tool category (pickaxe, axe, hammer, etc.); `[C]hange Slingshot` opens the same kind of picker without tabs, since there's only one slingshot category.

## Pouch

`[P]` from the Toolbelt opens the belt's contents - the scrap, tools, bait and hooks that are charged against the belt's weight rather than the backpack's. They don't appear in the [Backpack](#inventory) at all; each thing you carry lives in exactly one of the two screens.

Tabs across the top are item types, the same dynamic way the backpack's are. Inside a tab, rows are gathered under a heading per kind, with how many kinds that heading holds and what the group weighs - a belt full of mining gear reads as three sections instead of thirty loose rows. The bar above the list is your belt's total load:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [cave mines] | 10sy           [idle]     7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  On your belt: 12.4 of 17.                                            |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|_[All]| scrap | tool | crafting____________________________________ ___|
|  Metal (2)                                              3.4          |
|    - [12] Scrap Metal                                   2.4          |
|    - [5] Copper Wire                                    1            |
|                                                                       |
|  Pickaxe (1)                                            3            |
|    - [1] Iron Pickaxe                                   3            |
|                                                                       |
|  Bait (1)                                               0.25         |
|    - [5] Fishing Bait                                   0.25         |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ DANGER ] |                                      |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to do? |__________________________________________|
|                                                                       |
| [B]ack                 | [<>] Switch tab                              |
| [D]rop                 | [E]quip                                      |
| [U]se                  | [M]enu                                       |
|_______________________________________________________________________|
```
Section headings and the blank lines between them aren't selectable - land on one and Drop/Equip/Use say "Select an item first." rather than acting on whatever was nearest. `[U]se` currently refuses everything here: nothing on the belt is a consumable, so it's an affordance waiting on the catalog rather than a broken key.

## Quests

Quest boards show up as a hub feature at some locations (town square has one). Only quests you're high enough level for, and that aren't locked, show up - pick one and accept it.

Note the second bar under the header. Eleven screens carry one: this board, the mine and fishing pickers, all three shops, both workbench screens, the backpack, the toolbelt and the spellbook. It's separate from the prompt at the bottom, which tells you what the screen is for - this one is just scene-setting. Most of these rotate their line by the hour, so the same screen reads differently at dusk; the backpack and toolbelt keep one fixed label instead:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| The board is thick with paper, most of it months out of date.         |
|_______________________________________________________________________|
|   - Getting Started (Lv.1) - reward: 100gp, 100xp                     |
|   - Mine! Mine! Mine! (Lv.1) - reward: 100gp, 100xp                   |
|                                                                       |
|                                                                       |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                    |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Quest Board - accept a quest. |________________________________________|
|                                                                       |
| [B]ack              | [A]ccept                                        |
|_______________________________________________________________________|
```
Once accepted, a quest drops off the board and shows up in your Journal (`[J]ournal` from the Toolbelt screen), where you can track its objectives and claim the reward once everything's checked off:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| In Progress:                                                          |
|   Getting Started                                                     |
|     [ ] Chop some wood (0/1)                                          |
|     [ ] Sell Some scrap (0/1)                                         |
|     [ ] Buy a House (0/1)                                             |
|     Reward: 100gp, 100xp                                              |
|                                                                       |
|   You've Done It!                                                     |
|     [ ] Acquire a Mythic Weapon (0/1)                                 |
|     [ ] Defeat The Mad Bert Brothers: (1/3)                           |
|         [x] Defeat Hubert (1/1)                                       |
|         [ ] Defeat Gilbert (0/1)                                      |
|         [ ] Defeat Hilbert (0/1)                                      |
|     [ ] Find the lost ledger (0/1) (optional)                         |
|     Reward: 1000gp, 1000xp                                            |
|                                                                       |
| Completed:                                                            |
|   (nothing claimed yet)                                               |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                    |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Your Journal |_________________________________________________________|
|                                                                       |
| [C]laim Rewards                                                       |
|_______________________________________________________________________|
```
`[ESC]` is the way out, back to the Toolbelt you came in through - the legend lists only the claim key. Objective checkboxes update live as you make progress - no need to reopen the Journal. `[C]laim Rewards` grants gold and xp for every fully-checked-off quest in one go and moves it down to "Completed"; it's a no-op ("Nothing ready to claim yet.") if nothing's done yet. Enemy-defeating objectives count kills from your lifetime tally, so kills you made before accepting the quest still count. Item-acquiring objectives are *not* the same: they read what's in your bags right now, so one can tick and then un-tick if you sell or smelt the materials. Selling, crafting and casting objectives only count from the moment you accept.

Bigger quests group related work together. A line ending in a colon is a heading rather than a task: its own checkbox ticks when everything indented beneath it is done, and the count beside it is how many of those you've finished. Anything marked `(optional)` is exactly that - it tracks and ticks like the rest, but the quest will hand over its reward whether or not you bother with it.

Objectives can also ask for a kind of thing rather than a specific one: "a Mythic Weapon" means any weapon of that rarity, so how you get there is up to you.

## Achievements

Unlike quests, achievements need no accepting and no claiming - they watch what you do and pay out the moment you earn them. `[A]chievements` on the Menu shows the full list, unlocked first:

```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy 2g 1s [idl            8:14pm|
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Unlocked (1/7):                                                       |
|   [x] Welcome to apocylta - claimed 50gp, 50xp                        |
|                                                                       |
| Locked (6):                                                           |
|   [ ] This is Combat! - 100gp, 100xp, 50 fightingxp, 50 defensexp     |
|       Win a combat encouter with less than 50% health remaining       |
|       [ ] combatEnd                                                   |
|   [ ] Master Crafter - 100gp, 100xp, 50 craftingxp, 50 smithingxp     |
|       Crafted 10 items!                                               |
|       [ ] craftItem (0/10)                                            |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                     |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Achievements - 1 unlocked. They award themselves as you play.         |
|                                                                       |
| [B]ack                                                                |
|_______________________________________________________________________|
```

Each locked entry shows its description and how far along you are. Some rewards grant skill xp on top of gold and player xp, which quest rewards never do.

When one unlocks, a gold banner takes the tail of the status bar for a few seconds, wherever you happen to be. It occupies the same slot as the action xp readout rather than sitting beside it, so an unlock during a gather hides the progress bar until it clears:

```
| hp: 84 | mp: 46 | [ DANGER ] | Achievement unlocked: Boss Down!       |
```

A few requirements are judged in the instant a fight ends rather than tracked over time - winning with low health, clearing several enemies at once, killing a boss. Those show no running progress, because there isn't any to show: they're checked the moment you win, and only when you win. Fleeing or dying doesn't count.

## Save & Load

Both the title screen's `[C]ontinue` and the in-game Menu's `[S]ave`/`[L]oad` open the same picker, just in different modes. There are a few numbered slots plus (load mode only) an extra entry for the autosave the game writes on a timer in the background:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Slot 1: Wanderer - Lv.3 Elf/Ranger @ wilderness (saved 2m ago)        |
| Slot 2: Empty                                                        |
| Slot 3: Empty                                                        |
| Autosave: Wanderer - Lv.3 Elf/Ranger @ wilderness (saved just now)    |
|                                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ]                                    |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Which save would you like to load? |___________________________________|
|                                                                       |
| [B]ack              | [C]hoose                                        |
| [D]elete                                                              |
|_______________________________________________________________________|
```
In save mode, choosing an occupied slot asks you to confirm before overwriting it (press `[C]hoose` again to actually save); `[D]elete` (load mode only) works the same way - press it twice on the same slot to actually delete it. The number of slots is configurable (`game_config.saveSlots`, 3 by default); the autosave can't be deleted manually, it just gets overwritten by the next automatic save.

## Admin

Off by default. Set `allow_admin: true` in `config.js`'s `game_config` (or run with `ALLOW_ADMIN=true`) and the Menu grows a `[V] Admin` entry; leave it off and the entry isn't listed and the key does nothing. `ALLOW_ADMIN` wins over the config flag whichever way it's set, so `ALLOW_ADMIN=false` locks the editors out of a build that ships with them on. Everything under it writes state directly - no level gates, no slot caps, no rewards paid:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         [idle]     7:38pm   |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Admin                                                                 |
| What would you like to edit?                                          |
|                                                                       |
|   [1] Player stats   hp / mana and their maxes, gold, level, xp       |
|   [2] Skills         level and xp per skill                           |
|   [3] Inventory      every item in the game - give, take, infinite    |
|   [4] Equipment      armour by slot, equip and unequip                |
|   [5] Toolbelt       water, ammo, quiver, and the belt that caps them |
|   [6] Quests         accept, force objectives, complete               |
|   [7] Achievements   lock and unlock, pause auto-evaluation           |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ] |                                   |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Admin - editing state directly, no gates apply. |_____________________|
|                                                                       |
| [B]ack              | [C]hoose            | [1-7] Jump to editor      |
|_______________________________________________________________________|
```
Editors work the same way throughout: arrow keys move the cursor, `+` and `-` adjust the selected value, and `1`/`2`/`3` set how much a press is worth - 1, 10, or 100:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 55sy         [idle]     7:38pm   |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Player stats                                                          |
|   Health              [      87 ]  / 200                              |
|   Max Health          [     200 ]                                     |
|   Mana                [     100 ]  / 100                              |
|   Max Mana            [     100 ]                                     |
|   Gold                [    5500 ]                                     |
|   Level               [       1 ]                                     |
|   Experience          [       0 ]                                     |
|_______________________________________________________________________|
| hp: 87 | mp: 100 | [ SAFE ZONE ] |                                    |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Admin / Player stats - step: 100 |____________________________________|
|                                                                       |
| [B]ack              | [+-] Adjust                                     |
| [123] Step 1/10/100 | [F]ill hp/mp                                    |
| [G]odmode           |                                                 |
|_______________________________________________________________________|
```
The Skills editor adds `[P] Proficient`, which flips a skill's proficiency on or off. The Achievements editor adds `[E] Evaluate now`, forcing the check that normally runs on its own each second. The Toolbelt editor adds `[F] Fill`. The Inventory editor lists **every** item in the game with how many you hold (0 if none), tabbed by type - `[G]ive` and `[T]ake` move by the current step, and `[I]nfinite` marks an item to never run down, shown as `∞`. Equipment tabs by slot and marks what's worn with `[EQUIPPED]`; `[U]nequip` is the only place in the game that takes something off without swapping it for something else. Toolbelt edits the three stored counts and lets you put on any belt, since every cap comes from the belt rather than being stored.

Quests and Achievements are checkbox screens. A quest objective can be forced complete even when nothing in the game could satisfy it - most objectives are read live from your inventory, location, skills or kills rather than from a counter, so forcing is the only way to tick them. Achievements toggle the same way, but note they're re-checked every second: re-locking one you've genuinely earned will simply unlock again (and pay out again) unless you switch `auto-evaluate` off first.

Forced quest objectives are saved with the quest. The infinite-item marks and the auto-evaluate switch last for the session only.

### Godmode

`[G]` on the Player stats editor flips godmode, and while it's on a gold `[ GOD ]` badge sits in the status bar on every screen - it changes the rules everywhere, so it says so everywhere:
```
| hp: 100 | mp: 100 | [ DANGER ] [ GOD ]                                |
```
Nothing you'd spend gets spent. Enemies still swing and still miss for zero, mana never runs down (and spells cast fine at 0), shops hand things over for free, and crafting ignores both ingredients and the water on your belt. You can't die either - even with health already sitting at zero, the killing blow never comes.

What godmode does *not* do is take things away from you. Dropping an item still drops it, and selling still sells it - those are you asking, not the game charging. Equipping still moves an item onto the paperdoll rather than duplicating it.

It lasts for the session. For a character that's born invincible, set `godmode: true` in `config.js`'s `player_config` instead - that seeds the flag for every new character, and doesn't need the admin gate at all.

## Settings

`[T]` from the Menu. Changes save the moment you make them - there's no confirm step and nothing to apply:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | 10sy           [idle]    7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   Colorize        [ON ]   colour on/off; bold and highlighting stay   |
|   Action style    [B] Boxed Key     e.g. [T]ravel                     |
|                                                                       |
|   Playing since   Aug 7, 2026                                         |
|   Last session    2h ago                                              |
|   Last autosave   4m ago                                              |
|                                                                       |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ] |                                   |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| Settings - changes save immediately. |________________________________|
|                                                                       |
| [B]ack | [T]oggle                                                     |
|_______________________________________________________________________|
```

**Action style** decides how every command legend in the game draws its hotkeys. The row shows a live example, so you can see each one before you leave:

```
  [B]  Boxed Key       [T]ravel              the default
  [P]  Prefix          [T] Travel
  [R]  Bolded          Travel                (the T is bold)
  [S]  Boxed Action    T: [Travel]
```

Bolded only works where the hotkey is actually the first letter of the label. Plenty of commands don't work that way - the numbered actions at a location, `<>` for switching tabs, `N` for Mine - so those fall back to the prefix form rather than rendering with no visible key at all.

**Colorize** turns colour off for terminals that don't do colour. Bold text and the highlighted row you're standing on both stay, because those aren't colour - they're video attributes, and they work on a monochrome terminal. Without the highlight there'd be no way to tell what's selected.

The three timestamps at the bottom are recorded for you, not editable. The title screen uses them too - it knows whether this is your first run or a return visit, and tells you how long it's been.


## The Companion Web Page

While the game is running it also serves a small read-only page at `http://localhost:4000/`, meant for a
second monitor. It polls the live game every five seconds, so it follows along with whatever you're doing
in the terminal - there is nothing to press, and nothing you do there affects the run.

```
+-----------------------------------------------------------------------+
|  apocylta  playercard             [ Export HTML ] [ Export JSON ]     |
|  [Playercard] Toolbelt  Backpack  Quests  Achievements                |
|-----------------------------------------------------------------------|
|  Rae                              Human Warrior - Normal              |
|  Level 4          1,240 xp        [town square]  [ SAFE ZONE ]        |
|  HP 100/100  ############   MP  86/100  ########--                    |
|                                                                       |
|  Gather scraps (46s) - You found 2 Stone. (next in 4s)                |
|      gathered: Stone x2 | Wood Plank x1                               |
|                                                                       |
|  Skills                                                               |
|    Mining      Lv.6   ######----     Fishing   Lv.2   ##--------      |
|    Foraging    Lv.4   ###-------     Barter    Lv.5   #####-----      |
+-----------------------------------------------------------------------+
```

The five tabs all come from the same poll - switching between them is instant and doesn't fetch anything:

- **Playercard** - who you are, where you are, health and mana, your live action (including the last
  attempt and the countdown to the next one), your skills, and - only while they apply - the fight you're
  in and the tally of everything you've ever killed. An idle character simply reads `Idle`.
- **Toolbelt** - equipped belt, tool and slingshot, and the capacities they give you.
- **Backpack** - your inventory, grouped into sub-tabs by item type, with a second row for subtypes once
  there are enough categories to be worth navigating.
- **Quests** - accepted quests and their objective checklists.
- **Achievements** - the full catalog with live progress, unlocked and locked.

**[Export HTML]** and **[Export JSON]** appear only if exporting is enabled in `config.js`.

**[Export HTML]** downloads `apocylta_pc_<player>.html`: the whole page with your current data baked into
it. That copy renders itself once and never polls, so it keeps working with the game closed, on another
machine, or attached to a message - every tab and sub-tab still switches, it just shows the moment it was
taken.

**[Export JSON]** downloads `apocylta_pc_<player>.json` - the same snapshot, without the page around it.
A few kilobytes instead of fifty, small enough to paste into a message, and it's the format the reader
page below reads.

### The reader page

`http://localhost:4000/apocylta_player.html` is the other end of [Export JSON]. It's the same card with
nothing in it: paste a card's JSON into the box (or pick the downloaded file) and press Import, and it
draws itself from that text alone - no game running, no server involved, nothing uploaded.

```
+-----------------------------------------------------------------------+
|  apocylta  playercard reader                                          |
|-----------------------------------------------------------------------|
|  Paste the JSON a playercard's [Export JSON] button saved, then press |
|  Import. Nothing is uploaded and nothing is stored - the card is drawn |
|  here in your browser, from that text alone.                          |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | { "name": "Rae", "level": 4, ...                               |  |
|  |                                                                 |  |
|  +-----------------------------------------------------------------+  |
|  [ Import ]   or choose a file: [ Choose File ]                       |
+-----------------------------------------------------------------------+
```

Once it's read one, the paste box gives way to the full five-tab card and a **[Load another]** button, and
the footer reads `imported card` beside the date the export was taken. Because the page is a single
self-contained file, it works just as well dropped on any static host as it does served from the game.
