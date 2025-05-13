<template>
  <v-card>
    <v-card-title> Image Editing (Transparency) </v-card-title>
    <v-card-subtitle> Use the canvas to edit the image </v-card-subtitle>
    <v-card-actions>
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>
    </v-card-actions>
    <v-card-actions>
      <v-btn @click="saveEdits" color="primary">Save</v-btn>
      <v-btn @click="closeDialog" color="secondary">Cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
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

// キャンバスの消去処理
const handleErase = (mouseX: number, mouseY: number) => {
  if (!ctx.value) return; // コンテキストが取得できない場合は処理を中止
  const { erase } = useImageObject(ctx.value);

  if (ctx.value) {
    if (!originData.value) return; // 元データが存在しない場合は処理を中止
    erase(originData.value, mouseX, mouseY, 10); // 10pxの消去半径で消去
  }
};

// 編集後の画像を親コンポーネントに返す
const saveEdits = () => {
  if (!ctx.value) return; // コンテキストが取得できない場合は処理を中止
  if (!originData.value) return; // 元データが存在しない場合は処理を中止

  const { updateEditedDataURL } = useImageObject(ctx.value);
  emit("save", updateEditedDataURL(originData.value)); // 編集後の画像オブジェクトを親に送信
};

// モーダルを閉じる処理
const closeDialog = () => {
  // emit("save", props.imageObj); // 編集後の画像オブジェクトを親に送信
  emit("close"); // モーダルを閉じるイベントを親に送信
};

// // キャンバスに描画
// onMounted(() => {
//   ctx.value = canvasRef.value?.getContext("2d") || null;

//   if (!ctx.value) return; // コンテキストが取得できない場合は処理を中止
//   const { redraw, erase, getThumbnail } = useImageObject(ctx.value);

//   if (ctx.value) {
//     redraw(props.imageObj); // 初期描画
//   }
// });

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

// // 画像のリサイズ処理（縦横比を保つ）
// const resizeImage = (img: HTMLImageElement) => {
//   const aspectRatio = img.width / img.height;
//   let newWidth = props.canvasWidth;
//   let newHeight = props.canvasHeight;

//   // 縦横比を保ちながらリサイズ
//   if (img.width > img.height) {
//     newHeight = newWidth / aspectRatio;
//   } else {
//     newWidth = newHeight * aspectRatio;
//   }

//   return { newWidth, newHeight };
// };

// 画像をキャンバスに描画する
// const drawImage = () => {
//   if (ctx.value && img) {
//     const { newWidth, newHeight } = resizeImage(img);
//     ctx.value.clearRect(0, 0, props.canvasWidth, props.canvasHeight); // キャンバスをクリア
//     ctx.value.drawImage(img, 0, 0, newWidth, newHeight); // 画像を描画
//   }
// };

// キャンバスの消去処理（クリックした部分を透過）
const handleEraseMouse = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (rect && ctx.value) {
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    handleErase(mouseX, mouseY);
  }
};

// マウスダウン・マウスムーブ・マウスアップイベントで消去処理を行う
const startErase = () => {
  canvasRef.value?.addEventListener("mousedown", (event: MouseEvent) => {
    handleEraseMouse(event);
    canvasRef.value?.addEventListener("mousemove", handleEraseMouse);
  });

  canvasRef.value?.addEventListener("mouseup", () => {
    canvasRef.value?.removeEventListener("mousemove", handleEraseMouse);
  });
};

// キャンバス描画の初期化
onMounted(() => {
  ctx.value = canvasRef.value?.getContext("2d") || null;

  // キャンバスのコンテキストが取得できない場合はエラー
  if (!ctx.value) {
    console.error("Failed to get canvas context");
    return;
  }

  // 元データをクローン
  originData.value = JSON.parse(JSON.stringify(props.imageObj));
  if (!originData.value) return; // 元データが存在しない場合は処理を中止
  originData.value.img = props.imageObj.img; // 画像オブジェクトを設定

  const { initCanvas, redraw } = useImageObject(ctx.value);
  initCanvas(originData.value); // キャンバスの初期化
  redraw(originData.value); // 初期描画

  if (canvasRef.value) {
    startErase(); // 消去処理を初期化
  }
});
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
}
</style>
