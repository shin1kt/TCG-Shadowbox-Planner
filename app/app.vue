<template>
  <v-app>
    <AppHeader />
    <v-main>
      <v-container>
        <NuxtPage />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppHeader from "~/components/AppHeader.vue";
</script>

<style>
.v-application {
  background: #f5f5f5;
}

.v-footer {
  background-color: rgb(var(--v-theme-surface));
}

.text-disabled {
  opacity: 0.7;
}
</style>
