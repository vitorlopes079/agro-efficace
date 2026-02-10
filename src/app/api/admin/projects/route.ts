// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectStatus } from "@/generated/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ProjectStatus | null;

    // Build where clause
    const where = status ? { status } : {};

    // Fetch projects with user info
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        projectType: true,
        culture: true,
        status: true,
        notes: true,
        createdAt: true,
        completedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get counts by status for tabs
    const statusCounts = await prisma.project.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const counts = {
      all: projects.length,
      PROCESSING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    statusCounts.forEach((item) => {
      counts[item.status] = item._count.status;
    });

    // If we're filtering, recalculate "all" from the grouped counts
    if (!status) {
      counts.all = Object.values(counts).reduce((a, b) => a + b, 0) - counts.all;
    }

    // Format projects
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      projectType: project.projectType,
      culture: project.culture,
      status: project.status,
      notes: project.notes,
      owner: {
        id: project.user.id,
        name: project.user.name,
        email: project.user.email,
      },
      filesCount: project._count.files,
      createdAt: new Date(project.createdAt).toLocaleDateString("pt-BR"),
      completedAt: project.completedAt
        ? new Date(project.completedAt).toLocaleDateString("pt-BR")
        : null,
    }));

    return NextResponse.json({
      projects: formattedProjects,
      counts,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Erro ao buscar projetos" },
      { status: 500 }
    );
  }
}
