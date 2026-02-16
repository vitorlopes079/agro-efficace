import { prisma } from "@/lib/prisma";

export interface FileToProcess {
  pendingUploadId: string;
  category: string;
}

export interface ProcessedFileResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

export async function processProjectFile(
  fileData: FileToProcess,
  projectId: string,
  userId: string
): Promise<ProcessedFileResult> {
  const fileStart = Date.now();
  console.log(
    `📄 [FILE PROCESSOR] Processing file: ${fileData.pendingUploadId}`
  );

  try {
    // Fetch PendingUpload
    const pendingUpload = await prisma.pendingUpload.findUnique({
      where: { id: fileData.pendingUploadId },
    });

    if (!pendingUpload) {
      console.log(
        `⚠️ [FILE PROCESSOR] PendingUpload not found: ${fileData.pendingUploadId}`
      );
      throw new Error(
        `PendingUpload not found: ${fileData.pendingUploadId}`
      );
    }

    console.log(
      `📦 [FILE PROCESSOR] Found pending upload: ${pendingUpload.fileName}`
    );

    // Create File record and update PendingUpload in parallel
    // File stays in its original location - no R2 copy/delete needed
    await Promise.all([
      prisma.file.create({
        data: {
          projectId: projectId,
          fileName: pendingUpload.fileName,
          fileSize: pendingUpload.fileSize,
          fileType: pendingUpload.fileType,
          fileKey: pendingUpload.fileKey, // Keep original path
          fileCategory: fileData.category as any,
          uploadedBy: userId,
        },
      }),
      prisma.pendingUpload.update({
        where: { id: fileData.pendingUploadId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    const fileEnd = Date.now();
    console.log(
      `💾 [FILE PROCESSOR] File linked in ${fileEnd - fileStart}ms: ${pendingUpload.fileName}`
    );

    return { success: true, fileName: pendingUpload.fileName };
  } catch (error) {
    console.error(
      `❌ [FILE PROCESSOR] Error processing file ${fileData.pendingUploadId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function processProjectFiles(
  files: FileToProcess[],
  projectId: string,
  userId: string
): Promise<{
  processedCount: number;
  errorCount: number;
  results: PromiseSettledResult<ProcessedFileResult>[];
}> {
  console.log(
    `📁 [FILE PROCESSOR] Processing ${files.length} files in parallel...`
  );
  const fileProcessingStart = Date.now();

  const results = await Promise.allSettled(
    files.map((fileData) => processProjectFile(fileData, projectId, userId))
  );

  const fileProcessingEnd = Date.now();
  console.log(
    `⚡ [FILE PROCESSOR] All files processed in ${fileProcessingEnd - fileProcessingStart}ms`
  );

  // Count successes and failures
  const processedCount = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  const errorCount = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)
  ).length;

  // Log any errors
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `❌ [FILE PROCESSOR] Error processing file ${files[index].pendingUploadId}:`,
        result.reason
      );
    } else if (!result.value.success) {
      console.error(
        `❌ [FILE PROCESSOR] Failed to process file ${files[index].pendingUploadId}:`,
        result.value.error
      );
    }
  });

  console.log(
    `📊 [FILE PROCESSOR] Files processed: ${processedCount} success, ${errorCount} errors`
  );

  return { processedCount, errorCount, results };
}
