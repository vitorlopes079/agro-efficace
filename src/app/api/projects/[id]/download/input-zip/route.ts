import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import archiver from "archiver";
import { Readable } from "stream";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get project and verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        files: {
          where: { isInput: true },
          orderBy: { uploadedAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    // Check authorization (user owns project OR user is admin)
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && project.userId !== session.user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (project.files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo de entrada encontrado" },
        { status: 404 }
      );
    }

    // Create ZIP archive
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Set headers for download
    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${project.name}_arquivos_entrada.zip"`
    );

    // Download files from R2 and add to ZIP with folder structure
    const folderMapping: Record<string, string> = {
      INPUT_ORTOMOSAICO: "Ortomosaicos",
      INPUT_PERIMETRO: "Perimetros de Analise",
      INPUT_OTHER: "Outros Arquivos",
    };

    for (const file of project.files) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: file.fileKey,
        });
        const response = await r2Client.send(getCommand);

        if (response.Body) {
          const stream = response.Body as Readable;
          const folder = folderMapping[file.fileCategory] || "outros";
          archive.append(stream, { name: `${folder}/${file.fileName}` });
        }
      } catch (error) {
        console.error(`Error downloading file ${file.fileName}:`, error);
      }
    }

    await archive.finalize();

    // Return the ZIP as a stream
    return new Response(archive as any, { headers });
  } catch (error) {
    console.error("Error creating input ZIP:", error);
    return NextResponse.json(
      { error: "Erro ao criar arquivo ZIP" },
      { status: 500 }
    );
  }
}
