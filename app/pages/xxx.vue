<template>
  <v-container>
    <FileUpload @upload="handleFileUpload" />
    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col
            v-for="(image, index) in imageList"
            :key="index"
            cols="12"
            sm="6"
            md="4"
            class="d-flex"
          >
            <v-card class="flex-grow-1">
              <ImageThumbnail :modelValue="image" @image-clicked="openModal" />
              <v-card-actions>
                <v-btn
                  icon="mdi-content-copy"
                  variant="text"
                  @click="duplicateImage(index)"
                ></v-btn>
                <v-btn
                  icon="mdi-arrow-up"
                  variant="text"
                  @click="moveImage(index, -1)"
                  :disabled="index === 0"
                ></v-btn>
                <v-btn
                  icon="mdi-arrow-down"
                  variant="text"
                  @click="moveImage(index, 1)"
                  :disabled="index === imageList.length - 1"
                ></v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- モーダルをv-modelで管理 -->
    <v-dialog v-model="modalOpen" max-width="800px">
      <ImageCanvas
        v-if="selectedIndex !== -1"
        :imageObj="imageList[selectedIndex]"
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

const imageList = ref<ImageDataObject[]>([]); // 画像オブジェクトの配列
const modalOpen = ref(false); // モーダルの開閉状態
const selectedIndex = ref<number>(-1);

// 画像がアップロードされたときに呼ばれる関数
const handleFileUpload = (imageData: ImageDataObject) => {
  imageList.value.unshift(imageData); // 配列の先頭に追加
};

// サムネイルがクリックされたときにモーダルを開く
const openModal = (imageData: ImageDataObject) => {
  const index = imageList.value.findIndex((img) => img === imageData);
  if (index !== -1) {
    selectedIndex.value = index;
    modalOpen.value = true;
  }
};

// 画像を複製する
const duplicateImage = (index: number) => {
  const imageToDuplicate = imageList.value[index];
  const duplicatedImage = { ...imageToDuplicate }; // 浅いコピーを作成
  imageList.value.splice(index + 1, 0, duplicatedImage);
};

// 画像の位置を移動する
const moveImage = (index: number, direction: number) => {
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < imageList.value.length) {
    const temp = imageList.value[index];
    imageList.value[index] = imageList.value[newIndex];
    imageList.value[newIndex] = temp;
  }
};

// 編集が保存されたときに呼ばれる関数
const handleSave = (updatedImageObj: ImageDataObject) => {
  if (selectedIndex.value !== -1) {
    imageList.value[selectedIndex.value] = updatedImageObj;
  }
  modalOpen.value = false;
  selectedIndex.value = -1;
};
</script>

<style scoped>
/* 必要に応じてスタイルを追加 */
.v-card-actions {
  justify-content: center;
}
</style>
