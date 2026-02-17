import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Get all orphan files (status UPLOADED, not linked to any project)
    const orphanFiles = await prisma.pendingUpload.findMany({
      where: {
        status: "UPLOADED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate total size
    const totalSizeBytes = orphanFiles.reduce(
      (sum, file) => sum + Number(file.fileSize),
      0
    );

    // Group by user for summary
    const byUser = orphanFiles.reduce(
      (acc, file) => {
        const userId = file.userId;
        if (!acc[userId]) {
          acc[userId] = {
            user: file.user,
            count: 0,
            totalSize: 0,
          };
        }
        acc[userId].count++;
        acc[userId].totalSize += Number(file.fileSize);
        return acc;
      },
      {} as Record<string, { user: { id: string; name: string; email: string }; count: number; totalSize: number }>
    );

    return NextResponse.json({
      files: orphanFiles.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize.toString(),
        fileType: file.fileType,
        fileKey: file.fileKey,
        createdAt: file.createdAt.toISOString(),
        expiresAt: file.expiresAt.toISOString(),
        user: {
          id: file.user.id,
          name: file.user.name,
          email: file.user.email,
        },
      })),
      summary: {
        totalFiles: orphanFiles.length,
        totalSizeBytes: totalSizeBytes.toString(),
        totalSizeMb: (totalSizeBytes / (1024 * 1024)).toFixed(2),
        totalSizeGb: (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2),
        byUser: Object.values(byUser).map((item) => ({
          user: item.user,
          count: item.count,
          totalSizeMb: (item.totalSize / (1024 * 1024)).toFixed(2),
        })),
      },
    });
  } catch (error) {
    console.error("[ORPHAN FILES API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar arquivos órfãos" },
      { status: 500 }
    );
  }
}
