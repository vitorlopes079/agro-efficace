import { VALID_PROJECT_TYPES, VALID_CULTURES } from "@/lib/constants/project-constants";

export interface ProjectInput {
  projectName: string;
  projectType: string;
  culture: string;
  notes?: string;
  files: Array<{ category: string; pendingUploadId: string }>;
  userId?: string;
}

export interface ValidationError {
  error: string;
  status: number;
}

export function validateRequiredFields(input: ProjectInput): ValidationError | null {
  if (!input.projectName || !input.projectType || !input.culture) {
    return {
      error: "Nome, tipo e cultura são obrigatórios",
      status: 400,
    };
  }
  return null;
}

export function validateFiles(files: ProjectInput["files"]): ValidationError | null {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return {
      error: "É necessário enviar pelo menos um arquivo",
      status: 400,
    };
  }

  const hasOrtomosaico = files.some(
    (f) => f.category === "INPUT_ORTOMOSAICO"
  );

  if (!hasOrtomosaico) {
    return {
      error: "É necessário enviar pelo menos um ortomosaico",
      status: 400,
    };
  }

  return null;
}

export function validateProjectType(projectType: string): ValidationError | null {
  const projectTypeUpper = projectType.toUpperCase();

  if (!VALID_PROJECT_TYPES.includes(projectTypeUpper as any)) {
    return {
      error: "Tipo de projeto inválido",
      status: 400,
    };
  }

  return null;
}

export function validateCulture(culture: string): ValidationError | null {
  const cultureUpper = culture.toUpperCase();

  if (!VALID_CULTURES.includes(cultureUpper as any)) {
    return {
      error: "Cultura inválida",
      status: 400,
    };
  }

  return null;
}

export function validateUserPermissions(
  user: { status: string; canUpload: boolean } | null
): ValidationError | null {
  if (!user) {
    return {
      error: "Usuário não encontrado",
      status: 404,
    };
  }

  if (user.status === "SUSPENDED") {
    return {
      error: "Conta suspensa",
      status: 403,
    };
  }

  if (!user.canUpload) {
    return {
      error: "Você não tem permissão para criar projetos",
      status: 403,
    };
  }

  return null;
}

export function validateTargetUser(
  targetUser: { status: string; name: string } | null
): ValidationError | null {
  if (!targetUser) {
    return {
      error: "Usuário selecionado não encontrado",
      status: 400,
    };
  }

  if (targetUser.status !== "ACTIVE") {
    return {
      error: "Usuário selecionado não está ativo",
      status: 400,
    };
  }

  return null;
}

export function validateProjectInput(input: ProjectInput): ValidationError | null {
  // Check required fields
  const requiredFieldsError = validateRequiredFields(input);
  if (requiredFieldsError) return requiredFieldsError;

  // Check files
  const filesError = validateFiles(input.files);
  if (filesError) return filesError;

  // Check project type
  const projectTypeError = validateProjectType(input.projectType);
  if (projectTypeError) return projectTypeError;

  // Check culture
  const cultureError = validateCulture(input.culture);
  if (cultureError) return cultureError;

  return null;
}
