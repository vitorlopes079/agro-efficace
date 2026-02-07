// src/app/api/admin/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar logs com informações do usuário
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Últimos 100 logs
    });

    // Formatar dados
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      userName: log.user?.name || "Sistema",
      userEmail: log.user?.email || "-",
      entityType: log.entityType || "-",
      entityId: log.entityId || "-",
      metadata: log.metadata,
      ipAddress: log.ipAddress || "-",
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Erro ao buscar logs" }, { status: 500 });
  }
}
