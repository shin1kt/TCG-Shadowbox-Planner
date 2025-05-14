<template>
  <div>
    <div class="text-subtitle-1">
      {{ modelValue.title || t("canvas.defaultTitle") }}
    </div>
    <div class="d-flex justify-center">
      <v-img
        :src="thumbnail"
        alt="Thumbnail"
        class="mt-4 thumbnail-image"
        :width="imgWidth"
        :height="imgWidth"
        @click="handleClick"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ImageDataObject } from "@/types/imageData"; // 型をインポート

const props = defineProps<{
  modelValue: ImageDataObject; // 画像オブジェクト（型付き）
  imgWidth?: string; // 画像の幅を設定
}>();

const { t } = useI18n();

const emit = defineEmits<{
  (event: "image-clicked", imageObj: ImageDataObject): void; // クリックイベントで画像オブジェクトを親に送信
}>();

const thumbnail = computed(() => {
  if (props.modelValue) {
    return props.modelValue.editedDataUrl; // サムネイルURLを取得
  }
  return ""; // デフォルト値
});

// デフォルト値を設定
const imgWidth = props.imgWidth ?? "200px";
const imageHeight = computed(() => {
  if (props.modelValue) {
    return `${
      (parseInt(imgWidth) * props.modelValue.height) / props.modelValue.width
    }px`;
  }
  return "auto"; // デフォルト値
});

const handleClick = () => {
  console.log("clicked thubnail");
  emit("image-clicked", props.modelValue); // 画像をクリックした際に画像オブジェクトを親に送信
};
</script>
