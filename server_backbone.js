// server_backbone.js - serves the playercard web page (public/) and its
// live JSON data (/api/playercard) from the running game's in-memory state.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { server_config } from "./config.js";
import { logger } from "./logger.js";
import { getCurrentLocation, isSafeZone, formatClock } from "./state/gameState.js";
import { getAction } from "./data/actions.js";
import { ALL_ITEMS, SHOP_RARITY_DISPLAY } from "./item_backbone.js";
import { SKILLS, skillLevelCost } from "./skill_backbone.js";
import {
  waterBottleCap,
  slingshotAmmoCap,
  quiverCap,
  backpackSlotCap,
  backpackSlotsUsed,
  potionSlotCap,
  potionSlotsUsed,
} from "./data/toolbelt.js";
import { startedQuests, objectiveStatus } from "./data/quests.js";
import { achievementRows } from "./data/achievements.js";
import { ALL_ENEMIES } from "./enemy_backbone.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
const DEFAULT_MIME = "application/octet-stream";

const EQUIP_SLOTS = ["weapon", "tool", "slingshot", "belt", "head", "torso", "legs", "boots", "hands", "shield"];

// Joins against PUBLIC_DIR then verifies the result is still inside it -
// join-then-verify, not "reject '..' in the raw string", since that alone
// doesn't catch every traversal encoding.
function resolvePublicPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    logger.warn("server_backbone", `Failed to decode request URL: ${urlPath}`);
    return null;
  }
  const relative = decoded === "/" ? "/index.html" : decoded;
  const candidate = path.join(PUBLIC_DIR, relative);
  const root = PUBLIC_DIR + path.sep;
  if (candidate !== PUBLIC_DIR && !candidate.startsWith(root)) return null;
  return candidate;
}

function serveStatic(res, urlPath) {
  const filePath = resolvePublicPath(urlPath);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? DEFAULT_MIME });
    res.end(data);
  });
}

// Exported for the payload-shape test - the playercard page's backpack tabs
// group on `type`/`subtype`, so those fields are a contract, not incidental.
export function buildInventoryList(inventoryMap) {
  return Object.entries(inventoryMap ?? {})
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = ALL_ITEMS[id];
      const rarityInfo = item?.rarity ? SHOP_RARITY_DISPLAY[item.rarity] : null;
      return {
        id,
        name: item?.name ?? id,
        qty,
        type: item?.type ?? "unknown",
        // Optional in the catalog - plenty of items have no subtype, so this
        // is an explicit null the page groups under "other" rather than an
        // undefined that would vanish through JSON.stringify.
        subtype: item?.subtype ?? null,
        rarity: item?.rarity ?? null,
        rarityColor: rarityInfo?.color ?? "gray",
        rarityDisplay: rarityInfo?.display ?? (item?.rarity ?? "Unknown"),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildCurrentActionPayload(currentAction) {
  if (!currentAction) return null;
  const action = getAction(currentAction.id);
  return {
    id: currentAction.id,
    label: action?.label ?? currentAction.id,
    elapsedSeconds: currentAction.elapsedSeconds,
    gathered: buildInventoryList(currentAction.gatheredThisSession),
  };
}

function buildSkillsList(skills) {
  return Object.entries(SKILLS).map(([id, def]) => {
    const skill = skills[id] ?? { level: 1, xp: 0 };
    const xpFloor = skill.level <= 1 ? 0 : skillLevelCost(skill.level);
    const xpNext = skillLevelCost(skill.level + 1);
    const progress = Math.max(0, Math.min(1, (skill.xp - xpFloor) / (xpNext - xpFloor)));
    return {
      id,
      name: def.name,
      level: skill.level,
      xp: skill.xp,
      xpFloor,
      xpNext,
      progress,
    };
  });
}

function buildEquipmentPayload(equipment) {
  const payload = {};
  for (const slot of EQUIP_SLOTS) {
    const itemId = equipment?.[slot] ?? null;
    payload[slot] = itemId ? ALL_ITEMS[itemId]?.name ?? itemId : null;
  }
  return payload;
}

// quiverCap(state) can be Infinity (data/toolbelt.js: any belt equipped ->
// uncapped). Infinity doesn't survive JSON.stringify (silently -> null
// either way), so this makes "no cap" an explicit, intentional null rather
// than an accidental one - the frontend renders quiverCap===null as "no
// cap", mirroring toolbelt.js's own quiverMax===Infinity check. Equipped
// belt/tool/slingshot *names* are already resolved by buildEquipmentPayload
// (data.equipment.belt/tool/slingshot) - this only carries the
// toolbelt-specific counters/caps, not a second name lookup.
export function buildToolbeltPayload(state) {
  const quiverMax = quiverCap(state);
  return {
    waterBottle: state.toolbelt.waterBottle,
    waterBottleCap: waterBottleCap(state),
    slingshotAmmo: state.toolbelt.slingshotAmmo,
    slingshotAmmoCap: slingshotAmmoCap(state),
    quiver: state.toolbelt.quiver,
    quiverCap: quiverMax === Infinity ? null : quiverMax,
    backpackUsed: backpackSlotsUsed(state),
    backpackCap: backpackSlotCap(state),
    potionsUsed: potionSlotsUsed(state),
    potionsCap: potionSlotCap(state),
  };
}

// Mirrors journal.js's buildBody() grouping as structured JSON (not
// pre-formatted text) so the frontend renders its own checkboxes/styling.
export function buildQuestsPayload(state) {
  return startedQuests(state).map(({ id, quest, record }) => ({
    id,
    name: quest.name,
    status: record.status,
    objectives: Object.keys(quest.objectives).map((label) => ({ label, ...objectiveStatus(state, id, label) })),
    reward: quest.reward, // always {gold:number, xp:number}
  }));
}

// Static catalog browser only - achievements_backbone.js's ACHIEVEMENTS
// catalog exists but nothing in the codebase tracks progress against it yet
// (no state.achievements, no evaluator, no hooks), so this carries no
// unlocked/progress state, just the catalog entries. Takes no state
// argument on purpose - the catalog is fixed, independent of any player.
// Per-player now, not a static catalog: carries unlocked state and live
// per-requirement progress, the same way buildQuestsPayload does for
// objectives. combatEnd requirements always report incomplete here - they're
// only answerable from the snapshot taken when a fight is won, never from a
// poll (see data/achievements.js).
export function buildAchievementsPayload(state) {
  return achievementRows(state).map((row) => ({
    id: row.id,
    name: row.name,
    desc: row.desc,
    reward: row.reward, // {gold, xp} - xp: number | {player, skill:{...}}
    unlocked: row.unlocked,
    unlockedAt: row.unlockedAt,
    requirements: row.requirements, // [{key, current, target, complete}]
  }));
}

// Mirrors buildCurrentActionPayload's null-when-idle shape: the page renders
// a combat panel only while a fight is actually live. The lifetime kill tally
// is separate and always present, since it survives the encounter.
export function buildCombatPayload(state) {
  const combat = state.currentCombat;
  if (!combat) return null;
  const enemy = combat.enemies[combat.index] ?? null;
  return {
    round: combat.round,
    boss: !!combat.boss,
    outcome: combat.outcome,
    defeatedThisEncounter: combat.defeated.length,
    remaining: Math.max(0, combat.enemies.length - combat.index),
    enemy: enemy && { id: enemy.id, name: enemy.name, hp: enemy.hp, hpMax: enemy.hpMax },
    log: combat.log.slice(-8),
  };
}

export function buildKillsPayload(state) {
  return Object.entries(state.enemiesDefeated ?? {})
    .map(([id, quantity]) => ({
      id,
      name: ALL_ENEMIES[id]?.name ?? id,
      type: ALL_ENEMIES[id]?.type ?? null,
      quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

function buildPlayercardPayload(state) {
  const location = getCurrentLocation(state);
  return {
    name: state.name ?? "Unnamed Traveler",
    level: state.level,
    experience: state.experience,
    hp: state.hp,
    hpMax: state.hpMax,
    mp: state.mp,
    mpMax: state.mpMax,
    gold: state.gold,
    clock: formatClock(state),
    location: {
      id: state.currentLocationId,
      name: location?.name ?? state.currentLocationId,
      safe: isSafeZone(state),
    },
    currentAction: buildCurrentActionPayload(state.currentAction),
    combat: buildCombatPayload(state),
    kills: buildKillsPayload(state),
    inventory: buildInventoryList(state.inventory),
    skills: buildSkillsList(state.skills),
    equipment: buildEquipmentPayload(state.equipment),
    toolbelt: buildToolbeltPayload(state),
    quests: buildQuestsPayload(state),
    achievements: buildAchievementsPayload(state),
    generatedAt: new Date().toISOString(),
  };
}

// Resolves once the server has finished starting (bound, or failed to bind)
// so the caller can await it before touching stdout via blessed - the
// 'error' event fires asynchronously, so this can't be fire-and-forget.
export function startPlayercardServer(state) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url.split("?")[0];

      if (req.method === "GET" && urlPath === "/api/playercard") {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(buildPlayercardPayload(state)));
        return;
      }

      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD" });
        res.end("Method not allowed");
        return;
      }

      serveStatic(res, urlPath);
    });

    server.once("error", (err) => {
      const message = `Playercard server did not start (${err.code ?? err.message}). Continuing without it.`;
      console.warn(`[server_backbone] ${message}`);
      logger.warn("server_backbone", message);
      resolve(null);
    });
    server.once("listening", () => {
      const message = `Playercard available at http://${server_config.host}:${server_config.port}/`;
      console.log(`[server_backbone] ${message}`);
      logger.info("server_backbone", message);
      resolve(server);
    });

    server.listen(server_config.port, server_config.host);
  });
}
