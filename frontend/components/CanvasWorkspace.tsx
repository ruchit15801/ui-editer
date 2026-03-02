"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@store/useEditorStore";
import { Copy, Trash2 } from "lucide-react";

export const CanvasWorkspace: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const initializedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const { setCanvasAdapter, pushHistory, canvasAdapter } = useEditorStore();

  const handleExportSnapshot = useCallback(() => {
    const adapter = useEditorStore.getState().canvasAdapter;
    if (!adapter) return;
    const dataUrl = adapter.exportPNG();
    if (dataUrl) {
      pushHistory(dataUrl);
    }
  }, [pushHistory]);


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

    return () => {
      canvas.off("selection:created", updateSelection);
      canvas.off("selection:updated", updateSelection);
    };
  }, [canvasAdapter]);

  useEffect(() => {
    if (!canvasRef.current || initializedRef.current) return;

    const init = async () => {
      const { createCanvasAdapter } = await import("@lib/canvas/CanvasAdapter");

      const adapter = await createCanvasAdapter();
      setCanvasAdapter(adapter);

      await adapter.initializeCanvas(canvasRef.current!, {
        backgroundColor: "#ffffff"
      });

      initializedRef.current = true;
    };

    init();

    return () => {
      const adapter = useEditorStore.getState().canvasAdapter;
      adapter?.destroy();
      setCanvasAdapter(null);
    };
  }, [setCanvasAdapter]);

  useEffect(() => {
    if (!canvasAdapter) return;

    const canvas = canvasAdapter.getCanvas();
    if (!canvas) return;

    const save = () => {
      if (!canvasAdapter) return;

      if (canvasAdapter.getIsRestoring()) return;

      const canvas = canvasAdapter.getCanvas();
      if (!canvas) return;

      const objects = canvas.getObjects();

      if (objects.length === 0) return;

      const json = canvasAdapter.saveToJSON();

      console.log("✅ SAVED:", json);

      localStorage.setItem("canvas-data", json);
    };

    canvas.on("object:added", save);
    canvas.on("object:modified", save);
    canvas.on("object:removed", save);

    return () => {
      canvas.off("object:added", save);
      canvas.off("object:modified", save);
      canvas.off("object:removed", save);
    };
  }, [canvasAdapter]);

  useEffect(() => {
    if (!canvasAdapter || hasLoadedRef.current) return;

    const saved = localStorage.getItem("canvas-data");

    if (saved) {
      console.log("🔥 LOADING FROM STORAGE");

      setTimeout(() => {
        canvasAdapter.loadFromJSON(saved);
      }, 300);
    }

    hasLoadedRef.current = true;
  }, [canvasAdapter]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const adapter = useEditorStore.getState().canvasAdapter as any;

      if (!adapter) return;

      if (e.key === "Delete") {
        adapter.deleteSelected();
      }

      if (e.ctrlKey && e.key === "z") {
        adapter.undo();
      }

      if (e.ctrlKey && e.key === "y") {
        adapter.redo();
      }

      if (e.ctrlKey && e.key === "c") {
        adapter.duplicateSelected();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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
              onClick={() =>
                (useEditorStore.getState().canvasAdapter as any)?.duplicateSelected()
              }
              className="flex items-center justify-center rounded-md p-1 hover:bg-gray-100"
            >
              <Copy size={14} />
            </button>

            <button
              onClick={() =>
                (useEditorStore.getState().canvasAdapter as any)?.deleteSelected()
              }
              className="flex items-center justify-center rounded-md p-1 hover:bg-red-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center justify-center bg-neutral-100/80 py-6 overflow-auto h-full">
          <div
            ref={canvasRef}
            className="h-[1123px] w-[794px] rounded-xl bg-white"
          />
        </div>
      </div>
    </div>
  );
};