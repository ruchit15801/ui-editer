"use client";

import React, { useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { TopToolbar } from "./TopToolbar";
import { CanvasWorkspace } from "./CanvasWorkspace";
import { Loader } from "./Loader";
import { useEditorStore } from "@store/useEditorStore";

export const EditorLayout: React.FC = () => {
  const { isLoading } = useEditorStore();

  const handleExport = useCallback((dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `studio-canvas-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-slate-100 to-slate-200">
      <div className="flex min-h-screen flex-col">
        <TopToolbar onExport={handleExport} />
        <main className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated shadow-soft">
          <Sidebar />
          <CanvasWorkspace />
        </main>
        {isLoading && <Loader message="Processing image. This can take a moment." />}
      </div>
    </div>
  );
};

