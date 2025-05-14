<template>
  <v-card>
    <v-card-title class="text-subtitle-1">
      <v-text-field
        v-model="title"
        variant="plain"
        hide-details
        density="compact"
        class="pa-0"
        @update:model-value="updateTitle"
      ></v-text-field>
    </v-card-title>

    <v-card-text class="canvas-container pa-0">
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
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

// キャンバスの消去処理
const handleErase = (
  mouseX: number,
  mouseY: number,
  isNewPath: boolean = false
) => {
  if (!ctx.value) return;
  const { erase } = useImageObject(ctx.value);

  if (!originData.value) return;
  erase(originData.value, mouseX, mouseY, eraseRadius.value, isNewPath);
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
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isErasing.value) {
      handleEraseMouse(event, false);
    }
  };

  const handleMouseUp = () => {
    isErasing.value = false;
    canvas.classList.remove("erase-cursor");
  };

  const handleMouseOut = () => {
    isErasing.value = false;
    canvas.classList.remove("erase-cursor");
  };

  // タッチイベントハンドラー
  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault(); // スクロールを防止
    isErasing.value = true;
    handleEraseMouse(event, true);
  };

  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault(); // スクロールを防止
    if (isErasing.value) {
      handleEraseMouse(event, false);
    }
  };

  const handleTouchEnd = () => {
    isErasing.value = false;
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

// キャンバス描画の初期化
onMounted(() => {
  ctx.value = canvasRef.value?.getContext("2d") || null;

  if (!ctx.value) {
    console.error("Failed to get canvas context");
    return;
  }

  // 元データを参照として保持し、erasePaths配列のみ新しく作成
  originData.value = {
    ...props.imageObj,
    erasePaths: [...props.imageObj.erasePaths],
  };

  // タイトルの初期化
  title.value = originData.value.title || "Image Editing (Transparency)";

  const { initCanvas, redraw } = useImageObject(ctx.value);
  initCanvas(originData.value);
  redraw(originData.value);

  if (canvasRef.value) {
    startErase();
  }
});
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
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
}
.erase-size-container {
  position: relative;
  min-height: 50px; /* プレビューの高さ分の余白を確保 */
}
.erase-size-preview {
  position: absolute;
  left: 0;
  top: 0.2em;
  /* transform: translateY(-50%); */
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
</style>
