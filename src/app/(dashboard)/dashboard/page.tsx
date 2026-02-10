"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, SearchInput, StatCard, StatusBadge } from "@/components/ui";

const GridIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
  </svg>
);

const MapPinIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CurrencyIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 18V6" />
  </svg>
);

interface Project {
  id: string;
  name: string;
  projectType: string;
  culture: string;
  status: string;
  filesCount: number;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: "amber" | "green" | "red" }> = {
  PROCESSING: { label: "Em andamento", variant: "amber" },
  COMPLETED: { label: "Concluído", variant: "green" },
  CANCELLED: { label: "Cancelado", variant: "red" },
};

const columns = [
  {
    key: "id",
    header: "ID",
    render: (project: Project) => (
      <span className="text-sm font-medium text-zinc-500">
        #{project.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: "name",
    header: "Nome",
    render: (project: Project) => (
      <div>
        <p className="text-sm font-medium text-white">{project.name}</p>
        <p className="text-xs text-zinc-500">{project.projectType}</p>
      </div>
    ),
  },
  {
    key: "culture",
    header: "Cultura",
    render: (project: Project) => (
      <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
        {project.culture}
      </span>
    ),
  },
  {
    key: "filesCount",
    header: "Arquivos",
    render: (project: Project) => (
      <span className="text-sm text-zinc-300">{project.filesCount}</span>
    ),
  },
  {
    key: "createdAt",
    header: "Data",
    render: (project: Project) => (
      <span className="text-sm text-zinc-500">
        {new Date(project.createdAt).toLocaleDateString("pt-BR")}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (project: Project) => {
      const config = statusConfig[project.status as keyof typeof statusConfig];
      return <StatusBadge label={config.label} variant={config.variant} />;
    },
  },
];

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    projectsThisMonth: 0,
    areaProcessed: 0,
    balanceToPay: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects);

        const totalProjects = data.projects.length;
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        const projectsThisMonth = data.projects.filter((p: Project) => {
          const projectDate = new Date(p.createdAt);
          return (
            projectDate.getMonth() === thisMonth &&
            projectDate.getFullYear() === thisYear
          );
        }).length;

        setStats({
          totalProjects,
          projectsThisMonth,
          areaProcessed: 0,
          balanceToPay: 0,
        });
      } else {
        console.error("Error fetching projects:", data.error);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-zinc-400">Carregando projetos...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      {/* Search */}
      <div className="mb-8">
        <SearchInput placeholder="Buscar projeto, cultura..." />
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total de Projetos"
          value={stats.totalProjects}
          icon={<GridIcon />}
          iconColor="blue"
          trend={{
            value: `${stats.projectsThisMonth}`,
            label: "neste mês",
          }}
        />
        <StatCard
          title="Área Processada"
          value={stats.areaProcessed}
          unit="ha"
          icon={<MapPinIcon />}
          iconColor="emerald"
        />
        <StatCard
          title="Saldo a Pagar"
          value={stats.balanceToPay}
          prefix="R$"
          icon={<CurrencyIcon />}
          iconColor="amber"
          action={{ label: "Ver detalhes" }}
        />
      </div>

      {/* Projects Table */}
      <DataTable
        title="Meus Projetos"
        columns={columns}
        data={projects}
        keyExtractor={(project) => project.id}
        actions={
          <>
            <button className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
              Filtrar
            </button>
            <button className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
              Exportar
            </button>
          </>
        }
        onRowClick={(project) => router.push(`/projects/${project.id}`)}
        rowAction={(project) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/projects/${project.id}`);
            }}
            className="rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-medium text-white opacity-0 transition-all hover:bg-zinc-700 group-hover:opacity-100"
          >
            Abrir
          </button>
        )}
        pagination={{
          showing: projects.length,
          total: projects.length,
          hasPrevious: false,
          hasNext: false,
        }}
      />
    </main>
  );
}
