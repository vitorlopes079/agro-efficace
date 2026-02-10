// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        notes: true,
        canUpload: true,
        invitedAt: true,
        lastLoginAt: true,
        createdAt: true,
        invitedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Format dates for display
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      notes: user.notes,
      canUpload: user.canUpload,
      invitedBy: user.invitedBy,
      invitedAt: user.invitedAt
        ? new Date(user.invitedAt).toLocaleDateString("pt-BR")
        : null,
      lastLoginAt: user.lastLoginAt
        ? new Date(user.lastLoginAt).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : null,
      createdAt: new Date(user.createdAt).toLocaleDateString("pt-BR"),
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}
