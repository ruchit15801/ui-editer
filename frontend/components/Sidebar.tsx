"use client";

import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { uploadImage, removeBackground } from "@services/api";
import { useEditorStore } from "@store/useEditorStore";
import { Scissors, Type, Upload, Shapes } from "lucide-react";


const elements = [
  { type: "svg", src: "/elements/svg/e1.svg" },
  { type: "svg", src: "/elements/svg/e2.svg" },
  { type: "svg", src: "/elements/svg/e3.svg" },
  { type: "svg", src: "/elements/svg/e4.svg" },
  { type: "svg", src: "/elements/svg/e5.svg" },
  { type: "svg", src: "/elements/svg/e6.svg" },
  { type: "svg", src: "/elements/svg/e7.svg" },
  { type: "svg", src: "/elements/svg/e8.svg" },
  { type: "svg", src: "/elements/svg/e9.svg" },
  { type: "svg", src: "/elements/svg/e10.svg" },
  { type: "svg", src: "/elements/svg/e11.svg" },
  { type: "svg", src: "/elements/svg/e12.svg" },
  { type: "svg", src: "/elements/svg/e13.svg" },
  { type: "svg", src: "/elements/svg/e14.svg" },
];
export const Sidebar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastFileRef = useRef<File | null>(null);

  const fonts = [
    "Arial",
    "Verdana",
    "Times New Roman",
    "Georgia",
    "Courier New",
    "Trebuchet MS",
    "Tahoma",
    "Impact",
    "Comic Sans MS",
    "Poppins"
  ];

  const [selectedFont, setSelectedFont] = useState("Arial");

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

    const canvas = canvasAdapter.getCanvas();
    if (!canvas) return;

    const iText = new fabric.IText(text, {
      left: 350,
      top: 200,
      fill: currentColor,
      fontSize: size,
      fontFamily: selectedFont
    });

    canvas.add(iText);
    canvas.setActiveObject(iText);
    canvas.renderAll();
  };

  const addElement = async (item: any) => {

    if (!canvasAdapter) return;

    const canvas = canvasAdapter.getCanvas();
    if (!canvas) return;

    if (item.type === "svg") {

      fabric.loadSVGFromURL(item.src).then(({ objects, options }) => {
        const filteredObjects = objects.filter(Boolean) as fabric.Object[];
        const obj = fabric.util.groupSVGElements(filteredObjects, options);
        obj.set({
          left: 350,
          top: 200,
          scaleX: 0.5,
          scaleY: 0.5
        });

        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();

      });

    }

    if (item.type === "gif") {
      const img = await fabric.Image.fromURL(item.src);

      img.set({
        left: 350,
        top: 200,
        scaleX: 0.5,
        scaleY: 0.5
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();

    }

  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasAdapter) return;

    lastFileRef.current = file;

    const localUrl = URL.createObjectURL(file);
    await canvasAdapter.addImage(localUrl);

    try {
      setIsLoading(true);

      const res = await uploadImage(file);

      setUploadedImage(res.imageUrl);

    } catch (err) {
      console.error("Upload failed", err);
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
        <div className="flex flex-col gap-6">

          {["upload", "text", "elements", "remove"].map((item) => (
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
              {item === "elements" && <Shapes size={22} />}
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

              <div className="font-semibold text-gray-700 mt-4">
                Font Families
              </div>

              <div className="grid grid-cols-2 gap-3">

                {fonts.map((font) => (
                  <button
                    key={font}
                    onClick={() => setSelectedFont(font)}
                    className={`p-3 border rounded-xl bg-white hover:shadow transition ${selectedFont === font ? "border-purple-500" : ""
                      }`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}

              </div>
            </div>
          )}

          {panel === "elements" && (

            <div className="grid grid-cols-2 gap-4">

              {elements.map((item, index) => (

                <div
                  key={index}
                  onClick={() => addElement(item)}
                  className="cursor-pointer bg-white border rounded-xl p-4 hover:shadow-lg hover:scale-[1.05] transition"
                >

                  <img
                    src={item.src}
                    className="w-full h-20 object-contain"
                  />

                </div>

              ))}

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