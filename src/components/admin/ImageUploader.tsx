"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, X, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  /** Current image URL (for preview when editing) */
  value: string | null;
  /** Callback when file is selected or cleared */
  onChange: (val: File | string | null) => void;
  /** Is currently uploading from parent */
  isUploading?: boolean;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  isUploading = false,
  label = "Upload Image",
  placeholder = "Drag and drop or click to upload",
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      
      const maxSize = 1 * 1024 * 1024; // 1MB
      if (file.size > maxSize) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 1MB.`);
        return;
      }
      let mimeType = file.type;
      const isSvg = file.name.toLowerCase().endsWith(".svg");

      if (isSvg) {
        mimeType = "image/svg+xml";
      }

      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
      
      if (!allowedTypes.has(mimeType)) {
        setError(`Unsupported file type. Use JPG, PNG, WebP, or SVG.`);
        return;
      }

      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      // Force correct MIME type for SVG previews to prevent broken images
      const previewFile = isSvg ? new File([file], file.name, { type: mimeType }) : file;
      const objectUrl = URL.createObjectURL(previewFile);
      setPreview(objectUrl);
      onChange(file);
    },
    [onChange, preview]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayUrl = preview || value;

  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
        {label}
      </label>

      {/* Preview State */}
      {displayUrl && !isUploading ? (
        <div className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
          <div className="aspect-[16/9] w-full relative flex items-center justify-center bg-zinc-950/50">
            <img
              src={displayUrl}
              alt="Preview"
              className="object-cover w-full h-full rounded-md"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-3 right-3 p-1.5 bg-zinc-900/80 border border-zinc-700 rounded-full text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Upload Drop Zone */
        <div
          className={`relative flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
            dragActive
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/30"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-indigo-400 font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {dragActive ? (
                <ImageIcon className="w-10 h-10 text-indigo-400" />
              ) : (
                <UploadCloud className="w-10 h-10 text-zinc-600" />
              )}
              <p className="text-sm text-zinc-400">{placeholder}</p>
              <p className="text-xs text-zinc-600">JPG, PNG, WebP, SVG — Max 1MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <p className="mt-2 text-xs text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
}
