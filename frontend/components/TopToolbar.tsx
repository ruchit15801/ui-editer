"use client";

import React, { useCallback } from "react";
import { useEditorStore } from "@store/useEditorStore";
import { Download, Edit3, Eye, Redo2, Sparkles, Undo2 } from "lucide-react";

interface TopToolbarProps {
  onExport: (dataUrl: string) => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({ onExport }) => {
  const {
    canvasAdapter,
    currentFontSize,
    currentColor,
    setCurrentFontSize,
    setCurrentColor
  } = useEditorStore();

  const [saveStatus, setSaveStatus] = React.useState<"saved" | "editing" | "saving">("saved");

  const saveTimer = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!canvasAdapter) return;

    const canvas = canvasAdapter.getCanvas?.();
    if (!canvas) return;

    const handleChange = () => {

      // user editing
      setSaveStatus("editing");

      // reset timer
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      // wait until user stops editing
      saveTimer.current = setTimeout(() => {

        setSaveStatus("saving");

        // simulate save
        setTimeout(() => {
          setSaveStatus("saved");
        }, 600);

      }, 1500); // user stops editing for 1.5s
    };

    canvas.on("object:added", handleChange);
    canvas.on("object:modified", handleChange);
    canvas.on("object:removed", handleChange);
    canvas.on("text:changed", handleChange);

    return () => {
      canvas.off("object:added", handleChange);
      canvas.off("object:modified", handleChange);
      canvas.off("object:removed", handleChange);
      canvas.off("text:changed", handleChange);
    };

  }, [canvasAdapter]);

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = Number(event.target.value);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    setCurrentFontSize(numeric);
    if (canvasAdapter) {
      canvasAdapter.setFontSize(numeric);
    }
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setCurrentColor(color);
    if (canvasAdapter) {
      canvasAdapter.setTextColor(color);
    }
  };

  const handleExport = useCallback(() => {
    if (!canvasAdapter) return;
    const dataUrl = canvasAdapter.exportPNGWithWatermark();
    if (!dataUrl) return;
    onExport(dataUrl);
  }, [canvasAdapter, onExport]);

  return (
    <header className="sticky top-0 z-[1000] flex h-16 items-center justify-between px-6 bg-white/70 backdrop-blur-xl border-b border-gray-200">
      {/* LEFT */}
      <div className="flex items-center gap-5">
        {/* Logo */}
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
            <Sparkles size={16} />
          </div>
          <span className="text-sm tracking-wide">Studio Canvas</span>
        </div>
      </div>

      {/* CENTER TOOLBAR */}
      <div className="flex items-center gap-3 bg-white shadow-sm px-4 py-2 rounded-full border border-gray-200">
        {/* Undo */}
        <button onClick={() => canvasAdapter?.undo()} disabled={!canvasAdapter} className="p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-40">
          <Undo2 size={18} />
        </button>

        {/* Redo */}
        <button onClick={() => canvasAdapter?.redo()} disabled={!canvasAdapter} className="p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-40">
          <Redo2 size={18} />
        </button>

        <div className="w-px h-5 bg-gray-300" />

        {/* Font Size */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
          <span className="text-xs text-gray-500">Size</span>
          <input
            type="number"
            value={currentFontSize}
            onChange={handleFontSizeChange}
            className="w-12 bg-transparent text-sm outline-none text-gray-800"
          />
        </div>

        {/* Color */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
          <span className="text-xs text-gray-500">Color</span>
          <input
            type="color"
            value={currentColor}
            onChange={handleColorChange}
            className="h-6 w-6 rounded border cursor-pointer"
          />
        </div>

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* Autosave */}
        <div className="flex items-center gap-2 text-xs text-gray-500">

          <span
            className={`h-2 w-2 rounded-full animate-pulse ${saveStatus === "editing"
              ? "bg-yellow-500"
              : saveStatus === "saving"
                ? "bg-blue-500"
                : "bg-green-500"
              }`}
          />

          <span>
            {saveStatus === "editing" && "Editing..."}
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
          </span>

        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={!canvasAdapter}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 shadow-md hover:scale-105 hover:shadow-lg transition disabled:opacity-40">
          <Download size={16} />
          Export
        </button>
      </div>
    </header>
  );

};