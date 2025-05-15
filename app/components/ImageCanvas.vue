<template>
  <v-card>
    <v-card-title class="text-subtitle-1 d-flex align-center">
      <v-text-field
        v-model="title"
        variant="plain"
        hide-details
        density="compact"
        class="pa-0 flex-grow-1"
        @update:model-value="updateTitle"
      ></v-text-field>
      <v-btn
        icon="mdi-undo"
        size="small"
        :color="undoCounts.length === 0 ? 'grey-darken-3' : 'grey-lighten-1'"
        :disabled="undoCounts.length === 0"
        @click="undo(1)"
        class="undo-button ml-2"
      >
      </v-btn>
    </v-card-title>

    <v-card-text class="canvas-container pa-0">
      <!-- 市松模様のSVGパターン定義 -->
      <svg width="0" height="0" style="position: absolute">
        <defs>
          <pattern
            id="checkered"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="8" fill="#ffffff" />
            <rect x="8" y="0" width="8" height="8" fill="#e0e0e0" />
            <rect x="0" y="8" width="8" height="8" fill="#e0e0e0" />
            <rect x="8" y="8" width="8" height="8" fill="#ffffff" />
          </pattern>
        </defs>
      </svg>
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        class="checkered-background"
        :style="{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          display: 'block',
          margin: '0 auto',
        }"
      ></canvas>
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

// キャンバスの実際のサイズと表示サイズの比率を計算
const canvasScale = computed(() => {
  if (!canvasRef.value || !originData.value) return { scaleX: 1, scaleY: 1 };

  const rect = canvasRef.value.getBoundingClientRect();
  return {
    scaleX: originData.value.width / rect.width,
    scaleY: originData.value.height / rect.height,
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

// キャンバスの消去処理（クリックした部分を透過）
const handleEraseMouse = (
  event: MouseEvent | TouchEvent,
  isNewPath: boolean = false
) => {
  if (!isErasing.value) return;

  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect || !ctx.value || !originData.value) return;

  let clientX: number;
  let clientY: number;

  if (event instanceof TouchEvent) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    // スクロール位置の計算を修正
    clientX = event.clientX;
    clientY = event.clientY;
  }

  // キャンバス上の正確な位置を計算
  const mouseX = ((clientX - rect.left) / rect.width) * originData.value.width;
  const mouseY = ((clientY - rect.top) / rect.height) * originData.value.height;

  handleErase(mouseX, mouseY, isNewPath);
};

// マウスダウン・マウスムーブ・マウスアップイベントで消去処理を行う
const startErase = () => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;

  const handleMouseDown = (event: MouseEvent) => {
    isErasing.value = true;
    canvas.classList.add("erase-cursor");
    handleEraseMouse(event, true);
    currentEraseCount.value = 1; // 初回のeraseでカウントを1に設定
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isErasing.value) {
      handleEraseMouse(event, false);
      currentEraseCount.value++; // 現在のカウントを増やす
    }
  };

  const handleMouseUp = () => {
    isErasing.value = false;
    canvas.classList.remove("erase-cursor");
    if (currentEraseCount.value > 0) {
      undoCounts.value.push(currentEraseCount.value); // 消去作業が完了した時点でundoCountsに追加
    }
    currentEraseCount.value = 0; // カウントをリセット
  };

  const handleMouseOut = () => {
    isErasing.value = false;
    canvas.classList.remove("erase-cursor");
    if (currentEraseCount.value > 0) {
      undoCounts.value.push(currentEraseCount.value); // マウスが外れた時点でもundoCountsに追加
    }
    currentEraseCount.value = 0; // カウントをリセット
  };

  // タッチイベントハンドラー
  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    isErasing.value = true;
    handleEraseMouse(event, true);
    currentEraseCount.value = 1; // 初回のeraseでカウントを1に設定
  };

  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault();
    if (isErasing.value) {
      handleEraseMouse(event, false);
      currentEraseCount.value++; // 現在のカウントを増やす
    }
  };

  const handleTouchEnd = () => {
    isErasing.value = false;
    if (currentEraseCount.value > 0) {
      undoCounts.value.push(currentEraseCount.value); // タッチ終了時点でundoCountsに追加
    }
    currentEraseCount.value = 0; // カウントをリセット
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
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
}
canvas.checkered-background {
  background-color: transparent !important; /* 背景を強制的に透明に */
}
.erase-cursor {
  cursor: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"%3E%3Ccircle cx="25" cy="25" r="25" fill="rgba(0, 0, 0, 0.5)" /%3E%3C/svg%3E'),
    auto;
}
.canvas-container {
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
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
.undo-button {
  background-color: white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.undo-button:hover {
  background-color: #f5f5f5 !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}
</style>
