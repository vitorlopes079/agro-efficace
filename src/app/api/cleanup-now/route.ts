// src/app/api/cleanup-now/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ListMultipartUploadsCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";

export async function GET() {
  try {
    // Authentication check - admin only
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }


    // Listar todos uploads incompletos
    const listCommand = new ListMultipartUploadsCommand({
      Bucket: R2_BUCKET,
    });

    const { Uploads } = await r2Client.send(listCommand);

    if (!Uploads || Uploads.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum upload incompleto encontrado",
      });
    }


    let aborted = 0;

    // Abortar TODOS (sem verificar data)
    for (const upload of Uploads) {
      try {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: R2_BUCKET,
          Key: upload.Key!,
          UploadId: upload.UploadId!,
        });

        await r2Client.send(abortCommand);
        aborted++;
      } catch (error) {
        console.error(`❌ Failed to abort ${upload.Key}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Limpeza concluída! ${aborted} uploads abortados de ${Uploads.length} encontrados.`,
      aborted,
      total: Uploads.length,
    });
  } catch (error) {
    console.error("❌ Erro no cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro no cleanup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
