# Working on this repository

**What this is.** A Vite dev-server plugin. You hold a modifier key, point at
an element in the running app, type what is wrong, and the note is appended
to a Markdown file with the element's component chain, tag and classes.

**Commands.**

```bash
npm test            # node --test — the whole suite, no dependencies
npm pack --dry-run  # what actually ships
```

**Layout.**

- `src/index.js` — the plugin: virtual module, HTML injection, the route that
  writes notes.
- `src/client.js` — the browser side: highlight, the note field, the POST.
- `src/index.d.ts` — public types. Keep in step with `DEFAULTS`.
- `test/plugin.test.js` — the suite. It drives the middleware with a fake dev
  server; no browser needed.

**Constraints that are not negotiable.**

- Zero runtime dependencies.
- Nothing may reach a production build.
- `src/client.js` is served as source with `__AGENT_UI_KIT_OPTIONS__`
  substituted — it is not bundled, so keep it plain browser JavaScript.
