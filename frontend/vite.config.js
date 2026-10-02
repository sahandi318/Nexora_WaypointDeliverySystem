import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Waypoint Group Driver',
        short_name: 'Waypoint Driver',
        description: 'Waypoint Group delivery driver application',
        theme_color: '#007d67',
        background_color: '#f0fbf6',
        display: 'standalone',
        start_url: '/driver',
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
