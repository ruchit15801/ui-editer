/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fabric from "fabric";
import type { CanvasAdapter, InitializeOptions, TextOptions } from "./CanvasAdapter";

export class FabricAdapter implements CanvasAdapter {
  private canvas: fabric.Canvas | null = null;
  private activeText: fabric.IText | null = null;
  private selectedObject: fabric.Object | null = null;

  initializeCanvas(containerElement: HTMLDivElement, options?: InitializeOptions): void {
    if (this.canvas) {
      this.canvas.dispose();
    }

    const canvasElement = document.createElement("canvas");

    canvasElement.width = containerElement.clientWidth;
    canvasElement.height = containerElement.clientHeight;

    containerElement.innerHTML = "";
    containerElement.appendChild(canvasElement);

    this.canvas = new fabric.Canvas(canvasElement, {
      preserveObjectStacking: true,
      selection: true
    });

    this.canvas.on("selection:created", (e) => {
      this.selectedObject = e.selected?.[0] || null;
    });

    this.canvas.on("selection:updated", (e) => {
      this.selectedObject = e.selected?.[0] || null;
    });

    this.canvas.on("selection:cleared", () => {
      this.selectedObject = null;
    });

    this.canvas.on("object:modified", () => this.saveHistory());
    this.canvas.on("object:removed", () => this.saveHistory());

    this.history = [];
    this.historyIndex = -1;

    this.saveHistory();
    this.canvas.backgroundColor = options?.backgroundColor || "#ffffff";
    this.canvas.renderAll();
  }

  private handleSelection(e: any): void {
    const target = e.selected && e.selected[0];
    if (target && target.type === "i-text") {
      this.activeText = target as fabric.IText;
    } else {
      this.activeText = null;
    }
  }

  deleteSelected(): void {
    if (!this.canvas) return;

    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.remove(active);
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.saveHistory();
    }
  }
  async duplicateSelected(): Promise<void> {
    if (!this.canvas) return;

    const active = this.canvas.getActiveObject();
    if (!active) return;

    const cloned = await active.clone();

    cloned.set({
      left: (active.left || 0) + 20,
      top: (active.top || 0) + 20
    });

    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.renderAll();
    this.saveHistory();
  }
  private history: string[] = [];
  private historyIndex = -1;
  private isRestoring = false;
  getCanvas(): fabric.Canvas | null {
    return this.canvas;
  }
  saveHistory() {
    if (!this.canvas || this.isRestoring) return;
    const json = JSON.stringify(this.canvas.toJSON());
    if (this.history[this.historyIndex] === json) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(json);
    this.historyIndex++;
  }

  undo() {
    if (!this.canvas) return;
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.isRestoring = true;
    this.canvas.loadFromJSON(this.history[this.historyIndex], () => {
      this.canvas?.renderAll();
      this.isRestoring = false;
    });
  }
  redo() {
    if (!this.canvas) return;
    if (this.historyIndex >= this.history.length - 1) return;

    this.historyIndex++;
    this.isRestoring = true;

    this.canvas.loadFromJSON(this.history[this.historyIndex], () => {
      this.canvas?.renderAll();
      this.isRestoring = false;
    });
  }

  async addImage(imageUrl: string): Promise<void> {
    if (!this.canvas) return;

    try {
      const htmlImg = new Image();
      htmlImg.crossOrigin = "anonymous";
      htmlImg.src = imageUrl;

      await new Promise((resolve, reject) => {
        htmlImg.onload = resolve;
        htmlImg.onerror = reject;
      });

      const img = new fabric.Image(htmlImg);

      const canvasWidth = this.canvas.getWidth();
      const canvasHeight = this.canvas.getHeight();

      const scale = Math.min(
        (canvasWidth * 0.8) / (img.width || 100),
        (canvasHeight * 0.8) / (img.height || 100)
      );

      img.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: "center",
        originY: "center"
      });

      if (scale < 1) img.scale(scale);

      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
      this.canvas.requestRenderAll();

      this.saveHistory();

    } catch (err) {
      console.error("Image load failed:", err);
    }
  }

  async addText(text: string, options?: TextOptions): Promise<void> {
    if (!this.canvas) return;

    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    const iText = new fabric.IText(text || "Double click to edit", {
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: "center",
      originY: "center",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
      fontSize: options?.fontSize ?? 32,
      fill: options?.color ?? "#111827",
      editable: true,
      selectable: true
    });

    iText.set({
      cornerStyle: "circle",
      cornerColor: "#6366f1",
      borderColor: "#6366f1",
      cornerSize: 10,
      transparentCorners: false
    });

    this.canvas.add(iText);
    this.canvas.setActiveObject(iText);
    this.activeText = iText;
    this.canvas.renderAll();
    this.saveHistory();
  }

  setTextColor(color: string): void {
    if (!this.canvas) return;

    const active = this.canvas.getActiveObject();
    if (active && active.type === "i-text") {
      (active as fabric.IText).set("fill", color);
      this.canvas.renderAll();
      this.activeText = active as fabric.IText;
    } else if (this.activeText) {
      this.activeText.set("fill", color);
      this.canvas.setActiveObject(this.activeText);
      this.canvas.renderAll();
    }
  }

  setFontSize(size: number): void {
    if (!this.canvas) return;

    const active = this.canvas.getActiveObject();
    if (active && active.type === "i-text") {
      (active as fabric.IText).set("fontSize", size);
      this.canvas.renderAll();
      this.activeText = active as fabric.IText;
    } else if (this.activeText) {
      this.activeText.set("fontSize", size);
      this.canvas.setActiveObject(this.activeText);
      this.canvas.renderAll();
    }
  }

  exportPNG(): string {
    if (!this.canvas) {
      return "";
    }
    return this.canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2
    });
  }

  async removeBackground(imageUrl: string): Promise<void> {
    if (!this.canvas) return;

    try {
      const htmlImg = new Image();
      htmlImg.crossOrigin = "anonymous";
      htmlImg.src = imageUrl;

      await new Promise((resolve, reject) => {
        htmlImg.onload = resolve;
        htmlImg.onerror = reject;
      });

      const img = new fabric.Image(htmlImg);

      const objs = this.canvas.getObjects().filter((obj) => obj.type === "image");
      const target = objs[0] as fabric.Image | undefined;

      if (target) {
        img.set({
          left: target.left,
          top: target.top,
          originX: target.originX,
          originY: target.originY,
          scaleX: target.scaleX,
          scaleY: target.scaleY
        });

        this.canvas.remove(target);
      } else {
        img.set({
          left: this.canvas.getWidth() / 2,
          top: this.canvas.getHeight() / 2,
          originX: "center",
          originY: "center"
        });
      }

      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
      this.canvas.requestRenderAll();

      this.saveHistory();

    } catch (err) {
      console.error("Remove BG image load failed:", err);
    }
  }

  saveToJSON(): string {
    if (!this.canvas) return "";
    return JSON.stringify(this.canvas.toJSON());
  }

  loadFromJSON(json: string): void {
    if (!this.canvas || !json) return;

    this.canvas.loadFromJSON(json, () => {
      this.canvas?.renderAll();
    });
  }

  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
      this.activeText = null;
    }
  }
}

