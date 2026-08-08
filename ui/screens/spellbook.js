import { SPELLS, SPELL_TYPES } from "../../magic_backbone.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { isSpellKnown, isSpellUnlocked, canLearnSpell, learnSpell, castSpell } from "../../data/magic.js";
import { ingredientCount } from "../../data/stations.js";
import { colorTag, formatCommandRow } from "../format.js";
import { cycleTab, formatTabStrip } from "../tabs.js";
import { switchScreen } from "../router.js";

const TABS = ["Learned", "Unlearned"];

// Green reads as "you can act on this row", red as "you can't yet" - the same
// signal the [Learnable]/[Unlearnable] headers carry, repeated per row so it
// survives scrolling past the header. Note inventoryList's selected style is
// `inverse: true`, so the highlighted row shows its colour as a background
// rather than foreground; that's intended, not a bug to flatten.
const OK = "green";
const NO = "red";

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function itemName(id) {
  return ALL_ITEMS[id]?.name ?? id;
}

// "learn: Ley Crystals (2/3), Arcane Shard (1/5)" - owned over required, so a
// spell you can't afford shows how close you are instead of just what it costs.
function learnCostText(state, spell) {
  if (!spell.learn) return "no cost";
  const parts = Object.entries(spell.learn)
    .map(([id, qty]) => `${itemName(id)} (${ingredientCount(state, id)}/${qty})`)
    .join(", ");
  return `learn: ${parts}`;
}

function spellDetail(state, id, spell) {
  if (isSpellKnown(state, id)) return `known | cast: ${spell.mp} mp`;
  // The magic-level gate is a displayed reason, not a filter - a spell you
  // can't reach yet is still worth seeing as a goal.
  const levelReq = isSpellUnlocked(state, id) ? "" : `req: magic lv ${spell.level ?? 1} | `;
  return `${levelReq}${learnCostText(state, spell)} | cast: ${spell.mp} mp`;
}

// Groups [id, spell] entries by type in SPELL_TYPES's declared order, pushing
// a "Heal:" header before each non-empty type. `indent` is the header's own
// indentation; spell rows sit two spaces deeper.
function pushTypeGroups(entries, { push, indent, color }, state) {
  const byType = {};
  for (const [id, spell] of entries) (byType[spell.type] ??= []).push([id, spell]);

  for (const type of SPELL_TYPES.filter((t) => byType[t])) {
    push(`${indent}${capitalize(type)}:`);
    const sorted = byType[type].sort((a, b) => a[1].name.localeCompare(b[1].name));
    for (const [id, spell] of sorted) {
      push(`${indent}  ${colorTag(`- ${spell.name} (${spellDetail(state, id, spell)})`, color)}`, id);
    }
  }
}

// Exported for unit testing without blessed, following achievements.js's
// buildRows(). Returns parallel arrays: lines[i] is display text, spellIds[i]
// is the spell id or null for a header/placeholder row.
export function buildSpellRows(state, activeTab) {
  const lines = [];
  const spellIds = [];
  const push = (line, id = null) => {
    lines.push(line);
    spellIds.push(id);
  };

  const entries = Object.entries(SPELLS);

  if (activeTab === "Learned") {
    const known = entries.filter(([id]) => isSpellKnown(state, id));
    if (!known.length) push("No spells learned yet.");
    else pushTypeGroups(known, { push, indent: "  ", color: OK }, state);
    return { lines, spellIds };
  }

  const unknown = entries.filter(([id]) => !isSpellKnown(state, id));
  const learnable = unknown.filter(([id]) => canLearnSpell(state, id));
  const unlearnable = unknown.filter(([id]) => !canLearnSpell(state, id));

  if (!unknown.length) push("Nothing left to learn.");

  if (learnable.length) {
    push(`  ${colorTag(`[Learnable] (${learnable.length}):`, OK)}`);
    pushTypeGroups(learnable, { push, indent: "    ", color: OK }, state);
  }
  if (unlearnable.length) {
    if (learnable.length) push("");
    push(`  ${colorTag(`[Unlearnable] (${unlearnable.length}):`, NO)}`);
    pushTypeGroups(unlearnable, { push, indent: "    ", color: NO }, state);
  }

  return { lines, spellIds };
}

function tabLabels(state) {
  const entries = Object.entries(SPELLS);
  const known = entries.filter(([id]) => isSpellKnown(state, id)).length;
  return [`Learned (${known})`, `Unlearned (${entries.length - known})`];
}

function selectedSpellId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

function switchTab(state, ui, direction) {
  cycleTab(ui, "_tabIndex", direction, TABS.length);
  ui.inventoryList._resetSelection = true;
}

export const spellbookScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, "backpack"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    L: (state, ui) => {
      const spellId = selectedSpellId(ui);
      if (!spellId) {
        state.lastMessage = "Select a spell first.";
        return;
      }
      if (isSpellKnown(state, spellId)) {
        state.lastMessage = `You already know ${SPELLS[spellId].name}.`;
        return;
      }
      // learnSpell() collapses every refusal into null, so the level gate has
      // to be checked here or a level-locked spell would blame the reagents.
      if (!isSpellUnlocked(state, spellId)) {
        state.lastMessage = `${SPELLS[spellId].name} requires magic level ${SPELLS[spellId].level ?? 1}.`;
        return;
      }
      const result = learnSpell(state, spellId);
      state.lastMessage = result ?? "You don't have the ingredients for that.";
    },
    C: (state, ui) => {
      const spellId = selectedSpellId(ui);
      if (!spellId) {
        state.lastMessage = "Select a spell first.";
        return;
      }
      if (!isSpellKnown(state, spellId)) {
        state.lastMessage = "You haven't learned that spell yet.";
        return;
      }
      const result = castSpell(state, spellId);
      if (!result) {
        state.lastMessage = "Not enough mp.";
        return;
      }
      state.lastMessage = result;
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.inventoryList._tabIndex = 0;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
    ui.inventoryList._resetSelection = true;
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.inventoryList.setLabel(""); // clear the tab strip so other screens don't inherit it
    ui.mainContent.show();
  },

  render(state, ui) {
    const tabIndex = ui.inventoryList._tabIndex ?? 0;
    const { lines, spellIds } = buildSpellRows(state, TABS[tabIndex]);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = spellIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }
    ui.inventoryList.setLabel(` ${formatTabStrip(tabLabels(state), tabIndex)} `);

    ui.promptRow.setContent(state.lastMessage || `Spellbook - mp: ${state.mp}/${state.mpMax}`);
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Switch tab", hotkey: "<>" },
          { label: "Learn", hotkey: "L" },
          { label: "Cast", hotkey: "C" },
        ],
        { columns: 2 }
      )
    );
  },
};
