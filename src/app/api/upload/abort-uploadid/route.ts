// src/app/api/upload/abort-uploadid/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { uploadId, fileKey } = await req.json();

    // 🔍 ADDED: Detailed debug logs
    console.log("🔍 [DEBUG] Received uploadId:", uploadId);
    console.log("🔍 [DEBUG] Received fileKey:", fileKey);
    console.log("🔍 [DEBUG] uploadId type:", typeof uploadId);
    console.log("🔍 [DEBUG] uploadId length:", uploadId?.length);
    console.log("🔍 [DEBUG] R2_BUCKET:", R2_BUCKET);

    if (!uploadId || !fileKey) {
      return NextResponse.json(
        { error: "uploadId e fileKey são obrigatórios" },
        { status: 400 },
      );
    }

    console.log("🧹 [ABORT-UPLOADID] Aborting uploadId:", uploadId);
    console.log("🧹 [ABORT-UPLOADID] File key:", fileKey);

    const command = new AbortMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      UploadId: uploadId,
    });

    console.log("🔍 [DEBUG] Sending abort command...");
    const result = await r2Client.send(command);
    console.log("✅ [ABORT-UPLOADID] Successfully aborted! Result:", result);

    return NextResponse.json({
      success: true,
      message: "UploadId aborted successfully",
    });
  } catch (error: any) {
    // 🔍 ADDED: More detailed error logging
    console.error("❌ [ABORT-UPLOADID] Error details:", {
      name: error.name,
      code: error.Code,
      message: error.message,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
    });

    // Se o upload já foi completado/abortado, não é erro
    if (error.name === "NoSuchUpload" || error.Code === "NoSuchUpload") {
      console.log("ℹ️ [ABORT-UPLOADID] Upload already completed or aborted");
      return NextResponse.json({
        success: true,
        message: "Upload already completed or aborted",
      });
    }

    // Outros erros também não devem falhar o upload principal
    return NextResponse.json(
      {
        success: false, // 🔍 CHANGED: Return false so we can see the error in frontend
        warning: "Failed to abort but upload succeeded",
        error: error.message,
        errorCode: error.Code || error.name,
      },
      { status: 500 },
    );
  }
}
