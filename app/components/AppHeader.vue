<template>
  <v-app-bar>
    <v-container class="d-flex align-center">
      <v-app-bar-title>TCG Shadowbox</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn-group>
        <v-btn
          size="small"
          :color="locale === 'ja' ? 'primary' : ''"
          @click="locale = 'ja'"
        >
          日本語
        </v-btn>
        <v-btn
          size="small"
          :color="locale === 'en' ? 'primary' : ''"
          @click="locale = 'en'"
        >
          English
        </v-btn>
      </v-btn-group>
    </v-container>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { locale } = useI18n();
</script>
