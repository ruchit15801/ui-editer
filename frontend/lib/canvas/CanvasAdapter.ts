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
  loadFromJSON: (json: string) => void;
  undo: () => void;
  redo: () => void;
}

import { Canvas } from "fabric/*";
// Factory to create the active adapter implementation.
// To switch canvas library, only change this file to use a different adapter.

import { FabricAdapter } from "./FabricAdapter";

export const createCanvasAdapter = (): CanvasAdapter => {
  return new FabricAdapter();
};