import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function POST() {
  console.log("🧹 [CLEANUP] Starting orphaned files cleanup...");

  try {
    // 1. Authentication & Authorization
    console.log("🔐 [CLEANUP] Checking authentication...");
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("❌ [CLEANUP] No session found");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      console.log("❌ [CLEANUP] User is not admin");
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    console.log("✅ [CLEANUP] Admin authentication verified");

    // 2. Find orphaned database records (older than 30 minutes with status UPLOADED)
    console.log("🔍 [CLEANUP] Searching for orphaned database records...");

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

    console.log(
      `📊 [CLEANUP] Found ${orphanedRecords.length} orphaned database records`
    );

    // 3. Delete files from R2 and track results
    const r2DeletedKeys: string[] = [];
    const r2DeleteErrors: string[] = [];
    let totalBytesFreed = 0;

    console.log("🗑️ [CLEANUP] Starting R2 file deletion...");

    for (const record of orphanedRecords) {
      try {
        console.log(`   Deleting: ${record.fileKey}`);

        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: record.fileKey,
        });

        await r2Client.send(deleteCommand);

        r2DeletedKeys.push(record.fileKey);
        totalBytesFreed += Number(record.fileSize);

        console.log(`   ✅ Deleted: ${record.fileKey}`);
      } catch (error) {
        const errorMsg = `Failed to delete ${record.fileKey}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`   ❌ ${errorMsg}`);
        r2DeleteErrors.push(errorMsg);
      }
    }

    console.log(
      `📊 [CLEANUP] R2 deletion complete: ${r2DeletedKeys.length} files deleted, ${r2DeleteErrors.length} errors`
    );

    // 4. List orphaned R2 files (files in pending/ with no database record)
    console.log("🔍 [CLEANUP] Checking for orphaned R2 files without DB records...");

    let orphanedR2Files = 0;
    let continuationToken: string | undefined;

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: "pending/",
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
                console.log(`   Deleting orphaned R2 file: ${object.Key}`);

                const deleteCommand = new DeleteObjectCommand({
                  Bucket: R2_BUCKET,
                  Key: object.Key,
                });

                await r2Client.send(deleteCommand);

                orphanedR2Files++;
                totalBytesFreed += object.Size || 0;

                console.log(`   ✅ Deleted orphaned R2 file: ${object.Key}`);
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

    console.log(`📊 [CLEANUP] Found and deleted ${orphanedR2Files} orphaned R2 files`);

    // 5. Delete database records where R2 deletion succeeded
    console.log("🗄️ [CLEANUP] Deleting database records...");

    const recordsToDelete = orphanedRecords
      .filter((record) => r2DeletedKeys.includes(record.fileKey))
      .map((record) => record.id);

    let dbRecordsDeleted = 0;
    if (recordsToDelete.length > 0) {
      const deleteResult = await prisma.pendingUpload.deleteMany({
        where: {
          id: {
            in: recordsToDelete,
          },
        },
      });

      dbRecordsDeleted = deleteResult.count;
      console.log(`✅ [CLEANUP] Deleted ${dbRecordsDeleted} database records`);
    } else {
      console.log("ℹ️ [CLEANUP] No database records to delete");
    }

    // 6. Calculate summary
    const storageFreedMb = (totalBytesFreed / (1024 * 1024)).toFixed(2);

    const summary = {
      success: true,
      dbRecordsFound: orphanedRecords.length,
      r2FilesDeleted: r2DeletedKeys.length + orphanedR2Files,
      dbRecordsDeleted,
      storageFreedMb: parseFloat(storageFreedMb),
      errors: r2DeleteErrors,
    };

    console.log("📊 [CLEANUP] Cleanup summary:");
    console.log(`   Database records found: ${summary.dbRecordsFound}`);
    console.log(`   R2 files deleted: ${summary.r2FilesDeleted}`);
    console.log(`   Database records deleted: ${summary.dbRecordsDeleted}`);
    console.log(`   Storage freed: ${summary.storageFreedMb}MB`);
    console.log(`   Errors: ${summary.errors.length}`);

    console.log("🎉 [CLEANUP] Cleanup completed successfully");

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
