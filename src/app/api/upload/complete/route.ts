import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { uploadId, fileKey, parts } = await req.json();

    if (!uploadId || !fileKey || !parts?.length) {
      return NextResponse.json(
        { error: "uploadId, fileKey e parts são obrigatórios" },
        { status: 400 },
      );
    }

    
    const command = new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((part: { partNumber: number; etag: string }) => ({
          PartNumber: part.partNumber,
          ETag: part.etag,
        })),
      },
    });

    await r2Client.send(command);


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("💥 [COMPLETE] Error:", error);
    return NextResponse.json(
      { error: "Erro ao completar upload" },
      { status: 500 },
    );
  }
}
