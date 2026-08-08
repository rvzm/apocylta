import { RACES, CLASSES } from "../../player_backbone.js";
import { LOCATIONS } from "../../data/locations.js";
import { saveGame, loadGame, deleteSave, listSaveSlots } from "../../state/persistence.js";
import { readAutosave, autosaveSummary } from "../../state/autosave.js";
import { formatCommandRow, formatRelativeTime } from "../format.js";
import { switchScreen } from "../router.js";
import { logger } from "../../logger.js";

function formatSlotLine(label, summary) {
  if (summary.empty) return `${label}: Empty`;
  const raceName = RACES[summary.race]?.name ?? summary.race;
  const className = CLASSES[summary.class]?.name ?? summary.class;
  const locationName = LOCATIONS[summary.currentLocationId]?.name ?? summary.currentLocationId;
  return `${label}: ${summary.name} - Lv.${summary.level} ${raceName}/${className} @ ${locationName} (saved ${formatRelativeTime(summary.savedAt)})`;
}

// Numbered slots always; the autosave is only offered as a load target (it
// isn't a normal save destination - it's only ever written by the autosave
// timer in main.js).
function buildRows(mode) {
  const slots = listSaveSlots();
  const lines = slots.map((s) => formatSlotLine(`Slot ${s.slotId}`, s));
  const ids = slots.map((s) => s.slotId);

  if (mode === "load") {
    lines.push(formatSlotLine("Autosave", autosaveSummary()));
    ids.push("autosave");
  }

  return { lines, ids };
}

function selectedSlot(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

// The two-press confirm pattern shared by Delete and Save-overwrite: the
// first press arms it, the second press (with the same slot still selected)
// confirms it. Selecting a different slot before the second press just arms
// a fresh confirm on the new target instead - no separate "clear on
// navigate" listener needed, since the slot id simply won't match.
function isConfirmed(ui, action, slotId) {
  const pending = ui.inventoryList._pendingConfirm;
  return !!pending && pending.action === action && pending.slotId === slotId;
}

function arm(ui, action, slotId) {
  ui.inventoryList._pendingConfirm = { action, slotId };
}

export const saveSlotsScreen = {
  keymap: {
    B: (state, ui) => switchScreen(state, ui, state.saveSlotsContext.returnScreen),

    C: (state, ui) => {
      const slotId = selectedSlot(ui);
      const { mode } = state.saveSlotsContext;

      if (mode === "load") {
        const loaded = slotId === "autosave" ? readAutosave() : loadGame(slotId);
        if (!loaded) {
          state.lastMessage = "That slot is empty.";
          return;
        }
        Object.assign(state, loaded);
        // loadGame()/readAutosave() build their return value from
        // createInitialState(), which defaults currentScreen to "title" -
        // Object.assign() just clobbered it with that default. Restore it
        // before switchScreen() runs, since it looks up the OUTGOING screen's
        // onExit via state.currentScreen - left as "title" (no onExit),
        // saveSlotsScreen.onExit never fires and ui.inventoryList is never
        // hidden, leaving stale slot rows on screen after the load.
        state.currentScreen = "saveSlots";
        // Binds the session to this slot so permadeath (ui/screens/defeat.js)
        // knows what to delete. The autosave isn't a numbered slot, so loading
        // it leaves the session unbound.
        state.saveSlotId = slotId === "autosave" ? null : slotId;
        logger.info("saveSlots", `Loaded ${slotId === "autosave" ? "the autosave" : `slot ${slotId}`}.`);
        switchScreen(state, ui, "location");
        return;
      }

      const occupied = listSaveSlots().find((s) => s.slotId === slotId)?.empty === false;
      if (occupied && !isConfirmed(ui, "save", slotId)) {
        arm(ui, "save", slotId);
        state.lastMessage = `Press C again to overwrite Slot ${slotId}.`;
        return;
      }
      ui.inventoryList._pendingConfirm = null;
      try {
        saveGame(state, slotId);
        state.saveSlotId = slotId;
        state.lastMessage = `Saved to Slot ${slotId}.`;
        logger.info("saveSlots", `Saved to slot ${slotId}.`);
      } catch (err) {
        state.lastMessage = `Save failed: ${err.message}`;
        logger.error("saveSlots", `Save failed: ${err.message}`);
      }
    },

    // Only wired in load mode, per spec ("the Load screen should also have
    // a Delete option").
    D: (state, ui) => {
      if (state.saveSlotsContext.mode !== "load") return;
      const slotId = selectedSlot(ui);
      if (slotId === "autosave") {
        state.lastMessage = "The autosave can't be deleted manually.";
        return;
      }
      const slot = listSaveSlots().find((s) => s.slotId === slotId);
      if (!slot || slot.empty) {
        state.lastMessage = "Nothing to delete.";
        return;
      }
      if (!isConfirmed(ui, "delete", slotId)) {
        arm(ui, "delete", slotId);
        state.lastMessage = `Press D again to permanently delete Slot ${slotId}.`;
        return;
      }
      ui.inventoryList._pendingConfirm = null;
      deleteSave(slotId);
      state.lastMessage = `Deleted Slot ${slotId}.`;
      logger.info("saveSlots", `Deleted slot ${slotId}.`);
    },
  },

  onEnter(state, ui) {
    state.lastMessage = null;
    ui.inventoryList._pendingConfirm = null;
    ui.mainContent.hide();
    ui.inventoryList.show();
    ui.inventoryList.focus();
    ui.inventoryList.select(0);
  },

  onExit(state, ui) {
    ui.inventoryList.hide();
    ui.mainContent.show();
  },

  render(state, ui) {
    const { mode } = state.saveSlotsContext;
    const { lines, ids } = buildRows(mode);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = ids;
    // No .select() call here (unlike most pickers) - the two-press confirm
    // flow needs the cursor to stay put across the re-render that happens
    // after the first press, and setItems() doesn't reset it on its own.

    const promptDefault = mode === "load" ? "Which save would you like to load?" : "Which slot would you like to save to?";
    ui.promptRow.setContent(state.lastMessage || promptDefault);

    const commands = [
      { label: "Back", hotkey: "B" },
      { label: "Choose", hotkey: "C" },
    ];
    if (mode === "load") commands.push({ label: "Delete", hotkey: "D" });
    ui.commandList.setContent(formatCommandRow(commands, { columns: 2 }));
  },
};
