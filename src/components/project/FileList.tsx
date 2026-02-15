"use client";

import { ReactNode } from "react";
import { File, ArrowDown, Map, Hexagon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatFileSize, formatDate } from "./constants";
import type { FileData } from "./types";

export const MapIcon = () => <Map className="h-5 w-5 text-emerald-400" />;
export const PolygonIcon = () => <Hexagon className="h-5 w-5 text-blue-400" />;

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
                <File className="h-5 w-5 text-zinc-400" />
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
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-zinc-700"
                >
                  <ArrowDown className="h-4 w-4" />
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
