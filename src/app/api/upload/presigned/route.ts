import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
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

    // Check storage limit
    console.log("📊 [PRESIGNED] Checking storage limit...");
    const systemSettings = await prisma.systemSettings.findFirst();
    const limitGb = systemSettings?.orphanFilesLimitGb || 5;
    const limitBytes = limitGb * 1024 * 1024 * 1024;

    const orphanFilesSize = await prisma.pendingUpload.aggregate({
      where: { userId: session.user.id, status: "UPLOADED" },
      _sum: { fileSize: true },
    });

    const currentUsageBytes = Number(orphanFilesSize._sum.fileSize || 0);
    const newTotalBytes = currentUsageBytes + fileSize;
    const currentUsageGb = (currentUsageBytes / (1024 * 1024 * 1024)).toFixed(
      2,
    );
    const newTotalGb = (newTotalBytes / (1024 * 1024 * 1024)).toFixed(2);

    console.log(
      `💾 [PRESIGNED] Current: ${currentUsageGb}GB, After: ${newTotalGb}GB`,
    );

    if (newTotalBytes > limitBytes) {
      return NextResponse.json(
        {
          error: `Limite de armazenamento excedido. Entre em contato com o administrador.`,
          code: "STORAGE_LIMIT_EXCEEDED",
          currentUsage: parseFloat(currentUsageGb),
          limit: limitGb,
        },
        { status: 403 },
      );
    }

    // Generate file key
    const fileId = crypto.randomBytes(16).toString("hex");
    const fileExtension = fileName.split(".").pop();
    const fileKey = `files/${session.user.id}/${fileId}.${fileExtension}`;

    console.log("🔑 [PRESIGNED] Generated file key:", fileKey);

    // ✅ Create multipart upload on SERVER - never expose credentials
    const command = new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
      ContentType: fileType,
    });

    const multipartUpload = await r2Client.send(command);

    if (!multipartUpload.UploadId) {
      throw new Error("Failed to create multipart upload");
    }

    console.log(
      "✅ [PRESIGNED] Multipart upload created:",
      multipartUpload.UploadId,
    );

    // Create pending upload record
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

    // ✅ Return only uploadId - NO credentials!
    return NextResponse.json({
      success: true,
      uploadId: multipartUpload.UploadId,
      fileKey,
      pendingUploadId: pendingUpload.id,
    });
  } catch (error) {
    console.error("💥 [PRESIGNED] Error:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar upload" },
      { status: 500 },
    );
  }
}
