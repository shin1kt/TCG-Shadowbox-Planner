export interface ImageDataObject {
  img: HTMLImageElement;
  width: number;
  height: number;
  erasePaths: ErasePaths;
  editedDataUrl: string; // 編集後の画像データURL
  title: string; // 画像のタイトル
}

export type ErasePath = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  radius: number; // 消しゴムの半径
};
export type ErasePaths = ErasePath[];
