// src/app/api/admin/users/[id]/ban/route.ts
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

    // Prevent admin from banning themselves
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Você não pode banir a si mesmo" },
        { status: 400 }
      );
    }

    // Get current user status
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { status: true, name: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Toggle between SUSPENDED and ACTIVE
    const newStatus = currentUser.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const newCanUpload = newStatus === "ACTIVE"; // If unbanning, restore upload permission

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: newStatus,
        // When banning, also disable uploads
        ...(newStatus === "SUSPENDED" && { canUpload: false }),
      },
      select: {
        id: true,
        status: true,
        canUpload: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: newStatus === "SUSPENDED" ? "USER_BANNED" : "USER_UNBANNED",
        entityType: "User",
        entityId: id,
        metadata: {
          targetUserName: currentUser.name,
          previousStatus: currentUser.status,
          newStatus: newStatus,
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message:
        newStatus === "SUSPENDED"
          ? "Usuário banido com sucesso"
          : "Usuário desbanido com sucesso",
    });
  } catch (error) {
    console.error("Error banning/unbanning user:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do usuário" },
      { status: 500 }
    );
  }
}
