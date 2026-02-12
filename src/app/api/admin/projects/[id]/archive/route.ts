// src/app/api/admin/projects/[id]/archive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CopyObjectCommand,
  HeadObjectCommand,
  StorageClass,
} from "@aws-sdk/client-s3";
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
  console.log("🗄️ [ARCHIVE API] Starting project archive...");

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      console.log("❌ [ARCHIVE API] Unauthorized access attempt");
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 },
      );
    }

    const { id: projectId } = await params;
    console.log(`📦 [ARCHIVE API] Archiving project: ${projectId}`);

    // Fetch project with files
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        files: true,
      },
    });

    if (!project) {
      console.log("❌ [ARCHIVE API] Project not found");
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }

    if (project.isArchived) {
      console.log("⚠️ [ARCHIVE API] Project already archived");
      return NextResponse.json(
        { error: "Projeto já está arquivado" },
        { status: 400 },
      );
    }

    if (project.files.length === 0) {
      console.log("⚠️ [ARCHIVE API] No files to archive");
      return NextResponse.json(
        { error: "Projeto não possui arquivos para arquivar" },
        { status: 400 },
      );
    }

    console.log(
      `📁 [ARCHIVE API] Found ${project.files.length} files to archive`,
    );

    let archivedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const file of project.files) {
      try {
        console.log(`🔄 [ARCHIVE API] Processing file: ${file.fileName}`);

        // Check if file exists and get its current storage class
        try {
          const headCommand = new HeadObjectCommand({
            Bucket: R2_BUCKET,
            Key: file.fileKey,
          });
          const headResponse = await r2Client.send(headCommand);

          // Skip if already in Infrequent Access
          if (headResponse.StorageClass === StorageClass.STANDARD_IA) {
            console.log(
              `⏭️ [ARCHIVE API] File already archived: ${file.fileName}`,
            );
            archivedCount++;
            continue;
          }
        } catch (headError) {
          console.error(
            `❌ [ARCHIVE API] File not found in R2: ${file.fileName}`,
            headError,
          );
          errors.push(`Arquivo não encontrado: ${file.fileName}`);
          errorCount++;
          continue;
        }

        // Copy file with Infrequent Access storage class
        const copyCommand = new CopyObjectCommand({
          Bucket: R2_BUCKET,
          CopySource: `${R2_BUCKET}/${file.fileKey}`,
          Key: file.fileKey,
          StorageClass: StorageClass.STANDARD_IA,
          MetadataDirective: "COPY",
        });

        await r2Client.send(copyCommand);
        console.log(
          `✅ [ARCHIVE API] File moved to Infrequent Access: ${file.fileName}`,
        );

        archivedCount++;
      } catch (fileError) {
        console.error(
          `❌ [ARCHIVE API] Error archiving file ${file.fileName}:`,
          fileError,
        );
        errors.push(`Erro ao arquivar ${file.fileName}`);
        errorCount++;
      }
    }

    console.log(
      `📊 [ARCHIVE API] Archive completed: ${archivedCount} success, ${errorCount} errors`,
    );

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "PROJECT_ARCHIVED",
        entityType: "Project",
        entityId: project.id,
        userId: session.user.id,
        metadata: {
          projectName: project.name,
          filesTotal: project.files.length,
          filesArchived: archivedCount,
          filesErrors: errorCount,
          errors: errors.length > 0 ? errors : undefined,
        },
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    if (errorCount === project.files.length) {
      return NextResponse.json(
        {
          error: "Erro ao arquivar todos os arquivos",
          details: errors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Projeto arquivado com sucesso`,
      stats: {
        total: project.files.length,
        archived: archivedCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("💥 [ARCHIVE API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro ao arquivar projeto" },
      { status: 500 },
    );
  }
}
