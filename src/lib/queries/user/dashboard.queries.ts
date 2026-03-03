import { prisma } from "@/lib/prisma";

interface Stats {
  projects: { thisMonth: number; allTime: number };
  area: { thisMonth: number; allTime: number };
  balanceToPay: number;
}

interface Project {
  id: string;
  name: string;
  projectTypes: string[]; // Changed to array
  culture: string;
  status: string;
  area: string | null;
  price: string;
  userName: string;
  userEmail: string;
  filesCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Get dashboard statistics (projects, area, balance)
 */
export async function getDashboardStats(
  userId: string,
  isAdmin: boolean,
): Promise<Stats> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const baseWhere = isAdmin ? {} : { userId };

  const [
    projectsThisMonth,
    projectsAllTime,
    areaThisMonth,
    areaAllTime,
    balanceToPay,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        ...baseWhere,
        status: "COMPLETED",
        completedAt: { gte: firstDayOfMonth },
      },
    }),
    prisma.project.count({
      where: { ...baseWhere, status: "COMPLETED" },
    }),
    prisma.project.aggregate({
      where: {
        ...baseWhere,
        status: "COMPLETED",
        completedAt: { gte: firstDayOfMonth },
        areaProcessed: { not: null },
      },
      _sum: { areaProcessed: true },
    }),
    prisma.project.aggregate({
      where: {
        ...baseWhere,
        status: "COMPLETED",
        areaProcessed: { not: null },
      },
      _sum: { areaProcessed: true },
    }),
    prisma.project.aggregate({
      where: { ...baseWhere, status: "COMPLETED", isPaid: false },
      _sum: { price: true },
    }),
  ]);

  return {
    projects: {
      thisMonth: projectsThisMonth,
      allTime: projectsAllTime,
    },
    area: {
      thisMonth: Number(areaThisMonth._sum.areaProcessed || 0),
      allTime: Number(areaAllTime._sum.areaProcessed || 0),
    },
    balanceToPay: Number(balanceToPay._sum.price || 0),
  };
}

/**
 * Get paginated projects list
 */
export async function getProjects(
  userId: string,
  isAdmin: boolean,
  page = 1,
  limit = 10,
): Promise<{ projects: Project[]; pagination: Pagination }> {
  const skip = (page - 1) * limit;
  const whereClause = isAdmin ? {} : { userId };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { files: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where: whereClause }),
  ]);

  const formattedProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    projectTypes: (project as any).projectTypes || [], // Changed to array
    culture: project.culture,
    status: project.status,
    area: project.areaProcessed?.toString() ?? null,
    price: project.price.toString(),
    filesCount: project._count.files,
    userName: project.user.name,
    userEmail: project.user.email,
    createdAt: project.createdAt.toISOString(),
  }));

  return {
    projects: formattedProjects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all dashboard data in one call
 */
export async function getDashboardData(userId: string, isAdmin: boolean) {
  const [stats, projectsData] = await Promise.all([
    getDashboardStats(userId, isAdmin),
    getProjects(userId, isAdmin),
  ]);

  return { stats, ...projectsData };
}
