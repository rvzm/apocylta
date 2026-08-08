# apocylta GUI

This document shows the various GUI layouts.


## The Game Itself

The game runs inside the terminal, and looks kinda like this:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 5500     [idle]      7:38pm  |
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


## Movement

Players move around using the travel menu to visit places within the world. Picking a destination is a single numbered keypress - no typing, no confirm step:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 5500     [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  Travel from town square                                              |
|                                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
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
Shops always come first, followed by every other exit (paths, and airboat routes where available) in whatever order the location defines them. Shop hops are always instant; anything past a shop counter can take real time to get there - see below.


## Traveling

Longer trips take real time now instead of landing you there instantly. Picking a destination like "out of town" above drops you on a dedicated traveling screen with a countdown and a little ASCII animation of your progress along the route - a traveler moving down a road for ordinary paths:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 5500     out of town  7:41pm  |
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
| apocylta | Rae Lv.4 | [town square] | gp: 5500 Gather scraps    7:58pm |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  The Town square - a wonderful hub for various shops. | elapsed: 16s  |
|                                                                       |
|    You are searching for scraps along the streets of the              |
|    town square.                                                       |
|                                                                       |
|                                                                       |
|                                                                       |
|    gathered: [1] Bottle | [1] Plastic | [2] Stone | [2] Scrap Metal   |
|                                                                       |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ SAFE ZONE ] | foraging: 1 xp: +++------------ |  |
| +25 xp so far (0 levels)                                             |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| You are doing things. |_______________________________________________|
|                                                                       |
| [S]top action | [B]ackpack                                            |
| [M]enu                                                                |
|_______________________________________________________________________|
```
While an action is running, the header center shows its name (`Gather scraps` above) instead of `[idle]`, and the status bar grows a live skill/xp readout: the acting skill's level, a color-banded progress bar toward its next level (white → blue → yellow → green → gold as it fills, bold from yellow on), and how much xp and how many levels you've picked up this session.


## Combat

Any location flagged as dangerous offers a `[Fight]` action alongside its gathering ones, and picking it starts an encounter. Combat is **turn-based**: nothing at all happens until you press a key, and each press resolves one full round - your action first, then the enemy's answer.

```
______________________________________________________________________________
| apocylta | Rae Lv.4 | [wilderness] | gp: 5500 fighting Goblin Ranger 8:04pm|
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

If your HP reaches zero you lose everything in your backpack and wake up back in the town square with the gold and starter items a new character gets. Your equipment, skills and levels all survive.

On `survival` and `nightmare` difficulty there is no waking up: death deletes the save outright and returns you to the title screen.


## Mining

Locations with an ore vein (like the cave mines) offer a dedicated `[Mine]` action that opens an ore selector instead of the usual timed-action flow. Each mine has a tier, and only lists the ores that tier reaches - a basic mine like the cave mines offers the shallow metals, and the deeper caves add to them. Picking one and choosing it starts the same kind of timed action shown above, gated by both your mining skill level and the tier of pickaxe you have equipped:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [cave mines] | gp: 1000       [idle]     7:38pm  |
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

## Inventory

Players can view their inventory (or backpack). Tools don't live here anymore - they've moved to the Toolbelt (below). The backpack sorts itself into tabs by item type automatically (only types you're actually carrying show up), and the left/right arrow keys switch between them - the active tab is shown in brackets in the border:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 1000      [idle]     7:38pm  |
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
| [C]ast magic on       | [U]se                                         |
|_______________________________________________________________________|
```
[U]se consumes whatever's selected: food restores health, potions heal or restore mana, aid patches you up. Cooking pays off here - a raw rabbit is worth 5 health, a cooked one 15, and a good stew far more. Drinking a potion leaves you the empty bottle back (worth keeping - alchemy needs them), and both eating and drinking train a skill: survival for food, alchemy for potions.

Nothing is ever wasted on a no-op. Using something you can't benefit from tells you why and leaves the item alone - "You're already at full health.", "Your mana is already full.", "You're not poisoned." for an antidote when nothing ails you, and "Iron Sword can't be used." for anything that isn't a consumable at all. Ingredients like flour and yeast count as "not a consumable" despite being food; they're for cooking with, not eating.

A Revive is the one thing you never use on purpose - try it from the backpack and it tells you there's nothing to come back from. It spends itself the moment a blow would have killed you, and the fight simply carries on:
```
| The raider hits you for 34.                                           |
| The Revive burns out and pulls you back from the brink. 100 HP.       |
```
That check happens before anything treats the blow as a death, so on Survival and Nightmare a Revive is the difference between a close call and the end of the run. Carry more than one and the weakest goes first. They're apothecary stock, sold alongside potions.

Potions work the same way mid-fight (the [P]otion pick on the combat screen), down to the empty bottle and the alchemy xp - it's the same code either way.

## Spellbook

The Spellbook is reached from the backpack ("Cast magic on"), and splits into two arrow-key tabs: what you already know, and what you don't. Learned spells are listed green, grouped by spell type:
```
________________________________________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 1000    [idle]     7:38pm                                  |
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
| apocylta | Rae Lv.4 | [town square] | gp: 1000    [idle]     7:38pm                                  |
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
| apocylta | Rae Lv.4 | [cave mines] | gp: 1000       [idle]     7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|  Equipped Belt:      Leather Belt                                     |
|  Equipped Tool:      Iron Pickaxe                                     |
|  Water Bottle:       100/100                                          |
|  Slingshot Ammo:     0/10                                             |
|  Equipped Slingshot: none                                             |
|  Quiver:             0                                                |
|  Backpack:           7/100                                            |
|  Potions:            2/5                                              |
|                                                                       |
|_______________________________________________________________________|
| hp: 100 | mp: 100 | [ DANGER ] |                                      |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| What would you like to do? |__________________________________________|
|                                                                       |
| [S]wap Tool            | [C]hange Slingshot                           |
| [B]ackpack             | [J]ournal                                    |
|_______________________________________________________________________|
```
With no belt equipped, the water bottle, slingshot ammo, and quiver caps all drop to 0 (unusable until you put one on), while the backpack and potion pouch fall back to a small baseline instead of going away entirely - any belt is a strict upgrade. `[S]wap Tool` opens a picker just like the mining one above, grouped into tabs by tool category (pickaxe, axe, hammer, etc.); `[C]hange Slingshot` opens the same kind of picker without tabs, since there's only one slingshot category.

## Quests

Quest boards show up as a hub feature at some locations (town square has one). Only quests you're high enough level for, and that aren't locked, show up - pick one and accept it:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 5500     [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   - Getting Started (Lv.1) - reward: 100gp, 100xp                     |
|   - Mine! Mine! Mine! (Lv.1) - reward: 100gp, 100xp                   |
|                                                                       |
|                                                                       |
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
| apocylta | Rae Lv.4 | [town square] | gp: 5500     [idle]      7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
| In Progress:                                                          |
|   Getting Started                                                     |
|     [ ] Chop some wood (0/1)                                          |
|     [ ] Sell Some scrap (0/1)                                         |
|     [ ] Buy a House (0/1)                                             |
|     Reward: 100gp, 100xp                                              |
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
Objective checkboxes update live as you make progress - no need to reopen the Journal. `[C]laim Rewards` grants gold and xp for every fully-checked-off quest in one go and moves it down to "Completed"; it's a no-op ("Nothing ready to claim yet.") if nothing's done yet. Enemy-defeating objectives count kills from your lifetime tally, so kills you made before accepting the quest still count - the same way item-acquiring objectives already work.

## Achievements

Unlike quests, achievements need no accepting and no claiming - they watch what you do and pay out the moment you earn them. `[A]chievements` on the Menu shows the full list, unlocked first:

```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 5550 [idle]            8:14pm|
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

When one unlocks, a gold banner appears in the status bar for a few seconds, wherever you happen to be:

```
| hp: 84 | mp: 46 | [ DANGER ] | Achievement unlocked: Boss Down!       |
```

A few requirements are judged in the instant a fight ends rather than tracked over time - winning with low health, clearing several enemies at once, killing a boss. Those show no running progress, because there isn't any to show: they're checked the moment you win, and only when you win. Fleeing or dying doesn't count.

## Save & Load

Both the title screen's `[C]ontinue` and the in-game Menu's `[S]ave`/`[L]oad` open the same picker, just in different modes. There are a few numbered slots plus (load mode only) an extra entry for the autosave the game writes on a timer in the background:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 5500     [idle]      7:38pm  |
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

Off by default. Set `allow_admin: true` in `config.js`'s `game_config` (or run with `ALLOW_ADMIN=true`) and the Menu grows a `[V] Admin` entry; leave it off and the entry isn't listed and the key does nothing. Everything under it writes state directly - no level gates, no slot caps, no rewards paid:
```
_________________________________________________________________________
| apocylta | Rae Lv.4 | [town square] | gp: 5500     [idle]     7:38pm   |
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
| apocylta | Rae Lv.4 | [town square] | gp: 5500     [idle]     7:38pm   |
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
|_______________________________________________________________________|
```
The Inventory editor lists **every** item in the game with how many you hold (0 if none), tabbed by type - `[G]ive` and `[T]ake` move by the current step, and `[I]nfinite` marks an item to never run down, shown as `∞`. Equipment tabs by slot and marks what's worn with `[EQUIPPED]`; `[U]nequip` is the only place in the game that takes something off without swapping it for something else. Toolbelt edits the three stored counts and lets you put on any belt, since every cap comes from the belt rather than being stored.

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
| apocylta | Rae Lv.4 | [town square] | gp: 1000       [idle]    7:38pm  |
|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾|
|   Colorize        [ON ]   colour on/off                               |
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
