import { useMemo } from "react";
import type { ProjectData } from "@/components/project";

export function useProjectFileGrouping(project: ProjectData | null) {
  return useMemo(() => {
    if (!project) {
      return {
        inputFiles: [],
        outputFiles: [],
        outputDJI: [],
        outputOrtomosaic: [],
        outputRelatorio: [],
        outputDaninhas: [],
        outputObstaculos: [],
        outputPerimetros: [],
        outputOutros: [],
      };
    }

    const inputFiles = project.files.filter((f) => f.fileCategory.startsWith("INPUT_"));
    const outputFiles = project.files.filter((f) => f.fileCategory.startsWith("OUTPUT_"));

    const outputDJI = outputFiles.filter((f) => f.fileCategory === "OUTPUT_DJI_SHAPEFILE");
    const outputOrtomosaic = outputFiles.filter((f) => f.fileCategory === "OUTPUT_ORTOMOSAIC");
    const outputRelatorio = outputFiles.filter((f) => f.fileCategory === "OUTPUT_RELATORIO");
    const outputDaninhas = outputFiles.filter((f) => f.fileCategory === "OUTPUT_SHAPEFILE_DANINHAS");
    const outputObstaculos = outputFiles.filter((f) => f.fileCategory === "OUTPUT_SHAPEFILE_OBSTACULOS");
    const outputPerimetros = outputFiles.filter((f) => f.fileCategory === "OUTPUT_SHAPEFILE_PERIMETROS");
    const outputOutros = outputFiles.filter((f) => f.fileCategory === "OUTPUT_OTHER");

    return {
      inputFiles,
      outputFiles,
      outputDJI,
      outputOrtomosaic,
      outputRelatorio,
      outputDaninhas,
      outputObstaculos,
      outputPerimetros,
      outputOutros,
    };
  }, [project]);
}
