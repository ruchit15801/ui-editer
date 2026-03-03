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

    const A4_WIDTH = 794;
    const A4_HEIGHT = 1123;
    canvasElement.width = A4_WIDTH;
    canvasElement.height = A4_HEIGHT;
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

    this.canvas.on("object:added", () => {
      if (!this.isRestoring) this.saveHistory();
    });

    this.canvas.on("object:modified", () => {
      if (!this.isRestoring) this.saveHistory();
    });

    this.canvas.on("object:removed", () => {
      if (!this.isRestoring) this.saveHistory();
    });

    this.canvas.backgroundColor = options?.backgroundColor || "#ffffff";
    this.canvas.renderAll();
    const initialState = JSON.stringify(this.canvas.toJSON());
    this.history = [initialState];
    this.historyIndex = 0;
  }

  private handleSelection(e: any): void {
    const target = e.selected && e.selected[0];
    if (target && target.type === "i-text") {
      this.activeText = target as fabric.IText;
    } else {
      this.activeText = null;
    }
  }

  private history: string[] = [];
  private historyIndex = -1;
  private isRestoring = false;
  getCanvas(): fabric.Canvas | null {
    return this.canvas;
  }

  getIsRestoring(): boolean {
    return this.isRestoring;
  }
  saveHistory() {
    if (!this.canvas || this.isRestoring) return;
    const json = JSON.stringify(this.canvas.toJSON());
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(json);
    this.historyIndex = this.history.length - 1;
  }
  undo() {
    if (!this.canvas) return;
    if (this.historyIndex <= 0) return;

    this.historyIndex--;
    this.restoreState();
  }
  redo() {
    if (!this.canvas) return;
    if (this.historyIndex >= this.history.length - 1) return;

    this.historyIndex++;
    this.restoreState();
  }
  private async restoreState() {
    if (!this.canvas || this.historyIndex < 0) return;

    this.isRestoring = true;
    try {
      const state = JSON.parse(this.history[this.historyIndex]);
      await this.canvas.loadFromJSON(state);

      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.canvas.requestRenderAll();

      localStorage.setItem("canvas-data", this.history[this.historyIndex]);
    } catch (err) {
      console.error("Restore state failed:", err);
    } finally {
      setTimeout(() => {
        this.isRestoring = false;
      }, 50);
    }
  }
  deleteSelected(): void {
    if (!this.canvas) return;

    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.remove(active);
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
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
        objectCaching: false,
        selectable: true,
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
  }
  setTextColor(color: string): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active && active.type === "i-text") {
      active.set("fill", color);
      this.canvas.renderAll();
      this.saveHistory();
    } else if (this.activeText) {
      this.activeText.set("fill", color);
      this.canvas.renderAll();
      this.saveHistory();
    }
  }

  setFontSize(size: number): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (active && active.type === "i-text") {
      active.set("fontSize", size);
      this.canvas.renderAll();
      this.saveHistory();
    } else if (this.activeText) {
      this.activeText.set("fontSize", size);
      this.canvas.renderAll();
      this.saveHistory();
    }
  }

  exportPNG(): string {
    if (!this.canvas) return "";

    const A4_WIDTH = 2480;
    const A4_HEIGHT = 3508;

    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    const scaleX = A4_WIDTH / canvasWidth;
    const scaleY = A4_HEIGHT / canvasHeight;

    const multiplier = Math.min(scaleX, scaleY);

    return this.canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier,
    });
  }

  exportPNGWithWatermark(): string {
    if (!this.canvas) return "";
    const canvas = this.canvas;
    const padding = 30;

    const box = new fabric.Rect({
      width: 40,
      height: 40,
      rx: 12,
      ry: 12,
      fill: new fabric.Gradient({
        type: "linear",
        gradientUnits: "pixels",
        coords: { x1: 0, y1: 0, x2: 40, y2: 0 },
        colorStops: [
          { offset: 0, color: "#8b5cf6" },
          { offset: 1, color: "#6366f1" }
        ]
      })
    });

    const sparkle = new fabric.Text("✨", {
      fontSize: 18,
      fill: "#ffffff",
      originX: "center",
      originY: "center",
      left: 20,
      top: 20
    });

    const spacing = 10;

    const text = new fabric.Text("Studio Canvas", {
      fontSize: 20,
      fill: "#111827",
      fontWeight: "600",
      left: box.width! + spacing,
      top: 10
    });

    const group = new fabric.Group([box, sparkle, text], {
      selectable: false,
      evented: false
    });

    group.set({
      left: canvas.getWidth() - group.getScaledWidth() - padding,
      top: canvas.getHeight() - group.getScaledHeight() - padding
    });

    const originalBg = canvas.backgroundColor;
    canvas.backgroundColor = "#ffffff";
    canvas.add(group);
    canvas.renderAll();
    const A4_WIDTH = 2480;
    const A4_HEIGHT = 3508;
    const multiplier = Math.min(
      A4_WIDTH / canvas.getWidth(),
      A4_HEIGHT / canvas.getHeight()
    );

    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier
    });

    canvas.remove(group);
    canvas.backgroundColor = originalBg;
    canvas.renderAll();

    return dataUrl;
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
          objectCaching: false,
          selectable: true,
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
  async loadFromJSON(json: string): Promise<void> {
    if (!this.canvas || !json) return;
    this.isRestoring = true;

    try {
      const parsed = JSON.parse(json);
      await this.canvas.loadFromJSON(parsed);
      this.canvas.renderAll();
      this.canvas.requestRenderAll();
      const state = JSON.stringify(this.canvas.toJSON());
      this.history = [state];
      this.historyIndex = 0;
    } catch (err) {
      console.error("Load JSON error:", err);
    } finally {
      setTimeout(() => {
        this.isRestoring = false;
      }, 100);
    }
  }

  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
      this.activeText = null;
    }
  }
}
