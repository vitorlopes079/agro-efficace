// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Date calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total Revenue (from completed AND paid projects)
    const totalRevenueResult = await prisma.project.aggregate({
      where: {
        status: "COMPLETED",
        isPaid: true,
      },
      _sum: {
        price: true,
      },
    });

    // 2. Active Users (users with project activity in last 30 days)
    const activeUsers = await prisma.user.count({
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
    });

    // 3. New Users This Week
    const newUsersThisWeek = await prisma.user.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // 4. Total Projects (all time)
    const totalProjects = await prisma.project.count();

    // 5. Projects This Month
    const projectsThisMonth = await prisma.project.count({
      where: {
        createdAt: { gte: firstDayOfMonth },
      },
    });

    // 6. Monthly Revenue (last 6 months) - FIXED VERSION
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    console.log("[DEBUG] sixMonthsAgo:", sixMonthsAgo.toISOString());
    console.log("[DEBUG] now:", now.toISOString());

    // DEBUG: Check how many COMPLETED & paid projects exist at all
    const allPaidCount = await prisma.project.count({
      where: {
        status: "COMPLETED",
        isPaid: true,
      },
    });
    console.log(
      "[DEBUG] Total COMPLETED & paid projects (all time):",
      allPaidCount,
    );

    // DEBUG: Check how many have a completedAt date
    const withCompletedAt = await prisma.project.count({
      where: {
        status: "COMPLETED",
        isPaid: true,
        completedAt: { not: null },
      },
    });
    console.log(
      "[DEBUG] COMPLETED & paid with non-null completedAt:",
      withCompletedAt,
    );

    // DEBUG: Check how many have completedAt >= sixMonthsAgo
    const withCompletedAtInRange = await prisma.project.count({
      where: {
        status: "COMPLETED",
        isPaid: true,
        completedAt: { gte: sixMonthsAgo },
      },
    });
    console.log(
      "[DEBUG] COMPLETED & paid with completedAt >= sixMonthsAgo:",
      withCompletedAtInRange,
    );

    // Get all completed & paid projects from last 6 months
    const paidProjects = await prisma.project.findMany({
      where: {
        status: "COMPLETED",
        isPaid: true,
        completedAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        completedAt: true,
        price: true,
      },
    });

    console.log("[DEBUG] paidProjects count:", paidProjects.length);
    console.log(
      "[DEBUG] paidProjects sample (first 5):",
      paidProjects.slice(0, 5).map((p) => ({
        completedAt: p.completedAt,
        price: p.price?.toString(),
      })),
    );

    // Group by month manually
    const monthlyRevenueMap = new Map<string, number>();

    paidProjects.forEach((project) => {
      if (project.completedAt) {
        const monthKey = `${project.completedAt.getFullYear()}-${project.completedAt.getMonth()}`;
        const currentRevenue = monthlyRevenueMap.get(monthKey) || 0;
        const priceAsNumber = project.price.toNumber();
        console.log("[DEBUG] Project:", {
          monthKey,
          priceAsNumber,
          completedAt: project.completedAt,
        });
        monthlyRevenueMap.set(monthKey, currentRevenue + priceAsNumber);
      } else {
        console.log("[DEBUG] Project has null completedAt, skipping");
      }
    });

    console.log(
      "[DEBUG] monthlyRevenueMap entries:",
      Object.fromEntries(monthlyRevenueMap),
    );

    // Format monthly revenue data for last 6 months
    const monthlyRevenueData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      const monthName = monthDate.toLocaleDateString("pt-BR", {
        month: "short",
      });

      const monthRevenue = monthlyRevenueMap.get(monthKey) || 0;

      console.log("[DEBUG] Month lookup:", {
        i,
        monthKey,
        monthRevenue,
        monthName,
      });

      monthlyRevenueData.push({
        mes: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        receita: monthRevenue,
      });
    }

    console.log("[DEBUG] Final monthlyRevenueData:", monthlyRevenueData);

    // 7. Revenue by Culture
    const revenueByCulture = await prisma.project.groupBy({
      by: ["culture"],
      where: {
        status: "COMPLETED",
        isPaid: true,
      },
      _sum: {
        price: true,
      },
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
      .sort((a, b) => b.valor - a.valor); // Sort by highest revenue

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
