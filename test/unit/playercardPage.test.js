// The first test to actually start the HTTP server - everything else in the
// suite tests the payload builders in isolation. Worth it here because the
// export feature spans both halves: the server decides whether the button
// exists, and the page carries the bootstrap that makes an exported copy work
// offline.
//
// The browser half (Blob, download, opening the saved file) can't be reached
// from node; that's verified by hand in Chrome.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "apocylta-test-"));
process.env.LOG_PATH = path.join(scratchDir, "test.log");

after(() => fs.rmSync(scratchDir, { recursive: true, force: true }));

// Port 0 lets the OS pick a free one, so this never collides with a running
// game on 4000 or with a parallel test file.
async function withServer(fn) {
  const { startPlayercardServer } = await import("../../server_backbone.js");
  const { createInitialState } = await import("../../state/gameState.js");
  const { server_config } = await import("../../config.js");

  const state = createInitialState();
  state.name = "Test Runner";

  const originalPort = server_config.port;
  const originalHost = server_config.host;
  server_config.port = 0;
  // Pinned rather than left as "localhost", which can resolve to ::1 and bind
  // IPv6-only - then a 127.0.0.1 fetch is refused.
  server_config.host = "127.0.0.1";

  const server = await startPlayercardServer(state);
  assert.ok(server, "the playercard server should have started");

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`, state, server_config);
  } finally {
    server_config.port = originalPort;
    server_config.host = originalHost;
    await new Promise((resolve) => server.close(resolve));
  }
}

test("the page is served, and carries the export bootstrap", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    const html = await res.text();

    assert.match(html, /id="pc-snapshot"|SNAPSHOT_ID/, "the snapshot bootstrap has to be in the shipped page");
    assert.match(html, /id="export-btn"/);
    assert.match(html, /apocylta_pc_/, "the filename template travels with the page");
  });
});

// showTab() queries .tab-btn document-wide and reads btn.dataset.tab, so an
// Export button carrying that class would call showTab(undefined) on click and
// hide every panel at once.
test("neither export button is a tab button", async () => {
  await withServer(async (base) => {
    const html = await (await fetch(`${base}/`)).text();
    for (const id of ["export-btn", "export-json-btn"]) {
      const button = html.match(new RegExp(`<button id="${id}"[^>]*>`))[0];
      assert.doesNotMatch(button, /tab-btn/, `#${id} must not be a .tab-btn`);
      assert.match(button, /hidden/, "hidden until the payload says exports are enabled");
    }
  });
});

// The JSON half of the same flag. The filename template is asserted here rather
// than the download itself, which needs a browser.
test("the page carries the JSON export", async () => {
  await withServer(async (base) => {
    const html = await (await fetch(`${base}/`)).text();
    assert.match(html, /id="export-json-btn"/);
    assert.match(html, /apocylta_pc_\$\{slug\}\.\$\{ext\}/, "one filename builder, parameterised by extension");
    assert.match(html, /exportFilename\(lastData\.name, "json"\)/);
    assert.match(html, /application\/json/);
  });
});

// The reader page needs no route of its own: serveStatic() serves anything
// under public/, and index.html is only special as the "/" default.
test("the reader page is served alongside the live one", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/apocylta_player.html`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    assert.match(await res.text(), /id="import-btn"/);
  });
});

test("the payload's exportEnabled tracks the config flag", async () => {
  await withServer(async (base, state, server_config) => {
    const original = server_config.export;
    try {
      server_config.export = false;
      let payload = await (await fetch(`${base}/api/playercard`)).json();
      assert.equal(payload.exportEnabled, false);
      assert.equal(payload.name, "Test Runner", "and the name the filename is built from");

      // Read per request, so no restart is needed.
      server_config.export = true;
      payload = await (await fetch(`${base}/api/playercard`)).json();
      assert.equal(payload.exportEnabled, true);
    } finally {
      server_config.export = original;
    }
  });
});

test("the payload survives JSON round-tripping, which is how it's embedded", async () => {
  await withServer(async (base) => {
    const text = await (await fetch(`${base}/api/playercard`)).text();
    const parsed = JSON.parse(text);
    // An exported copy re-parses exactly this string out of a <script> tag.
    assert.deepEqual(JSON.parse(JSON.stringify(parsed)), parsed);
    for (const key of ["name", "level", "hp", "skills", "inventory", "quests", "achievements"]) {
      assert.ok(key in parsed, `payload is missing ${key}`);
    }
  });
});
