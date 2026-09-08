# Contributing

```bash
npm test          # node --test, no dependencies to install
npm pack --dry-run
```

Two rules, and they are the ones this package is made of:

- **A comment says why, not what.** The code already says what it does. Every
  `⚠️` in the source marks something that was learned by breaking — leave it
  where it is unless the reason stopped being true.
- **A bug that got past the tests comes back with a test.** Each entry in the
  changelog that says *fixed* has a test standing behind it.

Issues and pull requests are welcome. If you are reporting a bug, say which
framework and which Vite version — the component chain is read off framework
internals, and those differ.
