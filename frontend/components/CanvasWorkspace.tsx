"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@store/useEditorStore";
import { Copy, Trash2 } from "lucide-react";


export const CanvasWorkspace: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [pages, setPages] = useState<any[]>([]);

  const initializedRef = useRef(false);
  const { setCanvasAdapter, pushHistory, canvasAdapter } = useEditorStore();

  const handleExportSnapshot = useCallback(() => {
    if (!canvasAdapter) return;
    const dataUrl = canvasAdapter.exportPNG();
    if (dataUrl) pushHistory(dataUrl);
  }, [canvasAdapter, pushHistory]);

  useEffect(() => {
    if (!canvasAdapter) return;
    const canvas = canvasAdapter.getCanvas();
    if (!canvas) return;

    const saveToLocalStorage = () => {
      if (canvasAdapter.getIsRestoring()) return;

      const json = canvasAdapter.saveToJSON();
      if (!json || json === '{"version":"6.0.0","objects":[]}') return;

      try {
        localStorage.setItem("canvas-data", json);
      } catch (err) {
        console.warn("Storage quota exceeded. Clearing old data.");
        try {
          localStorage.removeItem("canvas-data");
          localStorage.setItem("canvas-data", json);
        } catch (e) {
          console.error("Failed to save canvas data", e);
        }
      }
    };

    canvas.on("object:modified", saveToLocalStorage);
    canvas.on("object:removed", saveToLocalStorage);

    return () => {
      canvas.off("object:modified", saveToLocalStorage);
      canvas.off("object:removed", saveToLocalStorage);
    };
  }, [canvasAdapter]);

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

    // const updateSelection = () => {
    //   const obj = canvas.getActiveObject();
    //   if (!obj) {
    //     setSelected(null);
    //     return;
    //   }
    //   const rect = obj.getBoundingRect();
    //   setSelected(obj);
    //   setPosition({
    //     top: rect.top - 50,
    //     left: rect.left + rect.width / 2
    //   });
    // };


    const updateSelection = () => {
      const obj = canvas.getActiveObject();
      if (!obj) {
        setSelected(null);
        return;
      }

      setSelected(obj);

      const rect = obj.getBoundingRect();
      const canvasEl = canvas.getElement();
      const canvasRect = canvasEl.getBoundingClientRect();

      setPosition({
        top: canvasRect.top + rect.top,
        left: canvasRect.left + rect.left + rect.width / 2
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

    const updatePages = () => {
      const pageList = (canvasAdapter as any).getPages();
      setPages(pageList);
    };

    const canvas = canvasAdapter.getCanvas();
    canvas?.on("object:added", updatePages);
    canvas?.on("object:removed", updatePages);

    updatePages();

    return () => {
      canvas?.off("object:added", updatePages);
      canvas?.off("object:removed", updatePages);
    };
  }, [canvasAdapter]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!canvasAdapter) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Delete") {
        e.preventDefault();
        canvasAdapter.deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        canvasAdapter.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        canvasAdapter.redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        canvasAdapter.duplicateSelected();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canvasAdapter]);

  useEffect(() => {
    const handle = setInterval(handleExportSnapshot, 15000);
    return () => clearInterval(handle);
  }, [handleExportSnapshot]);

  
  return (
    <div className="flex h-full w-full justify-center overflow-auto bg-[#f3f4f6] editor-scrollbar">
      <div className="relative py-16">

        {selected && (
          <div
            className="fixed z-50 flex items-center gap-2 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-md"
            style={{
              top: position.top - 8,
              left: position.left,
              transform: "translate(-50%, -100%)"
            }}
          >
            <button
              onClick={() => (canvasAdapter as any)?.duplicateSelected()}
              className="p-1.5 rounded-full hover:bg-gray-100 transition"
            >
              <Copy size={14} className="text-gray-700" />
            </button>

            <button
              onClick={() => (canvasAdapter as any)?.deleteSelected()}
              className="p-1.5 rounded-full hover:bg-red-100 transition"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        )}

        {/* Page Headers */}
        {pages.map((page, index) => (
          <div
            key={index}
            className="absolute left-0 w-full flex items-center justify-between px-6 z-40"
            style={{
              top: page.top + 30  
            }}
          >
            <span className="text-[16px] font-medium text-gray-600">
              Page {index + 1} – A4
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  (canvasAdapter as any)?.deletePageByIndex(index)
                }
                className="rounded-md p-1 hover:bg-red-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {/* CANVAS AREA */}
        <div className="flex justify-center">
          <div
            ref={canvasRef}
            className="w-[794px]"
          />
        </div>

        {/* Add Page Button */}
        <div className="flex justify-center mt-12">
          <button
            onClick={() => (canvasAdapter as any)?.addBlankPage()}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition"
          >
            + Add Page
          </button>
        </div>
      </div>
    </div>
  );

};