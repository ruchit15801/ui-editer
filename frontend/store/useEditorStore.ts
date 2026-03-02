import { create } from "zustand";
import type { EditorStore } from "../../frontend/types/editor.types";

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvasAdapter: null,
  selectedObjectId: null,
  currentFontSize: 32,
  currentColor: "#111827",
  isLoading: false,
  uploadedImage: null,
  historyStack: [],

  setCanvasAdapter: (adapter) =>
    set({
      canvasAdapter: adapter
    }),

  setSelectedObjectId: (id) =>
    set({
      selectedObjectId: id
    }),

  setCurrentFontSize: (size) =>
    set({
      currentFontSize: size
    }),

  setCurrentColor: (color) =>
    set({
      currentColor: color
    }),

  setIsLoading: (loading) =>
    set({
      isLoading: loading
    }),

  setUploadedImage: (url) =>
    set({
      uploadedImage: url
    }),

  pushHistory: (snapshot) =>
    set({
      historyStack: [...get().historyStack, snapshot]
    }),

  resetEditor: () =>
    set({
      canvasAdapter: null,
      selectedObjectId: null,
      currentFontSize: 32,
      currentColor: "#111827",
      isLoading: false,
      uploadedImage: null,
      historyStack: []
    })
}));

