import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/lib/queries/admin/dashboard.queries";
import { AdminStats, AdminCharts } from "@/components/admin/dashboard";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all admin data server-side
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Painel Administrativo</h1>

      {/* Stats Cards */}
      <AdminStats
        stats={{
          totalRevenue: stats.totalRevenue,
          activeUsers: stats.activeUsers,
          newUsersThisWeek: stats.newUsersThisWeek,
          totalProjects: stats.totalProjects,
          projectsThisMonth: stats.projectsThisMonth,
        }}
        isLoading={false}
      />

      {/* Charts */}
      <AdminCharts
        monthlyRevenue={stats.monthlyRevenue}
        revenueByCulture={stats.revenueByCulture}
      />
    </div>
  );
}
