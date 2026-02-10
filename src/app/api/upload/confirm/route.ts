// src/app/api/upload/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  console.log("🚀 [CONFIRM UPLOAD] Starting upload confirmation...");

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { pendingUploadId } = body;

    if (!pendingUploadId) {
      return NextResponse.json(
        { error: "pendingUploadId é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar se o upload pertence ao usuário
    const pendingUpload = await prisma.pendingUpload.findUnique({
      where: { id: pendingUploadId },
    });

    if (!pendingUpload) {
      return NextResponse.json(
        { error: "Upload não encontrado" },
        { status: 404 },
      );
    }

    if (pendingUpload.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para confirmar este upload" },
        { status: 403 },
      );
    }

    // Atualizar status para UPLOADED
    await prisma.pendingUpload.update({
      where: { id: pendingUploadId },
      data: { status: "UPLOADED" },
    });

    console.log("✅ [CONFIRM UPLOAD] Upload confirmed:", pendingUploadId);

    return NextResponse.json({
      success: true,
      message: "Upload confirmado com sucesso",
    });
  } catch (error) {
    console.error("💥 [CONFIRM UPLOAD] Error:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar upload" },
      { status: 500 },
    );
  }
}
