// ui/listScreen.js - the screen-agnostic half of driving ui.inventoryList.
//
// Split out of ui/screens/admin/shared.js once the Settings screen needed the
// same cursor-over-a-field-list behaviour; admin/shared.js re-exports these so
// the eight admin editors are unchanged.
//
// Screens draw into ui.inventoryList rather than ui.mainContent whenever they
// need a movable cursor: ui/router.js has no UP/DOWN tokens (only
// ESCAPE/LEFT/RIGHT), so arrow keys reach nothing but the focused blessed
// widget. The list is what makes a cursor possible at all.

export function enterList(state, ui) {
  state.lastMessage = null;
  ui.mainContent.hide();
  ui.inventoryList.show();
  ui.inventoryList.focus();
}

export function exitList(state, ui) {
  ui.inventoryList.hide();
  ui.inventoryList.setLabel(""); // clear any tab strip so other screens don't inherit it
  ui.mainContent.show();
}

export function selectedId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

// Pushes rows and their ids in lockstep - the same shape achievements.js and
// the spellbook use. Header/blank rows pass no id and are non-selectable.
export function rowBuilder() {
  const lines = [];
  const ids = [];
  const push = (line, id = null) => {
    lines.push(line);
    ids.push(id);
  };
  return { lines, ids, push };
}

// Screens that mutate on keypress re-render immediately afterwards.
// Deliberately does NOT call select() - that would snap the cursor back to row
// 0 after every press. Same reasoning saveSlots.js documents for its two-press
// confirm.
export function paint(ui, { lines, ids }, label = "") {
  ui.inventoryList.setItems(lines.length ? lines : ["(nothing here)"]);
  ui.inventoryList._itemIds = lines.length ? ids : [null];
  ui.inventoryList.setLabel(label);
}
