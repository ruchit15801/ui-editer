"use client";

import React, { useCallback } from "react";
import { useEditorStore } from "@store/useEditorStore";
import { Redo2, Undo2 } from "lucide-react";

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
    const dataUrl = canvasAdapter.exportPNG();
    if (!dataUrl) return;
    onExport(dataUrl);
  }, [canvasAdapter, onExport]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-surface-elevated/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs text-text-muted">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Autosave ready</span>
          {/* TODO Wire autosave to backend and storage */}
        </div>
      </div>


      <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-2 py-1.5">
        {/* Undo */}
        <button
          disabled={!canvasAdapter}
          onClick={() => {
            (canvasAdapter as any)?.undo();
          }}
          className="flex items-center justify-center rounded-full p-2 hover:bg-neutral-200 transition"
        >
          <Undo2 size={16} />
        </button>

        {/* Redo */}
        <button
          disabled={!canvasAdapter}
          onClick={() => {
            (canvasAdapter as any)?.redo();
          }}
          className="flex items-center justify-center rounded-full p-2 hover:bg-neutral-200 transition"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1.5">
          <span className="text-xs font-medium text-text-muted">Font size</span>
          <input
            type="number"
            min={8}
            max={144}
            value={currentFontSize}
            onChange={handleFontSizeChange}
            className="w-16 rounded-md border border-border-subtle bg-surface-elevated px-2 py-1 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1.5">
          <span className="text-xs font-medium text-text-muted">Color</span>
          <input
            type="color"
            value={currentColor}
            onChange={handleColorChange}
            className="h-7 w-7 cursor-pointer rounded-full border border-border-subtle bg-transparent p-0"
          />
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-neutral-400"
          disabled={!canvasAdapter}
        >
          Export PNG
        </button>
      </div>

    </header>
  );
};

