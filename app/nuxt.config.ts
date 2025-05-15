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
    head: {
      title: "TCG Shadowbox Planner",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          key: "description",
          name: "description",
          content: "TCGカードのシャドーボックスプランナー",
        },
        // OGP
        {
          key: "og:site_name",
          property: "og:site_name",
          content: "TCG Shadowbox Planner",
        },
        { key: "og:type", property: "og:type", content: "website" },
        {
          key: "og:url",
          property: "og:url",
          content: "https://shin1kt.github.io/TCG-Shadowbox-Planner/",
        },
        {
          key: "og:title",
          property: "og:title",
          content: "TCG Shadowbox Planner",
        },
        {
          key: "og:description",
          property: "og:description",
          content: "TCGカードのシャドーボックスプランナー",
        },
        {
          key: "og:image",
          property: "og:image",
          content: "https://shin1kt.github.io/TCG-Shadowbox-Planner/ogp.png",
        },
        // Twitter Card
        {
          key: "twitter:card",
          name: "twitter:card",
          content: "summary_large_image",
        },
      ],
    },
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
    "@nuxtjs/i18n",
    "nuxt-gtag",
  ],
  i18n: {
    langDir: "locales",
    locales: [
      { code: "ja", iso: "ja-JP", file: "ja.json", name: "日本語" },
      { code: "en", iso: "en-US", file: "en.json", name: "English" },
    ],
    defaultLocale: "ja",
    strategy: "prefix_except_default",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
  },
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
  css: ["@/assets/css/common.css"], // パスはapp/からの相対パスになります
});
