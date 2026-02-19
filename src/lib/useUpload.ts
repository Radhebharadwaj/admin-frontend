"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "./store";
import imageCompression from "browser-image-compression";

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

interface UseUploadReturn extends UploadState {
  upload: (file: File, folder?: string) => Promise<string | null>;
  reset: () => void;
}

/**
 * Reusable hook for uploading images to R2 via the Hono backend.
 * 
 * Usage:
 *   const { upload, uploading, error } = useUpload();
 *   const url = await upload(file, 'logos');
 */
export function useUpload(): UseUploadReturn {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  const upload = async (file: File, folder: string = "uploads"): Promise<string | null> => {
    setState({ uploading: true, progress: 10, error: null });

    // Client-side validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

    if (file.size > maxSize) {
      setState({ uploading: false, progress: 0, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.` });
      return null;
    }

    if (!allowedTypes.has(file.type)) {
      setState({ uploading: false, progress: 0, error: `Unsupported file type "${file.type}". Use JPG, PNG, WebP, or SVG.` });
      return null;
    }

    setState((prev) => ({ ...prev, progress: 10 }));

    try {
      let fileToUpload = file;
      if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
        const options = {
          maxSizeMB: 0.2, // 200KB
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: "image/jpeg"
        };
        try {
          const compressedFile = await imageCompression(file, options);
          fileToUpload = new File([compressedFile], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
        } catch (e) {
          console.error("Compression failed:", e);
        }
      }

      setState((prev) => ({ ...prev, progress: 30 }));

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("folder", folder);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";
      const { sessionToken } = useAuthStore.getState();

      const res = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/api/upload/image`);

        if (sessionToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${sessionToken}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded * 100) / event.total);
            setState((prev) => ({ ...prev, progress: percentComplete }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              resolve({ success: false, message: "Invalid JSON response" });
            }
          } else {
            resolve({ success: false, message: `Upload failed (${xhr.status})` });
          }
        };

        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });

      if (!res.success) {
        setState({ uploading: false, progress: 0, error: res.message || "Upload failed." });
        return null;
      }

      setState({ uploading: false, progress: 100, error: null });
      return res.data?.url || null;
    } catch (err: any) {
      setState({ uploading: false, progress: 0, error: err.message || "Network error during upload." });
      return null;
    }
  };

  const reset = () => {
    setState({ uploading: false, progress: 0, error: null });
  };

  return { ...state, upload, reset };
}
