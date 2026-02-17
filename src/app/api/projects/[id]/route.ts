import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
          orderBy: [
            { fileCategory: "asc" },
            { uploadedAt: "desc" },
          ],
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    // Authorization: user can see own projects, admins see all
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = project.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Group files by category
    const filesGrouped = {
      ortomosaico: project.files.filter((f) => f.fileCategory === "INPUT_ORTOMOSAICO"),
      perimetros: project.files.filter((f) => f.fileCategory === "INPUT_PERIMETRO"),
      fotos: project.files.filter((f) => f.fileCategory === "INPUT_FOTOS"),
      outros: project.files.filter((f) => f.fileCategory === "INPUT_OTHER"),
    };

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        projectType: project.projectType,
        culture: project.culture,
        status: project.status,
        notes: project.notes,
        price: project.price.toString(),
        isPaid: project.isPaid,
        paidAt: project.paidAt?.toISOString() || null,
        areaProcessed: project.areaProcessed?.toString() || null,
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
        totalFiles: project.files.length,
      },
    });
  } catch (error) {
    console.error("[PROJECT DETAIL API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar projeto" },
      { status: 500 }
    );
  }
}
