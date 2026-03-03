import { useState, useCallback } from "react";

export interface ProjectFormData {
  projectName: string;
  projectTypes: string[]; // Changed to array for multi-select
  culture: string;
  notes: string;
}

export function useProjectFormState() {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: "",
    projectTypes: [],
    culture: "",
    notes: "",
  });

  const handleInputChange = (
    e: { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for multi-select project types
  const handleProjectTypesChange = useCallback((types: string[]) => {
    setFormData((prev) => ({ ...prev, projectTypes: types }));
  }, []);

  const resetForm = () => {
    setFormData({
      projectName: "",
      projectTypes: [],
      culture: "",
      notes: "",
    });
  };

  return {
    formData,
    handleInputChange,
    handleProjectTypesChange,
    resetForm,
  };
}
