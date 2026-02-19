import { Loader2, FileText, X } from "lucide-react";
import { FileItem } from "@/hooks/useFileUpload";

interface FileUploadItemProps {
  file: FileItem;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function FileUploadItem({
  file,
  onRemove,
  disabled,
}: FileUploadItemProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800/50">
      {/* Header do arquivo */}
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0 flex flex-1 items-center gap-2 sm:gap-3">
          <div className="relative shrink-0">
            {file.uploadStatus === "uploading" ? (
              <Loader2 className="h-5 w-5 animate-spin text-green-500" />
            ) : file.uploadStatus === "completed" ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                ✓
              </div>
            ) : file.uploadStatus === "error" ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                ✗
              </div>
            ) : (
              <FileText className="h-5 w-5 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white sm:text-sm">
              {file.name}
            </p>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <p className="text-xs text-zinc-500">{file.size}</p>
              {file.uploadStatus === "uploading" && (
                <p className="text-xs font-medium text-green-500">
                  {file.uploadProgress}%
                </p>
              )}
              {file.uploadStatus === "completed" && (
                <p className="text-xs text-green-500">Completo ✓</p>
              )}
              {file.uploadStatus === "error" && (
                <p className="text-xs text-red-500">
                  {file.errorMessage || "Erro no upload"}
                </p>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(file.id)}
          disabled={disabled || file.uploadStatus === "uploading"}
          className="flex-shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Barra de progresso */}
      {file.uploadStatus === "uploading" && (
        <div className="px-4 pb-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300 ease-out"
              style={{ width: `${file.uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
