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
            :disabled="scale === CONSTANTS.MAX_SCALE"
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
            :disabled="scale === CONSTANTS.MIN_SCALE"
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
            class="checkered-background"
            :style="{
              width: `${canvasWidth * scale}px`,
              height: `${canvasHeight * scale}px`,
              display: 'block',
              cursor: cursorStyle,
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

// 定数の定義
const CONSTANTS = {
  DEFAULT_ERASE_SIZE: "20px",
  CANVAS_BORDER_WIDTH: 1,
  DEFAULT_ERASE_RADIUS: 10,
  MAX_SCALE: 2,
  MIN_SCALE: 1,
  DEFAULT_SCALE: 1,
  DEFAULT_TITLE: "Image Editing (Transparency)",
} as const;

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
const eraseRadius = ref(CONSTANTS.DEFAULT_ERASE_RADIUS); // 消去サイズの初期値
const eraseSizeRef = ref<HTMLDivElement | null>(null); // 消去サイズの表示用
const isErasing = ref(false); // マウスボタンが押されているかどうかを追跡

const undoCounts = ref<number[]>([]);
const currentEraseCount = ref(0); // 現在の消去作業のカウントを保持する変数を追加

const scale = ref<number>(CONSTANTS.DEFAULT_SCALE);

const isEraseMode = ref(true); // デフォルトで消去モードON

// 動的な削除サイズのスタイルのみを計算
const eraseSizeStyle = computed(() => {
  if (!canvasRef.value)
    return {
      width: CONSTANTS.DEFAULT_ERASE_SIZE,
      height: CONSTANTS.DEFAULT_ERASE_SIZE,
    };

  const rect = canvasRef.value.getBoundingClientRect();
  const size = (eraseRadius.value * 2 * rect.width) / props.canvasWidth;
  return {
    width: `${size}px`,
    height: `${size}px`,
  } as const;
});

// 動的なカーソルスタイル
const cursorStyle = computed(() => {
  if (!isEraseMode.value) return "";

  const size = eraseRadius.value * 2 * scale.value;
  const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E%3Ccircle cx='${size / 2}' cy='${size / 2}' r='${size / 2}' fill='rgba(0, 0, 0, 0.5)' /%3E%3C/svg%3E`;
  return `url("${svg}") ${size / 2} ${size / 2}, auto`;
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
onMounted(async () => {
  ctx.value = canvasRef.value?.getContext("2d") || null;

  if (!ctx.value) {
    console.error("Failed to get canvas context");
    return;
  }

  // 画像をキャンバスサイズにリサイズ
  const resizedDataURL = await resizeImageToCanvasSize(
    props.imageObj.editedDataUrl,
    props.canvasWidth,
    props.canvasHeight,
  );

  originData.value = {
    ...props.imageObj,
    editedDataUrl: resizedDataURL,
    width: props.canvasWidth,
    height: props.canvasHeight,
    erasePaths: [...props.imageObj.erasePaths],
  };

  title.value = originData.value?.title || CONSTANTS.DEFAULT_TITLE;

  const { initCanvas } = useImageObject(ctx.value);
  if (originData.value) {
    initCanvas(originData.value);
    redrawCanvas(); // 修正した再描画関数を使用
  }

  if (canvasRef.value) {
    startErase();
  }
});

// 消去処理の後の再描画を修正
const handleErase = (
  mouseX: number,
  mouseY: number,
  isNewPath: boolean = false,
) => {
  if (!ctx.value) return;
  const { erase } = useImageObject(ctx.value);

  if (!originData.value) return;
  erase(originData.value, mouseX, mouseY, eraseRadius.value, isNewPath);
  redrawCanvas();
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
  redrawCanvas();
};

// 編集後の画像を親コンポーネントに返す
const saveEdits = async () => {
  if (!ctx.value || !originData.value) return;

  const { updateEditedDataURL } = useImageObject(ctx.value);
  await updateEditedDataURL(originData.value);

  // リサイズ済みの画像データを確実に送信
  const finalImageData = {
    ...originData.value,
    width: props.canvasWidth,
    height: props.canvasHeight,
  };

  emit("save", finalImageData);
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
  },
);

// 消去モードの切り替え
const toggleEraseMode = () => {
  isEraseMode.value = !isEraseMode.value;
};

// キャンバスの消去処理（クリックした部分を透過）
const handleEraseMouse = (
  event: MouseEvent | TouchEvent,
  isNewPath: boolean = false,
) => {
  if (!isEraseMode.value || !isErasing.value) return;

  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect || !ctx.value || !originData.value) {
    return;
  }

  let clientX: number;
  let clientY: number;

  // Safariでは TouchEvent がグローバルに存在しない場合があるため、
  // event.type でタッチイベントかどうかを判定
  const isTouchEvent = event.type.startsWith("touch");

  if (isTouchEvent) {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
    if (!touch) return;
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    const mouseEvent = event as MouseEvent;
    clientX = mouseEvent.clientX;
    clientY = mouseEvent.clientY;
  }

  // シンプルな座標変換
  const mouseX = ((clientX - rect.left) / rect.width) * props.canvasWidth;
  const mouseY = ((clientY - rect.top) / rect.height) * props.canvasHeight;

  handleErase(mouseX, mouseY, isNewPath);
};

// マウスダウン・マウスムーブ・マウスアップイベントで消去処理を行う
const startErase = () => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;

  const handleMouseDown = (event: MouseEvent) => {
    if (!isEraseMode.value) return;
    event.preventDefault();
    event.stopPropagation();
    isErasing.value = true;
    handleEraseMouse(event, true);
    currentEraseCount.value = 1;
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isEraseMode.value) return;
    if (isErasing.value) {
      event.preventDefault();
      handleEraseMouse(event, false);
      currentEraseCount.value++;
    }
  };

  const handleEndErase = () => {
    if (!isEraseMode.value && !isErasing.value) return;
    isErasing.value = false;
    if (currentEraseCount.value > 0) {
      undoCounts.value.push(currentEraseCount.value);
    }
    currentEraseCount.value = 0;
  };

  const handleMouseUp = (event: MouseEvent) => {
    handleEndErase();
  };

  const handleDocumentMouseUp = (event: MouseEvent) => {
    if (isErasing.value) {
      handleEndErase();
    }
  };

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
  canvas.addEventListener("mousedown", handleMouseDown, { passive: false });
  canvas.addEventListener("mousemove", handleMouseMove, { passive: false });
  canvas.addEventListener("mouseup", handleMouseUp, { passive: false });

  // documentレベルでmouseupを監視（キャンバス外でマウスを離した場合にも対応）
  document.addEventListener("mouseup", handleDocumentMouseUp, {
    passive: false,
  });

  // タッチイベントリスナーを追加
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
  canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

  // コンポーネントのクリーンアップ時にイベントリスナーを削除
  onUnmounted(() => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("mouseup", handleDocumentMouseUp);

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
  if (scale.value < CONSTANTS.MAX_SCALE) {
    scale.value = CONSTANTS.MAX_SCALE;
    redrawCanvas();
  }
};

const zoomOut = () => {
  if (scale.value > CONSTANTS.MIN_SCALE) {
    scale.value = CONSTANTS.MIN_SCALE;
    redrawCanvas();
  }
};

/**
 * 画像をキャンバスサイズにリサイズする
 * アスペクト比を保持しながら画像をキャンバスサイズに合わせ、
 * 中央配置で透明な背景に描画する
 *
 * @param imageDataURL - リサイズ対象の画像データURL
 * @param targetWidth - 目標キャンバス幅（ピクセル）
 * @param targetHeight - 目標キャンバス高さ（ピクセル）
 * @returns Promise<string> - リサイズ後の画像データURL（PNG形式）
 */
const resizeImageToCanvasSize = (
  imageDataURL: string,
  targetWidth: number,
  targetHeight: number,
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      resolve(imageDataURL); // フォールバック
      return;
    }

    img.onload = () => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // アスペクト比を保持してリサイズ
      const scale = Math.min(
        targetWidth / img.width,
        targetHeight / img.height,
      );
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;

      // 背景を透明にクリア
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // 画像を中央に配置してリサイズ
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      resolve(imageDataURL); // エラー時はオリジナルを返す
    };

    img.src = imageDataURL;
  });
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
/* PC表示の場合のみ中心起点にする */
@media (hover: hover) and (pointer: fine) {
  .erase-size-preview {
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
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
