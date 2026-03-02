Project Overview
================

Studio Canvas is a demo image editor that brings a Canva style editing experience into the browser. The goal is to demonstrate a production ready architecture with a modular canvas layer, a clean React based interface, and a TypeScript Express backend that integrates with a background removal API and is ready for S3 based storage.

Features
========

- Modern Next.js image editor frontend with App Router
- Fabric based canvas implementation hidden behind an adapter interface
- Upload image and render it on the canvas
- Add, drag, and resize text overlays
- Change text color and font size from the top toolbar
- Export the current design as PNG
- Remove background via backend remove.bg integration
- Responsive SaaS style layout with sidebar, toolbar, and centered canvas
- Strict TypeScript across frontend and backend

Tech Stack
==========

- Frontend
  - Next.js App Router with TypeScript
  - React 18
  - Tailwind CSS for styling
  - Zustand for editor state management
  - Fabric.js for canvas implementation behind an adapter
  - Axios for HTTP requests
- Backend
  - Node.js with Express
  - TypeScript
  - Multer for file uploads
  - Axios for remove.bg integration
  - S3 ready storage service abstraction

High Level Architecture
=======================

The project is split into a frontend and backend workspace.

- The frontend exposes a single page editor built with Next.js App Router. Canvas operations are routed through a CanvasAdapter interface so that the specific canvas library can be swapped without touching UI components.
- The backend is a small Express service that accepts image uploads, calls remove.bg to strip backgrounds, and returns processed images as base64. A storage service is structured to later target AWS S3.

Frontend Folder Structure
=========================

frontend/

- app/
  - layout.tsx
  - page.tsx
- components/
  - EditorLayout.tsx
  - Sidebar.tsx
  - TopToolbar.tsx
  - CanvasWorkspace.tsx
  - Loader.tsx
- lib/
  - canvas/
    - CanvasAdapter.ts
    - FabricAdapter.ts
- store/
  - useEditorStore.ts
- services/
  - api.ts
- types/
  - editor.types.ts

Backend Folder Structure
========================

backend/

- src/
  - app.ts
  - server.ts
  - config/
    - env.ts
  - controllers/
    - image.controller.ts
  - routes/
    - image.routes.ts
  - services/
    - background.service.ts
    - storage.service.ts
  - middleware/
    - error.middleware.ts
  - utils/
    - asyncHandler.ts

How The Canvas Adapter Works
============================

The canvas layer is abstracted behind the CanvasAdapter interface defined in frontend/lib/canvas/CanvasAdapter.ts.

CanvasAdapter defines the following methods.

- initializeCanvas
- addImage
- addText
- setTextColor
- setFontSize
- exportPNG
- removeBackground
- destroy

The factory function createCanvasAdapter returns the active implementation of this interface. For this demo it returns an instance of FabricAdapter.

CanvasWorkspace only imports createCanvasAdapter and calls the interface methods. It never imports Fabric directly. This keeps all Fabric specific code inside FabricAdapter and allows easy replacement later.

Replacing Fabric With Another Canvas Library
============================================

To replace Fabric.js with another canvas library, follow these steps.

1. Create a new adapter file, for example KonvaAdapter.ts, in frontend/lib/canvas.
2. Implement the CanvasAdapter interface methods using the Konva API instead of Fabric.
3. Update the createCanvasAdapter function in CanvasAdapter.ts to return a new KonvaAdapter instance instead of FabricAdapter.

No other changes are required in CanvasWorkspace or any UI component, since they only depend on the CanvasAdapter contract.

Editor State Model
==================

The Zustand store in frontend/store/useEditorStore.ts keeps editor state centralised.

It tracks the following keys.

- canvasAdapter
- selectedObjectId
- currentFontSize
- currentColor
- isLoading
- uploadedImage
- historyStack

This state model is designed to grow over time.

- selectedObjectId can be extended into a structured layers model.
- historyStack can be expanded into a full undo and redo system.
- Additional fields can later track multi page documents, filters, and collaboration cursors.

Backend API Endpoints
=====================

Base URL

- Default base URL for local development is http://localhost:4000/api

POST /api/upload

- Description
  - Accepts a single image and returns it as base64. In future this is the place to add S3 storage integration.
- Request
  - Method: POST
  - URL: /api/upload
  - Body: multipart form data with field image containing a file
- Response
  - 200 OK
  - JSON body
    - success: boolean
    - imageBase64: base64 encoded image string

POST /api/remove-background

- Description
  - Accepts a single image, calls remove.bg to strip the background when an API key is configured, and returns the processed image as base64.
- Request
  - Method: POST
  - URL: /api/remove-background
  - Body: multipart form data with field image containing a file
- Response
  - 200 OK
  - JSON body
    - success: boolean
    - imageBase64: base64 encoded result image string

When the REMOVE_BG_API_KEY environment variable is not set, the background service returns the original image buffer so the demo continues to work without external dependencies.

Environment Variables
=====================

Backend .env

Create a .env file in the backend folder with the following keys.

- PORT=4000
- REMOVE_BG_API_KEY=your_remove_bg_api_key
- S3_BUCKET=your_bucket_name_optional
- S3_REGION=your_region_optional
- S3_ACCESS_KEY_ID=your_access_key_optional
- S3_SECRET_ACCESS_KEY=your_secret_key_optional

For local testing you can leave the S3 values empty. You can also leave REMOVE_BG_API_KEY empty if you are comfortable with the background removal endpoint returning the original image.

Frontend .env.local

Create a .env.local file in the frontend folder with the following key.

- NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

Running The Backend
===================

1. Install dependencies.

   - Open a terminal in backend
   - Run npm install

2. Configure environment.

   - Create backend/.env with at least PORT and optionally REMOVE_BG_API_KEY

3. Start the development server.

   - Run npm run dev
   - The API will listen on the configured port, defaulting to 4000

4. Build for production.

   - Run npm run build
   - Run npm start to serve dist/server.js

Running The Frontend
====================

1. Install dependencies.

   - Open a terminal in frontend
   - Run npm install

2. Configure environment.

   - Create frontend/.env.local with NEXT_PUBLIC_API_BASE_URL pointing at your backend

3. Start the development server.

   - Run npm run dev
   - Open the printed Next.js URL in your browser

4. Build for production.

   - Run npm run build
   - Run npm start to launch the production server

Production Build And Deployment
===============================

Frontend

- The frontend is a standard Next.js app.
- Build with npm run build in the frontend directory.
- Deploy the .next output through your preferred platform, such as a Node server or a managed Next.js host.

Backend

- Build the backend with npm run build in the backend directory.
- This compiles TypeScript into dist.
- Start the service with npm start and ensure environment variables are provided.

Scaling The Design
==================

The codebase has been structured so it can grow into a richer editor without large refactors.

- Layers panel
  - Extend the Zustand store with a layers collection and connect it to a new sidebar component section.
  - Each canvas object can be tracked as a layer entry with id, type, and metadata.
- Undo and redo
  - Build a command history system around historyStack, storing snapshots or structured actions.
  - Add toolbar controls and keyboard bindings for undo and redo operations.
- Multi page canvas
  - Model pages in the store and mount one canvas instance per page or reuse a single canvas while swapping content.
  - The layout can evolve to show a page strip or thumbnail rail.
- Templates and presets
  - Add a template service that loads predefined JSON scenes and renders them through the canvas adapter.
  - Extend Sidebar to browse and apply templates.
- Filters and adjustments
  - Introduce a filter pipeline in the canvas implementation layer and expose it behind CanvasAdapter.
  - Extend TopToolbar with filter controls that call adapter methods.
- Collaboration
  - Add a real time layer using WebSockets or WebRTC and sync high level actions instead of raw pixel data.
- Database storage and authentication
  - Persist designs and user accounts in a database.
  - Gate certain editor features behind authentication and ownership checks.

By keeping the canvas implementation behind a dedicated adapter and maintaining a clean separation between UI, state, and backend APIs, the project is ready to evolve into a full SaaS image editor.

