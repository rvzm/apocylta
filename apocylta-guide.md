# The apocylta Guide

Everything about how the game actually works. If you'd rather see what the screens look like, that's
[apocylta-gui.md](./apocylta-gui.md); if you just want to get it running, that's the
[README](./README.md).

---

## 1. Getting started

`npm start` and the game takes over your terminal. Every screen prints its own command legend along the
bottom — `[T] Travel | [1] Gather scraps | [M] Menu` — so the letter in brackets is the key to press. Case
doesn't matter. `q` quits from anywhere, immediately and without asking, so be a little careful with it.

This guide writes those keys in the **Prefix** style, `[T] Travel`. A fresh install draws them boxed
instead — `[T]ravel` — which is the same key doing the same thing. If you'd rather the game matched this
page, Action key style in the Settings (§15) switches it.

The screen is always laid out the same way. The top bar carries your name and level, where you are, your
money, whatever you're currently doing, and the time of day. Some screens — the shops, the workbenches, the
mine and fishing pickers, your backpack — add a second bar beneath it with a line of colour about where you're
standing; it changes with the hour and tells you nothing you need, so read it or don't. Under that is the main
pane, which is the screen you're actually on. Below that, a status bar with your health, mana, and whether
you're somewhere safe — and, while you're working, a progress bar for the skill you're using. Achievement
unlocks arrive there too, as a gold banner, and a gold `[ BLESSED ]` sits there while an aid spell is
running (§8). At the bottom, the prompt and the command legend.

Health, mana and that progress bar are all colour-banded, so you can read how you're doing without reading
the numbers.

The clock runs while you play — one in-game minute per real second — and it matters. Shops keep hours.
Locations read differently at dusk than at noon. Weather turns over on its own every few hours.

---

## 2. Making a character

Five choices, and all of them stick.

**Your name** is just yours.

**Difficulty** is the biggest decision you'll make, and it reaches much further than "enemies hit harder":

| | Casual | Normal | Nightmare | Demon Lord |
| --- | --- | --- | --- | --- |
| seconds between gathering attempts | 1 | 10 | 30 | 60 |
| skills you may pick as proficient | 5 | 2 | 0 | 0 |
| all xp earned | ×1.5 | ×1 | ×0.25 | ×0.1 |
| bonus for a proficient skill | ×1.5 | ×1.5 | **×0** | **×0** |
| enemy hp and damage | ×0.5 | ×1 | ×2 | ×5 |
| how often you're ambushed | rarely | steady | constantly | constantly |
| chance a fight is a whole pack | low | even | high | very high |
| death | recoverable | recoverable | **deletes your save** | **deletes your save** |

Easy, Hard and Survival fill the gaps between. Survival, Nightmare and Demon Lord are the three that play for
keeps — dying on any of them deletes the run.

Two rows there deserve spelling out. **All xp earned** is not just your player level: it multiplies every
skill xp payment in the game, so on Demon Lord a swing of the pickaxe teaches you a tenth of what it would on
Normal. (Quest and achievement rewards are the exception — those are paid in full.) And the **proficiency
bonus** goes the wrong way at the top end: it's ×1.5 up to Hard, halves to ×0.5 on Survival, and reaches
**zero** on Nightmare and Demon Lord, where a proficient skill earns nothing at all. Your race and class still
hand you four of them, so on those difficulties four skills start at level 5 and stay there.

**Your race** sets two proficient skills and what you start with: Human (mining, barter — 500 copper and a
hammer), Dwarf (smithing, mining — 300 copper and an iron pickaxe), Elf (fishing, foraging — 400 copper and
a fishing rod), Orc (fighting, survival — 200 copper and an axe), Goblin (trapping, woodcutting — 150
copper and an iron dagger). Coin values are given in copper throughout — see section 11.

**Your class** sets two more: Warrior (fighting, defense), Mage (magic, alchemy), Ranger (fishing,
foraging), Attacker (fighting, trapping), Tank (defense, smithing).

**Your starter pack** is a one-off leg up — a purse worth 5000 copper, a set of basic tools, potions and bread,
or a weapon and armor set of varying quality.

Then you pick however many extra proficient skills your difficulty allows. A proficient skill starts at
level 5 instead of 1, and up to Hard it earns xp 50% faster for the whole run — so on those difficulties the
choice compounds. See the proficiency row above before spending picks on Survival or harder.

Two of the seventeen skills are worth knowing about before you spend a pick. **Luck** has no way to earn xp
at all, and **crafting** has almost none — a pick spent on either buys you the starting level 5 and very
little after it. §6 has the details and the rest of the table.

---

## 3. The world

74 locations, connected by exits you can see on the travel screen. Some are **safe** — nothing will jump
you in a town square — and some aren't, which the status bar tells you at a glance.

Most journeys take real time. Press `[T] Travel`, pick a numbered destination, and a longer trip hands you a
countdown screen with a small animation appropriate to the route: someone walking a road, a glider over open
sky, a cart rattling through a tunnel, a shimmer for a teleport. Arriving pays Speed xp in proportion to the
trip — a thirty-second haul is worth thirty. Short hops stay instant, and there are plenty of them: every
shop door and most footpaths between neighbours cost nothing.

**Your speed skill shortens the walk**, gently: the times on the map below are what a new character walks,
and every level shaves a fraction off, down to a floor of 40% faster at around speed 100. It bottoms out
there rather than trending toward nothing. The xp a route pays doesn't shrink with it — a trip is worth its
posted length however fast you cover it, so training speed never makes speed harder to train.

The travel screen also previews where each exit leads *next*, a column per destination, so you can see one
hop past the one you're choosing.

Travel can't be interrupted by an ambush; that's deliberate. It does keep running if you open the
`[M] Menu`, but **`[B] Back` abandons the trip** — you return to where you set out from and the elapsed
time is gone.

Shops keep **opening hours**. A closed shop tells you when to come back rather than letting you in.

### Getting around quickly

Two things save you the long walk, and both are worth going out of your way for early.

The **Apocylta Regional Hub** is the airboat interchange: seven routes out of one room, thirty seconds
each, reaching every region in the game. Getting *to* it is the awkward part — from Apocylta Haven it's a
walk out to Mountain Peak and an airboat to Zenthal Airport before you can catch one onward.

**Your own house** is the better answer, and the real reason to buy a deed. It teleports you to five places
for five seconds apiece, and `[J] Go Home` from the town square or the housing district gets you into it.
That includes **Apocyltia Castle**, which nothing else in the world leads to — the castle has an exit *out*
to the Regional Hub, but no route in except your front door. That also makes it the quickest way to the Hub
there is: home, castle, hub, twenty seconds all told, against the better part of a minute going the long way
round through Zenthal.

### The map

<!-- worldmap:begin -->

### The long hauls

Every route that crosses from one region into another. Everything else is local, and shows up on the
region maps below.

```
                            +-- 30s airboat --> Zenthal Airport
                            +-- 30s airboat --> Zenthal City
                            +-- 30s airboat --> Town Square
  APOCYLTA REGIONAL HUB ----+-- 30s airboat --> Cordura Outpost
                            +-- 30s airboat --> Vetron Station
                            +-- 30s airboat --> Kooz Station
                            +-- 30s airboat --> Azari Town

                +-- 5s teleport --> Town Square
                +-- 5s teleport --> Zenthal City
  YOUR HOME ----+-- 5s teleport --> Azari Castle
                +-- 5s teleport --> Kooz Docks
                +-- 5s teleport --> Apocyltia Castle

  Mountain Peak (Apocylta Haven)  <-->  30s airboat  Zenthal Airport (Zenthal)
  Apocyltia Castle                 -->  10s teleport  Apocylta Regional Hub   (one way)
```

Read the region maps as *how you'd walk it*: each location hangs off the one you'd reach it from, with
the trip time and the kind of route beside it. `->` on a row lists the shortcuts leaving that location
that the tree doesn't need — teleports and airboats. Shop interiors aren't drawn; they're gathered into
the `Shops:` line under each region.

### Apocylta Haven — 31 locations (6 behind shop doors)

```
town square                                 safe
|- wilderness                               15s road   freshwater
|  |- mountain pass                         18s road   -> portal room 5s
|  |- north path                            12s road   safe
|  |  |- cliffside                          10s road
|  |  |- riverbank                          10s road   safe, freshwater
|  |  `- abandoned village                  15s road   boss: Hubert
|  |- east path                             12s road
|  |  |- forest edge                        10s road   safe
|  |  `- abandoned cabin                    10s road
|  |- west path                             12s road
|  |  |- mountain peak                      20s road   -> portal room 5s, zenthal airport 30s
|  |  `- cave entrance                      10s road   -> portal room 5s, mountain pass 5s
|  |     `- cave mines                      15s cave   safe, mine: basic
|  |        |- cave hub                     10s tunnel   safe, mine: mid tier
|  |        |- north deep cave              10s tunnel   safe, mine: high tier
|  |        `- south deep cave              10s tunnel   mine: legendary, boss: Goblin King
|  `- south path                            12s road
|     |- desert                             20s road   boss: Gilbert
|     `- oasis                              10s road   safe, freshwater
|- park                                     10s road   safe
|- market square                            instant road   safe
|- housing district                         5s road   safe
|- safehouse                                [S] Safehouse   safe
`- portal room                              5s teleport   safe
                                            -> mountain pass 5s, mountain peak 5s, cave entrance 5s
```

**Shops:** blacksmith (weapons, armor, salvage); potions shop (potions); food market (food); magic shop
(magic); general store (browse, food, materials); black market (enhancements, illicit goods); plus counters at
cave hub (browse); housing district (deeds).

### Zenthal — 10 locations (4 behind shop doors)

```
zenthal airport                             safe, -> mountain peak 30s, apocylta regional hub 30s
`- zenthal city                             15s road   saltwater
   |- zenthal market                        10s road   safe
   |  |- zenthal slums                      10s road   freshwater
   |  `- zenthal park                       5s road   safe, saltwater
   `- zenthal docks                         20s road   saltwater
```

**Shops:** zenthal residential (deeds); zenthal blacksmith (weapons, armor); zenthal general store (browse);
zenthal black market (enhancements, illicit goods); plus counters at zenthal airport (browse); zenthal market
(browse).

### Apocylta Regional Hub — 2 locations

```
apocylta regional hub                       safe
                                            -> zenthal airport 30s, zenthal city 30s, town square 30s,
                                               cordura outpost 30s, vetron station 30s, kooz station 30s,
                                               azari town 30s
`- apocylta regional hub shops              5s road   safe
```

**Shops:** counters at apocylta regional hub (browse); apocylta regional hub shops (weapons, armor, potions,
browse).

### Cordura — 12 locations

```
cordura outpost                             safe
|- cordura mines                            20s road   mine: basic
|  `- cordura mines deep                    15s tunnel   mine: advanced
|     |- cordura north tunnel               10s tunnel   mine: advanced
|     |  `- cordura north chamber           15s tunnel   mine: advanced, boss: Beelzebub
|     |- cordura south tunnel               10s tunnel   mine: advanced
|     |  `- cordura south chamber           15s tunnel   mine: advanced, boss: Azrael
|     |- cordura east tunnel                10s tunnel   mine: advanced
|     |  `- cordura east chamber            15s tunnel   mine: advanced, boss: Vortigern
|     `- cordura west tunnel                10s tunnel   mine: advanced
|        `- cordura west chamber            15s tunnel   mine: advanced, boss: Morgoth
`- cordura forest                           15s road
```

**Shops:** counters at cordura outpost (browse).

### Vetron — 4 locations

```
vetron station                              safe, -> apocylta regional hub 30s
|- vetron city                              20s road   safe, saltwater
|  `- vetron market                         10s road   safe
`- vetron docks                             15s road   saltwater
```

**Shops:** counters at vetron station (browse); vetron market (armor, weapons, magic, browse).

### Kooz — 4 locations

```
kooz station                                safe, -> apocylta regional hub 30s
|- kooz city                                20s road   safe, saltwater
|  `- kooz market                           10s road   safe
`- kooz docks                               15s road   saltwater
```

**Shops:** counters at kooz station (browse); kooz market (armor, weapons, magic, browse).

### Azari — 3 locations

```
azari town                                  safe
|- azari castle                             20s road   safe
`- azari docks                              15s road   safe, saltwater
```

**Shops:** counters at azari town (browse).

### Apocyltia Castle — 7 locations

```
apocyltia castle                            safe, -> apocylta regional hub 10s
|- apocyltia castle courtyard               5s hallway   safe, freshwater
|- apocyltia castle keep                    5s hallway   safe
|- apocyltia castle north wing              5s hallway   safe
|- apocyltia castle south wing              5s hallway   safe
|- apocyltia castle east wing               5s hallway   safe
`- apocyltia castle west wing               5s hallway   safe
```

**Shops:** none.

### Your Home — 1 location

```
Your Home                                   safe
                                            -> town square 5s, zenthal city 5s, azari castle 5s, kooz docks 5s,
                                               apocyltia castle 5s
```

**Shops:** none.

<!-- worldmap:end -->

---

## 4. Doing things: the attempt

This is the loop everything else sits on, so it's worth understanding properly.

When you start a timed action — gathering, mining, fishing, chopping — you don't collect continuously.
You make an **attempt** every so often, and each attempt either produces something or doesn't. The action
screen shows the last few attempts as they happen, with a countdown to the next one.

**How often** is your difficulty's gather clock: one second on Casual, ten on Normal, sixty on Demon Lord.

**Whether it lands** depends on what you're doing and how good you are at it. Every action has its own base
success rate — 60% for scavenging, looking for food and foraging, 55% for trapping and chopping, 50% for
mining and fishing — and every level of the gap between your skill and what you're going after moves it by
two points, up or down. It's clamped to **15% at worst and 95% at best**, so nothing is ever hopeless and
nothing is ever free.

Plain gathering measures against level 1, so it drifts up to the 95% ceiling by about skill 18 and stays
there. Mining and fishing measure against the ore or the species instead, which is why a mithril seam misses
at a level where tin never does.

Mining pays two extras on top, rolled separately on any attempt that lands: a **25%** chance of fuel and an
**8%** chance of a gemstone, both drawn from what the local seam's tier allows.

**A miss costs you the attempt and pays no xp.** Only successes teach you anything.

An attempt can also land and then have nowhere to go: if you're out of room the attempt log says so, and
takes whatever part of the haul still fits (§9). Being full is the one kind of failure you can fix on the
spot, by dropping something.

Standing in an unsafe location while you work, something may jump you. That roll is on its own clock,
faster on harder difficulties, and it interrupts whatever you were doing.

---

## 5. The gathering trades

**Scavenging, foraging, chopping, trapping** are the straightforward ones: pick the action from a
location's numbered list and it runs until you stop it.

**Mining** has a picker, reached with `[N] Mine` where a location has a seam. A mine has one of five tiers and
only lists the ores that tier reaches, each tier keeping everything below it:

| the mine | adds | needs mining |
| --- | --- | --- |
| basic | tin, copper, iron | 1, 1, 5 |
| mid tier | cobalt, mithril | 10, 25 |
| advanced | syllic | 40 |
| high tier | adamantite | 45 |
| legendary | runite | 60 |

Gold sits outside that ladder and turns up in every mine, at mining 8. Taking any ore needs your mining
level *and* a pickaxe whose own tier reaches it: a copper pickaxe will not break mithril no matter how
skilled you are. Coal and gemstones aren't on the list at all — they turn up on their own while you work,
and which gems are possible depends on how deep the mine is.

**Fishing** has a picker too, and three gates instead of two. What's swimming depends on the water:
freshwater locations hold pike, trout and carp; saltwater holds tuna, lobster and things further out. A
few species live in both. Taking one needs your fishing level, a rod whose tier reaches it, and — for
anything not caught on the rod alone — the right gear in your backpack. Each species is caught on bait, a
net, or a hook, and **bait is spent per attempt** while nets and hooks are yours for good. Run out of bait
mid-session and the trip simply ends.

The far end of the ladder is where the water stops being water. Krakens and barboros are still food, and
enormous. **Leviathans, poseidons and tarvuses are not** — they give up scales, teeth and bones instead of
supper, and can't be cooked at all. The climb runs kraken at fishing 30, leviathan at 40, poseidon at 50 and
tarvus at 60; the three kings behind them want **75**.

---

## 6. Skills and levelling

17 skills. Fifteen of them level on their own as you use them: magic, defense, fighting, speed, survival,
woodcutting, fishing, mining, smithing, cooking, foraging, trapping, alchemy, barter and strength. The other
two have no ordinary way to earn xp — see the notes under the table.

Some of those you'll never train on purpose. **Defense levels by being hit**, speed by travelling and by
fleeing, alchemy and survival by drinking what you brewed, barter by trading at either counter, and
**strength by carrying a heavy load** — it goes up while you're doing something else entirely.

Skill xp **accumulates** — it's a running total that never goes down, and each level names the total you need
to have reached it. So your bar fills toward the next threshold rather than emptying when you arrive. The
curve climbs steeply, so early levels come quickly and later ones are a project. Proficient skills earn a
multiplier on every payment, which your difficulty sets (§2). **Skills cap at 500.**

### What each skill is for

Skills do two different jobs, and it's worth keeping them apart. A few **gate** things — below the level,
the game simply refuses you. The rest **scale** something, quietly, with no threshold to cross.

| skill | what it does for you | how it earns xp |
| --- | --- | --- |
| **Mining** | **gates** which ores you can break: tin and copper 1, iron 5, gold 8, cobalt 10, mithril 25, syllic 40, adamantite 45, runite 60 — and your odds on each swing | successful attempts |
| **Fishing** | **gates** which species you can land, from 1 up to 75 for the three kings — and your odds per cast | successful attempts |
| **Magic** | **gates** which spells you may learn — every spell prints the level it wants | casting, paying each spell's own xp — 3 for Magic Missile, 50 for a Divine Cure |
| **Barter** | **gates** what a shop will show you at all: common 1, uncommon 5, rare 15, epic 25, legendary 35, mythic 65, unique 80, godlike 100 | buying and selling, scaled by the item's rarity |
| **Fighting** | **gates** boss fights at **level 20**; below that, scales how hard you hit | every swing, plus a lump on the kill worth half the enemy's xp |
| **Defense** | how much damage your armor soaks, and your block chance (caps at 60%) | every hit you take — you train it by being hit, not by choosing to |
| **Speed** | **how long travel takes**, dodging (caps at 50%) and running away (40% base, two points a level, caps at 90%) | one xp per second of every trip you finish, plus a little each dodge or escape |
| **Luck** | your critical-hit chance (caps at 50%) | nothing |
| **Woodcutting** | your odds per swing at a tree | successful attempts |
| **Foraging** | your odds when scavenging or foraging | successful attempts |
| **Trapping** | your odds per trap | successful attempts |
| **Survival** | your odds looking for food | looking for food, and eating anything |
| **Smithing** | nothing yet — the forge asks for ingredients, not a level | crafting, scaled by the rarity of what came out |
| **Cooking** | nothing yet — same | crafting, scaled by rarity |
| **Alchemy** | nothing yet — same | crafting, and drinking a potion |
| **Crafting** | nothing | **nothing — see below** |
| **Strength** | **how much you can carry** — two units on both the toolbelt and the backpack per level (§9) | hauling a heavy load, clearing a whole pack, and killing a boss |

Four things there want spelling out, because each is a place the game doesn't do what an RPG usually would.

**Gear has no level requirement.** You can equip anything you can carry — a mithril sword at fighting 1,
adamantite plate at defense 1. The game's data *describes* a tier ladder for weapons, armor, shields, axes,
hammers and mage robes, but nothing checks it. The two ladders that are real are mining's pickaxes and
fishing's rods, which are enforced exactly as §5 describes them.

**Crafting stations have no level requirement either.** If you have the ingredients, you can make the thing,
whatever your smithing, cooking or alchemy level. Those three skills earn xp and currently spend it on
nothing.

**Crafting earns nothing from crafting.** The crafting table and the anvil share their recipe pool with the
forge, and that pool pays **Smithing**. So every general craft you make raises smithing instead, and the only
crafting xp in the game comes from three achievements. Take it as a proficiency pick and it will sit at level
5 for the whole run.

**Luck has no xp source at all.** It can be picked as a proficiency at creation, which starts it at 5, and
there it stays — the only other way to move it is a black-market charm. It does at least do something from
there: it feeds your crit chance.

**Strength trains in three places**, none of which is a thing you set out to do: hauling a load past about
three-quarters of either capacity, clearing an entire pack of enemies, and putting down a boss. Ordinary
kills pay nothing — that's fighting's job. So strength climbs while you're mining a seam dry or wading
through a horde, which is exactly when carrying more would have helped.

One last thing, since it cuts across the whole table: **enhancements and blessings raise your effective
level, not your trained one.** A charm that says `+10 mining` — or a Blessed Pickaxe, which does the same
thing for ten minutes (§8) — will open an ore you couldn't touch a moment ago and improve your odds on it,
but every number the game *shows* you, every quest objective and every achievement reads the level you
actually trained. Both routes go through the same seam, so both behave identically here. See §11 for the
charms and §8 for the blessings.

### Your player level

Every skill level also feeds a share of its cost into your **overall player level**, so there's no such
thing as a wasted afternoon of fishing — it moves your character forward too, just less directly than
fighting would.

The player level runs on a much steeper curve than any single skill, which is what makes it read like an
average of everything you're good at. It will always trail the skills feeding it:

| what you have | roughly what you are |
| --- | --- |
| every skill around 25 | player 36 |
| every skill around 75 | player 99 |
| every skill around 100 | player 130 |
| five skills at 100, the rest untouched | player 81 |
| five skills at 120, the rest untouched | player 96 |
| one skill at 100, the rest untouched | player 43 |

So there are two honest routes to a high level: broad competence across the board, or four or five
specialities driven well past everyone else's. Neither is cheaper than the other by much, and doing both
is what gets you near the ceiling — **player level caps at 572**, which is exactly what all seventeen
skills at 500 is worth.

Kills, quest hand-ins and achievements pay player xp directly on top of that, and those rewards scale with
your level, so a quest is worth about the same slice of a level at 100 as it was at 10.

---

## 7. Fighting

Combat is turn-based and deliberate: one keypress resolves one full exchange — your action, then theirs.
Nothing happens while you're thinking.

### What you can do on your turn

- **`[A] Attack`** — swing whatever you have equipped. *Spends your round.*
- **`[C] Cast`** — opens your spell list: everything you know that does something in a fight, with its
  damage or healing and its mana cost, and a note on any you can't currently afford. `[C] Cast` again on the
  one you want. *Spends your round* — but backing out with `[B] Back` costs you nothing.
- **`[P] Potion`** — the same picker over the potions you're carrying, with what each one does. `[C] Use`
  drinks it. *Spends your round.*
- **`[F] Flee`** — 40% to start, two points per level of speed, capped at 90%. *Spends your round whether or
  not it works*, so a failed escape is a free hit for them.
- **`[B] Backpack`** — your bags, mid-fight. **Free**, and so is `[U] Use` from inside it: eating or drinking
  out of the backpack doesn't cost you a round, where the `[P]` picker does. If you only want the healing and
  not the tempo, go the long way round.
- **`[M] Menu`** — free. The fight waits; nothing resolves while you're away.
- **`[X] Continue`** — leaves the encounter, and only works once it's decided. Until then every other key is
  simply refused, so you can't walk out of a fight you're losing.

There's no defend command — defending isn't something you choose, it's what your armor and your defense
level do for you on every hit you take.

### How a round resolves

Your damage comes from your weapon plus your fighting level. Armor doesn't subtract from incoming hits — it
mitigates a *percentage*, with diminishing returns and a cap of **80%**, so stacking defense always helps but
never makes you untouchable. The three lucky breaks each ride a different skill and each have a ceiling:
crits on **luck** (up to 50%), dodges on **speed** (50%), blocks on **defense** (60%). Since luck can't
currently be trained, crits stay near their base rate for the whole run.

Three buff spells reach into that maths for the rest of the encounter: **Shield**, **Protection** and
**Fortitude** on your defense, **Strength** and **God's Hand** on your attack, and **Haste** on your speed —
which means Haste raises both your dodge chance and your odds of getting away. All three still respect the
ceilings above, so a buff helps up to the cap and no further.

An encounter can be a single enemy or a **pack** — groups queue up and you fight them one at a time, with a
bonus for clearing the whole thing. Harder difficulties throw packs far more often. The pack's name sits
above whoever you're currently facing, along with how far through it you are.

**Bosses** are a separate action at locations that have one, and they're gated behind fighting level 20.

### Losing

**Death**, on most difficulties, strips you of every item and every coin you were carrying and puts you back
at the town square with your equipment, skills and levels intact, plus the basics to start again. On
Survival, Nightmare and Demon Lord it's the end: the save slot and the autosave are both deleted. If you're
carrying a revive when you drop, it's spent automatically before any of that happens — the weakest one you
have, and a revive potion counts as readily as a proper revive item.

---

## 8. Magic

46 spells across seven types, laid out in a rarity ladder from starter to godlike. You begin knowing one:
Magic Missile, which costs nothing to learn and never stops being cheap.

### The seven types

A spell's type is also its targeting rule — there's no separate "who does this hit" setting, so what a
spell does tells you where it works.

| type | what it does | needs a target? | where it works |
| --- | --- | --- | --- |
| **attack** | straight damage, 10 (Magic Missile) up to 175 (Explosion) | yes | in a fight only |
| **heal** | restores hp, 15 (Cure) up to 1000 (Divine Cure) | no | anywhere |
| **buff** | raises your attack, defense or speed for the rest of the encounter | no | **in a fight only** |
| **debuff** | weakens the enemy's attack for the rest of the encounter | yes | in a fight only |
| **poison** | damage over time, ticking for a set number of rounds | yes | in a fight only |
| **aid** | the Blessed line — raises a skill for a set time | no | anywhere |
| **teleport** | moves you to a fixed location | no | anywhere |

**Buffs are the trap here.** They land on the *encounter*, not on you, so casting one in a town square
spends the mana and does nothing at all — there's nothing to attach to and nothing carries over into your
next fight. Cast them after the enemy shows up, not before you go looking.

### The Blessed line

The eight **aid** spells are the exception to all of that: they land on *you*, they hold for a set time
rather than for one fight, and they ride your save. A gold `[ BLESSED ]` badge sits in the status bar while
one is running.

| spell | raises | for |
| --- | --- | --- |
| Blessed Hammer | Smithing +10 | 10 minutes |
| Blessed Pickaxe | Mining +10 | 10 minutes |
| Blessed Hands | Crafting +10 | 10 minutes |
| Blessed Satchel | Foraging, Woodcutting, Trapping and Fishing +10 | 10 minutes |
| Blessed Alchemy | Alchemy +10 | 10 minutes |
| Zion's / K'ratch's / Blessing of Apocylta | all of the above +25 | 30 minutes |

Those are real minutes, and they're the only thing separating the three godlike blessings from the five
rare ones — they buff the same skills, three times as long, for reagents that cost void shards.

What a blessing raises is your **effective** level, the same thing an enhancement raises (§11), so the same
rule applies: it opens an ore or a fish species that was locked a moment ago and improves your odds on it,
but the level the game *shows* you, and every quest and achievement that measures one, still reads what you
actually trained.

Two practical notes. Recasting the same blessing **refreshes** its clock rather than stacking a second
bonus, so topping up early costs you nothing but mana. Two *different* blessings do stack — which is what
makes casting a rare one on top of a godlike one worth the mana, for +35 on a skill.

### Learning and casting

Learning one usually costs reagents — ley crystals, arcane shards, mystic dust, and void shards at the top
end — and always requires the magic level printed on it. Casting costs mana and pays magic xp, and both
scale with the spell: Magic Missile is 6 mana for 3 xp, Divine Cure is 100 for 50.

The **Spellbook** is reached with `[C] Spellbook` from your backpack, and shows everything — including
spells you can't have yet, with the reason spelled out and your reagents counted as owned against required,
so you can see what you're working toward instead of guessing.

- **`[L] Learn`** — learn the highlighted spell, if you have the level and the reagents.
- **`[C] Cast`** — cast it right there. Useful for healing, aid and teleports; attack spells politely do
  nothing with no one to point at.
- **`[<]` / `[>]`** — switch between Learned and Unlearned. The unlearned tab further splits into what you
  could learn now and what you couldn't, then groups by type.
- **`[B] Back`** — to the backpack.

In a fight you cast from `[C] Cast` on the combat screen instead, which lists only the spells that would
do something there.

**One known gap:** the godlike Azrael Castle Teleport names a destination that isn't in the game yet.
Every other teleport goes where it says.

---

## 9. Carrying it home

**Everything you carry has a weight**, and what limits you is how much of it you're hauling, not how many
different things you own. Ten thousand logs is ten thousand logs' worth of load.

You have **three places to put things**, and they fill up independently:

| container | holds | measured in |
| --- | --- | --- |
| **Toolbelt** | scrap, tools, and fishing bait and hooks | weight |
| **Backpack** | everything else | weight |
| **Potion pouch** | potions, and only potions | slots |

An item's home is fixed — you don't choose it. A pickaxe always rides the belt, an iron ore always rides
the pack, and filling one has no effect at all on the other. That's the practical reason to keep a decent
belt on even once you've a good backpack: a beltful of scrap doesn't cost you an ounce of pack space.

The **potion pouch** is the odd one out and still counts slots rather than weight. A potion costs one slot
no matter how many you stack in it, and costs nothing against either weight budget — so three healing
potions and three hundred take up exactly the same room.

### What sets your limits

Your **belt** sets the toolbelt budget, the potion pouch, and a floor under your backpack:

| belt | toolbelt | backpack | potions | sling ammo |
| --- | --- | --- | --- | --- |
| none | 8 | 100 | 5 | — |
| leather | 15 | 100 | 5 | 10 |
| chainmail | 20 | 150 | 10 | 15 |
| adventurer | 25 | 175 | 10 | 15 |
| plate | 30 | 200 | 15 | 20 |
| mythic | 50 | 300 | 20 | 30 |
| Apocylta's Eye | 90 | 500 | 30 | 50 |

Water, slingshot ammo and arrows are the strict part: they live *on the belt*, so without one equipped you
can't use them at all, whatever the number says. They're also outside the weight system entirely — a full
water bottle costs you no toolbelt room. Arrows are uncapped the moment any belt is on.

A **backpack**, worn in its own slot, raises the pack budget and nothing else:

| backpack | backpack budget |
| --- | --- |
| starter | 100 |
| small | 150 |
| medium | 200 |
| large | 300 |
| mythic | 500 |
| Apocyltian | 1000 |
| God's Back | 2000 |

The belt and the backpack **don't add up** — whichever grants more is the one that counts, so a backpack is
a straight upgrade once it beats what your belt was already giving you, and taking a belt off never buys you
room.

**Your strength adds to both budgets**, two units a level, and it's the only thing that lifts the toolbelt
beyond what your belt allows. See §6 for how it trains.

### Running out of room

A pickup that won't fit **takes what it can and leaves the rest** — mine three ore with room for two and you
get two, and the attempt line says what you left behind. Nothing is silently voided, and nothing is lost
that would have fitted.

For a sense of scale: a starting character with a leather belt can carry about eighty iron ore, or
seventy-five pieces of scrap metal on the belt beside it. Scrap and bait weigh almost nothing; ore, bars and
armor are what fill you up. A leviathan's bones are the heaviest thing in the world and are meant to be.

### Looking through it

There's a screen per container, and each thing you carry appears in exactly one of them:

- **`[B] Backpack`** — the pack. Tabbed by item type, each row showing its stack weight, with `[D] Drop`,
  `[E] Equip` and `[U] Use`. Anything consumable is used from here, and using it pays a little xp in the
  relevant skill — plus whatever it came in (see below).
- **`[P] Pouch`**, from the Toolbelt — the belt. Same tabs and the same three actions, but rows are gathered
  under headings by kind, so a belt holding nine axes and nine pickaxes reads as two sections rather than
  eighteen loose rows. Each heading carries how many kinds it holds and what the group weighs, and the bar
  above the list shows your belt's total load.

Your **potions** are the exception with no screen of their own: they show in the Backpack like everything
else, and the pouch that limits them is just a number on the Toolbelt screen.

### What's left when you've used it

Using a consumable pays xp in the skill it belongs to — alchemy for potions, survival for food and field
medicine — and **hands back whatever it came in**:

| you use | you keep |
| --- | --- |
| any potion | an empty bottle |
| a tea or brew | an empty thermos |
| an antidote, antivenom or elixir | an empty bottle |
| a Bandage Box | an empty box |
| a Medic Bag or Trauma Bag | an empty bag |
| a Phoenix Kit | an empty kit |
| an AEGIS Kit | nothing — it's used up entirely |
| plain food, a bandage, a revive | nothing |

The empties are ordinary crafting materials: sell them, or brew into them. **Potions are made in a bottle**,
so brewing one costs you an empty and drinking it gives that empty straight back — the bottle is a deposit,
not a bonus.

If your pack is full when a container comes back it's lost, and the message says so rather than quietly
dropping it.

---

## 10. Crafting and cooking

Stations do the work: a crafting table and anvil for general goods, a forge for smithing bars and gear, an
alchemy table for potions, a cooking station or campfire for food.

The craft screen tabs by what a recipe produces and lists each recipe with its ingredients, so you can see
at a glance what you're short of. Crafting pays xp scaled by the rarity of what you made.

Fish are the deepest branch: every species you can eat can be cooked, grilled, baked, smoked, pickled or
fried, and the preparation matters — raw is barely worth eating, and a smoked or baked rare catch rivals the
best stew in the game. The ancients from §5 are the exception; their scales and bones are crafting materials,
and no fire will make a meal of them.

Buy a **house** and you can start buying stations for it, rather than borrowing whatever the safehouse
happens to have.

---

## 11. Money

Money comes in **four metals**, each worth a fixed multiple of the one below it:

| coin | worth |
| --- | --- |
| copper | 1 (the base) |
| silver | 10 copper |
| gold | 2 silver |
| syllic | 5 gold |

Everything is priced in these, and the header shows what you're carrying in shorthand — `55sy` is
fifty-five syllic, `54sy 4g 1s` is what's left after breaking one of them. **You keep the coins you
were handed.** Selling a stack of scrap pays out in loose copper and it stays loose copper, so a
hundred coppers reads as a hundred coppers even though it's worth a syllic. Paying spends your small
change first and only breaks a bigger coin when the small stuff runs out — and it breaks the smallest
one that covers the bill, so three loose coppers never cost you a syllic.

You'll also see **ingots** and **slabs** on some price tags. They aren't a separate currency: an ingot
is ten coins of its metal and a slab a hundred, so a gold ingot is just a tidy way of writing twenty
silver.

Every item carries its own price. Rarity sets the *band* it falls in — a common item is worth a little, a
legendary one a lot — but where inside that band it lands comes from the item itself: a sword's damage, a
breastplate's defense, how deep a mine you needed to reach the ore. Two common swords are no longer worth
the same, which they used to be.

Selling returns 40% of what buying would cost, so trading is a way to convert effort into money, not a way
to print it. That last part is now literally enforced: no recipe whose ingredients you can *buy* is allowed
to produce something worth more than 2.5× what they cost, because 2.5 is the point where buying the
ingredients and selling the result starts minting coins out of nothing. Brewing tea used to pay five times
over.

Your **barter** skill gates what a shop will sell you at all: the better stock stays behind the counter
until your barter level is high enough. Selling pays barter xp scaled by what you sold, so the skill
grows through use like any other.

What a shop will *sell* you is gated by your barter level against the item's rarity: common needs 1,
uncommon 5, rare 15, epic 25, legendary 35, mythic 65, unique 80 and godlike 100. Until you've traded
enough, the good stock is visible and refused.

The sell screen lets you tick several stacks and offload them in one go.

### The black market

Two shops trade outside all of that, and you'll find them in the black market off the town square (and
again in Zenthal). Neither asks your barter level, because every single thing on the table is mythic or
better — a barter gate would show you an empty room until you'd traded half the game away. **The price is
the gate**, and nothing here is cheap: entries run from a thousand base units to five hundred thousand —
ten syllic to five thousand. Rows are green when you can afford them and red when you can't.

`[I] Illicit Goods` sells named one-off artifacts and focuses, plus bundles — a bundle is a name for a
pile of something else, so its row tells you what's actually inside before you pay for it.

`[E] Enhancements` sells 70 items across five slots — charm, talisman, beads, ring and bangle — with
one entry per slot for each of the 14 skills. You wear one per slot, so five at a time, and they stack.

An enhancement raises your **effective** skill level, not your trained one, and the difference matters:

- It counts wherever a level *gates or scales* what you can do — swinging harder in a fight, reaching an
  ore or a fish species that was locked a moment ago, improving your odds on a gather attempt, unlocking
  better shop stock.
- It does **not** count where the level is the thing being measured. A quest objective to reach mining 10,
  an achievement for the same, the xp you earn, and every number the game shows you all read the level you
  actually trained. Buying a charm won't complete a quest for you.

Your worn enhancements are listed in the Menu, and they ride your save.

---

## 12. Quests

Take work from a **Quest Board**. Quests are gated by your level — walk past the board again as you climb
and there'll be more on it. Once accepted, a quest lives in your **Journal**, reached from the Toolbelt.

Objectives track themselves live — acquire this, sell that, craft a thing, reach a place, learn a skill or a
spell, defeat something specific or enough of a type, buy a house or fit it out with stations. **How far back
they look varies, and it matters:**

- **Kills count for ever.** Anything you've already killed counts the moment you accept the quest.
- **Items are counted in your bags right now.** An "acquire 20 iron" objective ticks when you're holding
  twenty and *un*-ticks if you smelt or sell them, so hand the quest in before you spend the materials.
- **Selling, crafting and casting only count from acceptance onward.** Work done before you took the quest is
  invisible to it.
- **Reaching a place** means standing there, not having been there.

Two things worth knowing about how objectives read:

- A line ending in a colon is a **group**: its own box ticks when everything indented beneath it is done,
  and the count beside it is how many of those you've finished.
- Anything marked **(optional)** tracks and ticks like the rest, but the quest pays out whether or not you
  bother with it.

Objectives can also ask for a *kind* of thing rather than a specific one — "a Mythic Weapon" means any
weapon of that rarity, and how you come by it is your business.

`[C] Claim Rewards` in the Journal collects everything that's finished, in one go.

---

## 13. Achievements

24 of them, and there's nothing to accept or claim: the moment you meet the requirement it unlocks and
pays out, wherever you happen to be standing. A gold toast in the status bar tells you it happened. The
full catalog is browsable from the Menu, grouped into unlocked and locked with live progress on each, so
you can see what you're close to.

---

## 14. Saving

Manual saves go to one of **three** numbered slots in a local SQLite file, from the Menu. On top of that, an
**autosave** runs every ten minutes into a separate JSON file, and shows up as an extra entry in the load
picker alongside the numbered slots rather than occupying one of them.

Loading always resumes idle and out of combat — an interrupted fight or a half-finished gather isn't
preserved, by design.

On Survival, Nightmare and Demon Lord, death deletes both the slot and the autosave. There is no getting it
back.

---

## 15. Settings, and the web page

`[T] Settings` from the Menu, and they belong to the install rather than to a character:

- **Colorize** turns colour off while keeping bold and highlighting, for terminals or eyes that prefer it.
- **Action key style** changes how every command legend is drawn — `[T]ravel`, `[T] Travel`, **T**ravel,
  or `T: [Travel]`. Purely cosmetic, and it applies everywhere at once.

The screen also keeps a few dates for you — when you first played, when you last did, and when the autosave
last ran. `[T] Toggle` flips whatever the cursor is on, `[B] Back` or Esc goes back.

While the game runs it also serves a small read-only web page at `localhost:4000` — a live playercard with
tabs for your stats, toolbelt, backpack, quests and achievements, refreshing every five seconds. It's meant
for a second monitor, and nothing you do there touches the run.

If exporting is enabled, two buttons appear. **Export HTML** saves the whole page as one self-contained file
with your data baked in, which keeps working offline and on any other machine. **Export JSON** saves just the
data — a few kilobytes, small enough to paste into a message — and `localhost:4000/apocylta_player.html` is
the reader for it: paste the JSON in (or pick the file), press Import, and it draws the same card back.

---

## 16. Admin tools

Off unless `allow_admin` is set in `config.js` or you start the game with `ALLOW_ADMIN=true`, at which
point the Menu grows `[V] Admin`: editors for stats, skills, inventory, equipment, toolbelt, quests and
achievements, plus godmode. `ALLOW_ADMIN=false` shuts them off again for one run.

They write state directly and skip every gate in the game — that's the point. They're for testing
something you'd otherwise need forty levels to see, not for playing. Progression edits ride your save;
the live switches (godmode, infinite items) last only for the session.
