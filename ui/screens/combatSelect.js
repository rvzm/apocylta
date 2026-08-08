import { SPELLS } from "../../magic_backbone.js";
import { ALL_ITEMS } from "../../item_backbone.js";
import { isSpellKnown, canCastSpell } from "../../data/magic.js";
import { resolveRound } from "../../data/combat.js";
import { formatCommandRow } from "../format.js";
import { switchScreen } from "../router.js";

// Spell types that do something to a fight. heal/buff land on you, the rest
// need the enemy - data/magic.js's castSpell() sorts out which is which.
const COMBAT_SPELL_TYPES = new Set(["attack", "heal", "buff", "debuff", "poison"]);

// One picker serving both the Cast and Potion actions, parameterised via
// state.combatSelectContext.mode - same shared-screen-with-context shape
// saveSlots.js uses for its save/load duality.
function buildRows(state) {
  const mode = state.combatSelectContext?.mode ?? "spell";
  const lines = [];
  const ids = [];

  if (mode === "spell") {
    const known = Object.entries(SPELLS)
      .filter(([id, spell]) => isSpellKnown(state, id) && COMBAT_SPELL_TYPES.has(spell.type))
      .sort((a, b) => a[1].name.localeCompare(b[1].name));

    for (const [id, spell] of known) {
      const affordable = canCastSpell(state, id);
      const effect =
        spell.damage != null ? `${spell.damage} dmg` : spell.heal != null ? `heals ${spell.heal}` : spell.type;
      lines.push(`  ${spell.name} (${effect}, ${spell.mp} mp)${affordable ? "" : " - not enough mp"}`);
      ids.push(affordable ? id : null);
    }
    if (!lines.length) {
      lines.push("You don't know any spells that would help here.");
      ids.push(null);
    }
    return { lines, ids, mode };
  }

  const potions = Object.entries(state.inventory)
    .filter(([itemId, qty]) => qty > 0 && ALL_ITEMS[itemId]?.type === "potion")
    .sort((a, b) => (ALL_ITEMS[a[0]].name ?? "").localeCompare(ALL_ITEMS[b[0]].name ?? ""));

  for (const [itemId, qty] of potions) {
    const item = ALL_ITEMS[itemId];
    const effect =
      item.heal != null
        ? `heals ${item.heal}`
        : item.mana_restore != null
          ? `restores ${item.mana_restore} mp`
          : item.poison_damage != null || item.poison?.damage != null
            ? `${item.poison_damage ?? item.poison.damage} poison dmg`
            : item.buff?.stat
              ? `+${item.buff.stat}`
              : item.subtype;
    lines.push(`  ${item.name} x${qty} (${effect})`);
    ids.push(itemId);
  }
  if (!lines.length) {
    lines.push("No potions in your belt.");
    ids.push(null);
  }
  return { lines, ids, mode };
}

function selectedId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

function back(state, ui) {
  switchScreen(state, ui, "combat");
}

export const combatSelectScreen = {
  keymap: {
    B: back,
    ESCAPE: back,

    C: (state, ui) => {
      const id = selectedId(ui);
      if (!id) {
        state.lastMessage = "Pick something you can actually use.";
        return;
      }
      const mode = state.combatSelectContext?.mode ?? "spell";
      resolveRound(state, mode === "spell" ? { type: "spell", spellId: id } : { type: "potion", itemId: id });

      // Spending your turn can lose you the fight, so route the same way the
      // combat screen's own handlers do rather than assuming we go back.
      switchScreen(state, ui, state.currentCombat?.outcome === "defeat" ? "defeat" : "combat");
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
    ui.inventoryList._resetSelection = true;
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    if (!state.currentCombat) {
      switchScreen(state, ui, "location");
      return;
    }

    const { lines, ids, mode } = buildRows(state);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = ids;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }

    ui.promptRow.setContent(
      state.lastMessage || (mode === "spell" ? `Cast what? - mp: ${state.mp}/${state.mpMax}` : "Drink what?")
    );
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: mode === "spell" ? "Cast" : "Use", hotkey: "C" },
        ],
        { columns: 2 }
      )
    );
  },
};
