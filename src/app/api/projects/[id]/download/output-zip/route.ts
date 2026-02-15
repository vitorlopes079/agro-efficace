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
  console.log("📦 [OUTPUT ZIP] Starting on-demand ZIP generation...");

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("❌ [OUTPUT ZIP] No session");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: projectId } = await params;
    console.log(`🔍 [OUTPUT ZIP] Project ID: ${projectId}`);

    // Check authorization
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
      console.log("❌ [OUTPUT ZIP] Project not found");
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && project.userId !== session.user.id) {
      console.log("❌ [OUTPUT ZIP] Access denied");
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (project.status !== "COMPLETED") {
      console.log("⚠️ [OUTPUT ZIP] Project not completed yet");
      return NextResponse.json(
        { error: "Projeto ainda não finalizado" },
        { status: 400 },
      );
    }

    if (project.files.length === 0) {
      console.log("❌ [OUTPUT ZIP] No output files found");
      return NextResponse.json(
        { error: "Nenhum arquivo de saída encontrado" },
        { status: 404 },
      );
    }

    console.log(
      `📁 [OUTPUT ZIP] Creating ZIP for ${project.files.length} files`,
    );

    const archive = archiver("zip", { zlib: { level: 0 } });

    const folderMapping: Record<string, string> = {
      OUTPUT_DJI_SHAPEFILE: "DJI Shapefile",
      OUTPUT_ORTOMOSAIC: "Ortomosaico Processado",
      OUTPUT_RELATORIO: "Relatorios",
      OUTPUT_SHAPEFILE_DANINHAS: "Shapefiles/Daninhas Folha Larga",
      OUTPUT_SHAPEFILE_OBSTACULOS: "Shapefiles/Obstaculos",
      OUTPUT_SHAPEFILE_PERIMETROS: "Shapefiles/Perimetros",
      OUTPUT_OTHER: "Outros Arquivos",
    };

    console.log("📥 [OUTPUT ZIP] Adding files to archive...");
    for (const file of project.files) {
      try {
        console.log(`   📄 Adding: ${file.fileName}`);

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

    console.log("🔐 [OUTPUT ZIP] Finalizing archive...");
    archive.finalize();

    console.log("📤 [OUTPUT ZIP] Converting to Web Stream...");

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
          console.error("❌ [OUTPUT ZIP] Archive error:", err);
          controller.error(err);
        });
      },
    });

    const endTime = Date.now();
    console.log(`✅ [OUTPUT ZIP] ZIP ready in ${endTime - startTime}ms`);

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.name}_solucao_completa.zip"`,
      },
    });
  } catch (error) {
    console.error("💥 [OUTPUT ZIP] Error:", error);
    return NextResponse.json({ error: "Erro ao criar ZIP" }, { status: 500 });
  }
}
