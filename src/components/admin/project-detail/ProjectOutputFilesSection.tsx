import { File } from "lucide-react";
import { FileList, MapIcon, PolygonIcon } from "@/components/project";
import type { ProjectData } from "@/lib/types/project";

interface FileGroup {
  files: ProjectData["files"];
  title: string;
  icon: React.ReactNode;
}

interface ProjectOutputFilesSectionProps {
  projectId: string;
  outputDJI: ProjectData["files"];
  outputOrtomosaic: ProjectData["files"];
  outputRelatorio: ProjectData["files"];
  outputDaninhas: ProjectData["files"];
  outputObstaculos: ProjectData["files"];
  outputPerimetros: ProjectData["files"];
  outputOutros: ProjectData["files"];
}

export function ProjectOutputFilesSection({
  projectId,
  outputDJI,
  outputOrtomosaic,
  outputRelatorio,
  outputDaninhas,
  outputObstaculos,
  outputPerimetros,
  outputOutros,
}: ProjectOutputFilesSectionProps) {
  const fileGroups: FileGroup[] = [
    {
      files: outputDJI,
      title: "DJI Shapefile",
      icon: <File className="h-5 w-5 text-zinc-400" />,
    },
    {
      files: outputOrtomosaic,
      title: "Ortomosaico Processado",
      icon: <MapIcon />,
    },
    {
      files: outputRelatorio,
      title: "Relatórios",
      icon: <File className="h-5 w-5 text-zinc-400" />,
    },
    {
      files: outputDaninhas,
      title: "Shapefile - Daninhas",
      icon: <PolygonIcon />,
    },
    {
      files: outputObstaculos,
      title: "Shapefile - Obstáculos",
      icon: <PolygonIcon />,
    },
    {
      files: outputPerimetros,
      title: "Shapefile - Perímetros",
      icon: <PolygonIcon />,
    },
    {
      files: outputOutros,
      title: "Outros Arquivos",
      icon: <File className="h-5 w-5 text-zinc-400" />,
    },
  ];

  const visibleGroups = fileGroups.filter((group) => group.files.length > 0);

  if (visibleGroups.length === 0) return null;

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-lg font-semibold text-white">Arquivos de Saída</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {visibleGroups.map((group) => (
          <FileList
            key={group.title}
            files={group.files}
            projectId={projectId}
            icon={group.icon}
            title={group.title}
            emptyMessage={`Nenhum ${group.title.toLowerCase()}`}
          />
        ))}
      </div>
    </div>
  );
}
