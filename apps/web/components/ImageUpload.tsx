"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@clerk/nextjs";

/** Compress an image File to a JPEG Blob.
 *  - Resizes so the longest side is at most `maxDimension` px
 *  - Encodes as JPEG at `quality` (0–1)
 *  - Returns a File with the same name but .jpg extension
 */
async function compressImage(
    file: File,
    maxDimension = 1920,
    quality = 0.82
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxDimension || height > maxDimension) {
                if (width >= height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas not supported"));
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error("Compression failed"));
                    const baseName = file.name.replace(/\.[^.]+$/, "");
                    resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
                },
                "image/jpeg",
                quality
            );
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

interface ImageUploadProps {
    onUpload: (urls: string[]) => void;
    maxFiles?: number;
    defaultValue?: string[];
    disabled?: boolean;
    folder?: string;
    hidePreview?: boolean;
}

export function ImageUpload({
    onUpload,
    maxFiles = 5,
    defaultValue = [],
    disabled = false,
    folder = "projects",
    hidePreview = false,
}: ImageUploadProps) {
    const { getToken } = useAuth();
    const [images, setImages] = useState<string[]>(defaultValue);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (defaultValue && defaultValue.length > 0 && JSON.stringify(defaultValue) !== JSON.stringify(images)) {
            setImages(defaultValue);
        }
    }, [defaultValue]);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (disabled || isUploading) return;

            // When maxFiles === 1, replace mode — skip capacity check
            if (maxFiles > 1 && images.length + acceptedFiles.length > maxFiles) {
                toast.error(`You can only upload up to ${maxFiles} images`);
                return;
            }

            setIsUploading(true);
            const newUrls: string[] = [];

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                const token = await getToken();
                
                for (const rawFile of acceptedFiles) {
                    // Compress before upload — keeps size well under 5 MB
                    const file = await compressImage(rawFile);
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("folder", folder);

                    const response = await fetch(`${apiUrl}/media/upload`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        },
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`Upload failed [${response.status}]:`, errorText);
                        throw new Error(`Upload failed: ${response.status} – ${errorText}`);
                    }

                    const data = await response.json();
                    newUrls.push(data.url);
                }

                // Replace when single-file mode, append otherwise
                const updatedImages = maxFiles === 1 ? newUrls : [...images, ...newUrls];
                setImages(updatedImages);
                onUpload(updatedImages);
                toast.success(maxFiles === 1 ? "Image uploaded" : "Images uploaded successfully");
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Failed to upload images");
            } finally {
                setIsUploading(false);
            }
        },
        [disabled, isUploading, images, maxFiles, onUpload, folder]
    );

    const removeImage = (index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
        onUpload(updatedImages);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        maxFiles,
        disabled: disabled || isUploading,
    });

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-3xl p-8 transition-all duration-200 flex flex-col items-center justify-center gap-4 cursor-pointer
          ${isDragActive ? "border-orange-500 bg-orange-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"}
          ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-500">
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </div>
                <div className="text-center">
                    <p className="font-semibold text-zinc-900 leading-none mb-1">
                        {isDragActive ? "Drop the files here" : "Upload photos"}
                    </p>
                    <p className="text-sm text-zinc-500">
                        Drag & drop or click to select (max {maxFiles})
                    </p>
                </div>
            </div>

            {!hidePreview && images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-100 group shadow-sm bg-zinc-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-all scale-90 group-hover:scale-100 shadow-lg z-10"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
