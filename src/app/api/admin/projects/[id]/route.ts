import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// GET project details (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        files: {
          orderBy: [{ fileCategory: "asc" }, { uploadedAt: "desc" }],
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }

    // Group files by category
    const filesGrouped = {
      ortomosaico: project.files.filter(
        (f) => f.fileCategory === "INPUT_ORTOMOSAICO",
      ),
      perimetros: project.files.filter(
        (f) => f.fileCategory === "INPUT_PERIMETRO",
      ),
      fotos: project.files.filter((f) => f.fileCategory === "INPUT_FOTOS"),
      outros: project.files.filter((f) => f.fileCategory === "INPUT_OTHER"),
    };

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        projectTypes: (project as any).projectTypes || [], // Changed to array
        culture: project.culture,
        status: project.status,
        notes: project.notes,
        price: project.price.toString(),
        isPaid: project.isPaid,
        paidAt: project.paidAt?.toISOString() || null,
        areaProcessed: project.areaProcessed?.toString() || null,
        isArchived: project.isArchived,
        archivedAt: project.archivedAt?.toISOString() || null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        completedAt: project.completedAt?.toISOString() || null,
        user: {
          id: project.user.id,
          name: project.user.name,
          email: project.user.email,
        },
        files: project.files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize.toString(),
          fileType: file.fileType,
          fileKey: file.fileKey,
          fileCategory: file.fileCategory,
          isInput: file.isInput,
          uploadedAt: file.uploadedAt.toISOString(),
        })),
        filesGrouped: {
          ortomosaico: filesGrouped.ortomosaico.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            fileSize: file.fileSize.toString(),
            fileType: file.fileType,
            fileKey: file.fileKey,
            uploadedAt: file.uploadedAt.toISOString(),
          })),
          perimetros: filesGrouped.perimetros.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            fileSize: file.fileSize.toString(),
            fileType: file.fileType,
            fileKey: file.fileKey,
            uploadedAt: file.uploadedAt.toISOString(),
          })),
          fotos: filesGrouped.fotos.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            fileSize: file.fileSize.toString(),
            fileType: file.fileType,
            fileKey: file.fileKey,
            uploadedAt: file.uploadedAt.toISOString(),
          })),
          outros: filesGrouped.outros.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            fileSize: file.fileSize.toString(),
            fileType: file.fileType,
            fileKey: file.fileKey,
            uploadedAt: file.uploadedAt.toISOString(),
          })),
        },
      },
    });
  } catch (error) {
    console.error("[ADMIN PROJECT API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar projeto" },
      { status: 500 },
    );
  }
}

// PATCH update project (payment info, status, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }

    const updateData: {
      price?: number;
      areaProcessed?: number;
      isPaid?: boolean;
      paidAt?: Date | null;
      status?: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
      completedAt?: Date | null;
    } = {};

    // Handle price update
    if (body.price !== undefined) {
      const price = parseFloat(body.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
      }
      updateData.price = price;
    }

    // Handle area update
    if (body.areaProcessed !== undefined) {
      const area = parseFloat(body.areaProcessed);
      if (isNaN(area) || area < 0) {
        return NextResponse.json({ error: "Área inválida" }, { status: 400 });
      }
      updateData.areaProcessed = area;
    }

    // Handle payment status
    if (body.isPaid !== undefined) {
      updateData.isPaid = body.isPaid;
      if (body.isPaid) {
        updateData.paidAt = new Date();
      } else {
        updateData.paidAt = null;
      }
    }

    // Handle project status
    if (body.status !== undefined) {
      const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      }
      updateData.status = body.status;
      if (body.status === "COMPLETED") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "PROJECT_UPDATED",
        entityType: "Project",
        entityId: id,
        userId: session.user.id,
        metadata: {
          updates: body,
          previousValues: {
            price: project.price.toString(),
            isPaid: project.isPaid,
            status: project.status,
          },
        },
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.id,
        price: updatedProject.price.toString(),
        areaProcessed: updatedProject.areaProcessed?.toString() || null,
        isPaid: updatedProject.isPaid,
        paidAt: updatedProject.paidAt?.toISOString() || null,
        status: updatedProject.status,
        completedAt: updatedProject.completedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("[ADMIN PROJECT API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar projeto" },
      { status: 500 },
    );
  }
}

// DELETE project (admin only) - removes project and all files from R2
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;

    // 1. Fetch project with files
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        files: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }


    // 2. Delete all files from R2
    let deletedFilesCount = 0;
    const deleteErrors: string[] = [];

    for (const file of project.files) {
      try {

        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: file.fileKey,
        });

        await r2Client.send(deleteCommand);
        deletedFilesCount++;

      } catch (error) {
        const errorMsg = `Failed to delete ${file.fileKey}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`   ❌ ${errorMsg}`);
        deleteErrors.push(errorMsg);
      }
    }

    
    // 3. Delete project from database (cascades to files table)

    await prisma.project.delete({
      where: { id },
    });


    // 4. Create audit log

    await prisma.auditLog.create({
      data: {
        action: "PROJECT_DELETED",
        entityType: "Project",
        entityId: id,
        userId: session.user.id,
        metadata: {
          projectName: project.name,
          projectTypes: (project as any).projectTypes || [],
          culture: project.culture,
          filesCount: project.files.length,
          deletedFilesCount,
          errors: deleteErrors.length > 0 ? deleteErrors : undefined,
        },
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") || null,
      },
    });


    const summary = {
      success: true,
      message: "Projeto deletado com sucesso",
      filesDeleted: deletedFilesCount,
      errors: deleteErrors,
    };


    return NextResponse.json(summary);
  } catch (error) {
    console.error("💥 [DELETE PROJECT] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Erro ao deletar projeto",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
