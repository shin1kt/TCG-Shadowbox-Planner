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
</style>
