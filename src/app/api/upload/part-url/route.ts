import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { uploadId, fileKey, partNumber } = await req.json();

    if (!uploadId || !fileKey || !partNumber) {
      return NextResponse.json(
        { error: "uploadId, fileKey e partNumber são obrigatórios" },
        { status: 400 },
      );
    }

    console.log(
      `🔑 [PART-URL] Generating presigned URL for part ${partNumber}`,
    );

    const command = new UploadPartCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    // ✅ Presigned URL gerada no servidor, expira em 1h
    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    console.log(`✅ [PART-URL] Presigned URL generated for part ${partNumber}`);

    return NextResponse.json({ presignedUrl });
  } catch (error) {
    console.error("💥 [PART-URL] Error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL para parte" },
      { status: 500 },
    );
  }
}
