<template>
  <v-card>
    <v-card-actions>
      <v-btn
        :prepend-icon="isEraseMode ? 'mdi-eraser' : 'mdi-arrow-all'"
        variant="text"
        @click="toggleEraseMode"
        class="erase-mode-button ml-2"
        :aria-label="
          isEraseMode ? t('buttons.eraseMode') : t('buttons.moveMode')
        "
        >{{ isEraseMode ? "編集中" : "移動" }}
      </v-btn>

      <v-tooltip
        :text="t('imageCanvas.zoomIn')"
        :touch="false"
        class="desktop-only"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-magnify-plus"
            size="small"
            :disabled="scale === 2"
            @click="zoomIn"
            class="zoom-button ml-2"
            :aria-label="t('imageCanvas.zoomIn')"
          >
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip
        :text="t('imageCanvas.zoomOut')"
        :touch="false"
        class="desktop-only"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-magnify-minus"
            size="small"
            :disabled="scale === 1"
            @click="zoomOut"
            class="zoom-button ml-2"
            :aria-label="t('imageCanvas.zoomOut')"
          >
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip
        :text="t('imageCanvas.undo')"
        :touch="false"
        class="desktop-only"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-undo"
            size="small"
            :disabled="undoCounts.length === 0"
            @click="undo(1)"
            class="undo-button ml-2"
            :aria-label="t('imageCanvas.undo')"
          >
          </v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
    <v-card-title class="text-subtitle-1 d-flex flex-row align-center">
      <v-text-field
        v-model="title"
        variant="plain"
        hide-details
        density="compact"
        class="pa-0 flex-grow-1"
        @update:model-value="updateTitle"
      ></v-text-field>
    </v-card-title>

    <v-card-text class="canvas-container pa-0">
      <div class="canvas-scroll-container">
        <div class="canvas-wrapper">
          <canvas
            ref="canvasRef"
            :width="canvasWidth"
            :height="canvasHeight"
            :class="['checkered-background', { 'erase-cursor': isEraseMode }]"
            :style="{
              width: `${canvasWidth * scale}px`,
              height: `${canvasHeight * scale}px`,
              display: 'block',
            }"
          ></canvas>
        </div>
      </div>
    </v-card-text>
    <v-card-text>
      <div class="erase-size-container">
        <div class="d-flex">
          <div>{{ t("canvas.eraserSize") }}:</div>
          <div class="position-relative pl-4">
            <div
              ref="eraseSizeRef"
              class="erase-size-preview"
              :style="eraseSizeStyle"
            ></div>
          </div>
        </div>
        <v-slider v-model="eraseRadius"></v-slider>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="saveEdits" color="primary">{{ t("buttons.save") }}</v-btn>
      <v-btn @click="closeDialog" color="secondary">{{
        t("buttons.cancel")
      }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, onUnmounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ErasePaths, ImageDataObject } from "@/types/imageData"; // 型をインポート
import { useImageObject } from "@/composables/useImageObject";

const { t } = useI18n();

const props = defineProps<{
  imageObj: ImageDataObject; // 画像オブジェクトを受け取る
  canvasWidth: number;
  canvasHeight: number;
}>();

const emit = defineEmits<{
  (event: "save", imageObj: ImageDataObject): void; // 編集後の画像を親に送信
  (event: "close"): void; // モーダルを閉じるイベント
}>();

const title = ref("");

const originData = ref<ImageDataObject | null>(null); // 元の画像データを保持
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const eraseRadius = ref(10); // 消去サイズの初期値
const eraseSizeRef = ref<HTMLDivElement | null>(null); // 消去サイズの表示用
const isErasing = ref(false); // マウスボタンが押されているかどうかを追跡

const undoCounts = ref<number[]>([]);
const currentEraseCount = ref(0); // 現在の消去作業のカウントを保持する変数を追加

const scale = ref(1);

const isEraseMode = ref(true); // デフォルトで消去モードON

// キャンバスの実際のサイズと表示サイズの比率を計算
const canvasScale = computed(() => {
  if (!canvasRef.value || !originData.value) return { scaleX: 1, scaleY: 1 };

  const rect = canvasRef.value.getBoundingClientRect();
  return {
    scaleX: (originData.value.width * scale.value) / rect.width,
    scaleY: (originData.value.height * scale.value) / rect.height,
  };
});

// 動的な削除サイズのスタイルのみを計算
const eraseSizeStyle = computed(() => {
  const size = eraseRadius.value / canvasScale.value.scaleX;
  return {
    width: `${size * 2}px`,
    height: `${size * 2}px`,
  } as const;
});

// キャンバスの背景パターンを描画
const drawBackground = () => {
  if (!ctx.value || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const context = ctx.value;

  // キャンバスをクリアするときは完全な透明に
  context.clearRect(0, 0, canvas.width, canvas.height);
};

// キャンバスの再描画処理を修正
const redrawCanvas = () => {
  if (!ctx.value || !originData.value) return;

  const { redraw } = useImageObject(ctx.value);
  drawBackground(); // 背景をクリア
  redraw(originData.value); // 画像を描画
};

// キャンバス描画の初期化
onMounted(() => {
  ctx.value = canvasRef.value?.getContext("2d") || null;

  if (!ctx.value) {
    console.error("Failed to get canvas context");
    return;
  }

  originData.value = {
    ...props.imageObj,
    erasePaths: [...props.imageObj.erasePaths],
  };

  title.value = originData.value.title || "Image Editing (Transparency)";

  const { initCanvas } = useImageObject(ctx.value);
  initCanvas(originData.value);
  redrawCanvas(); // 修正した再描画関数を使用

  if (canvasRef.value) {
    startErase();
  }
});

// 消去処理の後の再描画を修正
const handleErase = (
  mouseX: number,
  mouseY: number,
  isNewPath: boolean = false
) => {
  if (!ctx.value) return;
  const { erase } = useImageObject(ctx.value);

  if (!originData.value) return;
  erase(originData.value, mouseX, mouseY, eraseRadius.value, isNewPath);
  redrawCanvas(); // 修正した再描画関数を使用
};

// Undo処理の後の再描画を修正
const undo = (count: number = 1) => {
  if (!originData.value) return;
  if (!ctx.value) return;
  const { undo } = useImageObject(ctx.value);

  const length = undoCounts.value.length;
  const undoCountsArray = undoCounts.value.slice(length - count, length);
  const undoCountsSum = undoCountsArray.reduce((acc, curr) => acc + curr, 0);

  undoCounts.value = undoCounts.value.slice(0, length - count);

  undo(originData.value, undoCountsSum);
  redrawCanvas(); // 修正した再描画関数を使用
};

// 編集後の画像を親コンポーネントに返す
const saveEdits = async () => {
  if (!ctx.value || !originData.value) return;

  const { updateEditedDataURL } = useImageObject(ctx.value);
  await updateEditedDataURL(originData.value);
  emit("save", originData.value);
};

// モーダルを閉じる処理
const closeDialog = () => {
  emit("close");
};

// 画像が変更されるたびに描画
watch(
  () => originData.value,
  () => {
    if (ctx.value) {
      const { redraw } = useImageObject(ctx.value);

      if (!originData.value) return; // 元データが存在しない場合は処理を中止
      redraw(originData.value); // 再描画
    }
  }
);

// 消去モードの切り替え
const toggleEraseMode = () => {
  isEraseMode.value = !isEraseMode.value;
};

// キャンバスの消去処理（クリックした部分を透過）
const handleEraseMouse = (
  event: MouseEvent | TouchEvent,
  isNewPath: boolean = false
) => {
  if (!isEraseMode.value || !isErasing.value) return;

  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect || !ctx.value || !originData.value) return;

  let clientX: number;
  let clientY: number;

  if (event instanceof TouchEvent) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  // スケールを考慮した座標計算
  const mouseX =
    ((clientX - rect.left) * canvasScale.value.scaleX) / scale.value;
  const mouseY =
    ((clientY - rect.top) * canvasScale.value.scaleY) / scale.value;

  handleErase(mouseX, mouseY, isNewPath);
};

// 高階関数でガード節を共通化
const withEraseModeGuard = (handler: Function) => (event?: any) => {
  if (!isEraseMode.value) return;
  handler(event);
};

// マウスダウン・マウスムーブ・マウスアップイベントで消去処理を行う
const startErase = () => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;

  const handleMouseDown = withEraseModeGuard((event: MouseEvent) => {
    isErasing.value = true;
    handleEraseMouse(event, true);
    currentEraseCount.value = 1;
  });

  const handleMouseMove = withEraseModeGuard((event: MouseEvent) => {
    if (isErasing.value) {
      handleEraseMouse(event, false);
      currentEraseCount.value++;
    }
  });

  const handleEndErase = () => {
    isErasing.value = false;
    if (currentEraseCount.value > 0) {
      undoCounts.value.push(currentEraseCount.value);
    }
    currentEraseCount.value = 0;
  };

  const handleMouseUp = withEraseModeGuard(handleEndErase);
  const handleMouseOut = withEraseModeGuard(handleEndErase);

  const handleTouchStart = (event: TouchEvent) => {
    if (!isEraseMode.value) return;
    event.preventDefault();
    isErasing.value = true;
    handleEraseMouse(event, true);
    currentEraseCount.value = 1;
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isEraseMode.value) return;
    event.preventDefault();
    if (isErasing.value) {
      handleEraseMouse(event, false);
      currentEraseCount.value++;
    }
  };

  const handleTouchEnd = () => {
    if (!isEraseMode.value) return;
    isErasing.value = false;
    if (currentEraseCount.value > 0) {
      undoCounts.value.push(currentEraseCount.value);
    }
    currentEraseCount.value = 0;
  };

  // マウスイベントリスナーを追加
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseout", handleMouseOut);

  // タッチイベントリスナーを追加
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd);
  canvas.addEventListener("touchcancel", handleTouchEnd);

  // コンポーネントのクリーンアップ時にイベントリスナーを削除
  onUnmounted(() => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mouseout", handleMouseOut);

    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchmove", handleTouchMove);
    canvas.removeEventListener("touchend", handleTouchEnd);
    canvas.removeEventListener("touchcancel", handleTouchEnd);
  });
};

// キャンバスのサイズが変更されたときに再描画
watch([() => props.canvasWidth, () => props.canvasHeight], () => {
  if (ctx.value && originData.value) {
    const { redraw } = useImageObject(ctx.value);
    redraw(originData.value);
  }
});

// タイトルが更新されたときの処理
const updateTitle = (newTitle: string) => {
  if (originData.value) {
    originData.value.title = newTitle;
  }
};

const zoomIn = () => {
  if (scale.value < 2) {
    scale.value = 2;
    redrawCanvas();
  }
};

const zoomOut = () => {
  if (scale.value > 1) {
    scale.value = 1;
    redrawCanvas();
  }
};
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
  display: block;
}
canvas.checkered-background {
  background-color: transparent !important;
}
.erase-cursor {
  cursor: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"%3E%3Ccircle cx="25" cy="25" r="25" fill="rgba(0, 0, 0, 0.5)" /%3E%3C/svg%3E'),
    auto;
}
.canvas-container {
  overflow: hidden;
  position: relative;
  height: 70vh;
  padding: 0;
  margin: 0;
}
.canvas-scroll-container {
  overflow: auto;
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}
.canvas-wrapper {
  min-width: max-content;
  min-height: max-content;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  margin: 0 auto;
}
.erase-size-container {
  position: relative;
  min-height: 50px; /* プレビューの高さ分の余白を確保 */
}
.erase-size-preview {
  position: absolute;
  left: 0;
  top: 0.2em;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
.zoom-button,
.erase-mode-button,
.undo-button {
  background-color: #f5f5f5 !important;
}
@media (hover: none) and (pointer: coarse) {
  .desktop-only {
    display: none !important;
  }
}
</style>
