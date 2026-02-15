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
  console.log("📦 [INPUT ZIP] Starting on-demand ZIP generation...");

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("❌ [INPUT ZIP] No session");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: projectId } = await params;
    console.log(`🔍 [INPUT ZIP] Project ID: ${projectId}`);

    // Get project and verify access
    console.log("💾 [INPUT ZIP] Fetching project from database...");
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
      console.log("❌ [INPUT ZIP] Project not found");
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 },
      );
    }

    console.log(`✅ [INPUT ZIP] Project found: ${project.name}`);
    console.log(`📁 [INPUT ZIP] Input files: ${project.files.length}`);

    // Calculate total size
    const totalSize = project.files.reduce(
      (sum, file) => sum + Number(file.fileSize),
      0,
    );
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`📊 [INPUT ZIP] Total size: ${totalSizeMB} MB`);

    // Check authorization (user owns project OR user is admin)
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && project.userId !== session.user.id) {
      console.log("❌ [INPUT ZIP] Access denied");
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (project.files.length === 0) {
      console.log("❌ [INPUT ZIP] No input files found");
      return NextResponse.json(
        { error: "Nenhum arquivo de entrada encontrado" },
        { status: 404 },
      );
    }

    console.log("🗜️ [INPUT ZIP] Creating ZIP archive...");
    const archive = archiver("zip", { zlib: { level: 0 } });

    // Folder mapping
    const folderMapping: Record<string, string> = {
      INPUT_ORTOMOSAICO: "Ortomosaicos",
      INPUT_PERIMETRO: "Perimetros de Analise",
      INPUT_OTHER: "Outros Arquivos",
    };

    // Download files from R2 and add to ZIP
    console.log("📥 [INPUT ZIP] Adding files to archive...");
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

    console.log("🔐 [INPUT ZIP] Finalizing archive...");
    archive.finalize();

    console.log("📤 [INPUT ZIP] Converting to Web Stream...");

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
    console.log(`✅ [INPUT ZIP] ZIP ready in ${endTime - startTime}ms`);

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
