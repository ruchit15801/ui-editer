import { Request, Response } from "express";
import sharp from "sharp";
import { asyncHandler } from "../utils/asyncHandler";
import { removeBackgroundFromBuffer } from "../services/background.service";
import { storeImageBuffer } from "../services/storage.service";
import { uploadToS3 } from "../services/s3.service";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as any).file;

  if (!file) {
    return res.status(400).json({ message: "File required" });
  }

  const optimizedBuffer = await sharp(file.buffer)
    .resize({
      width: 2000,
      height: 2000,
      fit: "inside",
      withoutEnlargement: true
    })
    .toBuffer();

  const imageUrl = await uploadToS3(
    optimizedBuffer,
    file.originalname,
    file.mimetype
  );

  res.json({
    success: true,
    imageUrl
  });
});

export const removeBackground = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    res.status(400).json({ success: false, message: "Image file is required" });
    return;
  }

  const processedBuffer = await removeBackgroundFromBuffer(file.buffer);
  const stored = await storeImageBuffer(`processed/${Date.now()}`, processedBuffer);

  res.json({
    success: true,
    imageBase64: `data:image/png;base64,${stored.base64}`
  });
});

