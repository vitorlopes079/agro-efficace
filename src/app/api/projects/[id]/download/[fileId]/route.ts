import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: projectId, fileId } = await params;

    // Fetch the file with project info
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Verify the file belongs to the requested project
    if (file.projectId !== projectId) {
      return NextResponse.json(
        { error: "Arquivo não pertence a este projeto" },
        { status: 400 }
      );
    }

    // Authorization: user can download from own projects, admins can download all
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = file.project.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    // Generate signed URL for download (expires in 1 hour)
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: file.fileKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    });

    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("[DOWNLOAD API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar link de download" },
      { status: 500 }
    );
  }
}
