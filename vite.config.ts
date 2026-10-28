import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'เครื่องสุ่มหวย',
        short_name: 'สุ่มหวย',
        description: 'สุ่มเลข 2 → 3 → 6 ตัว พร้อมประวัติและรูปแชร์ ใช้ได้แม้ออฟไลน์',
        lang: 'th',
        id: './',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#e9edf5',
        theme_color: '#c4122f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,png,woff,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
});
