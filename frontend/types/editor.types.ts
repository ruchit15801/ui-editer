import type { CanvasAdapter } from "@lib/canvas/CanvasAdapter";

export interface EditorState {
  canvasAdapter: CanvasAdapter | null;
  selectedObjectId: string | null;
  currentFontSize: number;
  currentColor: string;
  isLoading: boolean;
  uploadedImage: string | null;
  historyStack: string[];
}

export interface EditorActions {
  setCanvasAdapter: (adapter: CanvasAdapter | null) => void;
  setSelectedObjectId: (id: string | null) => void;
  setCurrentFontSize: (size: number) => void;
  setCurrentColor: (color: string) => void;
  setIsLoading: (loading: boolean) => void;
  setUploadedImage: (url: string | null) => void;
  pushHistory: (snapshot: string) => void;
  resetEditor: () => void;
}

export type EditorStore = EditorState & EditorActions;

