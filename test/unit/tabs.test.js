import { test } from "node:test";
import assert from "node:assert/strict";
import { cycleTab, formatTabStrip } from "../../ui/tabs.js";

function fakeUi() {
  return { inventoryList: {} };
}

test("cycleTab() advances and wraps forward", () => {
  const ui = fakeUi();
  cycleTab(ui, "_tabIndex", 1, 3); // 0 -> 1
  assert.equal(ui.inventoryList._tabIndex, 1);
  cycleTab(ui, "_tabIndex", 1, 3); // 1 -> 2
  assert.equal(ui.inventoryList._tabIndex, 2);
  cycleTab(ui, "_tabIndex", 1, 3); // 2 -> wraps to 0
  assert.equal(ui.inventoryList._tabIndex, 0);
});

test("cycleTab() wraps backward past zero", () => {
  const ui = fakeUi();
  cycleTab(ui, "_tabIndex", -1, 3); // 0 -> wraps to 2
  assert.equal(ui.inventoryList._tabIndex, 2);
});

test("cycleTab() defaults an unset index to 0 before applying direction", () => {
  const ui = fakeUi();
  cycleTab(ui, "_tabIndex", 1, 4);
  assert.equal(ui.inventoryList._tabIndex, 1);
});

test("cycleTab() is a no-op with a single tab", () => {
  const ui = fakeUi();
  cycleTab(ui, "_tabIndex", 1, 1);
  assert.equal(ui.inventoryList._tabIndex, 0);
  cycleTab(ui, "_tabIndex", -1, 1);
  assert.equal(ui.inventoryList._tabIndex, 0);
});

test("formatTabStrip() brackets only the active tab", () => {
  const output = formatTabStrip(["All", "weapon", "food"], 1);
  assert.equal(output, " All |[weapon]| food ");
});
