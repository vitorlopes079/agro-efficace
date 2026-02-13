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

    const userId = session.user.id;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const projectsAllTime = await prisma.project.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    });

    const projectsThisMonth = await prisma.project.count({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    const areaAllTimeResult = await prisma.project.aggregate({
      where: {
        userId,
        status: "COMPLETED",
      },
      _sum: {
        areaProcessed: true,
      },
    });

    const areaThisMonthResult = await prisma.project.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: {
          gte: firstDayOfMonth,
        },
      },
      _sum: {
        areaProcessed: true,
      },
    });

    // Balance to pay (sum of price from COMPLETED projects where isPaid = false)
    // This is always all time, not filtered by month
    const balanceResult = await prisma.project.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        isPaid: false,
      },
      _sum: {
        price: true,
      },
    });

    return NextResponse.json({
      projects: {
        thisMonth: projectsThisMonth,
        allTime: projectsAllTime,
      },
      area: {
        thisMonth: areaThisMonthResult._sum.areaProcessed?.toNumber() || 0,
        allTime: areaAllTimeResult._sum.areaProcessed?.toNumber() || 0,
      },
      balanceToPay: balanceResult._sum.price?.toNumber() || 0,
    });
  } catch (error) {
    console.error("[STATS API] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 },
    );
  }
}
