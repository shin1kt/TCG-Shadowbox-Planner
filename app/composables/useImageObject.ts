import type { ImageDataObject, ErasePath } from "@/types/imageData";

export function useImageObject(ctx: CanvasRenderingContext2D) {
  // キャンバスの初期化
  const initCanvas = (imageData: ImageDataObject) => {
    ctx.canvas.width = imageData.width;
    ctx.canvas.height = imageData.height;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "white"; // 背景色を白に設定
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over"; // 通常の描画モードに設定
  };

  // 画像の再描画
  const redraw = (imageData: ImageDataObject) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(imageData.img, 0, 0, imageData.width, imageData.height);

    // 消去パスの描画
    ctx.globalCompositeOperation = "destination-out";
    imageData.erasePaths.forEach((path: ErasePath) => {
      ctx.beginPath();
      ctx.moveTo(path.startX, path.startY);
      ctx.lineTo(path.endX, path.endY);
      ctx.lineWidth = 20;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    });

    // 描画モードを元に戻す
    ctx.globalCompositeOperation = "source-over";
    return imageData;
  };

  // 消去処理
  const erase = (
    imageData: ImageDataObject,
    mouseX: number,
    mouseY: number,
    eraseRadius: number,
    isNewPath: boolean = false
  ) => {
    ctx.globalCompositeOperation = "destination-out";

    if (!isNewPath) {
      const lastPath = imageData.erasePaths[imageData.erasePaths.length - 1];
      if (lastPath) {
        ctx.beginPath();
        ctx.moveTo(lastPath.endX, lastPath.endY);
        ctx.lineTo(mouseX, mouseY);
        ctx.lineWidth = eraseRadius * 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    ctx.beginPath();
    ctx.arc(mouseX, mouseY, eraseRadius, 0, Math.PI * 2);
    ctx.fill();

    imageData.erasePaths.push({
      startX: isNewPath
        ? mouseX
        : imageData.erasePaths[imageData.erasePaths.length - 1]?.endX ?? mouseX,
      startY: isNewPath
        ? mouseY
        : imageData.erasePaths[imageData.erasePaths.length - 1]?.endY ?? mouseY,
      endX: mouseX,
      endY: mouseY,
    });
  };

  // 消去処理後の画像をサムネイルとして取得する関数
  const getThumbnail = (): string => {
    return ctx.canvas.toDataURL("image/png");
  };

  // 編集後DataURLを設定する関数
  const updateEditedDataURL = (imageData: ImageDataObject) => {
    const dataUrl = getThumbnail();
    imageData.editedDataUrl = dataUrl;

    // 新しい画像オブジェクトを作成せず、既存のsrcを更新
    return new Promise<void>((resolve) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        imageData.img = tempImg;
        resolve();
      };
      tempImg.src = dataUrl;
    });
  };

  return {
    initCanvas,
    redraw,
    erase,
    getThumbnail,
    updateEditedDataURL,
  };
}
