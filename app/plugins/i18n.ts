import { createI18n } from "vue-i18n";

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: "ja",
    messages: {
      ja: {
        upload: {
          label: "画像をアップロード",
          accept: "画像ファイル",
        },
        buttons: {
          exportPDF: "PDFエクスポート",
          save: "保存",
          cancel: "キャンセル",
          delete: "削除",
          duplicate: "複製",
          moveUp: "上へ移動",
          moveDown: "下へ移動",
        },
        tabs: {
          layerEdit: "レイヤー編集",
          "3dView": "3D表示",
        },
        canvas: {
          eraserSize: "消しゴムサイズ",
          defaultTitle: "画像編集（透過）",
        },
        image: {
          title: "画像 {number}",
        },
      },
      en: {
        upload: {
          label: "Upload Image",
          accept: "Image files",
        },
        buttons: {
          exportPDF: "Export PDF",
          save: "Save",
          cancel: "Cancel",
          delete: "Delete",
          duplicate: "Duplicate",
          moveUp: "Move Up",
          moveDown: "Move Down",
        },
        tabs: {
          layerEdit: "Layer Edit",
          "3dView": "3D View",
        },
        canvas: {
          eraserSize: "Eraser Size",
          defaultTitle: "Image Editing (Transparency)",
        },
        image: {
          title: "Image {number}",
        },
      },
    },
  });

  vueApp.use(i18n);
});
