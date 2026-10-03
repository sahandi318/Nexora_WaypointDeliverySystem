import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      devOptions: {
        enabled: true,
      },

      manifest: {
        name: "Nexora Waypoint Delivery System",
        short_name: "Waypoint",
        description:
          "Waypoint Group delivery planning and operations system",

        theme_color: "#007d67",
        background_color: "#f0fbf6",

        display: "standalone",

        start_url: "/",
      },

      workbox: {
        navigateFallback: "index.html",

        globPatterns: [
          "**/*.{js,css,html,png,svg,ico,jpg,jpeg,webp}",
        ],
      },
    }),
  ],

  server: {
    port: 5173,
  },
});