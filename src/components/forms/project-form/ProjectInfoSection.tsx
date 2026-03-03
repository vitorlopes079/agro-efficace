import { Card, CardContent, CardHeader, CardTitle, Input, Select, MultiSelect } from "@/components/ui";
import { UserSearchSelect } from "@/components/admin/UserSearchSelect";
import type { ProjectFormData } from "@/hooks/useProjectFormState";

interface FormOption {
  value: string;
  label: string;
}

interface SelectedUser {
  id: string;
  name: string;
  email: string;
}

interface ProjectInfoSectionProps {
  formData: ProjectFormData;
  projectTypes: FormOption[];
  cultures: FormOption[];
  isAdmin: boolean;
  selectedUser: SelectedUser | null;
  onSelectedUserChange: (user: SelectedUser | null) => void;
  onInputChange: (e: { target: { name: string; value: string } }) => void;
  onProjectTypesChange: (types: string[]) => void;
  disabled?: boolean;
}

export function ProjectInfoSection({
  formData,
  projectTypes,
  cultures,
  isAdmin,
  selectedUser,
  onSelectedUserChange,
  onInputChange,
  onProjectTypesChange,
  disabled = false,
}: ProjectInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Projeto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Selection - Admin Only */}
        {isAdmin && (
          <UserSearchSelect
            value={selectedUser}
            onChange={onSelectedUserChange}
            disabled={disabled}
            required
          />
        )}

        <Input
          label="Nome do Projeto / Fazenda"
          name="projectName"
          value={formData.projectName}
          onChange={onInputChange}
          placeholder="Ex: Fazenda Santa Rita"
          required
          disabled={disabled}
        />

        <MultiSelect
          label="Tipo(s) de Projeto"
          value={formData.projectTypes}
          onChange={onProjectTypesChange}
          options={projectTypes}
          placeholder="Selecione o(s) tipo(s)"
          required
          disabled={disabled}
        />

        <Select
          label="Cultura"
          name="culture"
          value={formData.culture}
          onChange={onInputChange}
          options={cultures}
          placeholder="Selecione a cultura"
          required
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
