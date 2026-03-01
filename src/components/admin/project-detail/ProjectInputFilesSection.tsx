import { ArrowDown, File } from "lucide-react";
import { FileList, MapIcon, PolygonIcon } from "@/components/project";
import type { ProjectData } from "@/lib/types/project";

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
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <h2 className="text-base font-semibold text-white sm:text-lg">
          Arquivos de Entrada
        </h2>
        <div className="flex gap-2">
          {hasInputFiles && (
            <button
              onClick={onDownloadInputZip}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white sm:gap-2 sm:px-4"
            >
              <ArrowDown className="h-4 w-4" />
              <span className="sm:hidden">Cliente</span>
              <span className="hidden sm:inline">Baixar Arquivos do Cliente</span>
            </button>
          )}
          {project.status === "COMPLETED" && hasOutputFiles && (
            <button
              onClick={onDownloadOutputZip}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white sm:gap-2 sm:px-4"
            >
              <ArrowDown className="h-4 w-4" />
              <span className="sm:hidden">Solução</span>
              <span className="hidden sm:inline">Baixar Solução Completa</span>
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

      {project.filesGrouped.fotos.length > 0 && (
        <FileList
          files={project.filesGrouped.fotos}
          projectId={project.id}
          icon={<File className="h-5 w-5 text-zinc-400" />}
          title="Fotos do Drone"
          emptyMessage="Nenhuma foto enviada"
        />
      )}

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
