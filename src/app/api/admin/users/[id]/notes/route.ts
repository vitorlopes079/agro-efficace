// src/app/api/admin/users/[id]/notes/route.ts
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
    const body = await req.json();
    const { notes } = body;

    // Check if user exists
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { notes: notes || null },
      select: {
        id: true,
        notes: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Observações atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Error updating notes:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar observações" },
      { status: 500 }
    );
  }
}
