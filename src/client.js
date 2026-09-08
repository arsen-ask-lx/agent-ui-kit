/**
 * Browser side of agent-ui-kit.
 *
 * Hold the modifier key — the element under the cursor lights up.
 * Click — a small field opens. Type, press Enter — the note is appended
 * to a file on disk, together with a description of what you pointed at.
 *
 * WHY THIS EXISTS. Between "this button here" and `Rail.tsx:69` somebody
 * has to build a bridge. Without one, every conversation about the UI is
 * made of prose descriptions, and prose is read two ways.
 *
 * ⚠️ DEV SERVER ONLY. The plugin declares `apply: "serve"`, so nothing
 * here reaches a production bundle.
 *
 * ⚠️ NO `prompt()` / `confirm()`. A native dialog freezes the whole page
 * and breaks automation that drives the browser from outside — which is
 * exactly the audience this tool serves.
 */

// Substituted by the plugin when it serves this module — see load().
const OPTIONS = __AGENT_UI_KIT_OPTIONS__;

/**
 * Whose node is this — the chain of framework components, read off the
 * DOM node itself.
 *
 * ⚠️ READ FROM THE FRAMEWORK, NOT FROM THE BUILD. The first attempt wrote
 * source positions into the markup with a Babel plugin, and broke against
 * `@vitejs/plugin-react` 6, which is built on oxc — the Babel hook points
 * are simply gone.
 *
 * React in dev mode hangs a `__reactFiber$…` property (random suffix) on
 * every DOM node. Walking it upwards yields `ChatScreen › Rail › RoomList`
 * which, together with the class list, is enough to find the source line
 * with a single search.
 *
 * ⚠️ THESE ARE FRAMEWORK INTERNALS AND THEY MAY VANISH. That is why there
 * is not one "just in case" guard here: if no names are found, the note is
 * still recorded — with the tag, the classes and the text. Tooling that
 * dies together with somebody else's undocumented detail is worse than no
 * tooling at all.
 */
function fiberOf(node) {
  const key = Object.keys(node).find((one) => one.startsWith("__reactFiber$"));
  return key ? (node[key] ?? null) : null;
}

function nameOf(fiber) {
  if (typeof fiber.type !== "function") return undefined;
  return fiber.type.displayName ?? fiber.type.name;
}

function ownersOf(node) {
  const names = [];
  let fiber = fiberOf(node);
  // A depth limit on purpose: trees get deep and we only want the nearest.
  for (let step = 0; fiber && step < 40 && names.length < 4; step++) {
    const name = nameOf(fiber);
    if (name && !names.includes(name)) names.unshift(name);
    fiber = fiber.return ?? null;
  }
  return names.length > 0 ? names.join(" › ") : null;
}

/** How the element is recognised by eye: tag, a little text, classes. */
function describe(node) {
  return {
    tag: node.tagName.toLowerCase(),
    classes: node.getAttribute("class") ?? "",
    sample: (node.textContent ?? "").trim().slice(0, 60),
    id: node.id || "",
    testId: node.getAttribute("data-testid") ?? "",
  };
}

/**
 * ⚠️ COLOURS ARE SELF-CONTAINED, NOT TAKEN FROM THE HOST'S THEME.
 * An earlier version used the host project's CSS custom properties. That
 * is right inside one project and wrong in a package: in a project that
 * has no such tokens the highlight is invisible, and an invisible
 * highlight is indistinguishable from a broken plugin.
 */
function frameFor(node) {
  const frame = document.createElement("div");
  const at = node.getBoundingClientRect();
  frame.style.cssText = [
    "position:fixed",
    `left:${at.left}px`,
    `top:${at.top}px`,
    `width:${at.width}px`,
    `height:${at.height}px`,
    `border:2px solid ${OPTIONS.color}`,
    "border-radius:4px",
    `background:${OPTIONS.color}1a`,
    "pointer-events:none",
    "z-index:2147483646",
  ].join(";");
  return frame;
}

/**
 * The note field, next to the element. Resolves with the text or null.
 *
 * ⚠️ ENTER IS HANDLED EXPLICITLY, NOT THROUGH IMPLICIT FORM SUBMISSION.
 * Implicit submit depends on how many fields the form has and whether it
 * has a button; an end-to-end run caught this — the field closed and the
 * note went nowhere.
 *
 * ⚠️ CLOSING IS ON CLICK-OUTSIDE, NOT ON BLUR. `blur` fires before Enter
 * gets a chance to run and ate what was typed. Same defect, other half.
 */
function ask(node) {
  return new Promise((done) => {
    const at = node.getBoundingClientRect();
    const box = document.createElement("div");
    box.style.cssText = [
      "position:fixed",
      `left:${Math.max(8, Math.min(at.left, window.innerWidth - 348))}px`,
      `top:${Math.min(at.bottom + 8, window.innerHeight - 90)}px`,
      "z-index:2147483647",
      "padding:8px",
      "border-radius:12px",
      "background:#1b1b1e",
      "box-shadow:0 8px 24px rgb(0 0 0 / 40%)",
      "font:14px system-ui,sans-serif",
    ].join(";");

    const field = document.createElement("input");
    field.placeholder = OPTIONS.placeholder;
    field.style.cssText = [
      "width:300px",
      "padding:8px 10px",
      "border:0",
      "border-radius:8px",
      "background:#0f0f11",
      "color:#f1f1f3",
      "font:inherit",
      "outline:none",
    ].join(";");

    box.append(field);
    document.body.append(box);
    field.focus();

    let closed = false;
    const close = (answer) => {
      if (closed) return;
      closed = true;
      box.remove();
      document.removeEventListener("mousedown", outside, true);
      done(answer);
    };
    function outside(event) {
      if (!box.contains(event.target)) close(null);
    }

    field.addEventListener("keydown", (event) => {
      // Swallow everything: the page underneath must neither hear the
      // typing nor read Escape as "close the menu".
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        close(field.value.trim() || null);
      }
      if (event.key === "Escape") close(null);
    });

    document.addEventListener("mousedown", outside, true);
  });
}

/**
 * ⚠️ ARMED EXACTLY ONCE PER PAGE LIFETIME. Hot reload re-executes the
 * module, and without this mark the handlers stacked up: one click opened
 * three fields on top of each other and the page eventually locked up.
 *
 * The mark lives on `window`, not in the module: after a reload the module
 * is new and so are its variables. Only what lives outside survives.
 */
const ONCE = "__agentUiKitStarted";

function held(event) {
  return OPTIONS.key === "alt"
    ? event.altKey
    : OPTIONS.key === "ctrl"
      ? event.ctrlKey
      : event.metaKey;
}

function start() {
  if (window[ONCE]) return;
  window[ONCE] = true;

  let frame = null;
  let asking = false;

  const clear = () => {
    frame?.remove();
    frame = null;
  };

  document.addEventListener(
    "mousemove",
    (event) => {
      if (asking) return;
      if (!held(event)) return clear();
      const node = document.elementFromPoint(event.clientX, event.clientY);
      clear();
      if (!node) return;
      frame = frameFor(node);
      document.body.append(frame);
    },
    true,
  );

  document.addEventListener("keyup", () => {
    if (!asking) clear();
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!held(event) || asking) return;
      const node = event.target;
      if (!node) return;

      // The modifier-click belongs to us entirely: the application must not
      // hear it, or a note about a button would also press that button.
      event.preventDefault();
      event.stopPropagation();

      asking = true;
      void (async () => {
        const text = await ask(node);
        asking = false;
        clear();
        if (!text) return;

        const note = { text, where: ownersOf(node), url: location.pathname, ...describe(node) };
        try {
          const answer = await fetch(OPTIONS.route, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(note),
          });
          // Say it out loud on success too: silence is indistinguishable
          // from loss, and loss is precisely what we already missed once.
          if (answer.ok) console.info(`[agent-ui-kit] noted: ${text} → ${note.where ?? note.tag}`);
          else console.warn(`[agent-ui-kit] not saved: server answered ${answer.status}`);
        } catch {
          console.warn("[agent-ui-kit] not sent: the dev server did not answer");
        }
      })();
    },
    true,
  );

  console.info(`[agent-ui-kit] on — hold ${OPTIONS.key} to highlight, ${OPTIONS.key}+click to leave a note`);
}

start();
