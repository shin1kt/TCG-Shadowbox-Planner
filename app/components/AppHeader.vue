<template>
  <v-app-bar>
    <v-container class="d-flex align-center">
      <v-app-bar-title>{{ t("header.title") }}</v-app-bar-title>
      <v-spacer></v-spacer>

      <!-- メニューボタンを追加 -->
      <v-btn icon @click="toggleMenu" class="mr-2">
        <v-icon>mdi-menu</v-icon>
      </v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-translate</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="locale in availableLocales"
            :key="locale.code"
            :value="locale.code"
            :active="locale.code === currentLocale"
            @click="switchLanguage(locale.code)"
          >
            <template v-slot:prepend>
              <span class="mr-2">{{ locale.code === "ja" ? "🇯🇵" : "🇺🇸" }}</span>
            </template>
            <v-list-item-title>{{ locale.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn icon class="ml-2" @click="dialog = true">
        <v-icon>mdi-help-circle</v-icon>
      </v-btn>
      <HelpDialog v-model="dialog" />
    </v-container>
  </v-app-bar>

  <!-- ドロアーメニュー -->
  <v-navigation-drawer
    v-model="isMenuOpen"
    location="right"
    temporary
    width="280"
  >
    <v-list>
      <v-list-item>
        <v-list-item-title class="text-h6">
          {{ t("menu.title") }}
        </v-list-item-title>
      </v-list-item>
      <v-divider></v-divider>

      <!-- データの保存 -->
      <v-list-item
        @click="exportToJSON"
        :disabled="imageList.length === 0"
        prepend-icon="mdi-content-save"
      >
        <v-list-item-title>{{ t("menu.saveData") }}</v-list-item-title>
      </v-list-item>

      <!-- データの読み込み -->
      <v-list-item @click="triggerJSONImport" prepend-icon="mdi-folder-open">
        <v-list-item-title>{{ t("menu.loadData") }}</v-list-item-title>
      </v-list-item>

      <v-divider class="my-2"></v-divider>

      <!-- PDFでダウンロード -->
      <v-list-item
        @click="exportToPDF"
        :disabled="imageList.length === 0"
        prepend-icon="mdi-file-pdf-box"
      >
        <v-list-item-title>{{ t("menu.downloadPDF") }}</v-list-item-title>
      </v-list-item>

      <!-- 画面をリセット -->
      <v-list-item
        @click="resetAll"
        :disabled="imageList.length === 0"
        prepend-icon="mdi-refresh"
        class="text-error"
      >
        <v-list-item-title>{{ t("menu.reset") }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <!-- 隠しファイル入力 -->
  <input
    ref="jsonFileInput"
    type="file"
    accept=".json"
    style="display: none"
    @change="handleJSONImport"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import HelpDialog from "./HelpDialog.vue";

const dialog = ref(false);
const { t, locale, locales } = useI18n();

// アプリメニューの機能をインポート
const {
  isMenuOpen,
  jsonFileInput,
  imageList,
  toggleMenu,
  exportToPDF,
  exportToJSON,
  triggerJSONImport,
  handleJSONImport,
  resetAll,
} = useAppMenu();

type LocaleCode = "ja" | "en";

const availableLocales = computed(() => {
  return locales.value as Array<{ code: LocaleCode; name: string }>;
});

const currentLocale = computed(() => locale.value);

const switchLanguage = (code: LocaleCode) => {
  locale.value = code;
};
</script>

<style scoped>
.v-list-item-title {
  white-space: pre-line;
}

.v-app-bar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
