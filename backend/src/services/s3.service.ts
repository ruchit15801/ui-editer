import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3";
import { env } from "../config/env";

export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimetype?: string
) => {
  const key = `uploads/${Date.now()}-${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentDisposition: "inline",
      ContentType: mimetype || "application/octet-stream",
      ACL: "public-read"
    })
  );

  const url = `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;

  return url;
};