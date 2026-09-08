# agent-ui-kit

**English** · [Русский](README.ru.md)

[![npm](https://img.shields.io/npm/v/agent-ui-kit)](https://www.npmjs.com/package/agent-ui-kit)
[![checks](https://github.com/arsen-ask-lx/agent-ui-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/arsen-ask-lx/agent-ui-kit/actions/workflows/ci.yml)
[![MIT licence](https://img.shields.io/npm/l/agent-ui-kit)](LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-2ea44f)](package.json)

**Point at an element in your running app, say what is wrong — the note lands
in a file your coding agent reads.**

![Alt-click an element, type what is wrong, press Enter](https://raw.githubusercontent.com/arsen-ask-lx/agent-ui-kit/main/docs/demo.gif)

*<a href="https://github.com/arsen-ask-lx/agent-ui-kit/raw/main/docs/demo.mp4">The same thing at full size, in video</a> — recorded from the example in this repository, not staged.*

Between "this button here" and `Rail.tsx:69` somebody has to build a bridge.
Without one, every conversation about the UI is made of prose descriptions,
and prose is read two ways.

It is a Vite plugin: it lives in the dev server and there is
nothing to import in your source.

```bash
npm i -D agent-ui-kit
```

```js
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { agentUiKit } from "agent-ui-kit";

export default defineConfig({
  plugins: [react(), agentUiKit()],
});
```

That is the whole installation. Hold **Alt** — the element under the cursor
lights up. Click — a field opens. Type, press **Enter**.

Want to see it before installing anything? Clone and run the example:

```bash
git clone https://github.com/arsen-ask-lx/agent-ui-kit && cd agent-ui-kit
npm install && npm run example
```

```markdown
## the channel list slides under the profile instead of scrolling

- **where:** `ChatScreen › Rail › RoomList › SidebarSection`
- **what:** `<button>` — «Channels»
- **classes:** `flex min-w-0 flex-1 items-center gap-1 rounded px-2.5 py-1 …`
- **page:** `/c/01a0814d-3bd0-708e-bed0-b1be60d2bbee`
- **when:** 2026-09-08 18:20:30
```

Then you say to your agent: *"work through NOTES.md"*. The component chain
plus the class list is enough to find the source line with a single search.

## Why it is a file and not an MCP server

An MCP server would mean either the agent polling for notes or another daemon
to keep running. A file needs neither: the agent reads it when it looks, and
**any** agent can — Claude Code, Cursor, Codex, Copilot, or a human with
`git diff`. Nothing here is tied to one vendor.

You walk the screen and leave ten notes in a row; nobody should wait while
each one is processed. The file collects, the agent works through the list
afterwards.

## Options

```js
agentUiKit({
  file: "NOTES.md",   // where notes are collected
  key: "alt",         // "alt" | "ctrl" | "meta"
  color: "#e5484d",   // highlight colour
  placeholder: "what is wrong? Enter — save, Esc — cancel",
  route: "/__agent-ui-kit",  // change only on a collision
})
```

## What it reads off the element

- **the component chain** — pulled from React's own fibers on the DOM node
  (`ChatScreen › Rail › RoomList`). React only, and only in dev;
- **tag, classes, `id`, `data-testid`, a little text** — for everything else
  and for every other framework.

If no component names are found the note is still recorded, with the tag, the
classes and the text. Tooling that dies together with somebody else's
undocumented detail is worse than no tooling at all.

## Dev only

The plugin declares `apply: "serve"`. The client is injected by the dev
server as a virtual module, so there is nothing to import in your source and
nothing to remember to strip from a production build.

## Three things learned the hard way

They are in the source as comments, and they are why this is a package rather
than a snippet:

- **no `prompt()` / `confirm()`** — a native dialog freezes the page and
  breaks any automation driving the browser from outside;
- **the modifier-click belongs to the plugin entirely** — otherwise a note
  about a button also presses that button;
- **the field closes on click-outside, not on blur** — `blur` fires before
  Enter gets a chance to run, and ate what was typed.

MIT.
