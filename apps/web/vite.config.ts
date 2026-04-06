import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3001,
    strictPort: true,
    hmr: {
      host: "localhost",
      port: 3001,
      protocol: "ws",
      clientPort: 3001,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3002,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@algoscope/shared-types": path.resolve(__dirname, "../../packages/shared-types/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
