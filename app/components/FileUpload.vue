<template>
  <v-card>
    <v-card-actions>
      <v-file-input
        :label="t('upload.label')"
        :accept="t('upload.accept')"
        @change="handleFileChange"
      ></v-file-input>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import type { ImageDataObject } from "@/types/imageData"; // 型をインポート
import { useImageObject } from "@/composables/useImageObject";

const { t } = useI18n();

const emit = defineEmits<{
  (event: "upload", imageObj: ImageDataObject): void; // 型を使用してイベントを定義
}>();

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvasWidth = 500;
        const canvasHeight = 500;

        let width = img.width;
        let height = img.height;

        // アスペクト比を保ってリサイズ
        if (width > height) {
          if (width > canvasWidth) {
            height = Math.round((canvasWidth / width) * height);
            width = canvasWidth;
          }
        } else {
          if (height > canvasHeight) {
            width = Math.round((canvasHeight / height) * width);
            height = canvasHeight;
          }
        }

        // useImageObjectを呼び出してImageDataObjectを作成
        // const { erasePaths, redraw, erase, getThumbnail } = useImageObject(
        //   img,
        //   width,
        //   height
        // );

        const imageData: ImageDataObject = {
          img,
          width,
          height,
          erasePaths: [],
          editedDataUrl: img.src,
          title: file.name,
        };

        // ImageObjectをemit
        emit("upload", imageData); // 型付きでイベントをemit
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file); // ファイルをDataURLとして読み込む
  }
};
</script>
