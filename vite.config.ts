/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt', not 'autoUpdate': reloading by itself would cut off a protocol in progress (see UpdatePrompt.tsx).
      registerType: 'prompt',
      injectRegister: false,
      includeManifestIcons: false,
      manifest: {
        name: 'ALERTA+',
        short_name: 'ALERTA+',
        description: 'Guía de emergencia paso a paso',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#102A43',
        theme_color: '#D32F2F',
        lang: 'es-CO',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Está temblando', url: '/sismo' },
          { name: 'Tengo una emergencia', url: '/emergencia' },
          { name: 'Necesito ayuda', url: '/nucleo/avisar/ayuda' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest,txt}'],
        navigateFallback: '/index.html',
        // The API never goes through the service worker (plan section 8).
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  // Development: the Worker runs on its own port (`npm run dev:api`); in production it shares the domain.
  // API_URL lets the end-to-end tests point at their own Worker.
  server: { proxy: { '/api': process.env.API_URL ?? 'http://localhost:8787' } },
  preview: { proxy: { '/api': process.env.API_URL ?? 'http://localhost:8787' } },
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
