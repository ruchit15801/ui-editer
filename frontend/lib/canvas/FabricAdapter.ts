/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fabric from "fabric";
import type { CanvasAdapter, InitializeOptions, TextOptions } from "./CanvasAdapter";
import * as pdfjsLib from "pdfjs-dist/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

    this.canvas.backgroundColor = "#eef1f5"; 
    this.canvas.renderAll();
    const initialState = JSON.stringify(this.canvas.toJSON());
    this.history = [initialState];
    this.historyIndex = 0;

    (fabric.Object.prototype as any).toObject = (function (toObject) {
      return function (this: any) {
        return {
          ...toObject.call(this),
          isPage: this.isPage || false
        };
      };
    })(fabric.Object.prototype.toObject);
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

    try {
      localStorage.setItem("canvas-data", json);
    } catch (err) {
      console.warn("Storage failed", err);
    }
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

  getPages(): { id: number; top: number }[] {
    if (!this.canvas) return [];

    return this.canvas
      .getObjects()
      .filter((obj: any) => obj.isPage)
      .sort((a: any, b: any) => a.top - b.top)
      .map((obj: any, index: number) => ({
        id: index,
        top: obj.top
      }));
  }


  deletePageByIndex(index: number) {
      if (!this.canvas) return;

      const pages = this.canvas
        .getObjects()
        .filter((obj: any) => obj.isPage)
        .sort((a: any, b: any) => a.top - b.top);

      const target = pages[index];
      if (!target) return;

      this.canvas.remove(target);

      // RE-FLOW
      const updatedPages = this.canvas
        .getObjects()
        .filter((obj: any) => obj.isPage)
        .sort((a: any, b: any) => a.top - b.top);

      updatedPages.forEach((page: any, i: number) => {
        page.set("top", i * (1123 + 80));
      });

      this.canvas.setHeight(updatedPages.length * (1123 + 80));
      this.canvas.renderAll();
      this.saveHistory();
  }
 
  async addImage(fileUrl: string): Promise<void> {
    if (!this.canvas) return;

    if (fileUrl.toLowerCase().includes(".pdf") || fileUrl.startsWith("data:application/pdf")) {
      await this.renderPDF(fileUrl);
      return;
    }

    try {
      const img = await fabric.Image.fromURL(fileUrl, {
        crossOrigin: 'anonymous'
      });

      const canvasWidth = this.canvas.getWidth();
      const canvasHeight = this.canvas.getHeight();

      const scale = Math.min(
        (canvasWidth * 0.8) / img.width,
        (canvasHeight * 0.8) / img.height
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
      this.saveHistory();
    } catch (err) {
      console.error("Image load failed:", err);
    }
  }

  private async renderPDF(url: string) {
    if (!this.canvas) return;

    const A4_WIDTH = 794;
    const A4_HEIGHT = 1123;
    const gap = 40;

    const pdf = await pdfjsLib.getDocument(url).promise;
    const totalPages = pdf.numPages;

    let currentTop = this.canvas.getHeight();

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });

      const tempCanvas = document.createElement("canvas");
      const context = tempCanvas.getContext("2d")!;
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport
      }).promise;

      const pdfImage = new fabric.Image(tempCanvas);

      const scale = Math.min(
        A4_WIDTH / tempCanvas.width,
        A4_HEIGHT / tempCanvas.height
      );

      pdfImage.scale(scale);

      pdfImage.set({
        left: A4_WIDTH / 2,
        top: A4_HEIGHT / 2,
        originX: "center",
        originY: "center"
      });

      const pageBg = new fabric.Rect({
        width: A4_WIDTH,
        height: A4_HEIGHT,
        fill: "#ffffff",
        stroke: "#d1d5db",
        strokeWidth: 1
      });

      const pageGroup = new fabric.Group([pageBg, pdfImage], {
        left: 0,
        top: currentTop,
        selectable: true,
        hasControls: false
      });

      (pageGroup as any).isPage = true;

      this.canvas.add(pageGroup);

      currentTop += A4_HEIGHT + gap;
    }

    this.canvas.setHeight(currentTop);
    this.canvas.renderAll();
  }

  deleteSelectedPage(): void {
    if (!this.canvas) return;

    const active = this.canvas.getActiveObject() as any;
    if (!active || !active.isPage) return;

    const pageHeight = 1123 + 20; // A4 + gap
    const deletedTop = active.top;

    this.canvas.remove(active);

    // Shift all pages below upward
    this.canvas.getObjects().forEach((obj: any) => {
      if (obj.isPage && obj.top > deletedTop) {
        obj.set("top", obj.top - pageHeight);
      }
    });

    this.canvas.setHeight(this.canvas.getHeight() - pageHeight);
    this.canvas.renderAll();
    this.saveHistory();
  }

  addBlankPage(): void {
    if (!this.canvas) return;

    const A4_WIDTH = 794;
    const A4_HEIGHT = 1123;
    const gap = 40;

    const existingPages = this.canvas
      .getObjects()
      .filter((obj: any) => obj.isPage);

    const newTop = existingPages.length * (A4_HEIGHT + gap);

    const pageBg = new fabric.Rect({
      width: A4_WIDTH,
      height: A4_HEIGHT,
      fill: "#ffffff",
      stroke: "#e5e7eb",
      strokeWidth: 1,
      rx: 8,
      ry: 8
    });

    const pageGroup = new fabric.Group([pageBg], {
      left: 0,
      top: newTop,
      selectable: true,
      hasControls: false
    });

    (pageGroup as any).isPage = true;

    this.canvas.add(pageGroup);

    this.canvas.setHeight((existingPages.length + 1) * (A4_HEIGHT + gap));

    this.canvas.renderAll();
    this.saveHistory();
  }

  async addText(text: string) {
    if (!this.canvas) return;

    const active = this.canvas.getActiveObject() as any;

    let top = this.canvas.getHeight() / 2;

    if (active && active.isPage) {
      top = active.top + 200;
    }

    const iText = new fabric.IText(text || "Edit me", {
      left: 794 / 2,
      top,
      originX: "center",
      originY: "center"
    });

    this.canvas.add(iText);
    this.canvas.setActiveObject(iText);
    this.canvas.renderAll();
    this.saveHistory();
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
      fill: "rgba(0,0,0,0.6)"   
    });

  const sparkle = new fabric.Text("✨", {
    fontSize: 18,
    fill: "#d1d5db",   
    originX: "center",
    originY: "center",
    left: 20,
    top: 20
  });

    const spacing = 10;

    const text = new fabric.Text("Studio Canvas", {
      fontSize: 20,
      fill: "#6b7280",
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

  saveToLocalStorage(): void {
    const json = this.saveToJSON();
    if (!json || json === '{"version":"6.0.0","objects":[]}') return;

    try {
      localStorage.setItem("canvas-data", json);
    } catch (err) {
      console.warn("Storage quota exceeded", err);
      try {
        localStorage.removeItem("canvas-data");
        localStorage.setItem("canvas-data", json);
      } catch (e) {
        console.error("Failed to save canvas data", e);
      }
    }
  }
  
  async loadFromJSON(json: string): Promise<void> {
    if (!this.canvas || !json) return;

    this.isRestoring = true;

    try {
      await this.canvas.loadFromJSON(json);
      this.canvas.renderAll();
      this.canvas.requestRenderAll();

      this.history = [json];
      this.historyIndex = 0;

      const pages = this.canvas
        .getObjects()
        .filter((obj: any) => obj.isPage)
        .sort((a: any, b: any) => a.top - b.top);

      if (pages.length > 0) {
        const lastPage = pages[pages.length - 1];
        this.canvas.setHeight(lastPage.top + 1123 + 40);
      }
    } catch (err) {
      console.error("Load JSON error:", err);
    } finally {
      this.isRestoring = false;
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
