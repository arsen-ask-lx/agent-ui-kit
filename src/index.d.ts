import type { Plugin } from "vite";

export interface AgentUiKitOptions {
  /** Where notes are collected. Default: `NOTES.md` in the project root. */
  file?: string;
  /** Which key to hold while pointing. Default: `alt`. */
  key?: "alt" | "ctrl" | "meta";
  /** Highlight colour. Default: `#e5484d`. */
  color?: string;
  /** Placeholder in the note field. */
  placeholder?: string;
  /** Where the browser posts notes. Change only on a collision. */
  route?: string;
}

export function agentUiKit(options?: AgentUiKitOptions): Plugin;
export default agentUiKit;
