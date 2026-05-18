"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2, GripVertical, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = maxImages - images.length - uploading.length;

  const uploadToCloudinary = useCallback(
    async (file: File, uploadId: string) => {
      try {
        // 1. Get a signed upload URL from our API
        const signRes = await fetch("/api/upload/sign", { method: "POST" });
        if (!signRes.ok) throw new Error("Failed to get upload signature");
        const { signature, timestamp, cloudName, apiKey, folder } =
          await signRes.json();

        // 2. Upload directly to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("signature", signature);
        formData.append("timestamp", String(timestamp));
        formData.append("api_key", apiKey);
        formData.append("folder", folder);
        formData.append(
          "transformation",
          "c_limit,w_1600,h_1600,q_auto,f_auto",
        );

        const xhr = new XMLHttpRequest();

        const result = await new Promise<string>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === uploadId ? { ...u, progress: pct } : u,
                ),
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              resolve(data.secure_url);
            } else {
              reject(new Error("Upload failed"));
            }
          });

          xhr.addEventListener("error", () =>
            reject(new Error("Upload failed")),
          );

          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          );
          xhr.send(formData);
        });

        return result;
      } catch (err) {
        throw err;
      }
    },
    [],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, remainingSlots);
      if (fileArray.length === 0) return;

      // Validate files
      const validFiles = fileArray.filter((f) => {
        if (!f.type.startsWith("image/")) return false;
        if (f.size > 10 * 1024 * 1024) return false; // 10MB limit
        return true;
      });

      if (validFiles.length === 0) return;

      // Create preview entries
      const newUploading: UploadingFile[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      }));

      setUploading((prev) => [...prev, ...newUploading]);

      // Upload all files
      const results = await Promise.allSettled(
        newUploading.map(async (u) => {
          const url = await uploadToCloudinary(u.file, u.id);
          return { id: u.id, url };
        }),
      );

      const newUrls: string[] = [];
      const failedIds: string[] = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          newUrls.push(result.value.url);
        } else {
          // Find the matching upload entry
          const idx = results.indexOf(result);
          failedIds.push(newUploading[idx].id);
        }
      }

      // Add successful URLs to images
      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
      }

      // Clean up uploading state
      setUploading((prev) => {
        const remaining = prev.filter((u) => failedIds.includes(u.id));
        // Mark failed ones with error
        return remaining.map((u) => ({ ...u, error: "Upload failed" }));
      });

      // Clean up previews after a delay for failed ones
      if (failedIds.length > 0) {
        setTimeout(() => {
          setUploading((prev) => prev.filter((u) => !failedIds.includes(u.id)));
        }, 3000);
      }

      // Revoke object URLs
      newUploading.forEach((u) => URL.revokeObjectURL(u.preview));
    },
    [images, onChange, remainingSlots, uploadToCloudinary],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const removeUploadingItem = (id: string) => {
    setUploading((prev) => prev.filter((u) => u.id !== id));
  };

  // Drag-to-reorder handlers
  const handleReorderDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleReorderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleReorderDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Photos
      </label>

      <div
        className={cn(
          "grid grid-cols-4 sm:grid-cols-5 gap-3 p-3 rounded-xl border-2 border-dashed transition-colors",
          dragOver
            ? "border-emerald-400 bg-emerald-50"
            : "border-gray-200 bg-gray-50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes("Files")) {
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Uploaded images */}
        {images.map((img, i) => (
          <div
            key={img}
            draggable
            onDragStart={() => handleReorderDragStart(i)}
            onDragOver={(e) => handleReorderDragOver(e, i)}
            onDrop={() => handleReorderDrop(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setDragOverIndex(null);
            }}
            className={cn(
              "aspect-square rounded-lg overflow-hidden relative group cursor-grab active:cursor-grabbing",
              dragOverIndex === i && "ring-2 ring-emerald-500 ring-offset-2",
              dragIndex === i && "opacity-50",
            )}
          >
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
            {i === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded">
                Cover
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-60 transition-opacity">
              <GripVertical className="w-4 h-4 text-white" />
            </div>
          </div>
        ))}

        {/* Uploading items */}
        {uploading.map((u) => (
          <div
            key={u.id}
            className="aspect-square rounded-lg overflow-hidden relative bg-gray-100"
          >
            <img
              src={u.preview}
              alt=""
              className="w-full h-full object-cover opacity-60"
            />
            {u.error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                <span className="text-xs text-white">Failed</span>
                <button
                  type="button"
                  onClick={() => removeUploadingItem(u.id)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
                  <span className="text-xs text-white font-medium">
                    {u.progress}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add photo button */}
        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors bg-white"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Add Photo</span>
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-1.5">
        Add up to {maxImages} photos. Drag to reorder. First photo is the cover.
        Max 10MB each.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
