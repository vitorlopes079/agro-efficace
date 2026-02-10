// src/hooks/useFileUpload.ts
"use client";

import { useState } from "react";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  uploadProgress: number;
  uploadStatus: "pending" | "uploading" | "completed" | "error";
  pendingUploadId?: string;
  fileKey?: string;
  errorMessage?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function useFileUpload() {
  const [files, setFiles] = useState<FileItem[]>([]);

  const uploadFile = async (fileItem: FileItem) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? { ...f, uploadStatus: "uploading", uploadProgress: 0 }
            : f,
        ),
      );

      console.log("🚀 [UPLOAD] Starting upload for:", fileItem.name);

      // 1. Get credentials
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileItem.file.name,
          fileSize: fileItem.file.size,
          fileType: fileItem.file.type || "application/octet-stream",
        }),
      });

      if (!presignedRes.ok) {
        const error = await presignedRes.json();
        throw new Error(error.error || "Erro ao gerar credenciais");
      }

      const { fileKey, pendingUploadId, bucket, credentials, endpoint } =
        await presignedRes.json();

      console.log("✅ [CREDENTIALS] Received from backend");

      // 2. Create S3 client
      const tempClient = new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      });

      // 3. Create Upload object
      const upload = new Upload({
        client: tempClient,
        params: {
          Bucket: bucket,
          Key: fileKey,
          Body: fileItem.file,
          ContentType: fileItem.file.type || "application/octet-stream",
        },
        queueSize: 4,
        partSize: 100 * 1024 * 1024, // 100 MB
      });

      console.log("📦 [UPLOAD] Upload instance created");

      // 4. Progress tracking
      upload.on("httpUploadProgress", (progress) => {
        if (progress.loaded && progress.total) {
          const percent = Math.round((progress.loaded / progress.total) * 100);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, uploadProgress: percent } : f,
            ),
          );

          // Log milestones
          if (percent % 25 === 0 || percent === 100) {
            console.log(
              `📊 [PROGRESS] ${percent}% - Part ${progress.part || "?"}`,
            );
          }
        }
      });

      // 5. Execute upload
      console.log("⬆️ [UPLOAD] Starting upload.done()...");
      await upload.done();
      console.log("✅ [UPLOAD] upload.done() completed!");

      // 6. Confirm upload in database
      console.log("💾 [CONFIRM] Confirming upload in database...");
      const confirmRes = await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingUploadId }),
      });

      if (!confirmRes.ok) {
        throw new Error("Erro ao confirmar upload");
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                uploadStatus: "completed",
                uploadProgress: 100,
                pendingUploadId,
                fileKey,
              }
            : f,
        ),
      );

      console.log("🎉 [COMPLETE] Upload completed:", fileItem.name);
    } catch (error) {
      console.error("❌ [ERROR] Upload failed:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                uploadStatus: "error",
                errorMessage:
                  error instanceof Error ? error.message : "Erro desconhecido",
              }
            : f,
        ),
      );
    }
  };

  const addFiles = async (selectedFiles: FileList) => {
    const newFiles: FileItem[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      uploadProgress: 0,
      uploadStatus: "pending" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    for (const fileItem of newFiles) {
      await uploadFile(fileItem);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const retryUpload = async (id: string) => {
    const fileItem = files.find((f) => f.id === id);
    if (fileItem) {
      await uploadFile(fileItem);
    }
  };

  const clearAll = () => {
    setFiles([]);
  };

  const isUploading = files.some((f) => f.uploadStatus === "uploading");
  const hasErrors = files.some((f) => f.uploadStatus === "error");
  const completedFiles = files.filter((f) => f.uploadStatus === "completed");

  return {
    files,
    addFiles,
    removeFile,
    retryUpload,
    clearAll,
    isUploading,
    hasErrors,
    completedFiles,
  };
}
