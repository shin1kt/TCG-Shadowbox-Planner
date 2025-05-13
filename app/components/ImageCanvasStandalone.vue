<template>
  <v-container>
    <v-card>
      <v-card-title> Image Canvas (Standalone) </v-card-title>
      <v-card-subtitle>
        Upload an image and edit it using the canvas
      </v-card-subtitle>
      <v-card-actions>
        <v-file-input
          label="Upload Image"
          accept="image/*"
          @change="handleFileChange"
        ></v-file-input>
      </v-card-actions>
      <v-card-actions v-if="imageObj">
        <div>Canvas:</div>
        <!-- ref="canvasRef" として変数名と一致させる -->
        <canvas
          ref="canvasRef"
          :width="canvasWidth"
          :height="canvasHeight"
        ></canvas>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from "vue";
import { useImageObject } from "@/composables/useImageObject"; // useImageObjectをインポート

let imageObj = ref<any>(null); // 画像オブジェクトの状態
const canvasWidth = 500; // 任意のキャンバス幅
const canvasHeight = 500; // 任意のキャンバス高さ
const canvasRef = ref<HTMLCanvasElement | null>(null); // canvasRefを定義
const ctx = ref<CanvasRenderingContext2D | null>(null); // キャンバスのコンテキスト

// ファイルを選択したときに呼ばれる関数
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      console.log("FileReader loaded:", reader.result); // 読み込んだファイルの結果（DataURL）をログに表示
      const img = new Image();

      // 画像が正常に読み込まれたときに実行される
      img.onload = () => {
        console.log("Image loaded:", img); // 画像が正常に読み込まれたことを確認

        const width = img.width;
        const height = img.height;

        // useImageObjectを呼び出してImageObjectを作成
        const { erasePaths, redraw, erase, getThumbnail } = useImageObject(
          img,
          width,
          height
        );

        imageObj.value = {
          img,
          width,
          height,
          erasePaths,
          redraw,
          erase,
          getThumbnail,
        };

        // キャンバスに画像を描画
        nextTick(() => {
          // canvasRefが設定されていることを確認した後にコンテキストを取得
          ctx.value = canvasRef.value?.getContext("2d") || null;
          if (ctx.value) {
            console.log("Redrawing the image on canvas"); // キャンバスに描画する前にログ
            redraw(ctx.value); // キャンバスに画像を描画
          } else {
            console.log("Canvas context is null"); // ctxがnullの場合のログ
          }
        });
      };

      // 画像を設定
      img.src = reader.result as string; // ファイルをDataURLとして読み込む
    };
    reader.readAsDataURL(file); // ファイルをDataURLとして読み込む
  }
};

// キャンバスの消去処理
const handleErase = (mouseX: number, mouseY: number) => {
  if (ctx.value && imageObj.value) {
    console.log("Erasing at", mouseX, mouseY); // 消去処理の位置をログ
    imageObj.value.erase(mouseX, mouseY, 10, ctx.value); // 10pxの消去半径で消去
  }
};

// 初期設定（キャンバスのコンテキスト取得）
onMounted(() => {
  nextTick(() => {
    ctx.value = canvasRef.value?.getContext("2d") || null;
    console.log("Canvas context after mounted:", ctx.value); // キャンバスのコンテキストをログに表示
  });
});
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
}
</style>
