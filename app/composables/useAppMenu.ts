import { useI18n } from "vue-i18n";
import type { ImageDataObject } from "@/types/imageData";

export const useAppMenu = () => {
  const { t } = useI18n();

  // メニューの状態管理
  const isMenuOpen = ref(false);
  const jsonFileInput = ref<HTMLInputElement | null>(null);

  // 画像リスト（グローバル状態として管理）
  const imageList = useState<ImageDataObject[]>("imageList", () => []);

  // メニューを開く/閉じる
  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
  };

  const closeMenu = () => {
    isMenuOpen.value = false;
  };

  // PDFエクスポート機能
  const exportToPDF = async () => {
    closeMenu();

    if (imageList.value.length === 0) return;

    let jsPDF: any = null;
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

  // JSONエクスポート機能
  const exportToJSON = async () => {
    closeMenu();

    if (imageList.value.length === 0) return;

    try {
      // ファイル名を入力してもらう
      const defaultName = `tcg-shadowbox-${
        new Date().toISOString().split("T")[0]
      }`;
      const fileName = window.prompt(t("prompts.enterFileName"), defaultName);

      // キャンセルされた場合は処理を中断
      if (fileName === null) {
        return;
      }

      // 空文字の場合はデフォルト名を使用
      const finalFileName = fileName.trim() || defaultName;

      // iPhone Safari用: ユーザージェスチャーのコンテキストを保持するため、
      // リンク要素を先に作成して準備しておく
      const link = document.createElement("a");
      document.body.appendChild(link);
      link.style.display = "none";

      // HTMLImageElementをBase64データURLに変換してJSONにシリアライズ可能にする
      const exportData = await Promise.all(
        imageList.value.map(async (imageData) => {
          // 元の画像をCanvasに描画してBase64データURLを取得
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context not available");

          canvas.width = imageData.width;
          canvas.height = imageData.height;
          ctx.drawImage(imageData.img, 0, 0);
          const originalDataUrl = canvas.toDataURL("image/png");

          return {
            width: imageData.width,
            height: imageData.height,
            erasePaths: imageData.erasePaths,
            editedDataUrl: imageData.editedDataUrl,
            title: imageData.title,
            id: imageData.id,
            originalDataUrl, // 元の画像データ
          };
        })
      );

      const jsonData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        images: exportData,
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], {
        type: "application/json",
      });

      // .jsonが含まれていない場合は追加
      const downloadFileName = finalFileName.endsWith(".json")
        ? finalFileName
        : `${finalFileName}.json`;

      // iPhone Safari の検出とモバイルデバイス用の処理
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (isIOS || isMobile) {
        // モバイルデバイス（特にiPhone Safari）用の処理
        try {
          // Web Share API が利用可能な場合はそれを使用
          if (navigator.share && "canShare" in navigator) {
            const file = new File([blob], downloadFileName, {
              type: "application/json",
            });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: "TCG Shadowbox Data",
              });
              document.body.removeChild(link);
              return;
            }
          }
        } catch (shareError) {
          console.log(
            "Web Share API failed, falling back to download:",
            shareError
          );
        }

        // Web Share API が使えない場合の代替処理
        // データURLを使用してダウンロード
        const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(
          jsonString
        )}`;
        link.href = dataUrl;
        link.download = downloadFileName;
        link.click();

        // 少し遅延してから要素を削除
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1000);
      } else {
        // デスクトップ用の処理（既存の方法）
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = downloadFileName;
        link.click();

        // クリーンアップ
        setTimeout(() => {
          URL.revokeObjectURL(url);
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 100);
      }
    } catch (error) {
      console.error("JSON export failed:", error);
      alert(t("errors.exportFailed"));
    }
  };

  // JSONインポートのトリガー
  const triggerJSONImport = () => {
    closeMenu();
    jsonFileInput.value?.click();
  };

  // JSONインポート処理
  const handleJSONImport = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // バージョンチェック（将来的な互換性のため）
      if (!jsonData.version) {
        throw new Error("Invalid file format");
      }

      // 既存の画像がある場合は確認
      if (imageList.value.length > 0) {
        const shouldReplace = window.confirm(t("confirm.importReplace"));
        if (!shouldReplace) {
          target.value = ""; // ファイル選択をリセット
          return;
        }
      }

      // JSONデータからImageDataObjectを復元
      const restoredImages = await Promise.all(
        jsonData.images.map(async (imageData: any) => {
          return new Promise<ImageDataObject>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              resolve({
                img,
                width: imageData.width,
                height: imageData.height,
                erasePaths: imageData.erasePaths || [],
                editedDataUrl: imageData.editedDataUrl || "",
                title: imageData.title,
                id: imageData.id,
              });
            };
            img.onerror = () => {
              reject(new Error(`Failed to load image: ${imageData.title}`));
            };
            img.src = imageData.originalDataUrl;
          });
        })
      );

      // 画像リストを更新
      imageList.value = restoredImages;

      alert(t("success.importComplete"));
    } catch (error) {
      console.error("JSON import failed:", error);
      alert(t("errors.importFailed"));
    } finally {
      target.value = ""; // ファイル選択をリセット
    }
  };

  // リセット機能
  const resetAll = () => {
    closeMenu();

    // 確認ダイアログを表示
    if (window.confirm(t("confirm.reset"))) {
      imageList.value = [];
    }
  };

  return {
    isMenuOpen,
    jsonFileInput,
    imageList,
    toggleMenu,
    closeMenu,
    exportToPDF,
    exportToJSON,
    triggerJSONImport,
    handleJSONImport,
    resetAll,
  };
};
