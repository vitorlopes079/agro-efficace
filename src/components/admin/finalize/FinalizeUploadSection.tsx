import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { FileUploadItem } from "@/components/forms/FileUploadItem";
import type { FinalizeUploadSection as UploadSectionConfig } from "@/lib/config/finalize-upload-sections";
import type { FileItem } from "@/hooks/useFileUpload";

interface FinalizeUploadSectionProps {
  section: UploadSectionConfig;
  files: FileItem[];
  onFileChange: (files: FileList | null) => void;
  onRemoveFile: (fileId: string) => void;
  disabled?: boolean;
}

export function FinalizeUploadSection({
  section,
  files,
  onFileChange,
  onRemoveFile,
  disabled = false,
}: FinalizeUploadSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{section.title}</CardTitle>
        <p className="text-sm text-zinc-400">{section.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
            files.length > 0
              ? "border-green-500/50 bg-green-500/5"
              : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
          }`}
        >
          <Upload
            className={`mb-3 h-8 w-8 ${
              files.length > 0 ? "text-green-500" : "text-zinc-500"
            }`}
          />
          <p className="text-sm font-medium text-zinc-300">
            {files.length > 0
              ? `${files.length} arquivo(s) selecionado(s)`
              : "Clique ou arraste arquivos aqui"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Tipos aceitos: {section.acceptedTypes}
          </p>
          <input
            type="file"
            multiple
            onChange={(e) => onFileChange(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
        </label>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">
              Arquivos: {files.length}
            </p>
            {files.map((file) => (
              <FileUploadItem
                key={file.id}
                file={file}
                onRemove={() => onRemoveFile(file.id)}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
