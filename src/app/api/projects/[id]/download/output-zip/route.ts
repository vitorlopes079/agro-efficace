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
          where: { isInput: false },
          orderBy: { uploadedAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    // Check authorization
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && project.userId !== session.user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Only allow download for completed projects
    if (project.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Projeto ainda não finalizado" },
        { status: 400 }
      );
    }

    if (project.files.length === 0) {
      return NextResponse.json(
        { error: "Nenhum arquivo de saída encontrado" },
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
      `attachment; filename="${project.name}_solucao_completa.zip"`
    );

    // Download files from R2 and add to ZIP with folder structure
    const folderMapping: Record<string, string> = {
      OUTPUT_DJI_SHAPEFILE: "dji",
      OUTPUT_ORTOMOSAIC: "ortomosaico",
      OUTPUT_RELATORIO: "relatorios",
      OUTPUT_SHAPEFILE_DANINHAS: "shapefiles/daninhas",
      OUTPUT_SHAPEFILE_OBSTACULOS: "shapefiles/obstaculos",
      OUTPUT_SHAPEFILE_PERIMETROS: "shapefiles/perimetros",
      OUTPUT_OTHER: "outros",
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
    console.error("Error creating output ZIP:", error);
    return NextResponse.json(
      { error: "Erro ao criar arquivo ZIP" },
      { status: 500 }
    );
  }
}
