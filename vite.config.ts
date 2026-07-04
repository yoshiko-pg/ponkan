import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
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
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
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
