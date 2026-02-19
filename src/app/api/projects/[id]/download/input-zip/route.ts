import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import archiver from "archiver";
import { Readable } from "stream";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();

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
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }


    // Calculate total size
    const totalSize = project.files.reduce(
      (sum, file) => sum + Number(file.fileSize),
      0,
    );
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

    // Check authorization (user owns project OR user is admin)
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && project.userId !== session.user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (project.files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo de entrada encontrado" },
        { status: 404 },
      );
    }

    const archive = archiver("zip", { zlib: { level: 0 } });

    // Folder mapping
    const folderMapping: Record<string, string> = {
      INPUT_ORTOMOSAICO: "Ortomosaicos",
      INPUT_PERIMETRO: "Perimetros de Analise",
      INPUT_OTHER: "Outros Arquivos",
    };

    // Download files from R2 and add to ZIP
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
        console.error(`   ❌ Error adding ${file.fileName}:`, error);
      }
    }

    archive.finalize();


    // Manual conversion to DOM Web Stream
    const webStream = new ReadableStream({
      start(controller) {
        archive.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        archive.on("end", () => {
          controller.close();
        });

        archive.on("error", (err) => {
          console.error("❌ [INPUT ZIP] Archive error:", err);
          controller.error(err);
        });
      },
    });

    const endTime = Date.now();

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.name}_arquivos_entrada.zip"`,
      },
    });
  } catch (error) {
    console.error("💥 [INPUT ZIP] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro ao criar arquivo ZIP" },
      { status: 500 },
    );
  }
}
