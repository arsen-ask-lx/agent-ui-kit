import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { after, before, test } from "node:test";

import { agentUiKit } from "../src/index.js";

// The plugin resolves the notes file against the working directory, so the
// tests move into a scratch directory rather than writing into the checkout.
const cwd = process.cwd();
let box;

before(async () => {
  box = await mkdtemp(join(tmpdir(), "agent-ui-kit-"));
  process.chdir(box);
});

after(() => process.chdir(cwd));

/** A dev server thin enough to run the middleware, and no thinner. */
function fakeServer() {
  const logs = [];
  let handler;
  return {
    server: {
      middlewares: { use: (_route, fn) => (handler = fn) },
      config: { logger: { info: (m) => logs.push(m), error: (m) => logs.push(m) } },
    },
    logs,
    handler: (...args) => handler(...args),
    post: (note) => {
      const request = Readable.from([Buffer.from(JSON.stringify(note))]);
      request.method = "POST";
      return new Promise((done) => {
        handler(request, { end: function () { done(this.statusCode); } });
      });
    },
    send: (method) =>
      new Promise((done) => {
        handler({ method }, { end: function () { done(this.statusCode); } });
      }),
  };
}

test("the client is a virtual module, and only its own id resolves", () => {
  const plugin = agentUiKit();
  assert.equal(plugin.resolveId("virtual:agent-ui-kit/client"), "\0virtual:agent-ui-kit/client");
  assert.equal(plugin.resolveId("react"), null);
});

test("options reach the browser through the client source", async () => {
  const plugin = agentUiKit({ key: "ctrl", color: "#00f" });
  const code = await plugin.load("\0virtual:agent-ui-kit/client");
  assert.ok(!code.includes("__AGENT_UI_KIT_OPTIONS__"), "the placeholder must be substituted");
  assert.match(code, /"key":"ctrl"/);
  assert.match(code, /"color":"#00f"/);
});

test("the client is injected, so the host project imports nothing", () => {
  const [tag] = agentUiKit().transformIndexHtml();
  assert.equal(tag.tag, "script");
  assert.equal(tag.injectTo, "body");
});

// ⚠️ The plugin must never reach a production build: everything it does
// lives in the dev server.
test("dev only", () => assert.equal(agentUiKit().apply, "serve"));

test("a posted note is appended to the file, with the component chain first", async () => {
  const fake = fakeServer();
  agentUiKit({ file: "NOTES.md" }).configureServer(fake.server);

  const status = await fake.post({
    text: "the list slides under the profile",
    where: "ChatScreen › Rail › RoomList",
    tag: "button",
    sample: "Channels",
    classes: "flex min-w-0",
    id: "rooms",
    testId: "room-list",
    url: "/c/1",
  });

  assert.equal(status, 204);
  const notes = await readFile(join(box, "NOTES.md"), "utf8");
  assert.match(notes, /## the list slides under the profile/);
  assert.match(notes, /- \*\*where:\*\* `ChatScreen › Rail › RoomList`/);
  assert.match(notes, /- \*\*what:\*\* `<button>` — «Channels»/);
  assert.match(notes, /- \*\*id:\*\* `rooms`/);
  assert.match(notes, /- \*\*data-testid:\*\* `room-list`/);
  assert.ok(fake.logs.some((line) => line.includes("agent-ui-kit")), "the log must say it landed");
});

test("notes accumulate: ten in a row, nobody waits for each", async () => {
  const fake = fakeServer();
  agentUiKit({ file: "MANY.md" }).configureServer(fake.server);
  for (let i = 0; i < 10; i++) await fake.post({ text: `note ${i}`, tag: "div", url: "/" });
  const notes = await readFile(join(box, "MANY.md"), "utf8");
  assert.equal(notes.match(/^## note \d/gm).length, 10);
});

// An element React knows nothing about still has to be recordable — tooling
// that dies on somebody else's undocumented detail is worse than none.
test("a note without a component chain is still recorded", async () => {
  const fake = fakeServer();
  agentUiKit({ file: "PLAIN.md" }).configureServer(fake.server);
  assert.equal(await fake.post({ text: "wrong colour", tag: "span", url: "/" }), 204);
  const notes = await readFile(join(box, "PLAIN.md"), "utf8");
  assert.match(notes, /component not identified/);
  assert.match(notes, /- \*\*classes:\*\* `—`/);
});

test("the note file lands in a nested directory that does not exist yet", async () => {
  const fake = fakeServer();
  agentUiKit({ file: "docs/notes/UI.md" }).configureServer(fake.server);
  assert.equal(await fake.post({ text: "nested", tag: "p", url: "/" }), 204);
  assert.match(await readFile(join(box, "docs/notes/UI.md"), "utf8"), /## nested/);
});

test("only POST is answered", async () => {
  const fake = fakeServer();
  agentUiKit().configureServer(fake.server);
  assert.equal(await fake.send("GET"), 405);
});

test("a broken body fails loudly rather than silently dropping the note", async () => {
  const fake = fakeServer();
  agentUiKit({ file: "BROKEN.md" }).configureServer(fake.server);
  const request = Readable.from([Buffer.from("{not json")]);
  request.method = "POST";
  const status = await new Promise((done) => {
    fake.handler(request, { end: function () { done(this.statusCode); } });
  });
  assert.equal(status, 500, "a note that failed to save must say so");
  assert.ok(fake.logs.some((line) => line.includes("not saved")));
});
