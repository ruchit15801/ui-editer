import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api",
  timeout: 25000
});

export interface UploadResponse {
  success: boolean;
  imageUrl: string;
}

export interface RemoveBackgroundResponse {
  success: boolean;
  imageUrl: string;
  imageBase64: string;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<UploadResponse>("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
}

export async function removeBackground(file: File): Promise<RemoveBackgroundResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<RemoveBackgroundResponse>("/remove-background", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
}

