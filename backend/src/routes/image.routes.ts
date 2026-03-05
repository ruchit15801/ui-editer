import { Router } from "express";
import multer from "multer";
import { uploadImage, removeBackground } from "../controllers/image.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

export const imageRouter = Router();

imageRouter.post("/upload", upload.single("file"), uploadImage);
imageRouter.post("/remove-background", upload.single("file"), removeBackground);

