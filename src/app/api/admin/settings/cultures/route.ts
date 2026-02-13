import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const cultures = await prisma.cultureConfig.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ cultures });
  } catch (error) {
    console.error("Error fetching cultures:", error);
    return NextResponse.json(
      { error: "Erro ao buscar culturas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const { cultures } = body;

    if (!Array.isArray(cultures)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Delete all existing cultures and create new ones
    await prisma.$transaction(async (tx) => {
      await tx.cultureConfig.deleteMany();

      await tx.cultureConfig.createMany({
        data: cultures.map((c: { key: string; label: string }) => ({
          key: c.key,
          label: c.label,
        })),
      });
    });

    const updatedCultures = await prisma.cultureConfig.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      cultures: updatedCultures
    });
  } catch (error) {
    console.error("Error saving cultures:", error);
    return NextResponse.json(
      { error: "Erro ao salvar culturas" },
      { status: 500 }
    );
  }
}
