import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@scenes": path.resolve(__dirname, "src/scenes"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@web3": path.resolve(__dirname, "src/web3"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
