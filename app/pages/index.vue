<template>
  <v-container>
    <FileUpload @upload="handleFileUpload" />

    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="grid">レイヤー編集</v-tab>
      <v-tab value="stack">3D表示</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- グリッド表示 -->
      <v-window-item value="grid">
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
                  <ImageThumbnail
                    :modelValue="image"
                    @image-clicked="openModal"
                  />
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
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      @click="deleteImage(index)"
                    ></v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- スタック表示 -->
      <v-window-item value="stack">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <LayeredImages v-model="imageList" />
              </v-card-text>
              <v-card-actions>
                <v-row>
                  <v-col
                    v-for="(image, index) in imageList"
                    :key="index"
                    cols="auto"
                  >
                    <v-btn
                      size="small"
                      :color="index === selectedStackImage ? 'primary' : ''"
                      @click="selectedStackImage = index"
                    >
                      画像{{ index + 1 }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- モーダルの設定 -->
    <v-dialog v-model="modalOpen" max-width="90vw" max-height="90vh" scrollable>
      <ImageCanvas
        v-if="selectedIndex !== -1"
        :imageObj="imageList[selectedIndex]"
        :canvasWidth="calculateCanvasSize(imageList[selectedIndex]).width"
        :canvasHeight="calculateCanvasSize(imageList[selectedIndex]).height"
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
import LayeredImages from "@/components/LayeredImages.vue";

const imageList = ref<ImageDataObject[]>([]); // 画像オブジェクトの配列
const modalOpen = ref(false); // モーダルの開閉状態
const selectedIndex = ref<number>(-1);
const activeTab = ref("grid");
const selectedStackImage = ref(0);

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

// 画像を削除する
const deleteImage = (index: number) => {
  imageList.value.splice(index, 1);
  if (selectedIndex.value === index) {
    modalOpen.value = false;
    selectedIndex.value = -1;
  } else if (selectedIndex.value > index) {
    selectedIndex.value--;
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

// キャンバスサイズ計算ロジックを改善
const calculateCanvasSize = (imageObj: ImageDataObject) => {
  // カード要素とダイアログのパディングを考慮
  const dialogPadding = 48; // ダイアログの余白
  const cardPadding = 16; // カードの余白
  const totalPadding = dialogPadding + cardPadding * 2;

  // ビューポートの実効サイズを計算
  const maxWidth = Math.min(window.innerWidth - totalPadding, 1200);
  const maxHeight = Math.min(window.innerHeight - totalPadding, 800);

  const imageRatio = imageObj.height / imageObj.width;
  let width = maxWidth;
  let height = width * imageRatio;

  // 高さが最大値を超える場合は、高さを基準に計算
  if (height > maxHeight) {
    height = maxHeight;
    width = height / imageRatio;
  }

  // 最小サイズの設定
  width = Math.max(width, 280);
  height = Math.max(height, 200);

  return {
    width: Math.floor(width),
    height: Math.floor(height),
  };
};
</script>

<style scoped>
/* 必要に応じてスタイルを追加 */
.v-card-actions {
  justify-content: center;
}

.v-window-item {
  height: 100%;
}
</style>
