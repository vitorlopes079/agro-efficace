import { useFileUpload } from "./useFileUpload";
import { finalizeUploadSections } from "@/lib/config/finalize-upload-sections";
import { useMemo } from "react";

export type UploadSectionId =
  | "dji-shapefile"
  | "ortomosaic"
  | "reports"
  | "shapefile-weeds"
  | "shapefile-obstacles"
  | "shapefile-perimeters"
  | "outros";

export function useFinalizeProjectUploads() {
  // Individual upload hooks for each section
  const djiShapefile = useFileUpload();
  const ortomosaic = useFileUpload();
  const reports = useFileUpload();
  const shapefileWeeds = useFileUpload();
  const shapefileObstacles = useFileUpload();
  const shapefilePerimeters = useFileUpload();
  const outros = useFileUpload();

  // Map of section IDs to their upload hooks
  const uploads = useMemo(
    () => ({
      "dji-shapefile": djiShapefile,
      ortomosaic: ortomosaic,
      reports: reports,
      "shapefile-weeds": shapefileWeeds,
      "shapefile-obstacles": shapefileObstacles,
      "shapefile-perimeters": shapefilePerimeters,
      outros: outros,
    }),
    [
      djiShapefile,
      ortomosaic,
      reports,
      shapefileWeeds,
      shapefileObstacles,
      shapefilePerimeters,
      outros,
    ]
  );

  // All hooks as an array for aggregate operations
  const allHooks = useMemo(
    () => [
      djiShapefile,
      ortomosaic,
      reports,
      shapefileWeeds,
      shapefileObstacles,
      shapefilePerimeters,
      outros,
    ],
    [
      djiShapefile,
      ortomosaic,
      reports,
      shapefileWeeds,
      shapefileObstacles,
      shapefilePerimeters,
      outros,
    ]
  );

  // Aggregate states
  const isAnyUploading = useMemo(
    () => allHooks.some((hook) => hook.isUploading),
    [allHooks]
  );

  const hasAnyErrors = useMemo(
    () => allHooks.some((hook) => hook.hasErrors),
    [allHooks]
  );

  const totalCompletedFiles = useMemo(
    () => allHooks.reduce((acc, hook) => acc + hook.completedFiles.length, 0),
    [allHooks]
  );

  // Get upload hook for a specific section
  const getUploadHook = (sectionId: UploadSectionId) => {
    return uploads[sectionId];
  };

  // Get all completed files with their categories
  const getAllCompletedFiles = () => {
    const allFiles: Array<{
      pendingUploadId: string;
      category: string;
      sectionId: string;
    }> = [];

    finalizeUploadSections.forEach((section) => {
      const hook = uploads[section.id as UploadSectionId];
      hook.completedFiles.forEach((file) => {
        if (file.pendingUploadId) {
          allFiles.push({
            pendingUploadId: file.pendingUploadId,
            category: section.category,
            sectionId: section.id,
          });
        }
      });
    });

    return allFiles;
  };

  return {
    uploads,
    getUploadHook,
    isAnyUploading,
    hasAnyErrors,
    totalCompletedFiles,
    getAllCompletedFiles,
  };
}
