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

    const projectTypes = await prisma.projectTypeConfig.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ projectTypes });
  } catch (error) {
    console.error("Error fetching project types:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tipos de projeto" },
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
    const { projectTypes } = body;

    if (!Array.isArray(projectTypes)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Delete all existing project types and create new ones
    await prisma.$transaction(async (tx) => {
      await tx.projectTypeConfig.deleteMany();

      await tx.projectTypeConfig.createMany({
        data: projectTypes.map((pt: { key: string; label: string }) => ({
          key: pt.key,
          label: pt.label,
        })),
      });
    });

    const updatedProjectTypes = await prisma.projectTypeConfig.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      projectTypes: updatedProjectTypes
    });
  } catch (error) {
    console.error("Error saving project types:", error);
    return NextResponse.json(
      { error: "Erro ao salvar tipos de projeto" },
      { status: 500 }
    );
  }
}
