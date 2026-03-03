// src/components/forms/DualFileUploadSection.tsx
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { FileUploadItem } from "@/components/forms/FileUploadItem";
import type { FileItem } from "@/hooks/useFileUpload";

interface UploadSide {
  description: string;
  fileTypes: string;
  accept?: string; // File type filter for the input
  files: FileItem[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (fileId: string) => void;
  hoverBorderColor?: string;
}

interface DualFileUploadSectionProps {
  title: string;
  required?: boolean;
  leftUpload: UploadSide;
  rightUpload: UploadSide;
  disabled?: boolean;
}

export function DualFileUploadSection({
  title,
  required = false,
  leftUpload,
  rightUpload,
  disabled = false,
}: DualFileUploadSectionProps) {
  const leftHasFiles = leftUpload.files.length > 0;
  const rightHasFiles = rightUpload.files.length > 0;
  const anyFiles = leftHasFiles || rightHasFiles;

  // Mutually exclusive: block the other side if one has files
  const leftBlocked = disabled || rightHasFiles;
  const rightBlocked = disabled || leftHasFiles;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title}
          <span className="ml-2 text-sm font-normal text-zinc-400">
            ({required ? "Obrigatório" : "Opcional"})
          </span>
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Envie o ortomosaico já processado ou as fotos brutas do drone
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grid - só os botões de upload */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* LEFT: Ortomosaico */}
          <label
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-4 py-6 transition-all duration-200
              ${leftBlocked
                ? "cursor-not-allowed opacity-40"
                : `cursor-pointer ${leftUpload.hoverBorderColor ?? "hover:border-green-500/50"} hover:bg-zinc-800`
              }
            `}
          >
            <Upload className="mb-2 h-7 w-7 text-zinc-500" />
            <p className="text-center text-sm font-medium text-zinc-300">
              {leftUpload.description}
            </p>
            <p className="mt-1 text-center text-xs text-zinc-500">
              {leftUpload.fileTypes}
            </p>
            <input
              type="file"
              multiple
              accept={leftUpload.accept}
              onChange={leftUpload.onChange}
              className="hidden"
              disabled={leftBlocked}
            />
          </label>

          {/* RIGHT: Fotos */}
          <label
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-4 py-6 transition-all duration-200
              ${rightBlocked
                ? "cursor-not-allowed opacity-40"
                : `cursor-pointer ${rightUpload.hoverBorderColor ?? "hover:border-blue-500/50"} hover:bg-zinc-800`
              }
            `}
          >
            <Upload className="mb-2 h-7 w-7 text-zinc-500" />
            <p className="text-center text-sm font-medium text-zinc-300">
              {rightUpload.description}
            </p>
            <p className="mt-1 text-center text-xs text-zinc-500">
              {rightUpload.fileTypes}
            </p>
            <input
              type="file"
              multiple
              accept={rightUpload.accept}
              onChange={rightUpload.onChange}
              className="hidden"
              disabled={rightBlocked}
            />
          </label>
        </div>

        {/* Listas de arquivos - FORA do grid, largura total */}
        {anyFiles && (
          <div className="space-y-3">
            {/* Lista Ortomosaico */}
            {leftUpload.files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">
                  {leftUpload.description} ({leftUpload.files.length})
                </p>
                {leftUpload.files.map((file) => (
                  <FileUploadItem
                    key={file.id}
                    file={file}
                    onRemove={leftUpload.onRemove}
                    disabled={disabled}
                  />
                ))}
              </div>
            )}

            {/* Lista Fotos */}
            {rightUpload.files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">
                  {rightUpload.description} ({rightUpload.files.length})
                </p>
                {rightUpload.files.map((file) => (
                  <FileUploadItem
                    key={file.id}
                    file={file}
                    onRemove={rightUpload.onRemove}
                    disabled={disabled}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
