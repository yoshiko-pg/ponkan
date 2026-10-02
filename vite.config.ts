import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages (https://yoshiko-pg.github.io/ponkan/) 配信のためのサブパス
  base: "/ponkan/",
  server: {
    // preview環境からPORTが渡された場合はそれを使う
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "ponkan-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],
      manifest: {
        name: "PONKAN — museum stamp rally",
        short_name: "PONKAN",
        description: "関東近郊の水族館・美術館・博物館・科学館スタンプラリー",
        lang: "ja",
        theme_color: "#101013",
        background_color: "#101013",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // 拡張子つきURL(og-image.jpg等)はSPAフォールバックさせず実ファイルを返す
        navigateFallbackDenylist: [/\/[^/?]+\.[^/?]+$/],
        // 地図タイルはキャッシュしすぎないよう上限を設ける
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/basemaps\.cartocdn\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
});
