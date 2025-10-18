"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  name: string;
  label: string;
  currentImage?: string | null;
  maxSize?: number;
  required?: boolean;
  className?: string;
  initialCachedFile?: {
    dataUrl: string;
    name?: string | null;
  };
  onFileChange?: (file: File | null, dataUrl: string | null) => void;
}

export default function ImageUpload({
  name,
  label,
  currentImage,
  maxSize = 5,
  required = false,
  className = "",
  initialCachedFile,
  onFileChange,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const restoredFromCacheRef = useRef(false);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreview(currentImage ?? null);
    setFileName(null);
    setIsRemoved(false);
    restoredFromCacheRef.current = false;
  }, [currentImage]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleFile = useCallback(
    (file: File | null, options?: { dataUrl?: string; fileNameOverride?: string | null }) => {
      if (!file) {
        onFileChange?.(null, null);
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`File size must be less than ${maxSize}MB`);
        return;
      }

      setError(null);
      setFileName(options?.fileNameOverride ?? file.name);
      setIsRemoved(false);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const previewUrl = URL.createObjectURL(file);
      objectUrlRef.current = previewUrl;
      setPreview(previewUrl);

      const notifyParent = (dataUrl: string | null) => {
        onFileChange?.(file, dataUrl);
      };

      if (options?.dataUrl) {
        notifyParent(options.dataUrl);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        notifyParent(typeof reader.result === "string" ? reader.result : null);
      };
      reader.readAsDataURL(file);
    },
    [maxSize, onFileChange]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      handleFile(file);
    },
    [handleFile]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
      return;
    }

    if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file && inputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        inputRef.current.files = dataTransfer.files;
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreview(null);
    setFileName(null);
    setError(null);
    setIsRemoved(true);
    restoredFromCacheRef.current = false;
    onFileChange?.(null, null);
  }, [onFileChange]);

  useEffect(() => {
    if (!initialCachedFile?.dataUrl || restoredFromCacheRef.current) {
      return;
    }

    restoredFromCacheRef.current = true;

    const restore = async () => {
      try {
        const response = await fetch(initialCachedFile.dataUrl);
        const blob = await response.blob();
        const fileNameFromCache = initialCachedFile.name || "session-header";
        const restoredFile = new File([blob], fileNameFromCache, {
          type: blob.type || "image/png",
        });

        if (inputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(restoredFile);
          inputRef.current.files = dataTransfer.files;
        }

        handleFile(restoredFile, {
          dataUrl: initialCachedFile.dataUrl,
          fileNameOverride: fileNameFromCache,
        });
      } catch (error) {
        console.error("Failed to restore cached image", error);
        restoredFromCacheRef.current = false;
      }
    };

    restore();
  }, [handleFile, initialCachedFile]);

  return (
    <div className={className}>
      <label className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
        {label} {required && <span className="text-[#ff00ff]">*</span>}
      </label>

      <input
        type="hidden"
        name={`${name}_remove`}
        value={isRemoved ? "true" : "false"}
      />

      <input
        ref={inputRef}
        type="file"
        name={name}
        id={name}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        required={required && !preview}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <div className="relative w-full h-48 sm:h-64 rounded border-2 border-[#00ffff] border-opacity-30 overflow-hidden bg-[#0f0f23]">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="mt-3 flex items-center gap-4">
            {fileName && (
              <span className="text-sm text-[#00ffff] font-mono truncate">
                {fileName}
              </span>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="ml-auto px-4 py-2 text-sm font-bold uppercase tracking-wider text-black bg-[#ff00ff] hover:bg-[#cc00cc] rounded transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative w-full h-48 sm:h-64 rounded border-2 border-dashed cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-[#ff00ff] bg-[#1a1a3e]"
              : "border-[#00ffff] border-opacity-30 hover:border-opacity-60 hover:bg-[#0f0f23]"
          } flex flex-col items-center justify-center bg-[#0a0a1f]`}
        >
          <div className="text-center p-6">
            <svg
              className="mx-auto h-12 w-12 text-[#00ffff] opacity-50"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-[#00ffff] font-mono">
              <span className="font-bold text-[#ff00ff]">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-400 font-mono">
              PNG, JPG, WebP up to {maxSize}MB
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-[#ff00ff] font-mono">{error}</p>
      )}
    </div>
  );
}
