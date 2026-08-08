import { test } from "node:test";
import assert from "node:assert/strict";
import { formatXpBar, actionProgressText } from "../../ui/layout.js";
import { createInitialState, grantSkillXp } from "../../state/gameState.js";
import { beginAction } from "../../data/actions.js";
import { skillLevelCost } from "../../skill_backbone.js";

test("formatXpBar() renders a 15-char +/- bar proportional to progress", () => {
  assert.equal(formatXpBar(0), "---------------");
  assert.equal(formatXpBar(1), "+++++++++++++++");
  assert.equal(formatXpBar(0.5), "++++++++-------"); // round(7.5) = 8 filled
});

test("formatXpBar() clamps progress outside [0, 1]", () => {
  assert.equal(formatXpBar(-0.5), "---------------");
  assert.equal(formatXpBar(1.5), "+++++++++++++++");
});

test("actionProgressText() is empty with no action running", () => {
  const state = createInitialState();
  assert.equal(actionProgressText(state), "");
});

test("actionProgressText() shows the action's skill, level, xp bar, and session gains", () => {
  const state = createInitialState();
  beginAction(state, "mine", { lootSubtype: "tin" });
  grantSkillXp(state, "mining", 40);

  const text = actionProgressText(state);
  // The bar itself is now wrapped in a color tag (see the dedicated
  // band-coloring test below), so this just confirms the surrounding shape.
  assert.match(text, /^ \| mining: 1 xp: .+ \| \+40 xp so far \(0 levels\)$/);
});

test("actionProgressText() colors the xp bar by progress band (white at 0%, not bold)", () => {
  const state = createInitialState();
  beginAction(state, "mine", { lootSubtype: "tin" });

  const text = actionProgressText(state);
  assert.match(text, /xp: \{white-fg\}-{15}\{\/white-fg\}/);
  assert.doesNotMatch(text, /\{bold\}/);
});

test("actionProgressText() reflects a level-up crossed during the session", () => {
  const state = createInitialState();
  beginAction(state, "mine", { lootSubtype: "tin" });

  const xpToLevel2 = skillLevelCost(2);
  grantSkillXp(state, "mining", xpToLevel2 + 20);

  const text = actionProgressText(state);
  assert.match(text, /mining: 2 /);
  assert.match(text, /\(1 levels\)$/);
});

test("actionProgressText() is empty for an action whose skill doesn't grant xp bar data (defensive)", () => {
  const state = createInitialState();
  beginAction(state, "not_a_real_action");
  assert.equal(actionProgressText(state), "");
});

// renderChrome() only ever calls setContent on the widgets handed to it, so a
// plain stub is enough to assert what lands in each bar - no blessed screen.
function stubUi() {
  const box = () => ({ content: "", setContent(text) { this.content = text; } });
  return {
    headerLeft: box(),
    headerCenter: box(),
    headerRight: box(),
    statusBar: box(),
  };
}

test("renderChrome(): an achievement toast takes over the status bar tail", async () => {
  const { renderChrome } = await import("../../ui/layout.js");
  const { pushToast } = await import("../../state/gameState.js");
  const state = createInitialState();
  const ui = stubUi();

  renderChrome(state, ui);
  assert.doesNotMatch(ui.statusBar.content, /Achievement/);

  pushToast(state, "Achievement unlocked: Welcome to apocylta");
  renderChrome(state, ui);

  assert.match(ui.statusBar.content, /Achievement unlocked: Welcome to apocylta/);
  // Still shows vitals alongside it - the toast appends, it doesn't replace.
  assert.match(ui.statusBar.content, /hp: /);
  assert.match(ui.statusBar.content, /\[ SAFE ZONE \]/);
});

test("renderChrome(): the toast clears itself once its window elapses", async () => {
  const { renderChrome } = await import("../../ui/layout.js");
  const { pushToast } = await import("../../state/gameState.js");
  const state = createInitialState();
  const ui = stubUi();

  pushToast(state, "Achievement unlocked: Slayerrr!");
  renderChrome(state, ui);
  assert.match(ui.statusBar.content, /Slayerrr/);

  state.clock.totalMinutes += 6; // one tick per minute; TOAST_TICKS is 6
  renderChrome(state, ui);
  assert.doesNotMatch(ui.statusBar.content, /Slayerrr/);
  assert.deepEqual(state.toasts, [], "expired toasts are dropped on render");
});

// ----------------------------------------------------------- header identity

test("renderChrome(): the header carries the player's name and level", async () => {
  const { renderChrome } = await import("../../ui/layout.js");
  const state = createInitialState();
  const ui = stubUi();

  state.name = "Eater";
  state.level = 3;
  renderChrome(state, ui);

  assert.match(ui.headerLeft.content, /Eater/);
  assert.match(ui.headerLeft.content, /Lv\.3/);
  // Alongside what was already there, not instead of it.
  assert.match(ui.headerLeft.content, /apocylta/);
  assert.match(ui.headerLeft.content, /town square/);
  assert.match(ui.headerLeft.content, /gp: /);
});

// The header draws on the title screen and through every wizard step, where
// there is no character yet - "- Lv.1" would be noise.
test("renderChrome(): no identity segment before a character exists", async () => {
  const { renderChrome } = await import("../../ui/layout.js");
  const state = createInitialState();
  const ui = stubUi();

  assert.equal(state.name, null);
  renderChrome(state, ui);

  assert.doesNotMatch(ui.headerLeft.content, /Lv\./);
  assert.match(ui.headerLeft.content, /apocylta/, "the rest of the header still renders");
  assert.match(ui.headerLeft.content, /gp: /);
});

test("renderChrome(): the level shown tracks state.level", async () => {
  const { renderChrome } = await import("../../ui/layout.js");
  const state = createInitialState();
  const ui = stubUi();

  state.name = "Climber";
  renderChrome(state, ui);
  assert.match(ui.headerLeft.content, /Lv\.1/);

  state.level = 12;
  renderChrome(state, ui);
  assert.match(ui.headerLeft.content, /Lv\.12/);
  assert.doesNotMatch(ui.headerLeft.content, /Lv\.1\b/);
});

// The wizard takes free text, and the left column is only ~60 chars wide -
// an unbounded name would push the gold readout off the end of the bar.
test("renderChrome(): a long name is truncated for display only", async () => {
  const { renderChrome } = await import("../../ui/layout.js");
  const state = createInitialState();
  const ui = stubUi();

  state.name = "Bartholomew Fitzgerald The Third";
  renderChrome(state, ui);

  assert.doesNotMatch(ui.headerLeft.content, /Fitzgerald/);
  assert.match(ui.headerLeft.content, /Bartholomew/, "enough of it to still recognise");
  assert.match(ui.headerLeft.content, /…/);
  assert.match(ui.headerLeft.content, /gp: /, "gold still fits after the name");
  assert.equal(state.name, "Bartholomew Fitzgerald The Third", "state is untouched");
});

test("renderChrome(): a live toast displaces the action xp readout, not the vitals", async () => {
  const { renderChrome } = await import("../../ui/layout.js");
  const { pushToast } = await import("../../state/gameState.js");
  const state = createInitialState();
  const ui = stubUi();

  beginAction(state, "mine", { lootSubtype: "tin" });
  renderChrome(state, ui);
  assert.match(ui.statusBar.content, /mining: 1/);

  pushToast(state, "Achievement unlocked: Master Crafter");
  renderChrome(state, ui);
  assert.match(ui.statusBar.content, /Master Crafter/);
  assert.doesNotMatch(ui.statusBar.content, /mining: 1/, "one tail at a time");
});
