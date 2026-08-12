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

// --- tabs and sections ------------------------------------------------------
//
// Three screens now show the same thing: a strip of tabs across the top, and
// rows gathered under headings inside the active one (the Pouch, and both sides
// of a shop counter). The two helpers below are the part that doesn't care what
// a row says - callers supply the text.

// "All" first, then whatever values of `field` are actually present. `order` is
// a declared vocabulary (ITEM_TYPES, ARMOR_SLOTS...) so tabs read in a sensible
// sequence rather than alphabetically - armour head-to-toe, not "boots, cloak,
// hands". Anything not in `order`, or no `order` at all, falls back to
// alphabetical. Only present values get a tab, so a shop never shows an empty
// one.
export function buildTabList(entries, { field, order = null } = {}) {
  const present = [...new Set(entries.map(([, item]) => item?.[field]).filter(Boolean))];
  const ranked = order
    ? present.sort((a, b) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
    : present.sort((a, b) => a.localeCompare(b));
  return ["All", ...ranked];
}

// Groups entries under headings and pushes them through `push` (rowBuilder's).
// Headings and the blank line between groups carry no id, so they stay
// unselectable - which is what lets a screen's "select an item first" cover
// landing on one.
//
// `sectionOf` returning null for everything means no headings at all: the rows
// come out as one sorted list. That's the case where the tabs are ALREADY the
// section axis, and a heading per tab would just repeat the strip.
export function pushSections(push, entries, { sectionOf, label, row, sort = null }) {
  const byName = sort ?? ((a, b) => String(a).localeCompare(String(b)));
  const sorted = [...entries].sort(([, a], [, b]) => byName(a?.name ?? "", b?.name ?? ""));

  const sections = new Map();
  for (const entry of sorted) {
    const key = sectionOf(entry) ?? "";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key).push(entry);
  }

  [...sections.keys()]
    .sort((a, b) => a.localeCompare(b))
    .forEach((key, index) => {
      const group = sections.get(key);
      if (key) {
        if (index > 0) push("");
        push(label(key, group));
      }
      for (const entry of group) push(...[].concat(row(entry, key)));
    });
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
