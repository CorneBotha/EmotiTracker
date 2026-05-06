import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // When a new version is deployed, the service worker auto-refreshes.
      // User data in localStorage is NOT touched.
      manifest: {
        name: "EmoTracker",
        short_name: "EmoTracker",
        description: "Emotional awareness tracker",
        theme_color: "#0c0a09",
        background_color: "#0c0a09",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"]
      }
    })
  ]
});
