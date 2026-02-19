"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";

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

    setState((prev) => ({ ...prev, progress: 30 }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      setState((prev) => ({ ...prev, progress: 60 }));

      const res = await fetchApi("/api/upload/image", {
        method: "POST",
        body: formData,
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
