import { prisma } from "@/lib/prisma";

interface MonthlyRevenue {
  mes: string;
  receita: number;
}

interface CultureRevenue {
  cultura: string;
  valor: number;
  porcentagem: number;
}

export interface AdminStats {
  totalRevenue: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalProjects: number;
  projectsThisMonth: number;
  monthlyRevenue: MonthlyRevenue[];
  revenueByCulture: CultureRevenue[];
}

export interface StatusCounts {
  all: number;
  PENDING: number;
  PROCESSING: number;
  COMPLETED: number;
  CANCELLED: number;
  archived: number;
}

type ProjectStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

interface AdminProject {
  id: string;
  name: string;
  projectTypes: string[]; // Changed to array
  culture: string;
  status: string;
  notes: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  area: string | null;
  price: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  filesCount: number;
  createdAt: string;
  completedAt: string | null;
}

// Simple in-memory cache
let statsCache: {
  data: AdminStats | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get admin dashboard statistics with caching
 */
export async function getAdminStats(): Promise<AdminStats> {
  const now = Date.now();

  // Return cached data if still valid
  if (statsCache.data && now - statsCache.timestamp < CACHE_TTL) {
    return statsCache.data;
  }

  // Otherwise fetch fresh data
  const currentDate = new Date();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(
    currentDate.getTime() - 30 * 24 * 60 * 60 * 1000,
  );
  const sixMonthsAgo = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 6,
    1,
  );

  const [
    totalRevenue,
    activeUsers,
    newUsersThisWeek,
    totalProjects,
    projectsThisMonth,
    monthlyRevenueData,
    revenueByCultureData,
  ] = await Promise.all([
    // Total revenue from paid projects
    prisma.project.aggregate({
      where: { isPaid: true, status: "COMPLETED" },
      _sum: { price: true },
    }),

    // Active users (created project in last 30 days)
    prisma.user.count({
      where: {
        projects: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    }),

    // New users this week
    prisma.user.count({
      where: {
        createdAt: { gte: oneWeekAgo },
      },
    }),

    // Total projects
    prisma.project.count(),

    // Projects this month
    prisma.project.count({
      where: {
        createdAt: { gte: firstDayOfMonth },
      },
    }),

    // Monthly revenue (last 6 months)
    prisma.$queryRaw<Array<{ month: Date; revenue: number }>>`
      SELECT 
        DATE_TRUNC('month', "paidAt") as month,
        SUM(price) as revenue
      FROM "projects"
      WHERE "isPaid" = true
        AND "status" = 'COMPLETED'
        AND "paidAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "paidAt")
      ORDER BY month ASC
    `,

    // Revenue by culture
    prisma.$queryRaw<Array<{ culture: string; revenue: number }>>`
      SELECT 
        culture,
        SUM(price) as revenue
      FROM "projects"
      WHERE "isPaid" = true
        AND "status" = 'COMPLETED'
      GROUP BY culture
      ORDER BY revenue DESC
    `,
  ]);

  // Generate all 6 months with zero revenue for missing months
  const monthlyRevenue: MonthlyRevenue[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1,
    );

    // Find revenue for this month in the query results
    const revenueData = monthlyRevenueData.find((item) => {
      const itemDate = new Date(item.month);
      return (
        itemDate.getFullYear() === date.getFullYear() &&
        itemDate.getMonth() === date.getMonth()
      );
    });

    monthlyRevenue.push({
      mes: date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      }),
      receita: revenueData ? Number(revenueData.revenue) : 0,
    });
  }

  // Calculate total for percentage
  const totalCultureRevenue = revenueByCultureData.reduce(
    (sum, item) => sum + Number(item.revenue),
    0,
  );

  // Format revenue by culture with percentages
  const revenueByCulture: CultureRevenue[] = revenueByCultureData.map(
    (item) => {
      const valor = Number(item.revenue);
      return {
        cultura: item.culture,
        valor: valor,
        porcentagem:
          totalCultureRevenue > 0
            ? Number(((valor / totalCultureRevenue) * 100).toFixed(2))
            : 0,
      };
    },
  );

  const stats = {
    totalRevenue: Number(totalRevenue._sum.price || 0),
    activeUsers,
    newUsersThisWeek,
    totalProjects,
    projectsThisMonth,
    monthlyRevenue,
    revenueByCulture,
  };

  // Update cache
  statsCache = {
    data: stats,
    timestamp: now,
  };

  return stats;
}

/**
 * Manually invalidate the stats cache
 * Call this when a project is completed/paid to refresh stats immediately
 */
export function invalidateStatsCache() {
  statsCache = {
    data: null,
    timestamp: 0,
  };
}

/**
 * Get status counts for admin projects page
 */
export async function getAdminProjectCounts(): Promise<StatusCounts> {
  const [all, pending, processing, completed, cancelled, archived] =
    await Promise.all([
      prisma.project.count({ where: { isArchived: false } }),
      prisma.project.count({
        where: { status: "PENDING", isArchived: false },
      }),
      prisma.project.count({
        where: { status: "PROCESSING", isArchived: false },
      }),
      prisma.project.count({
        where: { status: "COMPLETED", isArchived: false },
      }),
      prisma.project.count({
        where: { status: "CANCELLED", isArchived: false },
      }),
      prisma.project.count({ where: { isArchived: true } }),
    ]);

  return {
    all,
    PENDING: pending,
    PROCESSING: processing,
    COMPLETED: completed,
    CANCELLED: cancelled,
    archived,
  };
}

/**
 * Get admin projects with optional status filter
 */
export async function getAdminProjects(
  status?: ProjectStatus | "archived",
  page = 1,
  limit = 10,
) {
  const skip = (page - 1) * limit;

  // Build where clause based on status
  const whereClause: {
    isArchived?: boolean;
    status?: ProjectStatus;
  } = {};

  if (status === "archived") {
    whereClause.isArchived = true;
  } else if (status) {
    whereClause.status = status;
    whereClause.isArchived = false;
  } else {
    whereClause.isArchived = false;
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: whereClause,
      include: {
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
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where: whereClause }),
  ]);

  const formattedProjects: AdminProject[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    projectTypes: (project as any).projectTypes || [], // Changed to array
    culture: project.culture,
    status: project.status,
    notes: project.notes,
    isArchived: project.isArchived,
    archivedAt: project.archivedAt?.toISOString() ?? null,
    area: project.areaProcessed?.toString() ?? null,
    price: project.price.toString(),
    owner: {
      id: project.user.id,
      name: project.user.name,
      email: project.user.email,
    },
    filesCount: project._count.files,
    createdAt: new Date(project.createdAt).toLocaleDateString("pt-BR"),
    completedAt: project.completedAt?.toISOString() ?? null,
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
