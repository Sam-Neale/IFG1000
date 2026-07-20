import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: fileURLToPath(new URL("src/main/index.ts", import.meta.url)),
          "computer-host": fileURLToPath(new URL("src/main/computer-host.ts", import.meta.url)),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: fileURLToPath(new URL("src/renderer", import.meta.url)),
    plugins: [react()],
    resolve: {
      alias: {
        "@ifg1000/g1000-ui": fileURLToPath(
          new URL("../../packages/g1000-ui/src/index.ts", import.meta.url),
        ),
        "@renderer": fileURLToPath(new URL("src/renderer", import.meta.url)),
        "@desktop": projectRoot,
      },
    },
  },
});
