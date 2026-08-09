# The apocylta Guide

Everything about how the game actually works. If you'd rather see what the screens look like, that's
[apocylta-gui.md](./apocylta-gui.md); if you just want to get it running, that's the
[README](./README.md).

---

## 1. Getting started

`npm start` and the game takes over your terminal. Every screen prints its own command legend along the
bottom — `[T]ravel | [1] Gather scraps | [M]enu` — so the letter in brackets is the key to press. Case
doesn't matter. `q` quits from anywhere, immediately and without asking, so be a little careful with it.

The screen is always laid out the same way. The top bar carries your name and level, where you are, your
gold, whatever you're currently doing, and the time of day. Under that is the main pane, which is the
screen you're actually on. Below that, a status bar with your health, mana, and whether you're somewhere
safe. At the bottom, the prompt and the command legend.

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
| player xp | ×1.5 | ×1 | ×0.25 | ×0.1 |
| enemy hp and damage | ×0.5 | ×1 | ×2 | ×5 |
| how often you're ambushed | rarely | steady | constantly | constantly |
| chance a fight is a whole pack | low | even | high | very high |
| death | recoverable | recoverable | **deletes your save** | **deletes your save** |

Easy, Hard and Survival fill the gaps between. Survival, Nightmare and Demon Lord are the ones that play for keeps —
dying on either deletes the run.

**Your race** sets two proficient skills and what you start with: Human (mining, barter — 500 gold and a
hammer), Dwarf (smithing, mining — 300 gold and an iron pickaxe), Elf (fishing, foraging — 400 gold and a
fishing rod), Orc (fighting, survival — 200 gold and an axe), Goblin (trapping, woodcutting — 150 gold and
an iron dagger).

**Your class** sets two more: Warrior (fighting, defense), Mage (magic, alchemy), Ranger (fishing,
foraging), Attacker (fighting, trapping), Tank (defense, smithing).

**Your starter pack** is a one-off leg up — a purse of 5000 gold, a set of basic tools, potions and bread,
or a weapon and armor set of varying quality.

Then you pick however many extra proficient skills your difficulty allows. A proficient skill starts at
level 5 instead of 1 and earns xp 50% faster forever, so these choices compound over a whole run.

---

## 3. The world

66 locations, connected by exits you can see on the travel screen. Some are **safe** — nothing will jump
you in a town square — and some aren't, which the status bar tells you at a glance.

Most journeys take real time. Press `[T]ravel`, pick a numbered destination, and a longer trip hands you a
countdown screen with a small animation appropriate to the route: someone walking a road, a glider over
open sky, a cart rattling through a tunnel. Arriving pays Speed xp in proportion to the trip. Short hops —
stepping into a shop and back out — stay instant. Travel can't be interrupted by an ambush; that's
deliberate. You can leave the traveling screen and do something else while the clock runs, and you'll
arrive regardless.

Shops keep **opening hours**. A closed shop tells you when to come back rather than letting you in.

---

## 4. Doing things: the attempt

This is the loop everything else sits on, so it's worth understanding properly.

When you start a timed action — gathering, mining, fishing, chopping — you don't collect continuously.
You make an **attempt** every so often, and each attempt either produces something or doesn't. The action
screen shows the last few attempts as they happen, with a countdown to the next one.

**How often** is your difficulty's gather clock: one second on Casual, ten on Normal, sixty on Demon Lord.

**Whether it lands** depends on what you're doing and how good you are at it. Every action has its own
base success rate — scavenging is more forgiving than mining — and your skill level moves it from there,
measured against whatever you're going after. Chasing something well above your level is a long shot;
coming back to it forty levels later is nearly a formality. It's clamped at both ends, so nothing is ever
hopeless and nothing is ever free.

**A miss costs you the attempt and pays no xp.** Only successes teach you anything.

Standing in an unsafe location while you work, something may jump you. That roll is on its own clock,
faster on harder difficulties, and it interrupts whatever you were doing.

---

## 5. The gathering trades

**Scavenging, foraging, chopping, trapping** are the straightforward ones: pick the action from a
location's numbered list and it runs until you stop it.

**Mining** has a picker. A mine has a tier, and only lists the ores that tier reaches — a basic seam gives
up tin, copper and iron; the deeper caves add cobalt, mithril, and eventually runite. Taking one needs
your mining level *and* a pickaxe whose own tier reaches it: a copper pickaxe will not break mithril no
matter how skilled you are. Coal and gemstones aren't on the list at all — they turn up on their own while
you work, and which gems are possible depends on how deep the mine is.

**Fishing** has a picker too, and three gates instead of two. What's swimming depends on the water:
freshwater locations hold pike, trout and carp; saltwater holds tuna, lobster and things further out. A
few species live in both. Taking one needs your fishing level, a rod whose tier reaches it, and — for
anything not caught on the rod alone — the right gear in your backpack. Each species is caught on bait, a
net, or a hook, and **bait is spent per attempt** while nets and hooks are yours for good. Run out of bait
mid-session and the trip simply ends.

The far end of the fishing ladder isn't food. The ancients — leviathans, krakens, the things that live
where the water stops being water — give up scales, teeth and bones instead of supper, and want a fishing
level in the high double digits to hook at all.

---

## 6. Skills and levelling

17 skills, each levelling on its own as you use it: magic, defense, fighting, strength, speed, survival,
woodcutting, fishing, mining, smithing, crafting, cooking, foraging, trapping, alchemy, barter and luck.

Skill xp is *spent* on levels rather than accumulated toward a rank — when you've banked enough, the next
level is bought automatically. The cost curve climbs steeply, so early levels come quickly and later ones
are a project. Proficient skills (from your race, class, and creation picks) earn 50% more xp per action,
permanently. **Skills cap at 500.**

### Your player level

Every skill level also feeds a share of its cost into your **overall player level**, so there's no such
thing as a wasted afternoon of fishing — it moves your character forward too, just less directly than
fighting would.

The player level runs on a much steeper curve than any single skill, which is what makes it read like an
average of everything you're good at. It will always trail the skills feeding it:

| what you have | roughly what you are |
| --- | --- |
| every skill around 25 | player 36 |
| every skill around 75 | player 100 |
| every skill around 100 | player 130 |
| five skills at 100, the rest untouched | player 80 |
| five skills at 120, the rest untouched | player 95 |
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

You can attack, defend, cast a spell, drink a potion, or run. Fleeing isn't guaranteed. An encounter can
be a single enemy or a **pack** — groups queue up and you fight them one at a time, with a bonus for
clearing the whole thing. Harder difficulties throw packs far more often.

Your damage comes from your weapon plus your fighting level. Armor doesn't subtract from incoming hits —
it mitigates a *percentage*, with diminishing returns and a hard cap, so stacking defense always helps but
never makes you untouchable. Crits, dodges and blocks all get a small boost from the relevant skill.

**Bosses** are a separate action at locations that have one, and they're gated behind fighting level 20.

**Death**, on most difficulties, strips you of every item and every coin you were carrying and puts you
back at the town square with your equipment, skills and levels intact, plus the basics to start again. On
Survival and Nightmare it's the end: the save slot and the autosave are both deleted. If you're carrying a
revive when you drop, it's spent automatically before any of that happens.

---

## 8. Magic

46 spells across attack, healing, buffs, debuffs, poison and teleportation, laid out in a rarity ladder
from starter to godlike.

Learning one usually costs reagents — ley crystals, arcane shards, mystic dust — and always requires the
magic level printed on it. The Spellbook shows everything, including spells you can't have yet, with the
reason spelled out and your reagents counted as owned/required, so you know what you're working toward
rather than guessing.

Casting costs mana, pays magic xp, and works in or out of a fight; a healing spell is as useful sitting
still as it is mid-encounter, while an attack spell needs something to point at.

---

## 9. Carrying it home

Your **belt** is the piece of equipment everything else depends on. It sets how many backpack slots you
have, how many potions you can keep to hand, and how much ammo you can carry — and water, slingshot ammo
and arrows aren't usable at all without one equipped.

The backpack is tabbed by item type. Tools don't live there; they go in the tool slot, one at a time,
which is why a pickaxe and a fishing rod compete for the same space. Anything consumable is used from the
backpack, and using it pays a little xp in the relevant skill — plus you keep the empty bottle.

---

## 10. Crafting and cooking

Stations do the work: a crafting table and anvil for general goods, a forge for smithing bars and gear, an
alchemy table for potions, a cooking station or campfire for food.

The craft screen tabs by what a recipe produces and lists each recipe with its ingredients, so you can see
at a glance what you're short of. Crafting pays xp scaled by the rarity of what you made.

Fish are the deepest branch: every species can be cooked, grilled, baked, smoked, pickled or fried, and
the preparation matters — raw is barely worth eating, and a smoked or baked rare catch rivals the best
stew in the game.

Buy a **house** and you can start buying stations for it, rather than borrowing whatever the safehouse
happens to have.

---

## 11. Money

Prices come from rarity. A common item is worth a little, a legendary one a lot, and selling returns 40%
of what buying would cost — so trading is a way to convert effort into gold, not a way to print it.

Your **barter** skill gates what a shop will sell you at all: the better stock stays behind the counter
until your barter level is high enough. Selling pays barter xp scaled by what you sold, so the skill
grows through use like any other.

The sell screen lets you tick several stacks and offload them in one go.

---

## 12. Quests

Take work from a **Quest Board**. Quests are gated by your level, and some are locked until something else
opens them. Once accepted, a quest lives in your **Journal**, reached from the Toolbelt.

Objectives track themselves live — acquire this, sell that, craft a thing, reach a place, learn a skill or
a spell, defeat something specific or enough of a type, buy a house or fit it out with stations. Most of
them count what you've *ever* done, so kills and materials from before you took the quest still count.

Two things worth knowing about how objectives read:

- A line ending in a colon is a **group**: its own box ticks when everything indented beneath it is done,
  and the count beside it is how many of those you've finished.
- Anything marked **(optional)** tracks and ticks like the rest, but the quest pays out whether or not you
  bother with it.

Objectives can also ask for a *kind* of thing rather than a specific one — "a Mythic Weapon" means any
weapon of that rarity, and how you come by it is your business.

`[C]laim Rewards` in the Journal collects everything that's finished, in one go.

---

## 13. Achievements

24 of them, and there's nothing to accept or claim: the moment you meet the requirement it unlocks and
pays out, wherever you happen to be standing. A gold toast in the status bar tells you it happened. The
full catalog is browsable from the Menu, grouped into unlocked and locked with live progress on each, so
you can see what you're close to.

---

## 14. Saving

Manual saves go to numbered slots in a local SQLite file, from the Menu. On top of that, an **autosave**
runs on a timer and shows up as an extra entry in the load picker alongside your numbered slots.

Loading always resumes idle and out of combat — an interrupted fight or a half-finished gather isn't
preserved, by design.

On Survival and Nightmare, death deletes both the slot and the autosave. There is no getting it back.

---

## 15. Settings, and the web page

`[T] Settings` from the Menu, and they belong to the install rather than to a character:

- **Colorize** turns colour off while keeping bold and highlighting, for terminals or eyes that prefer it.
- **Action key style** changes how every command legend is drawn — `[T]ravel`, `[T] Travel`, **T**ravel,
  or `T: [Travel]`. Purely cosmetic, and it applies everywhere at once.

While the game runs it also serves a small read-only web page at `localhost:4000` — a live playercard with
tabs for your stats, toolbelt, backpack, quests and achievements, refreshing every few seconds. It's meant
for a second monitor. If exporting is enabled, an **Export** button saves the whole thing as a single
self-contained HTML file with your data baked in, which keeps working offline.

---

## 16. Admin tools

Off unless `allow_admin` is set in `config.js` or you start the game with `ALLOW_ADMIN=true`, at which
point the Menu grows `[V] Admin`: editors for stats, skills, inventory, equipment, toolbelt, quests and
achievements, plus godmode. `ALLOW_ADMIN=false` shuts them off again for one run.

They write state directly and skip every gate in the game — that's the point. They're for testing
something you'd otherwise need forty levels to see, not for playing. Progression edits ride your save;
the live switches (godmode, infinite items) last only for the session.
