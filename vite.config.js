import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      workbox: {
        // Pre-cache the app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Runtime caching strategies
        runtimeCaching: [
          {
            // Static assets — CacheFirst for fast repeat loads
            urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // Google Fonts — CacheFirst (immutable CDN resources)
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
          {
            // API calls — NetworkOnly: NEVER cache financial data
            urlPattern: /\/api\/v1\/.*/i,
            handler: 'NetworkOnly',
          },
        ],

        // SPA fallback for navigation requests
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },

      manifest: {
        id: '/',
        name: 'CredoWallet',
        short_name: 'CredoWallet',
        description: 'Premium personal wealth management console to track incomes, expenses, budgets, AI insights, and friends ledger.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#09090b',
        background_color: '#fafafa',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      'sonner': path.resolve(__dirname, 'src/utils/toast.js'),
    }
  },
})
