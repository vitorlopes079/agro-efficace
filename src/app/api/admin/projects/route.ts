import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectStatus } from "@/generated/client";

const DEFAULT_PAGE_SIZE = 10;

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
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(
      1,
      Math.min(
        100,
        parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10),
      ),
    );
    const skip = (page - 1) * limit;


    // Check if requesting archived projects
    const isArchivedTab = statusParam === "archived";

    // Build where clause
    const where: any = isArchivedTab
      ? { isArchived: true }
      : {
          isArchived: false,
          ...(statusParam && statusParam !== "all"
            ? { status: statusParam as ProjectStatus }
            : {}),
        };

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ];

      // Check if search matches any Culture enum value
      const cultures = [
        "CANA",
        "MILHO",
        "SOJA",
        "EUCALIPTO",
        "CAFE",
        "ALGODAO",
      ];
      const matchingCulture = cultures.find((c) =>
        c.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      if (matchingCulture) {
        where.OR.push({ culture: matchingCulture });
      }

      // Check if search matches any ProjectType enum value
      const projectTypes = ["DANINHAS", "FALHAS", "RESTITUICAO", "MAPEAMENTO"];
      const matchingProjectType = projectTypes.find((pt) =>
        pt.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      if (matchingProjectType) {
        where.OR.push({ projectType: matchingProjectType });
      }
    }


    // Get total count for current filter
    const filteredTotal = await prisma.project.count({ where });

    // Fetch projects with user info and pagination
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        projectType: true,
        culture: true,
        status: true,
        notes: true,
        isArchived: true,
        archivedAt: true,
        areaProcessed: true,
        price: true,
        createdAt: true,
        completedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get counts by status (excluding archived)
    const statusCounts = await prisma.project.groupBy({
      by: ["status"],
      where: {
        isArchived: false,
      },
      _count: {
        status: true,
      },
    });

    // Get archived count separately
    const archivedCount = await prisma.project.count({
      where: {
        isArchived: true,
      },
    });

    // Build counts object
    const counts = {
      all: 0,
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      archived: archivedCount,
    };

    // Populate status counts (excluding archived)
    statusCounts.forEach((item) => {
      counts[item.status] = item._count.status;
    });

    // Calculate "all" count (all non-archived projects)
    counts.all =
      counts.PENDING + counts.PROCESSING + counts.COMPLETED + counts.CANCELLED;

    // Format projects
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      projectType: project.projectType,
      culture: project.culture,
      status: project.status,
      notes: project.notes,
      isArchived: project.isArchived,
      archivedAt: project.archivedAt
        ? new Date(project.archivedAt).toLocaleDateString("pt-BR")
        : null,
      area: project.areaProcessed ? project.areaProcessed.toString() : null,
      price: project.price.toString(),
      owner: {
        id: project.user.id,
        name: project.user.name,
        email: project.user.email,
      },
      createdAt: new Date(project.createdAt).toLocaleDateString("pt-BR"),
      completedAt: project.completedAt
        ? new Date(project.completedAt).toLocaleDateString("pt-BR")
        : null,
    }));

    const totalPages = Math.ceil(filteredTotal / limit);

    
    return NextResponse.json({
      projects: formattedProjects,
      counts,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Erro ao buscar projetos" },
      { status: 500 },
    );
  }
}
