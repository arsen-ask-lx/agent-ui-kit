import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * agent-ui-kit — point at an element, say what is wrong, the note lands
 * in a file your coding agent reads.
 *
 * WHY A FILE AND NOT A CONSOLE LINE. You walk the screen and leave ten notes
 * in a row; nobody should wait while each is processed. The file collects
 * them, the agent works through the list afterwards.
 *
 * WHY NOT MCP. An MCP server would mean the agent polling, or another daemon
 * to run. A file needs neither: the agent reads it when it looks, and any
 * agent can — this is not tied to one vendor.
 *
 * ⚠️ DEV SERVER ONLY (`apply: "serve"`). Nothing here reaches a production
 * build: the client is injected by the dev server and the route lives in its
 * middleware.
 */

const CLIENT = "\0virtual:agent-ui-kit/client";

const DEFAULTS = {
  /** Where notes are collected. Markdown: read by a human and by an agent. */
  file: "NOTES.md",
  /** Which key to hold. `alt` | `ctrl` | `meta`. */
  key: "alt",
  /** Highlight colour. Self-contained on purpose — see client.js. */
  color: "#e5484d",
  /** Placeholder in the note field. */
  placeholder: "what is wrong? Enter — save, Esc — cancel",
  /** Where the browser posts notes. Change only on a collision. */
  route: "/__agent-ui-kit",
};

/**
 * One note, one entry.
 *
 * Components come first and on their own line: they are what you open the
 * file by, so they must be findable by eye rather than read out of a
 * paragraph. Classes are the second key — they locate the exact line inside
 * the file.
 */
function entry(note) {
  const when = new Date().toISOString().replace("T", " ").slice(0, 19);
  const where = note.where || "component not identified";
  const what = `\`<${note.tag}>\`${note.sample ? ` — «${note.sample}»` : ""}`;
  return [
    ``,
    `## ${note.text}`,
    ``,
    `- **where:** \`${where}\``,
    `- **what:** ${what}`,
    `- **classes:** \`${note.classes || "—"}\``,
    note.id ? `- **id:** \`${note.id}\`` : null,
    note.testId ? `- **data-testid:** \`${note.testId}\`` : null,
    `- **page:** \`${note.url}\``,
    `- **when:** ${when}`,
    ``,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/**
 * @param {Partial<typeof DEFAULTS>} [options]
 */
export function agentUiKit(options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const notes = resolve(process.cwd(), settings.file);

  return {
    name: "agent-ui-kit",
    apply: "serve",

    // The client is a virtual module: nothing to copy into the host project,
    // and nothing to keep in sync with it.
    resolveId(id) {
      return id === CLIENT.slice(1) ? CLIENT : null;
    },

    async load(id) {
      if (id !== CLIENT) return null;
      const source = await readFile(new URL("./client.js", import.meta.url), "utf8");
      const runtime = {
        key: settings.key,
        color: settings.color,
        placeholder: settings.placeholder,
        route: settings.route,
      };
      return source.replace("__AGENT_UI_KIT_OPTIONS__", JSON.stringify(runtime));
    },

    // ⚠️ INJECTED BY THE PLUGIN, NOT IMPORTED BY THE HOST. One line in the
    // config is the whole installation; a project that has to import a client
    // file also has to remember to strip it from production.
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "module", src: `/@id/${CLIENT.slice(1)}` },
          injectTo: "body",
        },
      ];
    },

    configureServer(server) {
      server.middlewares.use(settings.route, (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end();
          return;
        }
        void (async () => {
          try {
            const note = await readBody(request);
            await mkdir(dirname(notes), { recursive: true });
            await appendFile(notes, entry(note), "utf8");
            // Say it in the dev-server log too: the person sees the note did
            // not fly off into nowhere without opening the file.
            server.config.logger.info(`[agent-ui-kit] ${note.text} → ${note.where || note.tag}`);
            response.statusCode = 204;
            response.end();
          } catch (error) {
            // Not swallowed: a note that failed to save must say so, or the
            // person will believe it was taken into account.
            server.config.logger.error(`[agent-ui-kit] not saved: ${String(error)}`);
            response.statusCode = 500;
            response.end();
          }
        })();
      });
    },
  };
}

export default agentUiKit;
