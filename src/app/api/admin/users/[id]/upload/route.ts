// src/app/api/admin/users/[id]/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { canUpload: true, status: true, name: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Can't toggle upload for suspended users
    if (currentUser.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Não é possível alterar permissões de um usuário banido" },
        { status: 400 }
      );
    }

    // Toggle canUpload
    const newCanUpload = !currentUser.canUpload;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { canUpload: newCanUpload },
      select: {
        id: true,
        canUpload: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: newCanUpload ? "USER_UPLOAD_ENABLED" : "USER_UPLOAD_DISABLED",
        entityType: "User",
        entityId: id,
        metadata: {
          targetUserName: currentUser.name,
          previousCanUpload: currentUser.canUpload,
          newCanUpload: newCanUpload,
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: newCanUpload
        ? "Permissão de envio ativada"
        : "Permissão de envio desativada",
    });
  } catch (error) {
    console.error("Error toggling upload permission:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar permissão de envio" },
      { status: 500 }
    );
  }
}
