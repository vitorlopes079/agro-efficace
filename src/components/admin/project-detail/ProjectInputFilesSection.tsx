import { ArrowDown, File } from "lucide-react";
import { FileList, MapIcon, PolygonIcon } from "@/components/project";
import type { ProjectData } from "@/components/project";

interface ProjectInputFilesSectionProps {
  project: ProjectData;
  hasInputFiles: boolean;
  hasOutputFiles: boolean;
  onDownloadInputZip: () => void;
  onDownloadOutputZip: () => void;
}

export function ProjectInputFilesSection({
  project,
  hasInputFiles,
  hasOutputFiles,
  onDownloadInputZip,
  onDownloadOutputZip,
}: ProjectInputFilesSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Arquivos de Entrada</h2>
        <div className="flex gap-2">
          {hasInputFiles && (
            <button
              onClick={onDownloadInputZip}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              <ArrowDown className="h-4 w-4" />
              Baixar Arquivos do Cliente
            </button>
          )}
          {project.status === "COMPLETED" && hasOutputFiles && (
            <button
              onClick={onDownloadOutputZip}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              <ArrowDown className="h-4 w-4" />
              Baixar Solução Completa
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FileList
          files={project.filesGrouped.ortomosaico}
          projectId={project.id}
          icon={<MapIcon />}
          title="Ortomosaicos"
          emptyMessage="Nenhum ortomosaico enviado"
        />

        <FileList
          files={project.filesGrouped.perimetros}
          projectId={project.id}
          icon={<PolygonIcon />}
          title="Perímetros de Análise"
          emptyMessage="Nenhum perímetro enviado"
        />
      </div>

      {project.filesGrouped.outros.length > 0 && (
        <FileList
          files={project.filesGrouped.outros}
          projectId={project.id}
          icon={<File className="h-5 w-5 text-zinc-400" />}
          title="Outros Arquivos"
          emptyMessage="Nenhum arquivo adicional"
        />
      )}
    </div>
  );
}
