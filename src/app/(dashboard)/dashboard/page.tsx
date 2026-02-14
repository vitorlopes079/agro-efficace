import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardStats from "@/components/ui/DashboardStats";
import ProjectsSection from "@/components/ui/Projectssection";
import { getDashboardData } from "@/lib/queries/user/dashboard.queries";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Fetch all dashboard data in one clean call
  const { stats, projects, pagination } = await getDashboardData(
    session.user.id,
    isAdmin,
  );

  return (
    <main className="mx-auto max-w-350 px-6 py-8 space-y-8">
      <DashboardStats stats={stats} isLoading={false} />

      <ProjectsSection
        initialProjects={projects}
        initialPagination={pagination}
      />
    </main>
  );
}
