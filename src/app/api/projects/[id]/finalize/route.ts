// src/app/api/projects/[id]/finalize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const { id: projectId } = await params;

  try {
    // 1. Authentication & Authorization
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Check user is ADMIN
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem finalizar projetos" },
        { status: 403 },
      );
    }

    // 2. Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }

    if (project.user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "O proprietário do projeto não está ativo" },
        { status: 400 },
      );
    }


    // 3. Validate Request Body
    const body = await req.json();

    const { files } = body;

    // Validate files array
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "É necessário enviar pelo menos um arquivo" },
        { status: 400 },
      );
    }

    // Validate all categories are OUTPUT categories
    const validOutputCategories = [
      "OUTPUT_DJI_SHAPEFILE",
      "OUTPUT_ORTOMOSAIC",
      "OUTPUT_RELATORIO",
      "OUTPUT_SHAPEFILE_DANINHAS",
      "OUTPUT_SHAPEFILE_OBSTACULOS",
      "OUTPUT_SHAPEFILE_PERIMETROS",
      "OUTPUT_OTHER",
    ];

    const invalidCategories = files.filter(
      (f) => !validOutputCategories.includes(f.category),
    );

    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { error: "Categorias de arquivo inválidas" },
        { status: 400 },
      );
    }


    // 4. Process Each File in PARALLEL
    const fileProcessingStart = Date.now();

    const processedCategories = new Set<string>();

    const results = await Promise.allSettled(
      files.map(async (fileData) => {
        const fileStart = Date.now();

        // Fetch PendingUpload
        const pendingUpload = await prisma.pendingUpload.findUnique({
          where: { id: fileData.pendingUploadId },
        });

        if (!pendingUpload) {
          throw new Error(
            `PendingUpload not found: ${fileData.pendingUploadId}`,
          );
        }

        // Create File record and update PendingUpload in parallel
        // File stays in its original location - no R2 copy/delete needed
        await Promise.all([
          prisma.file.create({
            data: {
              projectId: projectId,
              fileName: pendingUpload.fileName,
              fileSize: pendingUpload.fileSize,
              fileType: pendingUpload.fileType,
              fileKey: pendingUpload.fileKey, // Keep original path
              fileCategory: fileData.category,
              uploadedBy: session.user.id,
              isInput: false, // OUTPUT FILE
            },
          }),
          prisma.pendingUpload.update({
            where: { id: fileData.pendingUploadId },
            data: { status: "CONFIRMED" },
          }),
        ]);

        processedCategories.add(fileData.category);
        return {
          success: true,
          fileName: pendingUpload.fileName,
          category: fileData.category,
        };
      }),
    );

    // Count successes and failures
    const processedCount = results.filter(
      (r) => r.status === "fulfilled",
    ).length;
    const errorCount = results.filter((r) => r.status === "rejected").length;

    // Log any errors
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `❌ [FINALIZE API] Error processing file ${files[index].pendingUploadId}:`,
          result.reason,
        );
      }
    });

    // If no files were processed successfully, don't update project status
    if (processedCount === 0) {
      return NextResponse.json(
        { error: "Erro ao processar arquivos" },
        { status: 500 },
      );
    }

    // 5. Update Project Status to COMPLETED
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // 6. Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "PROJECT_FINALIZED",
        entityType: "Project",
        entityId: projectId,
        userId: session.user.id,
        metadata: {
          filesCount: processedCount,
          categories: Array.from(processedCategories),
          projectName: project.name,
          projectOwnerId: project.userId,
        },
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    // 7. Return Success Response
    return NextResponse.json(
      {
        success: true,
        message: "Projeto finalizado com sucesso",
        project: {
          id: updatedProject.id,
          status: "COMPLETED",
          filesProcessed: processedCount,
          filesErrors: errorCount,
          completedAt: updatedProject.completedAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("💥 [FINALIZE API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro ao finalizar projeto" },
      { status: 500 },
    );
  }
}
