// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// デフォルトのGoogle Analytics ID
const DEFAULT_GA_ID = "G-XXXXXXXXXX"; // ここに本番環境で使用するIDを設定

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  build: {
    transpile: ["vuetify"],
  },
  // GitHub Pagesのベースパスを設定
  app: {
    baseURL: "/TCG-Shadowbox-Planner/",
  },
  // 静的サイト生成の設定
  ssr: true,
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    "@nuxt/eslint",
    "@nuxt/test-utils",
    "nuxt-gtag",
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
  gtag: {
    id: process.env.GOOGLE_ANALYTICS_ID || DEFAULT_GA_ID,
  },
});
