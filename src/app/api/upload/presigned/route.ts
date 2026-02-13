// src/app/api/upload/presigned/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// ❌ REMOVE: import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  console.log("🚀 [PRESIGNED] Starting upload initialization...");

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canUpload: true, status: true },
    });

    if (user?.status === "SUSPENDED") {
      return NextResponse.json({ error: "Conta suspensa" }, { status: 403 });
    }

    if (!user?.canUpload) {
      return NextResponse.json(
        { error: "Você não tem permissão para fazer upload" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { fileName, fileSize, fileType } = body;

    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { error: "fileName, fileSize e fileType são obrigatórios" },
        { status: 400 },
      );
    }

    // Check storage limit for orphan files
    console.log("📊 [PRESIGNED] Checking storage limit...");

    // 1. Get the system storage limit
    const systemSettings = await prisma.systemSettings.findFirst();
    const limitGb = systemSettings?.orphanFilesLimitGb || 5;
    const limitBytes = limitGb * 1024 * 1024 * 1024; // Convert GB to bytes

    console.log(`⚙️ [PRESIGNED] Storage limit: ${limitGb}GB (${limitBytes} bytes)`);

    // 2. Calculate how much storage user is currently using (orphan files only)
    const orphanFilesSize = await prisma.pendingUpload.aggregate({
      where: {
        userId: session.user.id,
        status: 'UPLOADED' // Only count files that are uploaded but not in projects yet
      },
      _sum: {
        fileSize: true
      }
    });

    const currentUsageBytes = Number(orphanFilesSize._sum.fileSize || 0);
    const newTotalBytes = currentUsageBytes + fileSize;

    const currentUsageGb = (currentUsageBytes / (1024 * 1024 * 1024)).toFixed(2);
    const newTotalGb = (newTotalBytes / (1024 * 1024 * 1024)).toFixed(2);

    console.log(`💾 [PRESIGNED] Current usage: ${currentUsageGb}GB, After upload: ${newTotalGb}GB`);

    // 3. If adding this file would exceed the limit, reject it
   if (newTotalBytes > limitBytes) {
     console.log(
       `❌ [PRESIGNED] Storage limit exceeded: ${newTotalGb}GB > ${limitGb}GB`,
     );
     return NextResponse.json(
       {
         error: `Limite de armazenamento excedido. Entre em contato com o administrador para prosseguir ou tente novamente mais tarde.`,
         code: "STORAGE_LIMIT_EXCEEDED",
         currentUsage: parseFloat(currentUsageGb),
         limit: limitGb,
       },
       { status: 403 },
     );
   }

    console.log(`✅ [PRESIGNED] Storage check passed: ${newTotalGb}GB <= ${limitGb}GB`);

    const fileId = crypto.randomBytes(16).toString("hex");
    const fileExtension = fileName.split(".").pop();
    const fileKey = `pending/${session.user.id}/${fileId}.${fileExtension}`;

    console.log("🔑 [PRESIGNED] Generated file key:", fileKey);

    // ❌ REMOVE THIS ENTIRE BLOCK:
    // const command = new CreateMultipartUploadCommand({
    //   Bucket: R2_BUCKET,
    //   Key: fileKey,
    //   ContentType: fileType,
    // });
    //
    // const multipartUpload = await r2Client.send(command);
    //
    // if (!multipartUpload.UploadId) {
    //   throw new Error("Failed to create multipart upload");
    // }
    //
    // console.log("✅ [PRESIGNED] Multipart upload created:", multipartUpload.UploadId);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const pendingUpload = await prisma.pendingUpload.create({
      data: {
        userId: session.user.id,
        fileName,
        fileSize,
        fileKey,
        fileType,
        status: "UPLOADING",
        expiresAt,
      },
    });

    console.log("💾 [PRESIGNED] Created pending upload:", pendingUpload.id);

    return NextResponse.json({
      success: true,
      // ❌ REMOVE: uploadId: multipartUpload.UploadId,
      fileKey,
      pendingUploadId: pendingUpload.id,
      bucket: R2_BUCKET,
      region: "auto",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      endpoint: process.env.R2_ENDPOINT!,
    });
  } catch (error) {
    console.error("💥 [PRESIGNED] Error:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar upload" },
      { status: 500 },
    );
  }
}
