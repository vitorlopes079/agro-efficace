import { useState } from "react";

export interface ProjectFormData {
  projectName: string;
  projectType: string;
  culture: string;
  notes: string;
}

export function useProjectFormState() {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: "",
    projectType: "",
    culture: "",
    notes: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      projectName: "",
      projectType: "",
      culture: "",
      notes: "",
    });
  };

  return {
    formData,
    handleInputChange,
    resetForm,
  };
}
