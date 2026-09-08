# Security

This plugin runs **in the dev server only** (`apply: "serve"`). It is never
part of a production build: the client is injected by the dev server and the
route lives in its middleware.

While it is running, anything that can reach your dev server can post to the
note route and append text to the note file. That is the same trust boundary
as the dev server itself — do not expose it to a network you do not control
(`server.host` in Vite).

Found something worse than that? Open a private security advisory on the
repository rather than a public issue.
