import { prisma } from "@/lib/prisma";
import type { ProjectInput } from "@/lib/validation/project-validation";
import { processProjectFiles } from "./file-processor";

export interface CreateProjectResult {
  success: boolean;
  project?: {
    id: string;
    name: string;
    projectTypes: string[]; // Changed to array
    culture: string;
    status: string;
    filesProcessed: number;
    filesErrors: number;
    createdAt: Date;
  };
  error?: string;
}

export async function determineProjectOwner(
  sessionUserId: string,
  isAdmin: boolean,
  targetUserId?: string
): Promise<{ ownerId: string; error?: { error: string; status: number } }> {
  // Default to session user
  let ownerId = sessionUserId;

  // If admin provides a userId, validate and use it
  if (isAdmin && targetUserId) {
        const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { status: true, name: true },
    });

    if (!targetUser) {
      return {
        ownerId: sessionUserId,
        error: {
          error: "Usuário selecionado não encontrado",
          status: 400,
        },
      };
    }

    if (targetUser.status !== "ACTIVE") {
      return {
        ownerId: sessionUserId,
        error: {
          error: "Usuário selecionado não está ativo",
          status: 400,
        },
      };
    }

        ownerId = targetUserId;
  }

  return { ownerId };
}

export async function createProject(
  input: ProjectInput,
  ownerId: string
): Promise<CreateProjectResult> {

  try {
    // Normalize project types to uppercase
    const normalizedProjectTypes = input.projectTypes.map((t) => t.toUpperCase());

    const project = await prisma.project.create({
      data: {
        name: input.projectName,
        projectTypes: normalizedProjectTypes,
        culture: input.culture.toUpperCase(),
        notes: input.notes || null,
        userId: ownerId,
        status: "PENDING",
      },
    });


    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        projectTypes: project.projectTypes,
        culture: project.culture,
        status: project.status,
        filesProcessed: 0,
        filesErrors: 0,
        createdAt: project.createdAt,
      },
    };
  } catch (error) {
    console.error("❌ [PROJECT CREATION] Error creating project:", error);
    return {
      success: false,
      error: "Erro ao criar projeto no banco de dados",
    };
  }
}

export async function createProjectWithFiles(
  input: ProjectInput,
  ownerId: string,
  userId: string
): Promise<CreateProjectResult> {
  // Create project
  const projectResult = await createProject(input, ownerId);

  if (!projectResult.success || !projectResult.project) {
    return projectResult;
  }

  const project = projectResult.project;

  // Process files
  const { processedCount, errorCount } = await processProjectFiles(
    input.files,
    project.id,
    userId
  );

  // If no files were processed successfully, delete the project
  if (processedCount === 0) {
        await prisma.project.delete({ where: { id: project.id } });
    return {
      success: false,
      error: "Erro ao processar arquivos",
    };
  }

  return {
    success: true,
    project: {
      ...project,
      filesProcessed: processedCount,
      filesErrors: errorCount,
    },
  };
}

export async function createAuditLog(
  projectId: string,
  projectData: {
    name: string;
    projectTypes: string[]; // Changed to array
    culture: string;
    filesCount: number;
  },
  sessionUserId: string,
  projectOwnerId: string,
  ipAddress: string,
  userAgent: string | null
): Promise<void> {

  await prisma.auditLog.create({
    data: {
      action: "PROJECT_CREATED",
      entityType: "Project",
      entityId: projectId,
      userId: sessionUserId,
      metadata: {
        projectName: projectData.name,
        projectTypes: projectData.projectTypes,
        culture: projectData.culture,
        filesCount: projectData.filesCount,
        // Track if admin created for another user
        ...(projectOwnerId !== sessionUserId
          ? { createdForUserId: projectOwnerId, createdByAdmin: true }
          : {}),
      },
      ipAddress,
      userAgent,
    },
  });

}
