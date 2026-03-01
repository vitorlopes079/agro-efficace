"use client";

import { ReactNode, useState } from "react";
import { File, ArrowDown, Map, Hexagon, ChevronDown } from "lucide-react";
import { Card, CardTitle } from "@/components/ui";
import { formatFileSize, formatDate } from "@/lib/utils/formatters";
import type { FileData } from "@/lib/types/project";

export const MapIcon = () => <Map className="h-5 w-5 text-emerald-400" />;
export const PolygonIcon = () => <Hexagon className="h-5 w-5 text-blue-400" />;

interface FileListProps {
  files: FileData[];
  projectId: string;
  icon: ReactNode;
  title: string;
  emptyMessage: string;
  defaultOpen?: boolean;
}

export function FileList({ files, projectId, icon, title, emptyMessage, defaultOpen = false }: FileListProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleDownload = (fileId: string) => {
    window.open(`/api/projects/${projectId}/download/${fileId}`, "_blank");
  };

  return (
    <Card>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full cursor-pointer items-center gap-2 p-4 sm:p-6 ${
          isOpen ? "pb-0" : ""
        }`}
      >
        {icon}
        <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
        <span className="text-xs text-zinc-500 sm:text-sm">
          {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
        </span>
        <ChevronDown
          className={`ml-auto h-5 w-5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-4 sm:p-6 sm:pt-4">
            {files.length === 0 ? (
              <p className="text-sm text-zinc-500">{emptyMessage}</p>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="group flex items-center gap-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50 sm:gap-3 sm:p-3"
                  >
                    <File className="h-4 w-4 shrink-0 text-zinc-400 sm:h-5 sm:w-5" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white sm:text-sm">
                        {file.fileName}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file.id);
                      }}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-800 p-2 text-xs font-medium text-white transition-all hover:bg-zinc-700 sm:px-3 sm:py-1.5"
                      title="Download"
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
