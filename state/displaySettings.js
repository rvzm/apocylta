// state/displaySettings.js - the in-memory half of the display settings.
//
// Deliberately imports NOTHING. ui/format.js reads from here on every
// colorTag()/formatCommandRow() call, and format.js is imported by 37 screens
// plus renderChrome; pointing it at state/settings.js instead would drag
// db_backbone.js's import-time SQLite open into test/unit/format.test.js,
// layout.test.js and spellbookScreen.test.js, all of which import it
// statically today.
//
// state/settings.js owns the database row and pushes it in here at boot and on
// every write. Anything that only wants to *read* a display setting reads it
// from here, so the hot render path never touches the DB.

// The shipped defaults, and what every unit test that doesn't boot the DB
// sees. actionKey "B" is today's formatCommandRow behaviour exactly, which is
// what keeps the existing format/integration assertions passing.
const display = {
  colorize: true,
  actionKey: "B",
};

// Read per call, never captured into a module-level const by callers - a
// setting toggled on the Settings screen has to take effect on the next
// render. Same live-lookup rule as ui/screens/admin/shared.js's adminEnabled().
export function getDisplay() {
  return display;
}

export function setDisplay(patch) {
  Object.assign(display, patch);
}
