<template>
  <v-dialog
    :model-value="modelValue"
    width="600"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h5 pa-4">{{ t("help.title") }}</v-card-title>
      <v-card-text class="pa-4">
        <v-list>
          <v-list-subheader>{{ t("help.note.title") }}</v-list-subheader>
          <v-list-item>
            <v-list-item-title>
              <a
                href="https://note.com/fancy_gerbil880/n/nfc61eeac0841"
                target="_blank"
                rel="noopener"
              >
                {{ t("help.note.content") }}
              </a>
            </v-list-item-title>
          </v-list-item>

          <v-list-subheader>{{ t("help.upload.title") }}</v-list-subheader>
          <v-list-item>
            <v-list-item-title
              v-html="t('help.upload.content')"
            ></v-list-item-title>
          </v-list-item>

          <v-list-subheader>{{ t("help.layers.title") }}</v-list-subheader>
          <v-list-item>
            <v-list-item-title
              v-html="t('help.layers.content')"
            ></v-list-item-title>
          </v-list-item>

          <v-list-subheader>{{ t("help.edit.title") }}</v-list-subheader>
          <v-list-item>
            <v-list-item-title
              v-html="t('help.edit.content')"
            ></v-list-item-title>
          </v-list-item>

          <v-list-subheader>{{ t("help.preview.title") }}</v-list-subheader>
          <v-list-item>
            <v-list-item-title
              v-html="t('help.preview.content')"
            ></v-list-item-title>
          </v-list-item>

          <v-list-subheader>{{ t("help.export.title") }}</v-list-subheader>
          <v-list-item>
            <v-list-item-title
              v-html="t('help.export.content')"
            ></v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          @click="$emit('update:modelValue', false)"
        >
          {{ t("buttons.close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<style scoped>
.v-list-item-title {
  white-space: pre-line;
}

.v-list-item-title a {
  color: inherit;
  text-decoration: underline;
}
</style>
