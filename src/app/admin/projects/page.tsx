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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="mt-1 text-sm text-zinc-400">
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
