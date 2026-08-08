// logger.js resolves LOG_PATH and its debugLevel threshold from env vars at
// *import* time, and ES module imports fully evaluate before this file's own
// top-level code runs - so process.env.LOG_PATH/DEBUG_LEVEL must be set
// before any static import of logger.js. Pulling it in via dynamic import()
// after setting them, same pattern (and same reason) as persistence.test.js
// uses for db_backbone.js.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
process.env.LOG_PATH = path.join(scratchDir, "test.log");
process.env.DEBUG_LEVEL = "WARN";

after(() => fs.rmSync(scratchDir, { recursive: true, force: true }));

test("logger writes lines at or above the configured threshold", async () => {
  const { logger, LOG_PATH } = await import("../../logger.js");
  logger.warn("test", "this should be written");
  logger.error("test", "this should also be written");
  const contents = fs.readFileSync(LOG_PATH, "utf8");
  assert.match(contents, /\[WARN\] \[test\] this should be written/);
  assert.match(contents, /\[ERROR\] \[test\] this should also be written/);
});

test("logger drops lines below the configured threshold", async () => {
  const { logger, LOG_PATH } = await import("../../logger.js");
  const before = fs.readFileSync(LOG_PATH, "utf8");
  logger.full("test", "should NOT be written");
  logger.info("test", "should NOT be written either");
  const afterWrite = fs.readFileSync(LOG_PATH, "utf8");
  assert.equal(afterWrite, before, "sub-threshold writes must not change the log file");
});

test("logger rotates to .old.log once logMaxMB is crossed", async () => {
  const { logger, LOG_PATH } = await import("../../logger.js");
  // file_config.logMaxMB is 3 in config.js - write past 3MB directly rather
  // than depending on that literal value.
  const bigMessage = "x".repeat(3 * 1024 * 1024 + 1);
  logger.error("test", bigMessage);
  logger.error("test", "triggers the rotation check on the next write");

  const oldLogPath = LOG_PATH.replace(/\.log$/, ".old.log");
  assert.ok(fs.existsSync(oldLogPath), "expected a rotated .old.log after crossing logMaxMB");
  const oldSize = fs.statSync(oldLogPath).size;
  const newSize = fs.statSync(LOG_PATH).size;
  assert.ok(oldSize > newSize, "rotated file should hold the big write; new file should be small");
});
