// apocylta world data - locations
//
// `flavorText` is either a plain string or an array of lines, where an entry
// may be a (state, location) => string | null function - see data/flavor.js
// for the ready-made ones and resolveFlavorText() at the bottom of this file
// for how they're resolved. Most locations are still one string; convert the
// ones you want depth on.

import {
  dangerLine,
  firstVisitLine,
  healthLine,
  indoorTimeLine,
  openLine,
  packLine,
  timeLine,
  weatherLine,
} from "./flavor.js";

export const LOCATIONS = {
  // ** Player Home
  playerhome: {
    id: "playerhome",
    name: "Your Home",
    description: "Your Home - a small, cozy place to rest and store your belongings.",
    flavorText: [
      "It's quiet in here, and the door bolts from the inside.",
      indoorTimeLine,
      "",
      "Your bed is against the far wall. Whatever you've dragged home is stacked where you left it.",
      healthLine,
      packLine,
    ],
    safe: true,
    exits: [
      { label: "Apocylta Haven", to: "town_square", category: "teleport", time: 5 },
      { label: "Zenthal City", to: "zenthal_city", category: "teleport", time: 5 },
    ],
    interactiveActions: ["rest", "wait", "meditate", "organize_inventory", "craft", "cook", "brew", "forge"],
    hubFeatures: [],
  },

  // ** REGION: acopylta haven
  town_square: {
    id: "town_square",
    name: "town square",
    description: "Apocylta Haven Town square - a wonderful hub for various shops.",
    flavorText: [
      "Shopfronts line three sides of the square, and a road runs north out of town.",
      "",
      timeLine,
      "",
      weatherLine,
      "",
      "A handful of people are about, none of them looking at each other.",
      "The quest board is up against the far wall, thick with paper.",
      "",
      healthLine,
      packLine,
    ],
    safe: true,
    exits: [
      { label: "out of town", to: "wilderness", category: "path", time: 15 },
      { label: "park", to: "park", category: "path", time: 10 },
      { label: "weapons", to: "weapons_shop", category: "shop" },
      { label: "armor", to: "armor_shop", category: "shop" },
      { label: "potions", to: "potions_shop", category: "shop" },
      { label: "general store", to: "general_store", category: "shop" },
      { label: "black market", to: "black_market", category: "shop" },
      { label: "housing district", to: "housing_district", category: "path", time: 5 },
      { label: "portal room", to: "portal_room", category: "teleport", time: 5 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["quest_board", "safehouse", "toolbelt", "go_to_home", "cooking_station", "crafting_table"],
  },
  portal_room: {
    id: "portal_room",
    name: "portal room",
    description: "The Portal Room - a mysterious room filled with magical portals.",
    flavorText: "Various portals shimmer with arcane energy, each leading to a different location.",
    safe: true,
    exits: [
      { label: "town square", to: "town_square", category: "teleport", time: 5 },
      { label: "mountain pass", to: "mountain_pass", category: "teleport", time: 5 },
      { label: "mountain peak", to: "mountain_peak", category: "teleport", time: 5 },
      { label: "cave entrance", to: "cave_entrance", category: "teleport", time: 5 },
    ],
    interactiveActions: ["use_portal"],
    hubFeatures: ["toolbelt", "crafting_table"],
  },
  safehouse: {
    id: "safehouse",
    name: "safehouse",
    description: "The Safehouse - a secure location for players to rest and recover.",
    flavorText: "The safehouse is a haven for weary travelers, offering shelter and protection.",
    safe: true,
    exits: [{ label: "town square", to: "town_square", category: "path" }],
    interactiveActions: ["rest", "wait", "meditate"],
    hubFeatures: ["toolbelt", "cooking_station", "crafting_table", "alchemy_table", "anvil"],
  },
  wilderness: {
    id: "wilderness",
    name: "wilderness",
    description: "The Wilderness - a dangerous area outside of town.",
    flavorText: [
      "The ruins stretch out ahead of you, low and broken, going on further than you can see.",
      timeLine,
      weatherLine,
      "",
      firstVisitLine,
      "Scrap glints in the rubble. So does the odd pair of eyes.",
      dangerLine,
      healthLine,
    ],
    safe: false,
    boss: false,
    enemies: ["weak_goblin", "sneaky_goblin", "bow_goblin", "weak_human", "weak_goblin_group"],
    exits: [
      { label: "town square", to: "town_square", category: "path", time: 15 },
      { label: "mountain pass", to: "mountain_pass", category: "path", time: 18 },
      { label: "North Path", to: "north_path", category: "path", time: 12 },
      { label: "East Path", to: "east_path", category: "path", time: 12 },
      { label: "West Path", to: "west_path", category: "path", time: 12 },
      { label: "South Path", to: "south_path", category: "path", time: 12 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food", "trap_game", "fish", "forage", "chop", "fight"],
    hubFeatures: ["toolbelt", "campfire"],
  },
  mountain_pass: {
    id: "mountain_pass",
    name: "mountain pass",
    description: "The Mountain Pass - a treacherous path through the mountains.",
    flavorText: "The wind howls through the narrow pass, carrying with it the scent of danger.",
    safe: false,
    boss: false,
    enemies: ["weak_goblin", "small_dwarf", "bow_dwarf", "weak_dwarf_group"],
    exits: [
      { label: "wilderness", to: "wilderness", category: "path", time: 15 },
      { label: "portal room", to: "portal_room", category: "teleport", time: 5 },
    ],
    interactiveActions: ["gather_scraps", "fight"],
    hubFeatures: ["forge", "toolbelt"],
  },
  north_path: {
    id: "north_path",
    name: "north path",
    description: "The North Path - a winding trail leading into the unknown.",
    flavorText: "The path is overgrown and difficult to navigate, but it promises adventure.",
    safe: true,
    exits: [
      { label: "wilderness", to: "wilderness", category: "path", time: 12 },
      { label: "cliffside", to: "cliffside", category: "path", time: 10 },
      { label: "riverbank", to: "riverbank", category: "path", time: 10 },
      { label: "abandoned village", to: "abandoned_village", category: "path", time: 15 },
    ],
    interactiveActions: ["gather_scraps", "chop", "look_for_food"],
    hubFeatures: ["toolbelt"],
  },
  cliffside: {
    id: "cliffside",
    name: "cliffside",
    description: "The Cliffside - a steep drop with a breathtaking view.",
    flavorText: "The wind whips around you as you peer over the edge, the ground far below.",
    safe: false,
    boss: false,
    enemies: ["sneaky_goblin", "bow_goblin", "mage_goblin", "weak_human"],
    exits: [{ label: "north_path", to: "north_path", category: "path", time: 10 }],
    interactiveActions: ["gather_scraps", "fight"],
    hubFeatures: ["toolbelt"],
  },
  riverbank: {
    id: "riverbank",
    name: "riverbank",
    description: "The Riverbank - a calm area by the flowing river.",
    flavorText: "The sound of water soothes your nerves as you explore the area.",
    safe: true,
    exits: [{ label: "north_path", to: "north_path", category: "path", time: 10 }],
    interactiveActions: ["gather_scraps", "fish", "forage"],
    hubFeatures: ["toolbelt"],
  },
  abandoned_village: {
    id: "abandoned_village",
    name: "abandoned village",
    description: "The Abandoned Village - remnants of a once-thriving community.",
    flavorText: "The buildings are in ruins, and the air is thick with the scent of decay.",
    safe: false,
    boss: ["hubert"],
    enemies: ["berserker", "assassin", "necromancer", "cultist", "fanatic", "acolyte_party"],
    exits: [{ label: "north_path", to: "north_path", category: "path", time: 15 }],
    interactiveActions: ["gather_scraps", "look_for_food", "fight", "challenge_boss"],
    hubFeatures: ["toolbelt"],
  },
  east_path: {
    id: "east_path",
    name: "east path",
    description: "The East Path - a narrow trail that disappears into the forest.",
    flavorText: "The trees close in around you, and the sounds of wildlife echo through the woods.",
    safe: false,
    boss: false,
    enemies: ["rage_goblin", "berserker_goblin", "weak_human", "psycho", "goblin_group"],
    exits: [
      { label: "wilderness", to: "wilderness", category: "path", time: 15 },
      { label: "forest edge", to: "forest_edge", category: "path", time: 10 },
      { label: "abandoned cabin", to: "abandoned_cabin", category: "path", time: 10 },
    ],
    interactiveActions: ["gather_scraps", "fight"],
    hubFeatures: ["toolbelt"],
  },
  forest_edge: {
    id: "forest_edge",
    name: "forest edge",
    description: "The Forest Edge - the boundary between the wilderness and the dense forest.",
    flavorText: "The trees tower above you, their leaves whispering secrets in the wind.",
    safe: true,
    exits: [{ label: "east_path", to: "east_path", category: "path", time: 10 }],
    interactiveActions: ["gather_scraps", "forage", "chop"],
    hubFeatures: ["toolbelt"],
  },
  abandoned_cabin: {
    id: "abandoned_cabin",
    name: "abandoned cabin",
    description: "The Abandoned Cabin - a small, dilapidated structure in the woods.",
    flavorText: "The cabin is falling apart, but it might still hold some useful items.",
    safe: false,
    boss: false,
    enemies: ["sneaky", "rogue", "madman", "cultist_goblin", "mixed_group"],
    exits: [{ label: "east_path", to: "east_path", category: "path", time: 10 }],
    interactiveActions: ["gather_scraps", "look_for_food", "fight"],
    hubFeatures: ["toolbelt"],
  },
  west_path: {
    id: "west_path",
    name: "west path",
    description: "The West Path - a rugged trail that leads to the mountains.",
    flavorText: "The path is rocky and steep, but the view from the top is worth the climb.",
    safe: false,
    boss: false,
    enemies: ["small_dwarf", "axe_dwarf", "berserker_dwarf", "mage_dwarf", "dwarf_group"],
    exits: [
      { label: "wilderness", to: "wilderness", category: "path", time: 15 },
      { label: "mountain peak", to: "mountain_peak", category: "path", time: 20 },
      { label: "cave entrance", to: "cave_entrance", category: "path", time: 10 },
    ],
    interactiveActions: ["gather_scraps", "fight"],
    hubFeatures: ["toolbelt"],
  },
  mountain_peak: {
    id: "mountain_peak",
    name: "mountain peak",
    description: "The Mountain Peak - the highest point of the surrounding area.",
    flavorText: "The wind is fierce, and the view stretches for miles in every direction.",
    safe: false,
    boss: false,
    enemies: ["berserker_dwarf", "assassin_dwarf", "necromancer_dwarf", "big_orc", "strong_dwarf_group", "large_mixed_group"],
    exits: [
      { label: "west_path", to: "west_path", category: "path", time: 20 },
      { label: "portal room", to: "portal_room", category: "teleport", time: 5 },
      { label: "airboat to Zenthal", to: "zenthal_airport", category: "airboat", time: 30 },
    ],
    interactiveActions: ["gather_scraps", "fight"],
    hubFeatures: ["toolbelt"],
  },
  cave_entrance: {
    id: "cave_entrance",
    name: "cave entrance",
    description: "The Cave Entrance - a dark opening in the side of the mountain.",
    flavorText: "The air is cool and damp, and you can hear the faint sound of dripping water.",
    safe: false,
    boss: false,
    enemies: ["assassin_goblin", "necromancer_goblin", "cultist_dwarf", "weak_orc_group", "orc_acolyte_group"],
    exits: [
      { label: "west path", to: "west_path", category: "path", time: 10 },
      { label: "cave mines", to: "cave_mines", category: "cave", time: 15 },
      { label: "portal room", to: "portal_room", category: "teleport", time: 5 },
      { label: "mountain pass portal", to: "mountain_pass", category: "teleport", time: 5 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food", "fight"],
    hubFeatures: ["toolbelt"],
  },
  cave_mines: {
    id: "cave_mines",
    name: "cave mines",
    description: "The Cave Mines - a network of tunnels and shafts dug into the mountain.",
    flavorText: [
      "The walls are lined with veins of ore, and the air is thick with dust.",
      "",
      firstVisitLine,
      "Someone has driven props into the ceiling every few paces. They creak when you pass.",
      "This close to the surface it's tin, copper and iron - the good stuff is deeper in.",
      packLine,
    ],
    safe: true,
    mine: "basic",
    exits: [
      { label: "cave entrance", to: "cave_entrance", category: "cave", time: 15 },
      { label: "cave hub", to: "cave_hub", category: "in_cave", time: 10 },
      { label: "north deep cave", to: "south_deep_cave", category: "in_cave", time: 10 },
      { label: "south deep cave", to: "south_deep_cave", category: "in_cave", time: 10 }

    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "mine"],
  },
  cave_hub: {
    id: "cave_hub",
    name: "cave hub",
    description: "The Cave Hub - a central area in the cave system.",
    flavorText: "The hub is a crossroads for the various tunnels and shafts in the cave.",
    safe: true,
    mine: "mid_tier",
    exits: [
      { label: "cave mines", to: "cave_mines", category: "in_cave", time: 10 },
      { label: "north deep cave", to: "north_deep_cave", category: "in_cave", time: 10 },
      { label: "south deep cave", to: "south_deep_cave", category: "in_cave", time: 10 }
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "mine", "shop_general", "shop_sell"],
  },
  north_deep_cave: {
    id: "north_deep_cave",
    name: "north deep cave",
    description: "The North Deep Cave - a dark and dangerous area of the cave system.",
    flavorText: "The air is thick with the smell of damp earth and the sound of dripping water echoes through the tunnels.",
    safe: true,
    mine: "high_tier",
    exits: [
      { label: "cave hub", to: "cave_hub", category: "in_cave", time: 10 },
      { label: "south deep cave", to: "south_deep_cave", category: "in_cave", time: 10 }
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "mine"],
  },
  south_deep_cave: {
    id: "south_deep_cave",
    name: "south deep cave",
    description: "The South Deep Cave - a dark and dangerous area of the cave system.",
    flavorText: [
      "The air is thick with damp earth, and dripping water echoes away down tunnels you can't see the end of.",
      "",
      firstVisitLine,
      "The seams down here run to runic ore, if you've brought a pick that can bite it.",
      "Something has been scratching the walls at head height. The marks are fresh.",
      dangerLine,
      healthLine,
    ],
    safe: false,
    // An array like every other boss location - as a bare string it slipped
    // past both consistency tests, which guard on Array.isArray.
    boss: ["goblin_king"],
    mine: "legendary",
    enemies: ["berserker_goblin", "assassin_goblin", "necromancer_goblin", "cultist_goblin", "strong_goblin_group"],
    exits: [
      { label: "cave hub", to: "cave_hub", category: "in_cave", time: 10 },
      { label: "north deep cave", to: "north_deep_cave", category: "in_cave", time: 10 }
    ],
    interactiveActions: ["gather_scraps", "look_for_food", "fight", "challenge_boss"],
    hubFeatures: ["toolbelt", "mine"],
  },
  south_path: {
    id: "south_path",
    name: "south path",
    description: "The South Path - a dusty trail that leads to the desert.",
    flavorText: "The sun beats down on you as you make your way through the arid landscape.",
    safe: false,
    boss: false,
    enemies: ["axe_human", "madman", "sneaky", "wizard", "human_group", "human_dwarf_acolyte_group"],
    exits: [
      { label: "wilderness", to: "wilderness", category: "path", time: 15 },
      { label: "desert", to: "desert", category: "path", time: 20 },
      { label: "oasis", to: "oasis", category: "path", time: 10 },
    ],
    interactiveActions: ["gather_scraps", "fight"],
    hubFeatures: ["toolbelt"],
  },
  desert: {
    id: "desert",
    name: "desert",
    description: "The Desert - a vast expanse of sand and rock.",
    flavorText: "The heat is oppressive, and the wind carries the scent of danger.",
    safe: false,
    boss: ["gilbert"],
    enemies: ["dumb_raider", "sneaky_raider", "berserker_raider", "angry_raider", "raider_squad", "goblin_raider_group"],
    exits: [{ label: "south_path", to: "south_path", category: "path", time: 20 }],
    interactiveActions: ["gather_scraps", "fight", "challenge_boss"],
    hubFeatures: ["toolbelt"],
  },
  oasis: {
    id: "oasis",
    name: "oasis",
    description: "The Oasis - a small, lush area in the midst of the desert.",
    flavorText: "The water is cool and refreshing, and the shade of the palm trees is a welcome relief.",
    safe: true,
    exits: [{ label: "south_path", to: "south_path", category: "path", time: 10 }],
    interactiveActions: ["gather_scraps", "look_for_food", "fish"],
    hubFeatures: ["toolbelt"],
  },

// ** REGION: Zenthal

  zenthal_airport: {
    id: "zenthal_airport",
    name: "zenthal airport",
    description: "Zenthal Airport - a bustling hub of activity, with planes taking off and landing.",
    flavorText: "The airport is busy, but you can find a quiet corner to rest.",
    safe: true,
    exits: [
      { label: "Airboat to Apocylta Haven", to: "mountain_peak", category: "airboat", time: 30 },
      { label: "Airboat to Apocylta Regional Hub", to: "regional_hub", category: "airboat", time: 30 },
      { label: "Zenthal City", to: "zenthal_city", category: "path", time: 15 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "shop_general", "shop_sell"],
  },
  zenthal_city: {
    id: "zenthal_city",
    name: "zenthal city",
    description: "Zenthal City - a sprawling metropolis with towering skyscrapers and bustling streets.",
    flavorText: "The city is alive with activity, but danger lurks around every corner.",
    safe: false,
    enemies: ["rogue", "assassin", "berserker", "smart_raider", "human_group", "epic_mixed_group"],
    exits: [
      { label: "Zenthal Airport", to: "zenthal_airport", category: "path", time: 15 },
      { label: "Zenthal Market", to: "zenthal_market", category: "path", time: 10 },
      { label: "Zenthal Docks", to: "zenthal_docks", category: "path", time: 20 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food", "trap_game", "fish", "forage", "chop", "fight"],
    hubFeatures: ["toolbelt"],
  },
  zenthal_market: {
    id: "zenthal_market",
    name: "zenthal market",
    description: "Zenthal Market - a vibrant marketplace filled with vendors selling all manner of goods.",
    flavorText: "The market is crowded and chaotic, but you can find some interesting items if you look hard enough.",
    safe: true,
    exits: [
      { label: "Zenthal City", to: "zenthal_city", category: "path", time: 10 },
      { label: "Zenthal Docks", to: "zenthal_docks", category: "path", time: 15 },
      { label: "Zenthal Slums", to: "zenthal_slums", category: "path", time: 10 },
      { label: "Zenthal Park", to: "zenthal_park", category: "path", time: 5 },
      { label: "Zenthal Residential Area", to: "zenthal_residential", category: "shop" },
      { label: "Zenthal Blacksmith", to: "zenthal_blacksmith", category: "shop" },
      { label: "Zenthal General Store", to: "zenthal_general_store", category: "shop" },
      { label: "Zenthal Black Market", to: "zenthal_black_market", category: "shop" },
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "shop_general"],
  },
  zenthal_docks: {
    id: "zenthal_docks",
    name: "zenthal docks",
    description: "Zenthal Docks - a busy port where ships come and go, carrying goods and passengers.",
    flavorText: "The smell of saltwater and fish fills the air, and the sound of seagulls is constant.",
    safe: false,
    enemies: ["sneaky_raider", "dumb_raider", "psycho_raider", "raider_group", "orc_raider_group"],
    exits: [
      { label: "Zenthal City", to: "zenthal_city", category: "path", time: 20 },
      { label: "Zenthal Market", to: "zenthal_market", category: "path", time: 15 },
      { label: "Zenthal Slums", to: "zenthal_slums", category: "path", time: 20 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food", "trap_game", "fish", "fight"],
    hubFeatures: ["toolbelt"],
  },
  zenthal_slums: {
    id: "zenthal_slums",
    name: "zenthal slums",
    description: "Zenthal Slums - a run-down area of the city, filled with poverty and crime.",
    flavorText: "The streets are narrow and dirty, and the people here are wary of outsiders.",
    safe: false,
    enemies: ["psycho", "madman", "fanatic", "crazy_raider", "strong_human_group", "ultimate_mixed_group"],
    exits: [
      { label: "Zenthal Market", to: "zenthal_market", category: "path", time: 15 },
      { label: "Zenthal Docks", to: "zenthal_docks", category: "path", time: 20 },
      { label: "Zenthal Park", to: "zenthal_park", category: "path", time: 10 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food", "trap_game", "fish", "fight"],
    hubFeatures: ["toolbelt"],
  },
  zenthal_park: {
    id: "zenthal_park",
    name: "zenthal park",
    description: "Zenthal Park - a green space in the middle of the city, with trees, benches, and a small pond.",
    flavorText: "The park is a welcome respite from the hustle and bustle of the city.",
    safe: true,
    exits: [
      { label: "Zenthal Market", to: "zenthal_market", category: "path", time: 15 },
      { label: "Zenthal Slums", to: "zenthal_slums", category: "path", time: 10 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food", "trap_game", "fish"],
    hubFeatures: ["toolbelt"],
  },

  // ** REGION: Cordura
  cordura_outpost: {
    id: "cordura_outpost",
    name: "cordura outpost",
    description: "Cordura Outpost - a fortified settlement on the edge of the wilderness.",
    flavorText: "The outpost is well-defended, and you can see guards patrolling the walls.",
    safe: true,
    exits: [
      { label: "Apocylta Regional Hub", to: "regional_hub", category: "path", time: 30 },
      { label: "Cordura Mines", to: "cordura_mines", category: "path", time: 20 },
      { label: "Cordura Forest", to: "cordura_forest", category: "path", time: 15 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "shop_general"],
  },
  cordura_mines: {
    id: "cordura_mines",
    name: "cordura mines",
    description: "Cordura Mines - a network of tunnels and shafts where miners extract valuable resources.",
    flavorText: "The air is thick with dust, and the sound of pickaxes echoes through the tunnels.",
    safe: false,
    // Needed for the "mine" hub feature below - without it getMineType()
    // returns null and the ore selector reads "Nothing to mine here."
    mine: "basic",
    enemies: ["small_orc", "big_orc", "angry_orc", "shaman_orc", "orc_group", "large_orc_group"],
    exits: [{ label: "Cordura Outpost", to: "cordura_outpost", category: "path", time: 20 }],
    interactiveActions: ["gather_scraps", "look_for_food", "fight"],
    hubFeatures: ["toolbelt", "mine"],
  },
  cordura_forest: {
    id: "cordura_forest",
    name: "cordura forest",
    description: "Cordura Forest - a dense woodland filled with wildlife and hidden dangers.",
    flavorText: "The trees are tall and ancient, and the forest floor is covered in a thick layer of leaves.",
    safe: false,
    enemies: ["orc_warrior", "berserker_orc", "orc_bowman", "sneaky_orc", "orc_warband", "legendary_mixed_group"],
    exits: [{ label: "Cordura Outpost", to: "cordura_outpost", category: "path", time: 15 }],
    interactiveActions: ["gather_scraps", "look_for_food", "trap_game", "forage", "chop", "fight"],
    hubFeatures: ["toolbelt"],
  },

  // ** REGION: Vetron
  vetron_station: {
    id: "vetron_station",
    name: "vetron station",
    description: "Vetron Station - a bustling hub of activity, with trains coming and going.",
    flavorText: "The station is busy, but you can find a quiet corner to rest.",
    safe: true,
    exits: [
      { label: "Apocylta Regional Hub", to: "regional_hub", category: "path", time: 30 },
      { label: "Vetron City", to: "vetron_city", category: "path", time: 20 },
      { label: "Vetron Docks", to: "vetron_docks", category: "path", time: 15 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "shop_general"],
  },

  // ** REGION: Kooz
  kooz_station: {
    id: "kooz_station",
    name: "kooz station",
    description: "Kooz Station - a small, quiet station on the outskirts of the city.",
    flavorText: "The station is deserted, and you can hear the sound of the wind whistling through the tracks.",
    safe: true,
    exits: [
      { label: "Apocylta Regional Hub", to: "regional_hub", category: "path", time: 30 },
      { label: "Kooz City", to: "kooz_city", category: "path", time: 20 },
      { label: "Kooz Docks", to: "kooz_docks", category: "path", time: 15 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "shop_general"],
  },

  // ** REGION: Azari
  azari_town: {
    id: "azari_town",
    name: "azari town",
    description: "Azari Town - a small, bustling town with a rich history.",
    flavorText: "The town is alive with activity, and you can hear the sounds of merchants calling out their wares.",
    safe: true,
    exits: [
      { label: "Apocylta Regional Hub", to: "regional_hub", category: "path", time: 30 },
      { label: "Azari Castle", to: "azari_castle", category: "path", time: 20 },
      { label: "Azari Docks", to: "azari_docks", category: "path", time: 15 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "shop_general"],
  },

  azari_castle: {
    id: "azari_castle",
    name: "azari castle",
    description: "Azari Castle - a grand fortress that has stood for centuries.",
    flavorText: "The castle is imposing, and you can feel the weight of history in its walls.",
    safe: true,
    exits: [{ label: "Azari Town", to: "azari_town", category: "path", time: 20 }],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt"],
  },

  azari_docks: {
    id: "azari_docks",
    name: "azari docks",
    description: "Azari Docks - a busy port where ships come and go, carrying goods and passengers.",
    flavorText: "The smell of saltwater and fish fills the air, and the sound of seagulls is constant.",
    safe: true,
    exits: [{ label: "Azari Town", to: "azari_town", category: "path", time: 15 }],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt"],
  },

  // *** Apocylta Regional Hub ***
  regional_hub: {
    id: "regional_hub",
    name: "regional hub",
    description: "The Regional Hub - a central location for travelers and traders.",
    flavorText: "The hub is bustling with activity, and you can find all sorts of goods and services here.",
    safe: true,
    exits: [
      { label: "Zenthal Airport", to: "zenthal_airport", category: "path", time: 30 },
      { label: "Zenthal City", to: "zenthal_city", category: "path", time: 30 },
      { label: "Apocylta Haven", to: "town_square", category: "path", time: 30 },
      { label: "Cordura Outpost", to: "cordura_outpost", category: "path", time: 30 },
      { label: "Vetron Station", to: "vetron_station", category: "path", time: 30 },
      { label: "Kooz Station", to: "kooz_station", category: "path", time: 30 },
      { label: "Azari Town", to: "azari_town", category: "path", time: 30 },
    ],
    interactiveActions: ["gather_scraps", "look_for_food"],
    hubFeatures: ["toolbelt", "shop_general"],
  },

// ** Town Square Shops
  weapons_shop: {
    id: "weapons_shop",
    name: "weapons shop",
    description: "The Weapons Shop - racks of blades and battered firearms line the walls.",
    flavorText: [
      "Racks of blades and battered firearms line the walls, most of them second-hand and none of them cheap.",
      indoorTimeLine,
      "",
      openLine,
      "A hand-lettered sign says NO REFUNDS, twice, in different pens.",
    ],
    safe: true,
    exits: [{ label: "town square", to: "town_square", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_weapons", "shop_ammo", "shop_repair", "shop_sell"],
    openHours: { open: 8, close: 20 },
  },

  armor_shop: {
    id: "armor_shop",
    name: "armor shop",
    description: "The Armor Shop - scavenged plating and stitched leathers hang from every hook.",
    flavorText: "Nobody is behind the counter right now.",
    safe: true,
    exits: [{ label: "town square", to: "town_square", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_armor", "shop_repair", "shop_sell"],
    openHours: { open: 8, close: 20 },
  },

  potions_shop: {
    id: "potions_shop",
    name: "potions shop",
    description: "The Potions Shop - shelves of murky bottles hum faintly in the dark.",
    flavorText: "Nobody is behind the counter right now.",
    safe: true,
    exits: [{ label: "town square", to: "town_square", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_potions", "shop_ingredients", "shop_sell"],
    openHours: { open: 8, close: 20 },
  },

  general_store: {
    id: "general_store",
    name: "general store",
    description: "The General Store - a little bit of everything, none of it new.",
    flavorText: "Nobody is behind the counter right now.",
    safe: true,
    exits: [{ label: "town square", to: "town_square", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_general", "shop_sell"],
  },

  black_market: {
    id: "black_market",
    name: "black market",
    description: "The Black Market - a shadowed corner where questionable deals are made.",
    flavorText: "You get the feeling you're being watched.",
    safe: false,
    exits: [{ label: "town square", to: "town_square", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_upgrades", "shop_illegal", "shop_sell"],
    openHours: { open: 23, close: 6 },
  },

  housing_district: {
    id: "housing_district",
    name: "housing district",
    description: "The Housing District - rows of quiet, half-collapsed homes.",
    flavorText: "A few windows still have their lights on.",
    safe: true,
    exits: [{ label: "town square", to: "town_square", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_housing", "go_to_home"],
    openHours: { open: 10, close: 16 },
  },

  park: {
    id: "park",
    name: "park",
    description: "The Park - overgrown grass and rusted playground equipment.",
    flavorText: "It's oddly peaceful here.",
    safe: true,
    exits: [{ label: "town square", to: "town_square", category: "path" }],
    interactiveActions: ["gather_scraps", "look_for_food", "go_for_a_walk"],
    hubFeatures: [],
  },

  // ** Zenthal Market Shops
  zenthal_residential: {
    id: "zenthal_residential",
    name: "zenthal residential",
    description: "The Zenthal Residential Area - rows of well-kept homes and gardens.",
    flavorText: "Nobody is behind the counter right now.",
    safe: true,
    exits: [{ label: "zenthal market", to: "zenthal_market", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_housing", "go_to_home"],
    openHours: { open: 8, close: 20 },
  },
  zenthal_blacksmith: {
    id: "zenthal_blacksmith",
    name: "zenthal blacksmith",
    description: "The Zenthal Blacksmith - a forge and workshop for crafting and repairing weapons and armor.",
    flavorText: "Nobody is behind the counter right now.",
    safe: true,
    exits: [{ label: "zenthal market", to: "zenthal_market", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_weapons", "shop_armor", "shop_repair", "shop_sell"],
    openHours: { open: 8, close: 20 },
  },
  zenthal_general_store: {
    id: "zenthal_general_store",
    name: "zenthal general store",
    description: "The Zenthal General Store - a little bit of everything, none of it new.",
    flavorText: "Nobody is behind the counter right now.",
    safe: true,
    exits: [{ label: "zenthal market", to: "zenthal_market", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_general", "shop_sell"],
    openHours: { open: 8, close: 20 },
  },
  zenthal_black_market: {
    id: "zenthal_black_market",
    name: "zenthal black market",
    description: "The Zenthal Black Market - a shadowed corner where questionable deals are made.",
    flavorText: "You get the feeling you're being watched.",
    safe: false,
    exits: [{ label: "zenthal market", to: "zenthal_market", category: "path" }],
    interactiveActions: [],
    hubFeatures: ["shop_upgrades", "shop_illegal", "shop_sell"],
    openHours: { open: 23, close: 6 },
  },

};

export function getMineType(locationId) {
  const location = LOCATIONS[locationId];
  if (location && location.mine) {
    return location.mine;
  }
  return null;
}

export function getLocation(id) {
  return LOCATIONS[id];
}

// A location's `flavorText` is either a plain string or an array whose entries
// are strings or (state, location) => string | null functions - see
// data/flavor.js for the ready-made ones. Resolves to the lines to render.
//
// Two rules make conditional lines usable: a null/undefined result drops its
// line entirely, and consecutive blanks collapse, so a line that vanishes
// between two "" spacers doesn't leave a double gap behind it.
//
// Functions are called unguarded, matching data/actions.js's verbFlavor and
// data/hubFeatures.js's requires. Since the location screen now re-renders
// every tick, a throwing flavour function fails loudly and immediately rather
// than lurking - which is the right shape for authored data.
export function resolveFlavorText(location, state) {
  const raw = location?.flavorText;
  if (raw == null) return [];
  const entries = Array.isArray(raw) ? raw : [raw];

  const lines = [];
  for (const entry of entries) {
    const value = typeof entry === "function" ? entry(state, location) : entry;
    if (value == null) continue;
    if (value === "" && lines[lines.length - 1] === "") continue;
    lines.push(value);
  }
  // A dropped trailing line can leave the array ending on a spacer.
  while (lines[lines.length - 1] === "") lines.pop();
  return lines;
}
