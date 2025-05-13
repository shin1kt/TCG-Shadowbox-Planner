<template>
  <v-card>
    <v-card-title> Image Editing (Transparency) </v-card-title>
    <v-card-subtitle> Use the canvas to edit the image </v-card-subtitle>
    <v-card-text>
      <div>
        <div>
          削除サイズ:
          <div
            ref="eraseSizeRef"
            :style="{
              height: `${eraseRadius * 2}px`,
              width: `${eraseRadius * 2}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }"
          ></div>
        </div>
        <v-slider v-model="eraseRadius" @change="updateEraseSize"></v-slider>
      </div>
    </v-card-text>
    <v-card-text>
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="saveEdits" color="primary">Save</v-btn>
      <v-btn @click="closeDialog" color="secondary">Cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, onUnmounted } from "vue";
import type { ErasePaths, ImageDataObject } from "@/types/imageData"; // 型をインポート
import { useImageObject } from "@/composables/useImageObject";

const props = defineProps<{
  imageObj: ImageDataObject; // 画像オブジェクトを受け取る
  canvasWidth: number;
  canvasHeight: number;
}>();

const emit = defineEmits<{
  (event: "save", imageObj: ImageDataObject): void; // 編集後の画像を親に送信
  (event: "close"): void; // モーダルを閉じるイベント
}>();

const originData = ref<ImageDataObject | null>(null); // 元の画像データを保持
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const eraseRadius = ref(10); // 消去サイズの初期値
const eraseSizeRef = ref<HTMLDivElement | null>(null); // 消去サイズの表示用
const isErasing = ref(false); // マウスボタンが押されているかどうかを追跡

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
  // emit("save", props.imageObj); // 編集後の画像オブジェクトを親に送信
  emit("close"); // モーダルを閉じるイベントを親に送信
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
  if (!rect || !ctx.value) return;

  let clientX: number;
  let clientY: number;

  if (event instanceof TouchEvent) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  handleErase(mouseX, mouseY, isNewPath);
};

// 削除サイズの更新
const updateEraseSize = () => {
  if (eraseSizeRef.value) {
    eraseSizeRef.value.style.width = `${eraseRadius.value * 2}px`;
    eraseSizeRef.value.style.height = `${eraseRadius.value * 2}px`;
    eraseSizeRef.value.style.borderRadius = "50%";
    eraseSizeRef.value.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    eraseSizeRef.value.style.position = "absolute";
    eraseSizeRef.value.style.pointerEvents = "none"; // マウスイベントを無視
  }
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
</style>
