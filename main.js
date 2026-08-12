import { buildLayout, renderChrome } from "./ui/layout.js";
import { createInitialState } from "./state/gameState.js";
import { startGameLoop } from "./state/gameLoop.js";
import { registerScreen, switchScreen, handleKey, getScreen } from "./ui/router.js";
import { locationScreen } from "./ui/screens/location.js";
import { travelScreen } from "./ui/screens/travel.js";
import { travelingScreen } from "./ui/screens/traveling.js";
import { actionScreen } from "./ui/screens/action.js";
import { combatScreen } from "./ui/screens/combat.js";
import { combatSelectScreen } from "./ui/screens/combatSelect.js";
import { defeatScreen } from "./ui/screens/defeat.js";
import { backpackScreen } from "./ui/screens/backpack.js";
import { spellbookScreen } from "./ui/screens/spellbook.js";
import { menuScreen } from "./ui/screens/menu.js";
import { shopBuyScreen } from "./ui/screens/shopBuy.js";
import { shopSellScreen } from "./ui/screens/shopSell.js";
import { stationCraftScreen } from "./ui/screens/stationCraft.js";
import { stationSelectScreen } from "./ui/screens/stationSelect.js";
import { shopHousingScreen } from "./ui/screens/shopHousing.js";
import { blackMarketScreen } from "./ui/screens/blackMarket.js";
import { mineSelectScreen } from "./ui/screens/mineSelect.js";
import { fishSelectScreen } from "./ui/screens/fishSelect.js";
import { toolbeltScreen } from "./ui/screens/toolbelt.js";
import { toolSwapScreen } from "./ui/screens/toolSwap.js";
import { pouchScreen } from "./ui/screens/pouch.js";
import { slingshotSwapScreen } from "./ui/screens/slingshotSwap.js";
import { saveSlotsScreen } from "./ui/screens/saveSlots.js";
import { questBoardScreen } from "./ui/screens/questBoard.js";
import { journalScreen } from "./ui/screens/journal.js";
import { achievementsScreen } from "./ui/screens/achievements.js";
import { titleScreen } from "./ui/screens/title.js";
import { charNameScreen } from "./ui/screens/charName.js";
import { charDifficultyScreen } from "./ui/screens/charDifficulty.js";
import { charStarterPackScreen } from "./ui/screens/charStarterPack.js";
import { charRaceScreen } from "./ui/screens/charRace.js";
import { charClassScreen } from "./ui/screens/charClass.js";
import { charSkillsScreen } from "./ui/screens/charSkills.js";
import { adminHubScreen } from "./ui/screens/admin/adminHub.js";
import { adminStatsScreen } from "./ui/screens/admin/adminStats.js";
import { adminSkillsScreen } from "./ui/screens/admin/adminSkills.js";
import { adminInventoryScreen } from "./ui/screens/admin/adminInventory.js";
import { adminEquipmentScreen } from "./ui/screens/admin/adminEquipment.js";
import { adminToolbeltScreen } from "./ui/screens/admin/adminToolbelt.js";
import { adminQuestsScreen } from "./ui/screens/admin/adminQuests.js";
import { adminAchievementsScreen } from "./ui/screens/admin/adminAchievements.js";
import { startPlayercardServer } from "./server_backbone.js";
import { logger } from "./logger.js";
import { game_config } from "./config.js";
import { writeAutosave } from "./state/autosave.js";
import { loadSettings, stampRun, stampAutosave } from "./state/settings.js";
import { settingsScreen } from "./ui/screens/settings.js";

// Reassigned once buildLayout() runs below - declared as `let` (not `const`)
// so the crash handlers just below can safely check it regardless of how
// early a crash happens, without a TDZ error.
let ui = null;

process.on("uncaughtException", (err) => {
  logger.fatal("main", `Uncaught exception: ${err.stack ?? err.message}`);
  if (ui) ui.screen.destroy();
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
  logger.fatal("main", `Unhandled rejection: ${message}`);
  if (ui) ui.screen.destroy();
  process.exit(1);
});

logger.info("main", "apocylta starting");

registerScreen("location", locationScreen);
registerScreen("travel", travelScreen);
registerScreen("traveling", travelingScreen);
registerScreen("action", actionScreen);
registerScreen("combat", combatScreen);
registerScreen("combatSelect", combatSelectScreen);
registerScreen("defeat", defeatScreen);
registerScreen("backpack", backpackScreen);
registerScreen("spellbook", spellbookScreen);
registerScreen("menu", menuScreen);
registerScreen("shopBuy", shopBuyScreen);
registerScreen("shopSell", shopSellScreen);
registerScreen("stationCraft", stationCraftScreen);
registerScreen("stationSelect", stationSelectScreen);
registerScreen("shopHousing", shopHousingScreen);
registerScreen("blackMarket", blackMarketScreen);
registerScreen("mineSelect", mineSelectScreen);
registerScreen("fishSelect", fishSelectScreen);
registerScreen("toolbelt", toolbeltScreen);
registerScreen("toolSwap", toolSwapScreen);
registerScreen("pouch", pouchScreen);
registerScreen("slingshotSwap", slingshotSwapScreen);
registerScreen("saveSlots", saveSlotsScreen);
registerScreen("questBoard", questBoardScreen);
registerScreen("journal", journalScreen);
registerScreen("achievements", achievementsScreen);
registerScreen("title", titleScreen);
registerScreen("charName", charNameScreen);
registerScreen("charDifficulty", charDifficultyScreen);
registerScreen("charStarterPack", charStarterPackScreen);
registerScreen("charRace", charRaceScreen);
registerScreen("charClass", charClassScreen);
registerScreen("charSkills", charSkillsScreen);
registerScreen("settings", settingsScreen);
// Registered unconditionally; reachability is gated by game_config.allow_admin
// at the Menu and re-checked in each screen's onEnter (ui/screens/admin/shared.js).
registerScreen("adminHub", adminHubScreen);
registerScreen("adminStats", adminStatsScreen);
registerScreen("adminSkills", adminSkillsScreen);
registerScreen("adminInventory", adminInventoryScreen);
registerScreen("adminEquipment", adminEquipmentScreen);
registerScreen("adminToolbelt", adminToolbeltScreen);
registerScreen("adminQuests", adminQuestsScreen);
registerScreen("adminAchievements", adminAchievementsScreen);

const state = createInitialState();

// Before buildLayout() hands stdout to blessed, so a first-boot migration or
// bootstrap log line still prints normally - the same reason
// startPlayercardServer is awaited below. stampRun() returns the row as it was
// *before* stamping, so the title screen can tell a first launch from a
// return visit even though last_run has already moved.
loadSettings();
state.previousRun = stampRun().last_run || null;

// Awaited so the startup log line (success or failure) prints before
// buildLayout() hands stdout over to blessed's alt-screen buffer.
await startPlayercardServer(state);

ui = buildLayout();

ui.screen.key(["q", "Q", "C-c"], () => {
  ui.screen.destroy();
  process.exit(0);
});

ui.screen.on("keypress", (ch, key) => handleKey(state, ui, ch, key));

startGameLoop(state, (state) => {
  renderChrome(state, ui);
  if (state.currentScreen === "action") {
    // An ambush (state/gameLoop.js) ends the gather and sets currentCombat,
    // but the loop has no ui handle to switch screens with - that lands here.
    if (state.currentCombat) {
      switchScreen(state, ui, "combat");
    } else {
      getScreen("action").render(state, ui);
    }
  } else if (state.currentScreen === "traveling") {
    if (state.currentTravel) {
      getScreen("traveling").render(state, ui);
    } else {
      switchScreen(state, ui, "location");
    }
  } else if (state.currentScreen === "location") {
    // Flavour lines are computed per render (data/flavor.js), so the location
    // body has to keep up with the clock - otherwise a line about dusk sits
    // frozen until the next keypress.
    getScreen("location").render(state, ui);
  }
  ui.screen.render();
});

// Separate from the game loop's own tick - this is a persistence concern,
// not a clock/action one. Writes to its own JSON file (state/autosave.js),
// never the numbered SQLite save slots.
setInterval(() => {
  try {
    writeAutosave(state);
    stampAutosave();
    logger.info("main", "Autosaved.");
  } catch (err) {
    logger.error("main", `Autosave failed: ${err.message}`);
  }
}, (game_config.autosaveInterval ?? 600) * 1000);

switchScreen(state, ui, "title");
