"use client";

import { useEffect, useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, Input } from "@/components/ui";
import { FileUploadItem } from "@/components/forms/FileUploadItem";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { FileItem } from "@/hooks/useFileUpload";

interface DynamicUploadSectionProps {
  sectionId: string;
  title: string;
  onTitleChange: (title: string) => void;
  onRemove: () => void;
  onFilesChange: (sectionId: string, files: FileItem[]) => void;
  canRemove: boolean;
  disabled?: boolean;
}

export function DynamicUploadSection({
  sectionId,
  title,
  onTitleChange,
  onRemove,
  onFilesChange,
  canRemove,
  disabled = false,
}: DynamicUploadSectionProps) {
  const { files, addFiles, removeFile } = useFileUpload();

  // Use ref to store callback to avoid infinite loops
  const onFilesChangeRef = useRef(onFilesChange);
  onFilesChangeRef.current = onFilesChange;

  // Sync files with parent whenever they change
  useEffect(() => {
    onFilesChangeRef.current(sectionId, files);
  }, [sectionId, files]);

  const handleFileChange = async (fileList: FileList | null) => {
    if (!fileList) return;
    await addFiles(fileList);
  };

  const hasFiles = files.length > 0;
  const hasCompletedFiles = files.some((f) => f.uploadStatus === "completed");
  const showTitleError = hasCompletedFiles && !title.trim();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <Input
              placeholder="Nome da seção (ex: Relatórios, Mapas de Daninhas...)"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={disabled}
              className={showTitleError ? "border-red-500" : ""}
            />
            {showTitleError && (
              <p className="mt-1 text-xs text-red-500">
                Informe um nome para esta seção
              </p>
            )}
          </div>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-500 disabled:opacity-50"
              title="Remover seção"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
            hasFiles
              ? "border-green-500/50 bg-green-500/5"
              : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
          }`}
        >
          <Upload
            className={`mb-3 h-8 w-8 ${
              hasFiles ? "text-green-500" : "text-zinc-500"
            }`}
          />
          <p className="text-sm font-medium text-zinc-300">
            {hasFiles
              ? `${files.length} arquivo(s) selecionado(s)`
              : "Clique ou arraste arquivos aqui"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Todos os tipos de arquivo aceitos
          </p>
          <input
            type="file"
            multiple
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
        </label>

        {/* File List */}
        {hasFiles && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">
              Arquivos: {files.length}
            </p>
            {files.map((file) => (
              <FileUploadItem
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
