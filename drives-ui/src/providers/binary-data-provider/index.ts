import axios from "axios";

import { getSession } from "next-auth/react";

// Helper function to get auth headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const session = await getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  return headers;
};

export const BinaryService = {
  getBlob: async (url: string): Promise<Blob> => {
    const authHeaders = await getAuthHeaders();

    const response = await axios.get(url, {
      responseType: "blob", // Critical for binary data
      headers: {
        ...authHeaders,
      },
    });

    return response.data;
  },
  upload: async (url: string, files: File[]) => {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    // Must match @UploadedFiles() files: Express.Multer.File[]
    files.forEach((file) => formData.append("files", file));

    // Remove Content-Type to let axios set the boundary for multipart/form-data
    const { "Content-Type": _, ...restHeaders } = headers;

    return axios.post(url, formData, { headers: restHeaders });
  },

  delete: async (url: string) => {
    const headers = await getAuthHeaders();
    return axios.delete(url, { headers });
  },

  setPrimary: async (url: string) => {
    const headers = await getAuthHeaders();
    return axios.put(url, {}, { headers });
  },
};
