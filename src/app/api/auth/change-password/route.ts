import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Parse request body
    const { currentPassword, newPassword } = await req.json();

    // 3. Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      );
    }

    // 4. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // 5. Verify user has a password (not OAuth-only)
    if (!user.password) {
      return NextResponse.json(
        { error: "Usuário não possui senha configurada" },
        { status: 400 }
      );
    }

    // 6. Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 }
      );
    }

    // 7. Check if new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return NextResponse.json(
        { error: "A nova senha deve ser diferente da senha atual" },
        { status: 400 }
      );
    }

    // 8. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 9. Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 10. Create audit log
    await prisma.auditLog.create({
      data: {
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: user.id,
        userId: user.id,
        metadata: {
          userEmail: user.email,
        },
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Erro ao alterar senha" },
      { status: 500 }
    );
  }
}
