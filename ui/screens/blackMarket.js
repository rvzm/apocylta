import { ALL_ITEMS, blackMarketSections, blackMarketGrants } from "../../item_backbone.js";
import { getBuyPrice, getBarterXp, canAfford, chargeGold } from "../../data/shops.js";
import { indoorTimeLine, packLine, openLine } from "../../data/flavor.js";
import { addItem, grantSkillXp } from "../../state/gameState.js";
import { colorTag, formatCommandRow } from "../format.js";
import { cycleTab, formatTabStrip } from "../tabs.js";
import { switchScreen } from "../router.js";
import { logger } from "../../logger.js";

// Green reads as "you can buy this", red as "you can't" - the same signal
// ui/screens/spellbook.js uses for learnable/unlearnable spells. The bold flag
// carries it under `colorize: 0`: ui/format.js's colorTag drops colour there but
// keeps {bold}, so an affordable row stays distinguishable on a mono terminal.
const OK = "green";
const NO = "red";

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// A bundle's price is authored on the black-market entry; a plain item's comes
// from the catalog the usual way. Entries that name a real item carry no `cost`
// of their own in only one direction, so prefer the authored one when present.
function priceOf(id, entry) {
  return entry.cost ?? (ALL_ITEMS[id] ? getBuyPrice(ALL_ITEMS[id]) : 0);
}

// "Void Crystal - 50000gp", plus what a bundle actually contains, since a "Box
// of Coal" is otherwise the only row whose name doesn't say what you get.
function rowText(id, entry) {
  const price = priceOf(id, entry);
  const name = entry.name ?? ALL_ITEMS[id]?.name ?? id;
  if (entry.outputs) {
    const contents = Object.entries(entry.outputs)
      .map(([outId, qty]) => `${qty}x ${ALL_ITEMS[outId]?.name ?? outId}`)
      .join(", ");
    return `- ${name} (${contents}) - ${price}gp`;
  }
  return `- ${name} - ${price}gp`;
}

// Which sub-heading a row files under. Enhancements group by the skill they
// boost; illicit goods by the resolved item's own subtype (crystal/orb/book for
// the focuses, sword/dagger/armor slot for the artifacts). Bundles resolve to
// nothing - they aren't items - so they fall back to the section itself.
function groupOf(id, entry, sectionKey) {
  if (entry.outputs) return sectionKey;
  return ALL_ITEMS[id]?.subtype ?? ALL_ITEMS[id]?.type ?? sectionKey;
}

export function tabsFor(state) {
  return blackMarketSections(state.shopContext?.blackMarket).map((section) => section.label);
}

// Exported so the row building can be unit tested without blessed - the same
// thing spellbook.js's buildSpellRows and achievements.js's buildRows do.
// Returns parallel arrays: lines[i] is display text, itemIds[i] is the entry key
// or null for a group header / placeholder row.
export function buildBlackMarketRows(state, tabIndex) {
  const sections = blackMarketSections(state.shopContext?.blackMarket);
  const section = sections[tabIndex] ?? sections[0];

  const lines = [];
  const itemIds = [];
  const push = (line, id = null) => {
    lines.push(line);
    itemIds.push(id);
  };

  if (!section || !section.entries.length) {
    push("The stall is bare tonight.");
    return { lines, itemIds };
  }

  const byGroup = {};
  for (const [id, entry] of section.entries) {
    (byGroup[groupOf(id, entry, section.key)] ??= []).push([id, entry]);
  }
  const groups = Object.keys(byGroup).sort();

  // Headers only where they earn their row. One group means the tab label
  // already said it (the smithing bundles), and all-singleton groups means the
  // grouping collapses nothing - every enhancement tier has exactly one entry
  // per skill, so 14 rows would become 28 in a pane that holds ~18.
  const grouped = groups.length > 1 && groups.some((group) => byGroup[group].length > 1);

  const byPriceThenName = (a, b) =>
    priceOf(a[0], a[1]) - priceOf(b[0], b[1]) ||
    (a[1].name ?? a[0]).localeCompare(b[1].name ?? b[0]);

  for (const group of groups) {
    if (grouped) push(`${capitalize(group)}:`);
    for (const [id, entry] of byGroup[group].sort(byPriceThenName)) {
      // No barter gate here, deliberately: every entry is mythic/unique/godlike,
      // so isPurchasable() would empty the shop until barter 65 and hide the
      // rings and bangles until 100. The hand-set price is the gate.
      const affordable = canAfford(state, priceOf(id, entry));
      push(`  ${colorTag(rowText(id, entry), affordable ? OK : NO, affordable)}`, id);
    }
  }

  return { lines, itemIds };
}

function selectedItemId(ui) {
  return ui.inventoryList._itemIds?.[ui.inventoryList.selected] ?? null;
}

function switchTab(state, ui, direction) {
  const count = tabsFor(state).length;
  if (!count) return;
  cycleTab(ui, "_tabIndex", direction, count);
  ui.inventoryList._resetSelection = true;
}

export const blackMarketScreen = {
  subHeader: [
    "No one here asks where you got your money, and no one tells you where the stock came from.",
    "Prices are spoken, never written down, and they are not negotiable.",
    "Everything on this table is illegal somewhere, and most of it here.",
    openLine,
    indoorTimeLine,
    packLine,
  ],

  keymap: {
    B: (state, ui) => switchScreen(state, ui, "location"),
    LEFT: (state, ui) => switchTab(state, ui, -1),
    RIGHT: (state, ui) => switchTab(state, ui, 1),
    P: (state, ui) => {
      const id = selectedItemId(ui);
      if (!id) {
        state.lastMessage = "Select something first.";
        return;
      }
      const sections = blackMarketSections(state.shopContext?.blackMarket);
      const section = sections[ui.inventoryList._tabIndex ?? 0] ?? sections[0];
      const entry = section?.entries.find(([entryKey]) => entryKey === id)?.[1];
      if (!entry) return;

      const price = priceOf(id, entry);
      const name = entry.name ?? ALL_ITEMS[id]?.name ?? id;
      if (!canAfford(state, price)) {
        state.lastMessage = `You can't afford ${name} (${price}gp). You have ${state.gold}gp.`;
        return;
      }

      chargeGold(state, price);
      // A bundle hands over its `outputs`; everything else is the item its own
      // key names. Barter xp is paid on what actually changed hands, so a box
      // of 100 coal trains more than a single crystal - same rule shopBuy uses.
      let xp = 0;
      for (const [grantId, qty] of Object.entries(blackMarketGrants(id, entry))) {
        addItem(state, grantId, qty);
        if (ALL_ITEMS[grantId]) xp += getBarterXp(ALL_ITEMS[grantId], qty);
      }
      grantSkillXp(state, "barter", xp);
      logger.info("blackMarket", `Bought ${id} for ${price}gp.`);
      state.lastMessage = `Bought ${name} for ${price}gp.`;
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
    ui.inventoryList.setLabel(""); // clear the tab strip so other screens don't inherit it
    ui.mainContent.show();
  },

  render(state, ui) {
    const tabs = tabsFor(state);
    const tabIndex = Math.min(ui.inventoryList._tabIndex ?? 0, Math.max(0, tabs.length - 1));
    ui.inventoryList._tabIndex = tabIndex;

    const { lines, itemIds } = buildBlackMarketRows(state, tabIndex);
    ui.inventoryList.setItems(lines);
    ui.inventoryList._itemIds = itemIds;
    if (ui.inventoryList._resetSelection) {
      ui.inventoryList.select(0);
      ui.inventoryList._resetSelection = false;
    }
    ui.inventoryList.setLabel(tabs.length ? ` ${formatTabStrip(tabs, tabIndex)} ` : "");

    ui.promptRow.setContent(state.lastMessage || `What are you after? (gp: ${state.gold})`);
    ui.commandList.setContent(
      formatCommandRow(
        [
          { label: "Back", hotkey: "B" },
          { label: "Switch tab", hotkey: "<>" },
          { label: "Purchase", hotkey: "P" },
        ],
        { columns: 2 }
      )
    );
  },
};
