// test/helpers/bootstrapCharacter.js - drives the full character-creation
// wizard (title -> charName -> charDifficulty -> charStarterPack -> charRace
// -> charClass -> charSkills) down to the location screen, via a tmuxSession.
// Confirms the default (first/top) selection at every list screen and picks
// however many skills the chosen difficulty requires (read off the rendered
// "Pick N skills..." prompt rather than hardcoded, since the required count
// is now difficulty-dependent - see player_backbone.js's profSkillsFor()) -
// reused by every integration test that needs a live character rather than
// duplicating this keystroke sequence.

// `starterPack` is a 0-based index into the non-ngp STARTER_PACKS listing
// (0 = deep_pockets, 1 = basic_tools, 2 = starter_kit); the default confirms
// the top entry, as every other wizard screen here does. Tests that need
// specific items in the backpack pick a pack rather than gathering for them.
export async function bootstrapCharacter(session, { name = "Tester", starterPack = 0 } = {}) {
  await session.waitFor("APOCYLTA");
  session.sendKeys("n"); // New Game
  await session.waitFor("What is your name?");
  session.sendKeys(name, "Enter");

  await session.waitFor("choose your difficulty");
  session.sendKeys("c"); // Confirm default (Normal)

  await session.waitFor("choose your starter pack");
  for (let i = 0; i < starterPack; i++) {
    session.sendKeys("Down");
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  session.sendKeys("c"); // Confirm the selected pack

  await session.waitFor("choose your race");
  session.sendKeys("c"); // Confirm default (first race)

  await session.waitFor("choose your class");
  session.sendKeys("c"); // Confirm default (first class)

  const pane = await session.waitFor(/Pick \d+ skills/);
  const requiredPicks = Number(pane.match(/Pick (\d+) skills/)[1]);
  for (let i = 0; i < requiredPicks; i++) {
    // charSkills refuses to confirm until exactly this many are toggled, and
    // blessed processes keys as it renders - firing the whole burst at once
    // lets the trailing "c" overtake the toggles when the machine is loaded
    // (several integration tests each run their own game process in parallel).
    session.sendKeys("t", "Down");
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  session.sendKeys("c"); // Confirm skill picks -> finalizeCharacter() -> location screen

  // Not "town square": the header renders [town square] throughout the wizard
  // too (createInitialState defaults currentLocationId there), so matching on
  // it would return while still sitting on charSkills. The location screen's
  // own prompt is the unambiguous signal that the wizard actually finished.
  await session.waitFor("What would you like to do?", 15000);
}
