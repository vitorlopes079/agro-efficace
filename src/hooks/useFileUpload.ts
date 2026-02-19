"use client";

import { useState } from "react";

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

const PART_SIZE = 100 * 1024 * 1024; // 100MB por parte
const CONCURRENT_PARTS = 4; // 4 partes simultâneas

async function uploadPart(
  presignedUrl: string,
  chunk: Blob,
  partNumber: number,
  onProgress: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          reject(new Error(`No ETag returned for part ${partNumber}`));
          return;
        }
        resolve(etag);
      } else {
        reject(
          new Error(`Part ${partNumber} failed with status: ${xhr.status}`),
        );
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error(`Network error on part ${partNumber}`)),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error(`Part ${partNumber} aborted`)),
    );

    xhr.open("PUT", presignedUrl);
    xhr.send(chunk);
  });
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


      // 1. Iniciar multipart no servidor
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
        throw new Error(error.error || "Erro ao iniciar upload");
      }

      const { uploadId, fileKey, pendingUploadId } = await presignedRes.json();
      
      // 2. Dividir arquivo em partes
      const totalSize = fileItem.file.size;
      const totalParts = Math.ceil(totalSize / PART_SIZE);
      
      // Progress tracking por parte
      const partProgress: number[] = new Array(totalParts).fill(0);
      const partSizes: number[] = [];

      for (let i = 0; i < totalParts; i++) {
        const start = i * PART_SIZE;
        const end = Math.min(start + PART_SIZE, totalSize);
        partSizes.push(end - start);
      }

      const updateProgress = () => {
        const totalLoaded = partProgress.reduce((a, b) => a + b, 0);
        const percent = Math.round((totalLoaded / totalSize) * 100);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, uploadProgress: percent } : f,
          ),
        );
        if (percent % 10 === 0) {
        }
      };

      // 3. Fazer upload das partes com concorrência
      const completedParts: { partNumber: number; etag: string }[] = [];

      // Processar partes em grupos de CONCURRENT_PARTS
      for (let i = 0; i < totalParts; i += CONCURRENT_PARTS) {
        const batch = [];

        for (let j = i; j < Math.min(i + CONCURRENT_PARTS, totalParts); j++) {
          const partNumber = j + 1;
          const start = j * PART_SIZE;
          const end = Math.min(start + PART_SIZE, totalSize);
          const chunk = fileItem.file.slice(start, end);

          batch.push(
            (async () => {
              // Pedir presigned URL para esta parte
              const partUrlRes = await fetch("/api/upload/part-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId, fileKey, partNumber }),
              });

              if (!partUrlRes.ok) {
                throw new Error(`Erro ao gerar URL para parte ${partNumber}`);
              }

              const { presignedUrl } = await partUrlRes.json();

              
              const etag = await uploadPart(
                presignedUrl,
                chunk,
                partNumber,
                (loaded) => {
                  partProgress[j] = loaded;
                  updateProgress();
                },
              );

                            completedParts.push({ partNumber, etag });
            })(),
          );
        }

        await Promise.all(batch);
      }

      // 4. Ordenar partes por número
      completedParts.sort((a, b) => a.partNumber - b.partNumber);

      // 5. Completar multipart no servidor
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, fileKey, parts: completedParts }),
      });

      if (!completeRes.ok) {
        throw new Error("Erro ao completar upload");
      }


      // 6. Confirmar no banco
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
