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
  base: process.env.NODE_ENV === "production" ? "/static/" : "/",
  build: {
    manifest: "manifest.json",
    outDir: path.resolve(__dirname, "dist")
    // rollupOptions: {
    //   input: {
    //     index: "./src/index.jsx"
    //   }
    // }
  },
  server: {
    port: 3000,
    host: process.env.PRIVATE_IP ?? "localhost",
    strictPort: true,
    proxy: {
      // Proxy API, admin, static and user-uploaded-file requests to Django backend
      "/api": {
        target: `http://${process.env.PRIVATE_IP ?? "localhost"}:8000`,
        changeOrigin: true,
        secure: false
      },
      "/admin": {
        target: `http://${process.env.PRIVATE_IP ?? "localhost"}:8000`,
        changeOrigin: true,
        secure: false
      },
      "/static": {
        target: `http://${process.env.PRIVATE_IP ?? "localhost"}:8000`,
        changeOrigin: true,
        secure: false
      },
      "/uploads": {
        target: `http://${process.env.PRIVATE_IP ?? "localhost"}:8000`,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
