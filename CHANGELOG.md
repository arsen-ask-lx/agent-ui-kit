# Changelog

## 0.1.1

- **Fixed: the client never received its options.** The substitution used
  `String.replace`, which replaces the first occurrence only — and the first
  occurrence was a lint comment above the declaration. The constant itself
  stayed an undefined name, so the browser threw a `ReferenceError` before
  the first click. Found by the test suite added in this release.
- Tests: ten cases over the note format, the accumulating file, nested
  directories, method handling and the failure path. `npm test`, no
  dependencies.
- CI on Linux and Windows, Node 20/22/24.

## 0.1.0

First release. Published briefly as `vite-plugin-aim`; npm rejected that name
as too close to an existing package, hence the rename.
