import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src")
    }
  },
  base: "/static/",
  build: {
    manifest: "manifest.json",
    outDir: path.resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        index: "./src/index.jsx"
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      // Proxy API requests to Django backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
