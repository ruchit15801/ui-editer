"use client";

import React, { useEffect, useRef, useState } from "react";
import { uploadImage, removeBackground } from "@services/api";
import { useEditorStore } from "@store/useEditorStore";
import { Scissors, Type, Upload } from "lucide-react";

export const Sidebar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastFileRef = useRef<File | null>(null);

  const {
    canvasAdapter,
    currentColor,
    setIsLoading,
    setUploadedImage
  } = useEditorStore();

  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const panel = active || hovered;

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleAddText = async (text: string, size: number) => {
    if (!canvasAdapter) return;
    await canvasAdapter.addText(text, {
      color: currentColor,
      fontSize: size
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    lastFileRef.current = file;

    try {
      setIsLoading(true);
      const res = await uploadImage(file);
      setUploadedImage(res.imageUrl);
      await canvasAdapter?.addImage(res.imageUrl);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!lastFileRef.current) return;

    try {
      setIsLoading(true);
      const res = await removeBackground(lastFileRef.current);
      setUploadedImage(res.imageBase64);
      await canvasAdapter?.removeBackground(res.imageBase64);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setActive(null);
    };

    window.addEventListener("click", handleOutsideClick);

    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-4rem)]">

      <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-20 bg-white border-r flex flex-col items-center py-5 text-gray-700 shadow-sm z-40">
        <div className="mb-10 text-xl font-bold">✨</div>
        <div className="flex flex-col gap-6">

          {["upload", "text", "remove"].map((item) => (
            <button
              key={item}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => {
                e.stopPropagation();
                setActive((prev) => (prev === item ? null : item));
              }}
              className="p-3 rounded-xl hover:bg-white/20 transition hover:scale-110">
              {item === "upload" && <Upload size={22} />}
              {item === "text" && <Type size={22} />}
              {item === "remove" && <Scissors size={22} />}
            </button>
          ))}

        </div>
      </aside>

      {/* 🌟 PANEL */}
      {panel && (
        <div
          className="fixed top-16 left-20 h-[calc(100vh-4rem)] w-80 bg-[#f9fafb] shadow-2xl border-r p-4 overflow-y-auto z-30"
          onMouseEnter={() => setHovered(panel)}
          onMouseLeave={() => setHovered(null)}>

          {panel === "upload" && (
            <>
              <h3 className="font-semibold mb-4">Uploads</h3>
              <button onClick={triggerFileDialog} className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-3">
                Upload files
              </button>
            </>
          )}

          {panel === "text" && (
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input placeholder="Search fonts and combinations" className="w-full rounded-2xl border py-3 pl-10 pr-4 text-sm"/>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>

              <button onClick={() => handleAddText("Text", 24)}
                className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 font-semibold">
                Add a text box
              </button>

              <div className="font-semibold text-gray-700">
                Default text styles
              </div>

              <button onClick={() => handleAddText("Heading", 42)} className="p-4 bg-white border rounded-2xl text-2xl font-bold">
                Add a heading
              </button>

              <button onClick={() => handleAddText("Subheading", 28)} className="p-4 bg-white border rounded-2xl text-lg font-semibold">
                Add a subheading
              </button>

              <button onClick={() => handleAddText("Body text", 16)} className="p-4 bg-white border rounded-2xl text-sm">
                Add a little bit of body text
              </button>
            </div>
          )}

          {panel === "remove" && (
            <>
              <h3 className="font-semibold mb-4">Edit Image</h3>
              <button onClick={handleRemoveBackground} className="w-full bg-red-500 text-white p-3 rounded-xl">
                Remove Background
              </button>
            </>
          )}
        </div>
      )}

      {/* hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
};