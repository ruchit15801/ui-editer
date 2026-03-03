"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@store/useEditorStore";
import { Copy, Trash2 } from "lucide-react";

export const CanvasWorkspace: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const initializedRef = useRef(false); 
  const { setCanvasAdapter, pushHistory, canvasAdapter } = useEditorStore();

  const handleExportSnapshot = useCallback(() => {
    if (!canvasAdapter) return;
    const dataUrl = canvasAdapter.exportPNG();
    if (dataUrl) pushHistory(dataUrl);
  }, [canvasAdapter, pushHistory]);

  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;

    const init = async () => {
      const { createCanvasAdapter } = await import("@lib/canvas/CanvasAdapter");
      const adapter = createCanvasAdapter();
      
      await adapter.initializeCanvas(canvasRef.current!, {
        backgroundColor: "#ffffff"
      });

      const saved = localStorage.getItem("canvas-data");
      if (saved && saved !== "{}") {
        await adapter.loadFromJSON(saved);
      }
      setCanvasAdapter(adapter);
      initializedRef.current = true;
    };

    init();

    return () => {
      canvasAdapter?.destroy();
      setCanvasAdapter(null);
      initializedRef.current = false;
    };
  }, []); 

  useEffect(() => {
    if (!canvasAdapter) return;
    const canvas = canvasAdapter.getCanvas();
    if (!canvas) return;

    const updateSelection = () => {
      const obj = canvas.getActiveObject();
      if (!obj) {
        setSelected(null);
        return;
      }
      const rect = obj.getBoundingRect();
      setSelected(obj);
      setPosition({
        top: rect.top - 50,
        left: rect.left + rect.width / 2
      });
    };

    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", () => setSelected(null));
    canvas.on("object:moving", updateSelection);
    canvas.on("object:scaling", updateSelection);

    return () => {
      canvas.off("selection:created", updateSelection);
      canvas.off("selection:updated", updateSelection);
      canvas.off("selection:cleared");
      canvas.off("object:moving");
    };
  }, [canvasAdapter]);

  useEffect(() => {
    if (!canvasAdapter) return;
    const canvas = canvasAdapter.getCanvas();
    if (!canvas) return;

    const saveToLocalStorage = () => {
      if (canvasAdapter.getIsRestoring()) return;

      const json = canvasAdapter.saveToJSON();
      if (json && json !== '{"version":"6.0.0","objects":[]}') { 
        localStorage.setItem("canvas-data", json);
      }
    };

    canvas.on("object:added", saveToLocalStorage);
    canvas.on("object:modified", saveToLocalStorage);
    canvas.on("object:removed", saveToLocalStorage);

    return () => {
      canvas.off("object:added", saveToLocalStorage);
      canvas.off("object:modified", saveToLocalStorage);
      canvas.off("object:removed", saveToLocalStorage);
    };
  }, [canvasAdapter]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!canvasAdapter) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Delete") canvasAdapter.deleteSelected();
      if (e.ctrlKey && e.key === "z") canvasAdapter.undo();
      if (e.ctrlKey && e.key === "y") canvasAdapter.redo();
      if (e.ctrlKey && e.key === "c") canvasAdapter.duplicateSelected();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canvasAdapter]);

  useEffect(() => {
    const handle = setInterval(handleExportSnapshot, 15000);
    return () => clearInterval(handle);
  }, [handleExportSnapshot]);

  return (
    <div className="flex h-full flex-1 items-center justify-center overflow-auto bg-surface editor-scrollbar">
      <div className="relative">
        {selected && (
          <div
            className="absolute z-50 flex items-center gap-2 rounded-xl bg-white px-2 py-1 shadow-lg border border-gray-200"
            style={{
              top: position.top,
              left: position.left,
              transform: "translate(-50%, -100%)"
            }}
          >
            <button
              onClick={() => (canvasAdapter as any)?.duplicateSelected()}
              className="flex items-center justify-center rounded-md p-1 hover:bg-gray-100"
            >
              <Copy size={14} />
            </button>

            <button
              onClick={() => (canvasAdapter as any)?.deleteSelected()}
              className="flex items-center justify-center rounded-md p-1 hover:bg-red-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center justify-center bg-neutral-100/80 py-6 overflow-auto h-full" style={{ paddingLeft: '92px' }}>
          <div
            ref={canvasRef}
            className="h-[1123px] w-[794px] rounded-xl bg-white shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};