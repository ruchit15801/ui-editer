import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY || "",
  S3_BUCKET: process.env.S3_BUCKET || "",
  S3_REGION: process.env.S3_REGION || "",
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || "",
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || ""
};


export const configEnv = () => {
  if (!env.REMOVE_BG_API_KEY) {
    // In demo environments we allow missing key and simply skip upstream call
    // TODO In production, enforce required environment variables strictly
  }
};

