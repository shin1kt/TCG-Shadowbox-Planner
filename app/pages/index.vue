<template>
  <v-container>
    <v-row>
      <v-col cols="auto">
        <v-btn
          color="primary"
          @click="exportToPDF"
          :disabled="imageList.length === 0"
          size="small"
          density="compact"
        >
          {{ t("buttons.exportPDF") }}
        </v-btn>
        <v-btn
          color="error"
          class="ml-2"
          @click="resetAll"
          :disabled="imageList.length === 0"
          size="small"
          density="compact"
        >
          {{ t("buttons.reset") }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <FileUpload @upload="handleFileUpload" />
      </v-col>
    </v-row>

    <v-tabs v-model="activeTab" class="mb-4" :touch="false">
      <v-tab value="grid">{{ t("tabs.layerEdit") }}</v-tab>
      <v-tab value="stack">{{ t("tabs.3dView") }}</v-tab>
    </v-tabs>

    <v-window v-model="activeTab" :touch="false">
      <!-- Grid View -->
      <v-window-item value="grid">
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col
                v-for="(image, index) in imageList"
                :key="index"
                cols="12"
                class="d-flex px-4"
              >
                <v-card class="flex-grow-1">
                  <v-card-text>
                    <ImageThumbnail
                      :modelValue="image"
                      @image-clicked="openModal"
                    />
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      icon="mdi-content-copy"
                      variant="text"
                      @click="duplicateImage(index)"
                      :title="t('buttons.duplicate')"
                    ></v-btn>
                    <v-btn
                      icon="mdi-arrow-up"
                      variant="text"
                      @click="moveImage(index, -1)"
                      :disabled="index === 0"
                      :title="t('buttons.moveUp')"
                    ></v-btn>
                    <v-btn
                      icon="mdi-arrow-down"
                      variant="text"
                      @click="moveImage(index, 1)"
                      :disabled="index === imageList.length - 1"
                      :title="t('buttons.moveDown')"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      @click="deleteImage(index)"
                      :title="t('buttons.delete')"
                    ></v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Stack View -->
      <v-window-item value="stack">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <LayeredImages
                  v-model="imageList"
                  ref="layeredImagesRef"
                  :selected-indices="selectedStackImages"
                />
              </v-card-text>
              <v-card-actions class="layer-buttons">
                <v-container class="pa-2">
                  <v-row dense>
                    <v-col
                      cols="12"
                      v-for="(image, index) in imageList"
                      :key="image.id"
                    >
                      <v-btn
                        size="small"
                        block
                        class="mb-1"
                        :color="
                          selectedStackImages.includes(index) ? 'primary' : ''
                        "
                        :variant="
                          selectedStackImages.includes(index)
                            ? 'elevated'
                            : 'outlined'
                        "
                        @click="toggleStackImage(index)"
                      >
                        {{ image.title }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-container>
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
import { useI18n } from "vue-i18n";
import { v4 as uuidv4 } from "uuid";
import type { ImageDataObject } from "@/types/imageData"; // 型をインポート

const { t } = useI18n();

const imageList = ref<ImageDataObject[]>([]); // 画像オブジェクトの配列
const modalOpen = ref(false); // モーダルの開閉状態
const selectedIndex = ref<number>(-1);
const activeTab = ref("grid");
const selectedStackImages = ref<number[]>([]); // 選択されたレイヤーのインデックスを配列で管理
const layeredImagesRef = ref<{ redraw: () => void } | null>(null);

let jsPDF: any = null;

// 画像リストの変更を監視
watch(
  imageList,
  (newList) => {
    // 画像が追加された場合は、その画像を選択状態にする
    if (newList.length > 0) {
      const currentIndices = new Set(selectedStackImages.value);
      const allIndices = Array.from({ length: newList.length }, (_, i) => i);

      // まだ選択されていないインデックスを追加
      allIndices.forEach((index) => {
        if (!currentIndices.has(index)) {
          selectedStackImages.value.push(index);
        }
      });
    }
  },
  { deep: true }
);

// タブ変更時の処理を追加
watch(activeTab, (newTab) => {
  if (newTab === "stack") {
    // 次のティックで再描画を実行
    nextTick(() => {
      layeredImagesRef.value?.redraw();
    });
  }
});

// 画像がアップロードされたときに呼ばれる関数
const handleFileUpload = (imageData: ImageDataObject) => {
  // タイトルの重複をチェックし、ユニークなタイトルを生成
  let baseTitle = imageData.title;
  let newTitle = baseTitle;
  let counter = 1;

  while (imageList.value.some((img) => img.title === newTitle)) {
    newTitle = `${baseTitle} (${counter})`;
    counter++;
  }

  imageData.title = newTitle;
  imageList.value.unshift(imageData); // 配列の先頭に追加

  // 新しい画像を選択状態に追加
  selectedStackImages.value = [
    0,
    ...selectedStackImages.value.map((i) => i + 1),
  ];
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
  const duplicatedImage = {
    ...imageToDuplicate,
    id: uuidv4(), // 新しいIDを生成
    title: `${imageToDuplicate.title} (copy)`,
  };
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

// PDFエクスポート機能
const exportToPDF = async () => {
  if (!jsPDF) {
    const module = await import("jspdf");
    jsPDF = module.jsPDF;
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
  });

  for (let i = 0; i < imageList.value.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const img = imageList.value[i];
    const imgData = img.editedDataUrl || img.img.src;

    // ページサイズに合わせて画像のサイズを調整
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgRatio = img.height / img.width;

    let imgWidth = pageWidth;
    let imgHeight = imgWidth * imgRatio;

    if (imgHeight > pageHeight) {
      imgHeight = pageHeight;
      imgWidth = imgHeight / imgRatio;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
  }

  // モバイルデバイスでの互換性を向上させるため、Blobを使用
  try {
    const pdfBlob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    // モバイルデバイスでの処理
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "layered-images.pdf";
      link.click();

      // 一定時間後にBlobURLを解放
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } else {
      // デスクトップでの処理
      pdf.save("layered-images.pdf");
    }
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("PDFのエクスポートに失敗しました。もう一度お試しください。");
  }
};

// レイヤーの選択状態をトグルする関数
const toggleStackImage = (index: number) => {
  const currentIndex = selectedStackImages.value.indexOf(index);
  if (currentIndex === -1) {
    selectedStackImages.value.push(index);
  } else {
    selectedStackImages.value.splice(currentIndex, 1);
  }
};

const resetAll = () => {
  // 確認ダイアログを表示
  if (window.confirm(t("confirm.reset"))) {
    imageList.value = [];
    selectedIndex.value = -1;
    modalOpen.value = false;
    activeTab.value = "grid";
    selectedStackImages.value = []; // 選択状態もリセット
  }
};

// 初期状態ですべてのレイヤーを選択状態に
const initializeSelectedImages = () => {
  selectedStackImages.value = Array.from(
    { length: imageList.value.length },
    (_, i) => i
  );
};

onMounted(() => {
  initializeSelectedImages();
});
</script>

<style scoped>
/* 必要に応じてスタイルを追加 */
.v-card-actions {
  justify-content: center;
}

.v-window-item {
  height: 100%;
}

.layer-buttons {
  justify-content: center;
  max-height: 300px;
  overflow-y: auto;
}

.layer-buttons .v-container {
  padding: 8px !important;
}

.layer-buttons .v-btn {
  margin-bottom: 4px;
}
</style>
