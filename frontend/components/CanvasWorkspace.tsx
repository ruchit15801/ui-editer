// "use client";

// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { useEditorStore } from "@store/useEditorStore";
// import { Copy, Trash2 } from "lucide-react";

// export const CanvasWorkspace: React.FC = () => {
//   const canvasRef = useRef<HTMLDivElement | null>(null);
//   const [selected, setSelected] = useState<any>(null);
//   const [position, setPosition] = useState({ top: 0, left: 0 });
//   const initializedRef = useRef(false);
//   const { setCanvasAdapter, pushHistory, canvasAdapter } = useEditorStore();

//   const handleExportSnapshot = useCallback(() => {
//     const adapter = useEditorStore.getState().canvasAdapter;
//     if (!adapter) return;
//     const dataUrl = adapter.exportPNG();
//     if (dataUrl) {
//       pushHistory(dataUrl);
//     }
//   }, [pushHistory]);

//   useEffect(() => {
//     if (!canvasAdapter) return;

//     const canvas = canvasAdapter.getCanvas();
//     if (!canvas) return;

//     const updateSelection = () => {
//       const obj = canvas.getActiveObject();

//       console.log("ACTIVE OBJ:", obj);

//       if (!obj) {
//         setSelected(null);
//         return;
//       }

//       const rect = obj.getBoundingRect();

//       setSelected(obj);

//       setPosition({
//         top: rect.top - 40,
//         left: rect.left + rect.width / 2
//       });
//     };

//     canvas.on("selection:created", updateSelection);
//     canvas.on("selection:updated", updateSelection);
//     canvas.on("selection:cleared", () => setSelected(null));

//     canvas.on("object:moving", updateSelection);

//     return () => {
//       canvas.off("selection:created", updateSelection);
//       canvas.off("selection:updated", updateSelection);
//     };
//   }, [canvasAdapter]);

//   useEffect(() => {
//     if (!canvasRef.current || initializedRef.current) return;

//     const init = async () => {
//       const { createCanvasAdapter } = await import("@lib/canvas/CanvasAdapter");

//       const adapter = await createCanvasAdapter();
//       setCanvasAdapter(adapter);

//       await adapter.initializeCanvas(canvasRef.current!, {
//         backgroundColor: "#ffffff"
//       });

//       initializedRef.current = true;
//     };

//     init();

//     return () => {
//       const adapter = useEditorStore.getState().canvasAdapter;
//       adapter?.destroy();
//       setCanvasAdapter(null);
//     };
//   }, [setCanvasAdapter]);

//   useEffect(() => {
//     const adapter = useEditorStore.getState().canvasAdapter as any;
//     if (!adapter) return;

//     const saved = localStorage.getItem("canvas-data");
//     if (saved) {
//       adapter.loadFromJSON(saved);
//     }
//   }, []);

//   useEffect(() => {
//     const adapter = useEditorStore.getState().canvasAdapter as any;
//     if (!adapter || !adapter.canvas) return;

//     const save = () => {
//       const json = adapter.saveToJSON();
//       localStorage.setItem("canvas-data", json);
//     };

//     adapter.canvas.on("object:added", save);
//     adapter.canvas.on("object:modified", save);
//     adapter.canvas.on("object:removed", save);

//   }, []);

//   useEffect(() => {
//     const handleKey = (e: KeyboardEvent) => {
//       const adapter = useEditorStore.getState().canvasAdapter as any;

//       if (!adapter) return;

//       if (e.key === "Delete") {
//         adapter.deleteSelected();
//       }

//       if (e.ctrlKey && e.key === "z") {
//         adapter.undo();
//       }

//       if (e.ctrlKey && e.key === "y") {
//         adapter.redo();
//       }

//       if (e.ctrlKey && e.key === "c") {
//         adapter.duplicateSelected();
//       }
//     };

//     window.addEventListener("keydown", handleKey);
//     return () => window.removeEventListener("keydown", handleKey);
//   }, []);

//   useEffect(() => {
//     const handle = setInterval(handleExportSnapshot, 15000);
//     return () => clearInterval(handle);
//   }, [handleExportSnapshot]);

//   return (
//     // <div className="flex h-full flex-1 items-center justify-center overflow-auto bg-surface editor-scrollbar">
//     //   <div className="relative flex w-full justify-center px-6 py-10">
//     //     <div className="relative w-full overflow-visible rounded-2xl bg-surface-elevated shadow-soft">
//     //       {selected && (
//     //         <div
//     //           className="absolute z-50 flex items-center gap-2 rounded-xl bg-white px-2 py-1 shadow-lg border border-gray-200"
//     //           style={{
//     //             top: position.top,
//     //             left: position.left,
//     //             transform: "translate(-50%, -100%)"
//     //           }}
//     //         >
//     //           <button
//     //             onClick={() =>
//     //               (useEditorStore.getState().canvasAdapter as any)?.duplicateSelected()
//     //             }
//     //             className="flex items-center justify-center rounded-md p-1 hover:bg-gray-100"
//     //           >
//     //             <Copy size={14} />
//     //           </button>

//     //           <button
//     //             onClick={() =>
//     //               (useEditorStore.getState().canvasAdapter as any)?.deleteSelected()
//     //             }
//     //             className="flex items-center justify-center rounded-md p-1 hover:bg-red-100"
//     //           >
//     //             <Trash2 size={14} />
//     //           </button>
//     //         </div>
//     //       )}
//     //       <div className="flex justify-center bg-neutral-100/70 px-4 py-2 text-xs text-text-muted">
//     //         <span>Canvas</span>
//     //       </div>
//     //       <div className="flex items-center justify-center bg-neutral-100/80 p-6 overflow-auto h-full">
//     //         <div
//     //           ref={canvasRef}
//     //           className="h-[1123px] w-[794px] rounded-xl bg-white"
//     //         />
//     //       </div>
//     //     </div>
//     //   </div>
//     // </div>

//     <div className="flex h-full flex-1 justify-center overflow-auto bg-gray-100">

//       <div className="relative flex w-full justify-center py-10">

//         {/* Floating Toolbar */}
//         {selected && (
//           <div
//             className="absolute z-50 flex items-center gap-2 rounded-lg bg-white px-2 py-1 shadow-md border"
//             style={{
//               top: position.top,
//               left: position.left,
//               transform: "translate(-50%, -120%)"
//             }}
//           >
//             <button
//               onClick={() =>
//                 (useEditorStore.getState().canvasAdapter as any)?.duplicateSelected()
//               }
//               className="p-1 rounded hover:bg-gray-100"
//             >
//               <Copy size={14} />
//             </button>

//             <button
//               onClick={() =>
//                 (useEditorStore.getState().canvasAdapter as any)?.deleteSelected()
//               }
//               className="p-1 rounded hover:bg-red-100"
//             >
//               <Trash2 size={14} />
//             </button>
//           </div>
//         )}

//         {/* Canvas Area */}
//         <div className="flex items-center justify-center p-10">

//           <div className="relative bg-white shadow-xl rounded-md">

//             {/* Label */}
//             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400">
//               Canvas
//             </div>

//             {/* Actual Canvas */}
//             <div
//               ref={canvasRef}
//               className="h-[1123px] w-[794px] rounded-md"
//             />

//           </div>

//         </div>

//       </div>

//     </div>
//   );
// };



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
    const adapter = useEditorStore.getState().canvasAdapter;
    if (!adapter) return;
    const dataUrl = adapter.exportPNG();
    if (dataUrl) pushHistory(dataUrl);
  }, [pushHistory]);

  // ✅ FIXED: PERFECT TOOLBAR POSITION
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
      const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();

      setSelected(obj);

      setPosition({
        top: canvasRect.top + rect.top - 50,
        left: canvasRect.left + rect.left + rect.width / 2
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

  // ✅ INIT CANVAS
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

  // ✅ LOAD FROM LOCALSTORAGE
  useEffect(() => {
    const adapter = useEditorStore.getState().canvasAdapter as any;
    if (!adapter) return;

    const saved = localStorage.getItem("canvas-data");
    if (saved) adapter.loadFromJSON(saved);
  }, []);

  // ✅ AUTO SAVE
  useEffect(() => {
    const adapter = useEditorStore.getState().canvasAdapter as any;
    if (!adapter || !adapter.canvas) return;

    const save = () => {
      const json = adapter.saveToJSON();
      localStorage.setItem("canvas-data", json);
    };

    adapter.canvas.on("object:added", save);
    adapter.canvas.on("object:modified", save);
    adapter.canvas.on("object:removed", save);
  }, []);

  // ✅ KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const adapter = useEditorStore.getState().canvasAdapter as any;
      if (!adapter) return;

      if (e.key === "Delete") adapter.deleteSelected();
      if (e.ctrlKey && e.key === "z") adapter.undo();
      if (e.ctrlKey && e.key === "y") adapter.redo();
      if (e.ctrlKey && e.key === "c") adapter.duplicateSelected();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ✅ AUTO SNAPSHOT
  useEffect(() => {
    const handle = setInterval(handleExportSnapshot, 15000);
    return () => clearInterval(handle);
  }, [handleExportSnapshot]);

  return (
    <div className="flex h-full w-full flex-1 justify-center overflow-auto bg-gray-100">

      <div className="relative flex w-full justify-center py-10">

        {/* ✅ FLOATING TOOLBAR */}
        {selected && (
          <div
            className="absolute z-[9999] flex items-center gap-1 rounded-lg bg-white px-2 py-1 shadow-md border border-gray-200"
            style={{
              top: position.top,
              left: position.left,
              transform: "translate(-50%, -120%)"
            }}
          >
            <button
              onClick={() =>
                (useEditorStore.getState().canvasAdapter as any)?.duplicateSelected()
              }
              className="p-1.5 rounded-md hover:bg-gray-100 transition"
            >
              <Copy size={14} />
            </button>

            <button
              onClick={() =>
                (useEditorStore.getState().canvasAdapter as any)?.deleteSelected()
              }
              className="p-1.5 rounded-md hover:bg-red-100 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* ✅ CANVAS */}
        <div className="flex items-center justify-center min-h-full">
          <div className="relative bg-white shadow-xl rounded-md hover:shadow-2xl transition">
            <div ref={canvasRef} className="h-[1123px] w-[794px] rounded-md"/>
          </div>
        </div>
      </div>
    </div>
  );
};