import { ALL_ITEMS, STATIONS, ITEM_TYPES, METALURGY } from "../../item_backbone.js";
import {
  normalizeResult,
  primaryResultId,
  recipeTypeOf,
  recipeGroupOf,
  groupOrderFor,
  RECIPE_TAB_LABELS,
  getCraftXp,
  hasIngredients,
  spendIngredients,
} from "../../data/stations.js";
import { addItem, grantSkillXp } from "../../state/gameState.js";
import { recordItemCrafted } from "../../data/quests.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";
import { cycleTab, formatTabStrip } from "../tabs.js";

function itemName(id) {
  return ALL_ITEMS[id]?.name ?? id;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Enforces "only show recipes the player can currently make" - the single
// point both tab presence and row listing filter through. Kept as [key,
// recipe] pairs (like Object.entries) since the recipe key is what the
// Craft handler needs back, not the recipe object itself.
function visibleRecipes(state) {
  return Object.entries(state.stationContext.recipes).filter(([, r]) => hasIngredients(state, r.ingredients));
}

// "All" first, then whatever result types are actually craftable right now,
// in ITEM_TYPES's declared order - same dynamic-tab shape as backpack.js.
function buildTabs(state) {
  const present = new Set(visibleRecipes(state).map(([, r]) => recipeTypeOf(r)).filter(Boolean));
  return ["All", ...ITEM_TYPES.filter((type) => present.has(type))];
}

function tabLabel(type) {
  return type === "All" ? "All" : RECIPE_TAB_LABELS[type] ?? capitalize(type);
}

// Orders group keys by the declared catalog for the active tab (metal tier,
// weapon type, etc.) when one exists, else alphabetically - covers the
// mixed-type "All" tab and any recipe type with no declared order.
function orderedGroupKeys(keys, activeTab) {
  const declared = groupOrderFor(activeTab);
  if (!declared) return [...keys].sort();
  return [...keys].sort((a, b) => {
    const ia = declared.indexOf(a);
    const ib = declared.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

// Metal group keys (e.g. "tin", "bronze") resolve to their METALURGY
// display name; every other group key (weapon/tool category, food/potion
// subtype) has no such catalog, so just title-case the raw key.
function groupLabel(key) {
  return METALURGY[key]?.name ?? capitalize(key.replace(/_/g, " "));
}

function buildCraftRows(state, activeTab) {
  const filtered = visibleRecipes(state).filter(([, r]) => activeTab === "All" || recipeTypeOf(r) === activeTab);

  const groups = new Map();
  for (const [key, recipe] of filtered) {
    const groupKey = recipeGroupOf(recipe) ?? "";
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push([key, recipe]);
  }

  const lines = [];
  const recipeIds = [];

  for (const groupKey of orderedGroupKeys([...groups.keys()], activeTab)) {
    const recipesInGroup = groups
      .get(groupKey)
      .sort((a, b) => itemName(primaryResultId(a[1])).localeCompare(itemName(primaryResultId(b[1]))));

    if (groupKey) {
      lines.push(`${groupLabel(groupKey)}:`);
      recipeIds.push(null);
    }

    for (const [key, recipe] of recipesInGroup) {
      const resultMap = normalizeResult(recipe.result);
      const resultText = Object.entries(resultMap)
        .map(([id, qty]) => (qty > 1 ? `${qty}x ${itemName(id)}` : itemName(id)))
        .join(", ");
      const ingredientText = Object.entries(recipe.ingredients)
        .map(([id, qty]) => `${qty}x ${itemName(id)}`)
        .join(", ");
      lines.push(`  - ${resultText} (needs: ${ingredientText})`);
      recipeIds.push(key);
    }
  }

  if (!lines.length) {
    lines.push("Nothing craftable here yet.");
    recipeIds.push(null);
  }

  return { lines, recipeIds };
}

function selectedRecipeKey(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

function switchTab(state, ui, direction) {
  cycleTab(ui, "_tabIndex", direction, buildTabs(state).length);
  ui.inventoryList._resetSelection = true;
}

export const stationCraftScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "stationSelect"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    C: (state, ui) => {
      const key = selectedRecipeKey(ui);
      if (!key) {
        state.lastMessage = "Select a recipe first.";
        return;
      }
      const { recipes, skill } = state.stationContext;
      const recipe = recipes[key];
      if (!hasIngredients(state, recipe.ingredients)) {
        state.lastMessage = "You don't have the ingredients for that.";
        return;
      }

      spendIngredients(state, recipe.ingredients);

      const resultMap = normalizeResult(recipe.result);
      let xpGained = 0;
      const producedNames = [];
      for (const [id, qty] of Object.entries(resultMap)) {
        addItem(state, id, qty);
        recordItemCrafted(state, id, qty);
        xpGained += getCraftXp(id, qty);
        producedNames.push(qty > 1 ? `${qty}x ${itemName(id)}` : itemName(id));
      }
      grantSkillXp(state, skill, xpGained);
      state.lastMessage = `Crafted ${producedNames.join(", ")}.`;
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.inventoryList._tabIndex = 0;
    ui.inventoryList._resetSelection = true;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.inventoryList.setLabel("");
    ui.mainContent.show();
  },

  render(state, ui) {
    const tabs = buildTabs(state);
    const tabIndex = Math.min(ui.inventoryList._tabIndex ?? 0, tabs.length - 1);
    ui.inventoryList._tabIndex = tabIndex;
    const activeTab = tabs[tabIndex];

    const { lines, recipeIds } = buildCraftRows(state, activeTab);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = recipeIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }
    ui.inventoryList.setLabel(` ${formatTabStrip(tabs.map(tabLabel), tabIndex)} `);

    const stationName = STATIONS[state.stationContext.stationId]?.name ?? "Crafting";
    ui.promptRow.setContent(state.lastMessage || `${stationName} - what would you like to craft?`);
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Switch tab", hotkey: "<>" },
          { label: "Craft", hotkey: "C" },
        ],
        { columns: 2 }
      )
    );
  },
};
