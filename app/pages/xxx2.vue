<template>
  <v-container>
    <FileUpload @upload="handleFileUpload" />
    <v-row>
      <v-col v-if="imageObj" cols="12" sm="6" md="4">
        <ImageThumbnail :modelValue="imageObj" @image-clicked="openModal" />
      </v-col>
    </v-row>

    <!-- モーダルをv-modelで管理 -->
    <v-dialog v-model="modalOpen" max-width="800px">
      <ImageCanvas
        v-if="imageObj"
        :imageObj="imageObj"
        :canvasWidth="500"
        :canvasHeight="500"
        @save="handleSave"
        @close="modalOpen = false"
      />
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { ImageDataObject } from "@/types/imageData"; // 型をインポート
import FileUpload from "@/components/FileUpload.vue";
import ImageThumbnail from "@/components/ImageThumbnail.vue";
import ImageCanvas from "@/components/ImageCanvas.vue";

let imageObj = ref<ImageDataObject | null>(null); // 画像オブジェクトの参照
let modalOpen = ref(false); // モーダルの開閉状態

// 画像がアップロードされたときに呼ばれる関数
const handleFileUpload = (imageData: ImageDataObject) => {
  imageObj.value = imageData; // アップロードされた画像データを保存
};

// サムネイルがクリックされたときにモーダルを開く
const openModal = (imageData: ImageDataObject) => {
  // console.log("open modal");
  imageObj.value = imageData; // 画像データを設定
  modalOpen.value = true; // モーダルを開く
};

// 編集が保存されたときに呼ばれる関数
const handleSave = (updatedImageObj: ImageDataObject) => {
  imageObj.value = updatedImageObj; // 編集後の画像を保存

  // const ctx = canvasRef.getContext("2d"); // キャンバスのコンテキストを取得
  // imageObj.value.setEditedDataUrl(ctx); // 編集後の画像データURLを設定

  modalOpen.value = false; // 編集後にモーダルを閉じる

  // const ctx = canvasRef.getContext("2d"); // キャンバスのコンテキストを取得
  // if (!ctx) return; // コンテキストが取得できない場合は処理を中止

  // // サムネイル更新処理
  // // const thumbnail = updatedImageObj.getThumbnail(ctx); // 編集後のサムネイルを取得
  // // imageObj.value = { ...imageObj.value }; // サムネイルを更新
  // imageObj.value = updatedImageObj;
};
</script>

<style scoped>
/* 必要に応じてスタイルを追加 */
</style>
