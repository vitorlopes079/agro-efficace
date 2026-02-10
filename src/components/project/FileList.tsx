"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatFileSize, formatDate } from "./constants";
import type { FileData } from "./types";

const FileIcon = () => (
  <svg
    className="h-5 w-5 text-zinc-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export const MapIcon = () => (
  <svg
    className="h-5 w-5 text-emerald-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2 1,6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

export const PolygonIcon = () => (
  <svg
    className="h-5 w-5 text-blue-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5 12,2" />
  </svg>
);

interface FileListProps {
  files: FileData[];
  projectId: string;
  icon: ReactNode;
  title: string;
  emptyMessage: string;
}

export function FileList({ files, projectId, icon, title, emptyMessage }: FileListProps) {
  const handleDownload = (fileId: string) => {
    window.open(`/api/projects/${projectId}/download/${fileId}`, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="ml-auto text-sm text-zinc-500">
            {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <FileIcon />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(file.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-all hover:bg-zinc-700 group-hover:opacity-100"
                >
                  <DownloadIcon />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
