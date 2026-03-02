import axios from "axios";
import FormData from "form-data";
import { env } from "../config/env";

export const removeBackgroundFromBuffer = async (buffer: Buffer): Promise<Buffer> => {
  if (!env.REMOVE_BG_API_KEY) {
    // When API key is not present, return the original buffer to keep the demo working
    return buffer;
  }

  const formData = new FormData();
  formData.append("image_file", buffer, {
    filename: "upload.png",
    contentType: "image/png"
  });
  formData.append("size", "auto");

  const response = await axios.post<ArrayBuffer>("https://api.remove.bg/v1.0/removebg", formData, {
    headers: {
      "X-Api-Key": env.REMOVE_BG_API_KEY,
      ...formData.getHeaders()
    },
    responseType: "arraybuffer"
  });

  return Buffer.from(response.data);
};


