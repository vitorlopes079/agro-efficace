import { prisma } from "@/lib/prisma";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import archiver from "archiver";
import { PassThrough, Readable } from "stream";

export async function generateOutputZip(projectId: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Get project OUTPUT files
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        files: {
          where: { isInput: false }, // OUTPUT files only
          orderBy: { uploadedAt: "asc" },
        },
      },
    });

    if (!project || project.files.length === 0) {
      return;
    }

    // Create archive
    const archive = archiver("zip", { zlib: { level: 0 } });
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    // Collect chunks
    const chunks: Buffer[] = [];
    passThrough.on("data", (chunk) => chunks.push(chunk));

    // Add files to archive
    for (const file of project.files) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: file.fileKey,
        });
        const response = await r2Client.send(getCommand);

        if (response.Body) {
          const stream = response.Body as Readable;
          // Use the fileCategory (custom section title) as the folder name
          const folder = file.fileCategory || "Outros Arquivos";
          archive.append(stream, { name: `${folder}/${file.fileName}` });
        }
      } catch (error) {
        console.error(`   ❌ Error adding ${file.fileName}:`, error);
      }
    }

    archive.finalize();

    // Wait for all chunks
    await new Promise<void>((resolve) => passThrough.on("end", resolve));

    const zipBuffer = Buffer.concat(chunks);
    const zipSizeMB = (zipBuffer.length / 1024 / 1024).toFixed(2);

    // Upload to R2
    const zipKey = `projects/${projectId}/downloads/output-files.zip`;

    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: zipKey,
      Body: zipBuffer,
      ContentType: "application/zip",
    });

    await r2Client.send(putCommand);

    const endTime = Date.now();
      } catch (error) {
    console.error("💥 [GENERATE OUTPUT ZIP] Error:", error);
    throw error;
  }
}
