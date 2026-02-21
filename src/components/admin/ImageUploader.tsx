"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, X, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useUpload } from "@/lib/useUpload";

interface ImageUploaderProps {
  /** Current image URL (for preview when editing) */
  value: string | null;
  /** Callback when upload completes or image is cleared */
  onChange: (url: string | null) => void;
  /** R2 folder to upload into */
  folder?: string;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder = "uploads",
  label = "Upload Image",
  placeholder = "Drag and drop or click to upload",
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress, error } = useUpload();

  const handleFile = useCallback(
    async (file: File) => {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to R2
      const url = await upload(file, folder);
      if (url) {
        onChange(url);
      } else {
        // Upload failed — clear preview
        setPreview(null);
      }
    },
    [upload, folder, onChange]
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
    setPreview(null);
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
      {displayUrl && !uploading ? (
        <div className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
          <div className="aspect-[16/9] w-full relative flex items-center justify-center bg-zinc-950/50">
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-contain p-4"
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
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-indigo-400 font-medium">Uploading... {progress}%</p>
              <div className="w-40 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {dragActive ? (
                <ImageIcon className="w-10 h-10 text-indigo-400" />
              ) : (
                <UploadCloud className="w-10 h-10 text-zinc-600" />
              )}
              <p className="text-sm text-zinc-400">{placeholder}</p>
              <p className="text-xs text-zinc-600">JPG, PNG, WebP, SVG — Max 5MB</p>
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
