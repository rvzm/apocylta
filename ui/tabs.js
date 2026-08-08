// ui/tabs.js - shared Left/Right tab-cycling mechanics for screens that
// filter a ui.inventoryList by category (backpack by item type, toolSwap by
// tool category). Each screen still builds its own tab list from its own
// source data; this only handles the "which tab, wrap around" bookkeeping.

// Ephemeral per-screen-visit UI state, stored directly on the widget - same
// convention ui.inventoryList._itemIds/_selectedIds already use elsewhere.
export function cycleTab(ui, key, direction, tabCount) {
  const current = ui.inventoryList[key] ?? 0;
  ui.inventoryList[key] = (current + direction + tabCount) % tabCount;
}

export function formatTabStrip(labels, activeIndex) {
  return labels.map((label, i) => (i === activeIndex ? `[${label}]` : ` ${label} `)).join("|");
}
