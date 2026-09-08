import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Пример подключается к пакету из этой же папки, а не из реестра: правка в
// src/ видна здесь сразу, без публикации версии.
import { agentUiKit } from "../src/index.js";

export default defineConfig({
  plugins: [react(), agentUiKit({ file: "NOTES.md" })],
});
