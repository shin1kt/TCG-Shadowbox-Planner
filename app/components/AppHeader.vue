<template>
  <v-app-bar>
    <v-container class="d-flex align-center">
      <v-app-bar-title>{{ t("header.title") }}</v-app-bar-title>
      <v-spacer></v-spacer>
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
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import HelpDialog from "./HelpDialog.vue";

const dialog = ref(false);
const { t, locale, locales } = useI18n();

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
