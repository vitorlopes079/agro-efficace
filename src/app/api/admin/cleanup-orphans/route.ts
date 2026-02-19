import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function POST() {

  try {
    // 1. Authentication & Authorization
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }


    // 2. Find orphaned database records (older than 30 minutes with status UPLOADED)

    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const orphanedRecords = await prisma.pendingUpload.findMany({
      where: {
        status: "UPLOADED",
        createdAt: {
          lt: thirtyMinutesAgo,
        },
      },
    });

    
    // 3. SAFER APPROACH: Delete DB records FIRST, then R2 files
    // If R2 deletion fails, orphaned R2 files will be caught by step 4
    const r2DeletedKeys: string[] = [];
    const r2DeleteErrors: string[] = [];
    let totalBytesFreed = 0;
    let dbRecordsDeleted = 0;

    if (orphanedRecords.length > 0) {
      // 3a. Delete database records first (atomic operation)

      const recordIds = orphanedRecords.map((r) => r.id);
      const deleteResult = await prisma.pendingUpload.deleteMany({
        where: { id: { in: recordIds } },
      });
      dbRecordsDeleted = deleteResult.count;


      // 3b. Now delete from R2 (if this fails, files become orphaned R2 files)

      for (const record of orphanedRecords) {
        try {

          const deleteCommand = new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: record.fileKey,
          });

          await r2Client.send(deleteCommand);

          r2DeletedKeys.push(record.fileKey);
          totalBytesFreed += Number(record.fileSize);

        } catch (error) {
          // R2 deletion failed - file will be caught by orphaned R2 check below
          const errorMsg = `Failed to delete ${record.fileKey}: ${error instanceof Error ? error.message : "Unknown error"}`;
          console.error(`   ❌ ${errorMsg}`);
          r2DeleteErrors.push(errorMsg);
        }
      }

          }

    // 4. List orphaned R2 files (files in files/ with no database record)

    let orphanedR2Files = 0;
    let continuationToken: string | undefined;

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: "files/",
        ContinuationToken: continuationToken,
      });

      const listResponse = await r2Client.send(listCommand);

      if (listResponse.Contents) {
        for (const object of listResponse.Contents) {
          if (!object.Key || !object.LastModified) continue;

          // Check if file is older than 30 minutes
          const fileAge = Date.now() - object.LastModified.getTime();
          const thirtyMinutesMs = 30 * 60 * 1000;

          if (fileAge > thirtyMinutesMs) {
            // Check if this fileKey exists in database
            const dbRecord = await prisma.pendingUpload.findFirst({
              where: { fileKey: object.Key },
            });

            if (!dbRecord) {
              // Orphaned R2 file with no database record
              try {

                const deleteCommand = new DeleteObjectCommand({
                  Bucket: R2_BUCKET,
                  Key: object.Key,
                });

                await r2Client.send(deleteCommand);

                orphanedR2Files++;
                totalBytesFreed += object.Size || 0;

              } catch (error) {
                const errorMsg = `Failed to delete orphaned R2 file ${object.Key}: ${error instanceof Error ? error.message : "Unknown error"}`;
                console.error(`   ❌ ${errorMsg}`);
                r2DeleteErrors.push(errorMsg);
              }
            }
          }
        }
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);


    // 5. Calculate summary
    const storageFreedMb = (totalBytesFreed / (1024 * 1024)).toFixed(2);

    const summary = {
      success: true,
      dbRecordsFound: orphanedRecords.length,
      r2FilesDeleted: r2DeletedKeys.length + orphanedR2Files,
      dbRecordsDeleted,
      storageFreedMb: parseFloat(storageFreedMb),
      errors: r2DeleteErrors,
    };



    return NextResponse.json(summary);
  } catch (error) {
    console.error("💥 [CLEANUP] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Erro ao limpar arquivos órfãos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
