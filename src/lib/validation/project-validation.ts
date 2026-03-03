import { prisma } from "@/lib/prisma";

export interface ProjectInput {
  projectName: string;
  projectTypes: string[]; // Changed to array for multi-select
  culture: string;
  notes?: string;
  files: Array<{ category: string; pendingUploadId: string }>;
  userId?: string;
}

export interface ValidationError {
  error: string;
  status: number;
}

export function validateRequiredFields(
  input: ProjectInput,
): ValidationError | null {
  if (!input.projectName || !input.projectTypes?.length || !input.culture) {
    return {
      error: "Nome, tipo(s) e cultura são obrigatórios",
      status: 400,
    };
  }
  return null;
}

export function validateFiles(
  files: ProjectInput["files"],
): ValidationError | null {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return {
      error: "É necessário enviar pelo menos um arquivo",
      status: 400,
    };
  }

  const hasOrtomosaicoOrFotos = files.some(
    (f) => f.category === "INPUT_ORTOMOSAICO" || f.category === "INPUT_FOTOS",
  );

  if (!hasOrtomosaicoOrFotos) {
    return {
      error: "É necessário enviar o ortomosaico ou as fotos do drone",
      status: 400,
    };
  }
  return null;
}

export async function validateProjectTypes(
  projectTypes: string[],
): Promise<ValidationError | null> {
  // Fetch valid project types from config table
  const validTypes = await prisma.projectTypeConfig.findMany({
    select: { key: true },
  });
  const validKeys = validTypes.map((t) => t.key.toUpperCase());

  for (const projectType of projectTypes) {
    const projectTypeUpper = projectType.toUpperCase();
    if (!validKeys.includes(projectTypeUpper)) {
      return {
        error: `Tipo de projeto inválido: ${projectType}`,
        status: 400,
      };
    }
  }

  return null;
}

export async function validateCulture(
  culture: string,
): Promise<ValidationError | null> {
  // Fetch valid cultures from config table
  const validCultures = await prisma.cultureConfig.findMany({
    select: { key: true },
  });
  const validKeys = validCultures.map((c) => c.key.toUpperCase());

  const cultureUpper = culture.toUpperCase();

  if (!validKeys.includes(cultureUpper)) {
    return {
      error: "Cultura inválida",
      status: 400,
    };
  }

  return null;
}

export function validateUserPermissions(
  user: { status: string; canUpload: boolean } | null,
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
  targetUser: { status: string; name: string } | null,
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

export async function validateProjectInput(
  input: ProjectInput,
): Promise<ValidationError | null> {
  // Check required fields
  const requiredFieldsError = validateRequiredFields(input);
  if (requiredFieldsError) return requiredFieldsError;

  // Check files
  const filesError = validateFiles(input.files);
  if (filesError) return filesError;

  // Check project types (now async, validates against config table)
  const projectTypesError = await validateProjectTypes(input.projectTypes);
  if (projectTypesError) return projectTypesError;

  // Check culture (now async, validates against config table)
  const cultureError = await validateCulture(input.culture);
  if (cultureError) return cultureError;

  return null;
}
