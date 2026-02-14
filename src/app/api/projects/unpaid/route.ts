import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/projects/unpaid
 * Returns list of completed, unpaid projects for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        isPaid: false,
      },
      select: {
        id: true,
        name: true,
        projectType: true,
        culture: true,
        status: true,
        price: true,
        areaProcessed: true,
        completedAt: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      projectType: project.projectType,
      culture: project.culture,
      status: project.status,
      price: project.price.toString(),
      area: project.areaProcessed?.toString() ?? null,
      completedAt: project.completedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      projects: formattedProjects,
    });
  } catch (error) {
    console.error("Error fetching unpaid projects:", error);
    return NextResponse.json(
      { error: "Erro ao buscar projetos" },
      { status: 500 },
    );
  }
}
