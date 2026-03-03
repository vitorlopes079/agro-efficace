import { useState, useCallback, useRef } from "react";
import type { FileItem } from "./useFileUpload";

export interface SectionData {
  id: string;
  title: string;
}

export interface SectionFiles {
  sectionId: string;
  title: string;
  files: FileItem[];
}

export function useDynamicFinalizeUploads() {
  // Store section metadata (id and title)
  const [sections, setSections] = useState<SectionData[]>([
    { id: crypto.randomUUID(), title: "" },
  ]);

  // Ref to store file data from each section component
  const sectionFilesRef = useRef<Map<string, FileItem[]>>(new Map());

  // Add a new section
  const addSection = useCallback(() => {
    const newId = crypto.randomUUID();
    setSections((prev) => [...prev, { id: newId, title: "" }]);
  }, []);

  // Remove a section
  const removeSection = useCallback((sectionId: string) => {
    setSections((prev) => {
      // Don't allow removing the last section
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== sectionId);
    });
    sectionFilesRef.current.delete(sectionId);
  }, []);

  // Update section title
  const updateSectionTitle = useCallback((sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  }, []);

  // Register files from a section component
  const registerSectionFiles = useCallback(
    (sectionId: string, files: FileItem[]) => {
      sectionFilesRef.current.set(sectionId, files);
    },
    []
  );

  // Get all completed files with their section titles
  const getAllCompletedFiles = useCallback(() => {
    const allFiles: Array<{
      pendingUploadId: string;
      category: string; // This will be the section title
    }> = [];

    sections.forEach((section) => {
      const files = sectionFilesRef.current.get(section.id) || [];
      files.forEach((file) => {
        if (file.pendingUploadId && file.uploadStatus === "completed") {
          allFiles.push({
            pendingUploadId: file.pendingUploadId,
            category: section.title.trim() || "Outros Arquivos",
          });
        }
      });
    });

    return allFiles;
  }, [sections]);

  // Check if any section has files uploading
  const getUploadingState = useCallback(() => {
    let isAnyUploading = false;
    let hasAnyErrors = false;
    let totalCompletedFiles = 0;

    sectionFilesRef.current.forEach((files) => {
      files.forEach((file) => {
        if (file.uploadStatus === "uploading") isAnyUploading = true;
        if (file.uploadStatus === "error") hasAnyErrors = true;
        if (file.uploadStatus === "completed") totalCompletedFiles++;
      });
    });

    return { isAnyUploading, hasAnyErrors, totalCompletedFiles };
  }, []);

  // Validate all sections have titles
  const validateSections = useCallback(() => {
    const sectionsWithFiles: SectionData[] = [];

    sections.forEach((section) => {
      const files = sectionFilesRef.current.get(section.id) || [];
      const hasCompletedFiles = files.some((f) => f.uploadStatus === "completed");
      if (hasCompletedFiles) {
        sectionsWithFiles.push(section);
      }
    });

    // Check if any section with files is missing a title
    const missingTitles = sectionsWithFiles.filter((s) => !s.title.trim());

    return {
      isValid: missingTitles.length === 0,
      missingTitles,
      sectionsWithFiles,
    };
  }, [sections]);

  return {
    sections,
    addSection,
    removeSection,
    updateSectionTitle,
    registerSectionFiles,
    getAllCompletedFiles,
    getUploadingState,
    validateSections,
  };
}
