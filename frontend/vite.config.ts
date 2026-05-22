import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local `vite` dev, proxy /api to the Bun backend so the SPA can use
// relative URLs (matching the nginx proxy behaviour in production).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
