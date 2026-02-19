import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ===== CACHE LAYER =====
interface CachedMonth {
  monthKey: string;
  revenue: number;
  cachedAt: number;
}

const monthlyRevenueCache = new Map<string, CachedMonth>();
const PAST_MONTH_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_MONTH_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedRevenue(monthKey: string, isCurrent: boolean): number | null {
  const cached = monthlyRevenueCache.get(monthKey);
  if (!cached) return null;

  const ttl = isCurrent ? CURRENT_MONTH_TTL : PAST_MONTH_TTL;
  const isExpired = Date.now() - cached.cachedAt > ttl;

  if (isExpired) {
    monthlyRevenueCache.delete(monthKey);
    return null;
  }

  return cached.revenue;
}

function setCachedRevenue(monthKey: string, revenue: number) {
  monthlyRevenueCache.set(monthKey, {
    monthKey,
    revenue,
    cachedAt: Date.now(),
  });
}

// ===== MAIN ROUTE =====
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run basic stats in parallel
    const [
      totalRevenueResult,
      activeUsers,
      newUsersThisWeek,
      totalProjects,
      projectsThisMonth,
    ] = await Promise.all([
      // 1. Total Revenue
      prisma.project.aggregate({
        where: { status: "COMPLETED", isPaid: true },
        _sum: { price: true },
      }),

      // 2. Active Users
      prisma.user.count({
        where: {
          projects: {
            some: {
              OR: [
                { createdAt: { gte: thirtyDaysAgo } },
                { updatedAt: { gte: thirtyDaysAgo } },
              ],
            },
          },
        },
      }),

      // 3. New Users This Week
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // 4. Total Projects
      prisma.project.count(),

      // 5. Projects This Month
      prisma.project.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
    ]);

    // ===== OPTIMIZED MONTHLY REVENUE WITH CACHING =====
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const monthlyRevenueData = [];
    const monthsToFetch: string[] = [];

    // Check cache for each of the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      const isCurrent = monthKey === currentMonthKey;

      const cachedRevenue = getCachedRevenue(monthKey, isCurrent);

      if (cachedRevenue !== null) {
        // Use cached value
        const monthName = monthDate.toLocaleDateString("pt-BR", {
          month: "short",
        });
        monthlyRevenueData.push({
          mes: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          receita: cachedRevenue,
        });
      } else {
        // Need to fetch from DB
        monthsToFetch.push(monthKey);
      }
    }

    // Fetch only uncached months from database
    if (monthsToFetch.length > 0) {

      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const paidProjects = await prisma.project.findMany({
        where: {
          status: "COMPLETED",
          isPaid: true,
          completedAt: { gte: sixMonthsAgo },
        },
        select: {
          completedAt: true,
          price: true,
        },
      });

      // Group by month
      const monthlyRevenueMap = new Map<string, number>();
      paidProjects.forEach((project) => {
        if (project.completedAt) {
          const monthKey = `${project.completedAt.getFullYear()}-${project.completedAt.getMonth()}`;
          const currentRevenue = monthlyRevenueMap.get(monthKey) || 0;
          monthlyRevenueMap.set(
            monthKey,
            currentRevenue + project.price.toNumber(),
          );
        }
      });

      // Cache the results
      for (const monthKey of monthsToFetch) {
        const revenue = monthlyRevenueMap.get(monthKey) || 0;
        const isCurrent = monthKey === currentMonthKey;
        setCachedRevenue(monthKey, revenue);

        // Find the month date for formatting
        const [year, month] = monthKey.split("-").map(Number);
        const monthDate = new Date(year, month, 1);
        const monthName = monthDate.toLocaleDateString("pt-BR", {
          month: "short",
        });

        monthlyRevenueData.push({
          mes: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          receita: revenue,
        });

              }
    }

    // Sort by month order (oldest to newest)
    monthlyRevenueData.sort((a, b) => {
      const months = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      return months.indexOf(a.mes) - months.indexOf(b.mes);
    });

    // ===== REVENUE BY CULTURE (no caching needed - changes frequently) =====
    const revenueByCulture = await prisma.project.groupBy({
      by: ["culture"],
      where: { status: "COMPLETED", isPaid: true },
      _sum: { price: true },
    });

    const totalRevenue = totalRevenueResult._sum.price?.toNumber() || 0;

    const revenueByCultureData = revenueByCulture
      .map((item) => {
        const valor = item._sum.price?.toNumber() || 0;
        const porcentagem =
          totalRevenue > 0 ? Math.round((valor / totalRevenue) * 100) : 0;
        return {
          cultura: item.culture,
          valor,
          porcentagem,
        };
      })
      .sort((a, b) => b.valor - a.valor);

    return NextResponse.json({
      totalRevenue,
      activeUsers,
      newUsersThisWeek,
      totalProjects,
      projectsThisMonth,
      monthlyRevenue: monthlyRevenueData,
      revenueByCulture: revenueByCultureData,
    });
  } catch (error) {
    console.error("[ADMIN STATS API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 },
    );
  }
}
