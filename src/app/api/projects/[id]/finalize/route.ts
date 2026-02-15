// src/app/api/projects/[id]/finalize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";

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
  console.log("🚀 [FINALIZE API] Starting project finalization...");
  const { id: projectId } = await params;

  try {
    // 1. Authentication & Authorization
    const session = await getServerSession(authOptions);
    console.log(
      "👤 [FINALIZE API] Session:",
      session?.user?.email || "No session",
    );

    if (!session) {
      console.log("❌ [FINALIZE API] No session found");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Check user is ADMIN
    if (session.user.role !== "ADMIN") {
      console.log("⛔ [FINALIZE API] User is not admin");
      return NextResponse.json(
        { error: "Apenas administradores podem finalizar projetos" },
        { status: 403 },
      );
    }

    // 2. Check project exists
    console.log("🔍 [FINALIZE API] Checking project exists...");
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
      console.log("❌ [FINALIZE API] Project not found");
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }

    if (project.user.status !== "ACTIVE") {
      console.log("⛔ [FINALIZE API] Project owner is not active");
      return NextResponse.json(
        { error: "O proprietário do projeto não está ativo" },
        { status: 400 },
      );
    }

    console.log("✅ [FINALIZE API] Project found:", project.name);

    // 3. Validate Request Body
    const body = await req.json();
    console.log("📦 [FINALIZE API] Request body:", body);

    const { files } = body;

    // Validate files array
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.log("❌ [FINALIZE API] No files provided");
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
      console.log("❌ [FINALIZE API] Invalid categories found");
      return NextResponse.json(
        { error: "Categorias de arquivo inválidas" },
        { status: 400 },
      );
    }

    console.log("✅ [FINALIZE API] Validation passed");

    // 4. Process Each File in PARALLEL
    console.log(
      `📁 [FINALIZE API] Processing ${files.length} files in parallel...`,
    );
    const fileProcessingStart = Date.now();

    const folderMapping: Record<string, string> = {
      OUTPUT_DJI_SHAPEFILE: "output/dji",
      OUTPUT_ORTOMOSAIC: "output/ortomosaico",
      OUTPUT_RELATORIO: "output/relatorios",
      OUTPUT_SHAPEFILE_DANINHAS: "output/shapefiles/daninhas_folha_larga",
      OUTPUT_SHAPEFILE_OBSTACULOS: "output/shapefiles/obstaculos",
      OUTPUT_SHAPEFILE_PERIMETROS: "output/shapefiles/perimetros",
      OUTPUT_OTHER: "output/outros",
    };

    const processedCategories = new Set<string>();

    const results = await Promise.allSettled(
      files.map(async (fileData) => {
        const fileStart = Date.now();
        console.log(
          `📄 [FINALIZE API] Processing file: ${fileData.pendingUploadId}`,
        );

        // Fetch PendingUpload
        const pendingUpload = await prisma.pendingUpload.findUnique({
          where: { id: fileData.pendingUploadId },
        });

        if (!pendingUpload) {
          console.log(
            `⚠️ [FINALIZE API] PendingUpload not found: ${fileData.pendingUploadId}`,
          );
          throw new Error(
            `PendingUpload not found: ${fileData.pendingUploadId}`,
          );
        }

        console.log(
          `📦 [FINALIZE API] Found pending upload: ${pendingUpload.fileName}`,
        );

        // Get target folder based on category
        const targetFolder = folderMapping[fileData.category];

        // Extract file name
        const fileName =
          pendingUpload.fileKey.split("/").pop() || pendingUpload.fileName;

        // Build new file key
        const newFileKey = `projects/${projectId}/${targetFolder}/${fileName}`;

        console.log(
          `🔄 [FINALIZE API] Moving file from ${pendingUpload.fileKey} to ${newFileKey}`,
        );

        // Copy file in R2
        const copyCommand = new CopyObjectCommand({
          Bucket: R2_BUCKET,
          CopySource: `${R2_BUCKET}/${pendingUpload.fileKey}`,
          Key: newFileKey,
        });
        await r2Client.send(copyCommand);
        console.log(`✅ [FINALIZE API] File copied to new location`);

        // Delete old pending file
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: pendingUpload.fileKey,
        });
        await r2Client.send(deleteCommand);
        console.log(`🗑️ [FINALIZE API] Old file deleted from pending`);

        // Create File record and update PendingUpload in parallel
        await Promise.all([
          prisma.file.create({
            data: {
              projectId: projectId,
              fileName: pendingUpload.fileName,
              fileSize: pendingUpload.fileSize,
              fileType: pendingUpload.fileType,
              fileKey: newFileKey,
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

        const fileEnd = Date.now();
        console.log(
          `💾 [FINALIZE API] File processed in ${fileEnd - fileStart}ms: ${pendingUpload.fileName}`,
        );

        processedCategories.add(fileData.category);
        return {
          success: true,
          fileName: pendingUpload.fileName,
          category: fileData.category,
        };
      }),
    );

    const fileProcessingEnd = Date.now();
    console.log(
      `⚡ [FINALIZE API] All files processed in ${fileProcessingEnd - fileProcessingStart}ms`,
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

    console.log(
      `📊 [FINALIZE API] Files processed: ${processedCount} success, ${errorCount} errors`,
    );

    // If no files were processed successfully, don't update project status
    if (processedCount === 0) {
      console.log("❌ [FINALIZE API] No files were processed successfully");
      return NextResponse.json(
        { error: "Erro ao processar arquivos" },
        { status: 500 },
      );
    }

    // 5. Update Project Status to COMPLETED
    console.log("💾 [FINALIZE API] Updating project status to COMPLETED...");
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    console.log("✅ [FINALIZE API] Project status updated to COMPLETED");

    // 6. Create Audit Log
    console.log("📝 [FINALIZE API] Creating audit log...");
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
    console.log("✅ [FINALIZE API] Audit log created");

    const endTime = Date.now();
    console.log(
      `🎉 [FINALIZE API] Project finalization completed successfully in ${endTime - startTime}ms`,
    );

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
