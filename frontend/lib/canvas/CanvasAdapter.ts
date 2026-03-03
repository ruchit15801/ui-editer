export interface InitializeOptions {
  backgroundColor?: string;
}

export interface TextOptions {
  color?: string;
  fontSize?: number;
}

export interface CanvasAdapter {
  initializeCanvas: (containerElement: HTMLDivElement, options?: InitializeOptions) => void;
  addImage: (imageUrl: string) => Promise<void>;
  addText: (text: string, options?: TextOptions) => Promise<void>;
  setTextColor: (color: string) => void;
  setFontSize: (size: number) => void;
  exportPNG: () => string;
  removeBackground: (imageUrl: string) => Promise<void>;
  destroy: () => void;
  getCanvas: () => Canvas | null;
  getIsRestoring: () => boolean;
  saveToJSON: () => string;
  saveToLocalStorage: () => void;
  loadFromJSON: (json: string) => void;
  undo: () => void;
  redo: () => void;
  deleteSelected(): void;
  deleteSelectedPage(): void;
  duplicateSelected(): Promise<void>;
  exportPNGWithWatermark: () => string;
}

import { Canvas } from "fabric/*";

import { FabricAdapter } from "./FabricAdapter";

export const createCanvasAdapter = (): CanvasAdapter => {
  return new FabricAdapter();
};