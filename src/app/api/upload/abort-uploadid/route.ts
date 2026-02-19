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

    if (!uploadId || !fileKey) {
      return NextResponse.json(
        { error: "uploadId e fileKey são obrigatórios" },
        { status: 400 },
      );
    }


    const command = new AbortMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      UploadId: uploadId,
    });

    const result = await r2Client.send(command);

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
