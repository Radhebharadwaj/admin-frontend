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

export interface UploadOptions {
  uploadType: 'image' | 'document';
  entityType: 'universities' | 'courses' | 'subjects';
  universitySlug: string;
  courseSlug?: string;
  subjectCode?: string;
  filePrefix?: string;
}

interface UseUploadReturn extends UploadState {
  upload: (file: File, options: UploadOptions) => Promise<string | null>;
  reset: () => void;
}

/**
 * Reusable hook for uploading images to R2 via the Hono backend.
 * 
 * Usage:
 *   const { upload, uploading, error } = useUpload();
 *   const url = await upload(file, { uploadType: 'image', entityType: 'universities', universitySlug: 'ignou', filePrefix: 'logo' });
 */
export function useUpload(): UseUploadReturn {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  });

  const upload = async (file: File, options: UploadOptions): Promise<string | null> => {
    setState({ uploading: true, progress: 10, error: null });

    // Client-side validation
    const isImage = options.uploadType === 'image';
    const maxSize = isImage ? 1 * 1024 * 1024 : 20 * 1024 * 1024; // 1MB for image, 20MB for document
    const allowedTypes = isImage
      ? new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"])
      : new Set(["application/pdf"]);

    if (file.size > maxSize) {
      setState({ uploading: false, progress: 0, error: `File too large. Max ${isImage ? '1MB' : '20MB'}.` });
      return null;
    }

    if (!allowedTypes.has(file.type)) {
      setState({ uploading: false, progress: 0, error: `Unsupported file type. ${isImage ? 'Use JPG, PNG, WebP, or SVG.' : 'Use PDF.'}` });
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
      formData.append("uploadType", options.uploadType);
      formData.append("entityType", options.entityType);
      formData.append("universitySlug", options.universitySlug);
      if (options.courseSlug) formData.append("courseSlug", options.courseSlug);
      if (options.subjectCode) formData.append("subjectCode", options.subjectCode);
      if (options.filePrefix) formData.append("filePrefix", options.filePrefix);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";
      const { sessionToken } = useAuthStore.getState();

      const res = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/api/upload/media`);

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
