import { File } from "lucide-react";
import { FileList } from "@/components/project";
import type { OutputFileGroup } from "@/hooks/useProjectFileGrouping";

interface ProjectOutputFilesSectionProps {
  projectId: string;
  outputFileGroups: OutputFileGroup[];
}

export function ProjectOutputFilesSection({
  projectId,
  outputFileGroups,
}: ProjectOutputFilesSectionProps) {
  if (outputFileGroups.length === 0) return null;

  // Split into two columns
  const leftColumn = outputFileGroups.filter((_, i) => i % 2 === 0);
  const rightColumn = outputFileGroups.filter((_, i) => i % 2 === 1);

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-base font-semibold text-white sm:text-lg">Arquivos de Saída</h2>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          {leftColumn.map((group) => (
            <FileList
              key={group.title}
              files={group.files}
              projectId={projectId}
              icon={<File className="h-5 w-5 text-zinc-400" />}
              title={group.title}
              emptyMessage="Nenhum arquivo"
            />
          ))}
        </div>
        <div className="flex-1 space-y-6">
          {rightColumn.map((group) => (
            <FileList
              key={group.title}
              files={group.files}
              projectId={projectId}
              icon={<File className="h-5 w-5 text-zinc-400" />}
              title={group.title}
              emptyMessage="Nenhum arquivo"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
