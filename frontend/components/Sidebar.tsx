"use client";

import React, { useRef } from "react";
import { uploadImage, removeBackground } from "@services/api";
import { useEditorStore } from "@store/useEditorStore";
import { Scissors, Type, Upload } from "lucide-react";

interface SidebarProps {
  onImageLoaded?: (dataUrl: string) => Promise<void>;
  onBackgroundRemoved?: (dataUrl: string) => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onImageLoaded,
  onBackgroundRemoved
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const { canvasAdapter, currentColor, currentFontSize, setIsLoading, setUploadedImage } = useEditorStore();

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    lastFileRef.current = file;

    try {
      setIsLoading(true);

      const response = await uploadImage(file);
      const imageUrl = response.imageUrl;

      setUploadedImage(imageUrl);

      if (canvasAdapter) {
        await canvasAdapter.addImage(imageUrl);
      }

    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const handleAddText = async () => {
    if (!canvasAdapter) return;
    await canvasAdapter.addText("Your text", {
      color: currentColor,
      fontSize: currentFontSize
    });
  };

  const handleRemoveBackground = async () => {
    const file = lastFileRef.current;
    if (!file) return;

    try {
      setIsLoading(true);

      const response = await removeBackground(file);
      const base64 = response.imageBase64;

      setUploadedImage(base64);

      const adapter = useEditorStore.getState().canvasAdapter;

      if (adapter) {
        await adapter.removeBackground(base64);
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    // <aside className="flex h-full w-64 flex-col border-r border-border-subtle bg-surface-elevated/80 p-4 backdrop-blur-md">
    //   <div className="mb-6">
    //     <h1 className="text-sm font-semibold uppercase tracking-[0.24em] text-text-muted">
    //       Studio Canvas
    //     </h1>
    //     <p className="mt-1 text-sm text-text-muted">
    //       Image editor
    //     </p>
    //   </div>

    //   <div className="space-y-3">
    //     <button
    //       type="button"
    //       onClick={triggerFileDialog}
    //       className="flex w-full items-center justify-between rounded-lg border border-dashed border-accent/40 bg-accent-soft px-3 py-2.5 text-left text-sm font-medium text-accent transition hover:border-accent hover:bg-accent hover:text-white"
    //     >
    //       <span>Upload image</span>
    //       <span className="text-xs font-semibold uppercase tracking-wide">
    //         PNG JPG
    //       </span>
    //     </button>

    //     <button
    //       type="button"
    //       onClick={handleAddText}
    //       className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm font-medium text-text-main transition hover:border-accent hover:bg-accent-soft"
    //     >
    //       Add text
    //     </button>

    //     <button
    //       type="button"
    //       onClick={handleRemoveBackground}
    //       className="w-full rounded-lg border border-transparent bg-neutral-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
    //       disabled={!canvasAdapter}
    //     >
    //       Remove background
    //     </button>
    //   </div>

    //   <input
    //     ref={fileInputRef}
    //     type="file"
    //     accept="image/*"
    //     onChange={handleFileChange}
    //     className="hidden"
    //   />

    //   <div className="mt-auto pt-6 text-xs text-text-muted">
    //     <p>Upload an image, add text, then export as PNG.</p>
    //     {/* TODO Extend sidebar with layers and templates sections */}
    //   </div>
    // </aside>


    <aside className="flex h-full w-20 flex-col items-center border-r border-gray-200 bg-white py-4 relative">

      {/* Logo */}
      <div className="mb-8 text-sm font-bold text-gray-700">
        SC
      </div>

      {/* Menu */}
      <div className="flex flex-col items-center gap-6">

        {/* Upload */}
        <div className="group relative">
          <button
            onClick={triggerFileDialog}
            className="p-3 rounded-xl hover:bg-gray-100 transition"
          >
            <Upload size={20} />
          </button>

          {/* Tooltip */}
          <span className="absolute left-14 top-1/2 -translate-y-1/2 
      whitespace-nowrap rounded-md bg-black text-white text-xs px-2 py-1 
      opacity-0 group-hover:opacity-100 transition z-[9999]">
            Upload
          </span>
        </div>

        {/* Text */}
        <div className="group relative">
          <button
            onClick={handleAddText}
            className="p-3 rounded-xl hover:bg-gray-100 transition"
          >
            <Type size={20} />
          </button>

          <span className="absolute left-14 top-1/2 -translate-y-1/2 
      whitespace-nowrap rounded-md bg-black text-white text-xs px-2 py-1 
      opacity-0 group-hover:opacity-100 transition z-[9999]">
            Text
          </span>
        </div>

        {/* Remove BG */}
        <div className="group relative">
          <button
            onClick={handleRemoveBackground}
            disabled={!canvasAdapter}
            className="p-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-40"
          >
            <Scissors size={20} />
          </button>

          <span className="absolute left-14 top-1/2 -translate-y-1/2 
      whitespace-nowrap rounded-md bg-black text-white text-xs px-2 py-1 
      opacity-0 group-hover:opacity-100 transition z-[9999]">
            Remove BG
          </span>
        </div>

      </div>

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

    </aside>
  );
};

