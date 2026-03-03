import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { FileUploadItem } from "@/components/forms/FileUploadItem";
import type { FileItem } from "@/hooks/useFileUpload";

interface FileUploadSectionProps {
  title: string;
  required?: boolean;
  description: string;
  fileTypes: string;
  accept?: string; // File type filter for the input
  files: FileItem[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileId: string) => void;
  hoverBorderColor?: string;
  disabled?: boolean;
}

export function FileUploadSection({
  title,
  required = false,
  description,
  fileTypes,
  accept,
  files,
  onFileChange,
  onRemoveFile,
  hoverBorderColor = "hover:border-zinc-500/50",
  disabled = false,
}: FileUploadSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title}
          <span className="ml-2 text-sm font-normal text-zinc-400">
            ({required ? "Obrigatório" : "Opcional"})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-6 py-10 transition-colors ${hoverBorderColor} hover:bg-zinc-800`}
        >
          <Upload className="mb-3 h-10 w-10 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-300">{description}</p>
          <p className="mt-1 text-xs text-zinc-500">{fileTypes}</p>
          <input
            type="file"
            multiple
            accept={accept}
            onChange={onFileChange}
            className="hidden"
            disabled={disabled}
          />
        </label>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">
              Arquivos: {files.length}
            </p>
            {files.map((file) => (
              <FileUploadItem
                key={file.id}
                file={file}
                onRemove={onRemoveFile}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
