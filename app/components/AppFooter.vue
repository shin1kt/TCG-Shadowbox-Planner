<script setup lang="ts">
import { version } from "~/package.json";

const openChangelog = () => {
  navigateTo(
    "https://github.com/shin1kt/TCG-Shadowbox-Planner/blob/main/CHANGELOG.md",
    {
      external: true,
    }
  );
};
</script>

<template>
  <v-footer class="d-flex flex-column">
    <div class="px-4 py-2 text-center w-100">
      <div class="mb-2">
        <small class="text-disabled">
          v{{ version }}
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-icon
                size="small"
                v-bind="props"
                class="ms-1"
                @click="openChangelog"
                style="cursor: pointer"
              >
                mdi-history
              </v-icon>
            </template>
            {{ $t("footer.showChangelog") }}
          </v-tooltip>
        </small>
      </div>
      <div class="mb-2">
        <small class="text-disabled">
          {{ $t("footer.disclaimer") }}
        </small>
      </div>
      <div class="mb-2">
        <small>
          <v-icon size="small">mdi-github</v-icon>
          <a
            href="https://github.com/shin1kt/TCG-Shadowbox-Planner"
            target="_blank"
            rel="noopener noreferrer"
            >shin1kt/TCG-Shadowbox-Planner</a
          >
        </small>
      </div>
      <div>
        <span>&copy; 2025 katacom.jp</span>
      </div>
    </div>
  </v-footer>
</template>
