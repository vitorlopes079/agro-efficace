import { useMemo } from "react";
import type { ProjectData } from "@/lib/types/project";

export interface OutputFileGroup {
  title: string;
  files: ProjectData["files"];
}

export function useProjectFileGrouping(project: ProjectData | null) {
  return useMemo(() => {
    if (!project) {
      return {
        inputFiles: [],
        outputFiles: [],
        outputFileGroups: [] as OutputFileGroup[],
      };
    }

    const inputFiles = project.files.filter((f) => f.isInput);
    const outputFiles = project.files.filter((f) => !f.isInput);

    // Group output files by their category (custom title)
    const outputGroupsMap = outputFiles.reduce(
      (acc, file) => {
        const category = file.fileCategory;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(file);
        return acc;
      },
      {} as Record<string, typeof outputFiles>
    );

    // Convert to array for rendering
    const outputFileGroups: OutputFileGroup[] = Object.entries(outputGroupsMap).map(
      ([title, files]) => ({
        title,
        files,
      })
    );

    return {
      inputFiles,
      outputFiles,
      outputFileGroups,
    };
  }, [project]);
}
