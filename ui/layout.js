import blessed from "neo-blessed";
import { app_version } from "../config.js";
import { getCurrentLocation, isSafeZone, formatClock, activeToast } from "../state/gameState.js";
import { getAction } from "../data/actions.js";
import { skillLevelCost } from "../skill_backbone.js";
import { colorTag } from "./format.js";
// COLOR/pickBand/HP_BANDS live in markup.js so data/flavor.js can band its
// health line with the same table this file's HP number uses.
import { COLOR, pickBand, HP_BANDS } from "../markup.js";

const INFO_BAR_HEIGHT = 3;
// The optional second header bar. Bordered, so it needs 3 rows to show one
// line of text - and it takes those 3 from the content pane while visible.
export const SUB_BAR_HEIGHT = 3;
export const CONTENT_TOP = INFO_BAR_HEIGHT;

// Builds the fixed apocylta widget tree: a 2/3-height top panel (header +
// main content) and a 1/3-height bottom panel (status + command box),
// regardless of terminal size. Returns the screen plus handles to every
// widget a screen module needs to update.
export function buildLayout() {
  const screen = blessed.screen({
    smartCSR: true,
    title: "apocylta",
    // Keep Ctrl-C working as a hard quit even while an input widget (e.g.
    // the character-name screen's textbox) has grabbed key input.
    ignoreLocked: ["C-c"],
    // neo-blessed's bundled terminfo set doesn't include "tmux-256color" (or
    // several other modern TERM values), so it falls back to the system
    // terminfo database - whose parsing has turned out to under-detect color
    // depth (confirmed: TERM=tmux-256color read back as an 8-color terminal
    // despite the system terminfo correctly declaring 256), silently
    // degrading every hex-color tag ({#ffae42-fg}, etc.) to a crude 8-color
    // approximation. Forcing blessed's own bundled xterm-256color terminfo
    // sidesteps that lookup entirely and reliably gives full 256-color tags,
    // which is safe since effectively all modern terminal emulators (and
    // tmux itself, as used here) support at least 256 colors regardless of
    // their actual TERM string.
    terminal: "xterm-256color",
  });

  const topPanel = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: "100%",
    height: "67%",
  });

  const headerBar = blessed.box({
    parent: topPanel,
    top: 0,
    left: 0,
    width: "100%",
    height: INFO_BAR_HEIGHT,
    border: { type: "line" },
  });

  // Three columns on the header's single content row - split out so the
  // clock can hug the right edge and the idle/action indicator can sit in a
  // genuinely centered zone, independent of the variable-length left text.
  const headerLeft = blessed.box({
    parent: headerBar,
    top: 0,
    left: 0,
    width: "50%",
    height: 1,
    tags: true,
  });

  const headerCenter = blessed.box({
    parent: headerBar,
    top: 0,
    left: "50%",
    width: "30%",
    height: 1,
    tags: true,
    align: "center",
  });

  const headerRight = blessed.box({
    parent: headerBar,
    top: 0,
    left: "80%",
    width: "20%",
    height: 1,
    tags: true,
    align: "right",
  });

  // A screen-specific flavour bar, slotted between the header and the content
  // pane. Hidden by default and shown only for screens declaring a `subHeader`
  // - see ui/subHeader.js, which also moves mainContent/inventoryList down to
  // make room. Screens that don't opt in pay nothing.
  const subHeaderBar = blessed.box({
    parent: topPanel,
    top: INFO_BAR_HEIGHT,
    left: 0,
    width: "100%",
    height: SUB_BAR_HEIGHT,
    border: { type: "line" },
    tags: true,
    hidden: true,
  });

  const mainContent = blessed.box({
    parent: topPanel,
    top: INFO_BAR_HEIGHT,
    left: 0,
    width: "100%",
    height: `100%-${INFO_BAR_HEIGHT}`,
    border: { type: "line" },
    tags: true,
    content: "",
    scrollable: true,
    mouse: true,
  });

  const inventoryList = blessed.list({
    parent: topPanel,
    top: INFO_BAR_HEIGHT,
    left: 0,
    width: "100%",
    height: `100%-${INFO_BAR_HEIGHT}`,
    border: { type: "line" },
    tags: true,
    hidden: true,
    keys: true,
    vi: true,
    mouse: true,
    style: {
      selected: { inverse: true },
    },
    scrollbar: {
      ch: " ",
      style: { inverse: true },
    },
  });

  const bottomPanel = blessed.box({
    parent: screen,
    top: "67%",
    left: 0,
    width: "100%",
    bottom: 0,
  });

  const statusBar = blessed.box({
    parent: bottomPanel,
    top: 0,
    left: 0,
    width: "100%",
    height: INFO_BAR_HEIGHT,
    border: { type: "line" },
    tags: true,
  });

  const commandBox = blessed.box({
    parent: bottomPanel,
    top: INFO_BAR_HEIGHT,
    left: 0,
    width: "100%",
    bottom: 0,
    border: { type: "line" },
  });

  const promptRow = blessed.box({
    parent: commandBox,
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    tags: true,
    content: "",
  });

  const commandList = blessed.box({
    parent: commandBox,
    top: 1,
    left: 0,
    right: 0,
    bottom: 0,
    tags: true,
    content: "",
  });

  const nameInput = blessed.textbox({
    parent: commandBox,
    top: 1,
    left: 0,
    width: 40,
    height: 1,
    hidden: true,
    inputOnFocus: true,
    style: { fg: "white" },
  });

  return {
    screen,
    topPanel,
    headerBar,
    headerLeft,
    headerCenter,
    headerRight,
    subHeaderBar,
    mainContent,
    inventoryList,
    bottomPanel,
    statusBar,
    commandBox,
    promptRow,
    commandList,
    nameInput,
  };
}

const XP_BAR_WIDTH = 15;

export function formatXpBar(progress, width = XP_BAR_WIDTH) {
  const filled = Math.max(0, Math.min(width, Math.round(progress * width)));
  return "+".repeat(filled) + "-".repeat(width - filled);
}

const MP_BANDS = [
  { min: 0.75, color: "light-blue" },
  { min: 0.5, color: "blue" },
  { min: 0.25, color: COLOR.darkBlue },
  { min: 0, color: "red" },
];

// Ascending white -> blue -> yellow -> green -> gold as action xp progress
// climbs toward the next level; bold kicks in starting at yellow.
const XP_BAR_BANDS = [
  { min: 0.8, color: COLOR.gold, bold: true },
  { min: 0.6, color: "green", bold: true },
  { min: 0.4, color: "yellow", bold: true },
  { min: 0.2, color: "blue", bold: false },
  { min: 0, color: "white", bold: false },
];

// HP/MP numbers are unconditionally bold, unlike the xp bar's banded bold.
function formatStat(value, max, bands) {
  const pct = max > 0 ? value / max : 0;
  return colorTag(String(value), pickBand(pct, bands).color, true);
}

// "" when idle (no currentAction, or its action grants no skill) - the
// status bar falls back to exactly the plain hp/mp/zone line in that case.
// Diffs the live skill against the snapshot data/actions.js's beginAction()
// took when the action started, so "gained this session" needs no separate
// running total (skill.xp is a cumulative lifetime value, never reset on
// level-up).
export function actionProgressText(state) {
  const currentAction = state.currentAction;
  if (!currentAction) return "";
  const action = getAction(currentAction.id);
  const skill = action?.skill ? state.skills[action.skill] : null;
  if (!skill) return "";

  const xpFloor = skill.level <= 1 ? 0 : skillLevelCost(skill.level);
  const xpNext = skillLevelCost(skill.level + 1);
  const progress = Math.max(0, Math.min(1, (skill.xp - xpFloor) / (xpNext - xpFloor)));
  const xpGained = skill.xp - currentAction.skillXpAtStart;
  const levelsGained = skill.level - currentAction.skillLevelAtStart;

  const band = pickBand(progress, XP_BAR_BANDS);
  const coloredBar = colorTag(formatXpBar(progress), band.color, band.bold);

  return ` | ${action.skill}: ${skill.level} xp: ${coloredBar} | +${xpGained} xp so far (${levelsGained} levels)`;
}

// The wizard takes free text, so a long name would push `gp:` off the end of
// the 50%-wide left column. Truncated for display only - state.name is
// untouched, and the Menu still shows it in full.
const HEADER_NAME_MAX = 14;

function headerIdentity(state) {
  // Omitted rather than rendered as "- Lv.1": the header draws on the title
  // screen and through every step of the creation wizard, where there is no
  // character yet.
  if (!state.name) return "";
  const name = state.name.length > HEADER_NAME_MAX ? `${state.name.slice(0, HEADER_NAME_MAX - 1)}…` : state.name;
  return `${colorTag(name, "white", true)} ${colorTag(`Lv.${state.level}`, COLOR.yellowOrange, false)} | `;
}

// Renders the header/status bars shared by every screen: header is
// left (apocylta | name+level | [location] | gold) / center (idle or current
// action) / right (clock); status is hp | mp | zone flag | action progress.
export function renderChrome(state, ui) {
  const location = getCurrentLocation(state);
  const zoneColor = isSafeZone(state) ? "green" : "red";

  // Everything colored here goes through colorTag rather than a raw tag, so
  // the colorize setting has a single gate to close - a literal "{blue-fg}"
  // would survive it.
  ui.headerLeft.setContent(
    ` ${colorTag("apocylta", "blue", true)} | ` +
      headerIdentity(state) +
      `${colorTag("[", zoneColor)}${colorTag(location.name, COLOR.yellowOrange, true)}${colorTag("]", zoneColor)} | ` +
      `gp: ${colorTag(String(state.gold), COLOR.yellowOrange, false)}`
  );

  // A fight outranks a gather in the header - beginCombat() clears
  // currentAction anyway, so the two are never both live.
  const enemyInCombat = state.currentCombat?.enemies?.[state.currentCombat.index];
  const actionLabel = state.currentAction ? getAction(state.currentAction.id)?.label : null;
  ui.headerCenter.setContent(
    enemyInCombat
      ? colorTag(`fighting ${enemyInCombat.name}`, "red", true)
      : actionLabel
        ? colorTag(actionLabel, COLOR.yellowOrange, false)
        : colorTag("[idle]", "blue")
  );

  ui.headerRight.setContent(`${formatClock(state)} `);

  const zoneBadge = isSafeZone(state)
    ? colorTag("[ SAFE ZONE ]", "green")
    : colorTag("[ DANGER ]", "red");

  // Godmode silently changes the rules of every screen - what damage does,
  // what things cost - so it says so in the one bar every screen draws rather
  // than only on the admin editor that toggles it.
  const godBadge = state.godmode ? ` ${colorTag("[ GOD ]", COLOR.gold, true)}` : "";

  // An achievement can unlock on any screen, including ones that never show
  // state.lastMessage - so unlocks ride here instead, in the one bar every
  // screen renders. activeToast() also expires stale entries; it's called from
  // render rather than the tick so it stays correct however we got here.
  const toast = activeToast(state);
  const tail = toast
    ? ` | ${colorTag(toast.text, COLOR.gold, true)}`
    : actionProgressText(state);

  ui.statusBar.setContent(
    ` hp: ${formatStat(state.hp, state.hpMax, HP_BANDS)} | mp: ${formatStat(state.mp, state.mpMax, MP_BANDS)} | ${zoneBadge}${godBadge}${tail}`
  );
}
