import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import {
  getAdminProjects,
  getAdminProjectCounts,
} from "@/lib/queries/admin/dashboard.queries";
import { AdminProjectsTable } from "@/components/admin/dashboard";

export default async function AdminProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch initial data server-side
  const [projectsData, counts] = await Promise.all([
    getAdminProjects(), // all projects, page 1
    getAdminProjectCounts(),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Projetos</h1>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            {counts.all} projetos ativos • {counts.archived} arquivados
          </p>
        </div>
        <Link href="/projects/new">
          <Button>Novo Projeto</Button>
        </Link>
      </div>

      {/* Tabs + Search + Table */}
      <AdminProjectsTable
        initialProjects={projectsData.projects}
        initialPagination={projectsData.pagination}
        initialCounts={counts}
      />
    </div>
  );
}
