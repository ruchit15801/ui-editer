"use client";

import React from "react";

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-surface-elevated px-5 py-3 shadow-soft">
        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm font-medium text-text-muted">
          {message ?? "Processing image..."}
        </p>
      </div>
    </div>
  );
};

