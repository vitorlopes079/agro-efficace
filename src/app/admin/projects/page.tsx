// src/app/admin/projects/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, DataTable, StatusBadge } from "@/components/ui";
import {
  projectStatusConfig,
  projectTypeLabels,
  cultureLabels,
} from "@/components/project";
import { FolderOpen } from "lucide-react";

type ProjectStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
type ProjectType = "DANINHAS" | "FALHAS" | "RESTITUICAO" | "MAPEAMENTO";
type Culture = "CANA" | "MILHO" | "SOJA" | "EUCALIPTO" | "CAFE" | "ALGODAO";

interface Project {
  id: string;
  name: string;
  projectType: ProjectType;
  culture: Culture;
  status: ProjectStatus;
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

interface StatusCounts {
  all: number;
  PENDING: number;
  PROCESSING: number;
  COMPLETED: number;
  CANCELLED: number;
  archived: number;
}

type TabValue = "all" | ProjectStatus | "archived";

const tabs: { value: TabValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "PROCESSING", label: "Em andamento" },
  { value: "COMPLETED", label: "Concluídos" },
  { value: "CANCELLED", label: "Cancelados" },
  { value: "archived", label: "Arquivados" },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({
    all: 0,
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    archived: 0,
  });
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const statusParam = activeTab !== "all" ? `?status=${activeTab}` : "";
      const response = await fetch(`/api/admin/projects${statusParam}`);
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects);
        setCounts(data.counts);
      } else {
        console.error("Error fetching projects:", data.error);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (project: Project) => (
        <span className="text-sm text-zinc-500 font-mono">
          {project.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "name",
      header: "Projeto",
      render: (project: Project) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">{project.name}</p>
            {project.isArchived && (
              <StatusBadge label="Arquivado" variant="gray" />
            )}
          </div>
          <p className="text-xs text-zinc-500">
            {projectTypeLabels[project.projectType]} •{" "}
            {cultureLabels[project.culture]}
          </p>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Proprietário",
      render: (project: Project) => (
        <div>
          <p className="text-sm text-zinc-300">{project.owner.name}</p>
          <p className="text-xs text-zinc-500">{project.owner.email}</p>
        </div>
      ),
    },
    {
      key: "area",
      header: "Área",
      render: (project: Project) => (
        <span className="text-sm text-zinc-300">
          {project.area && parseFloat(project.area) > 0
            ? `${parseFloat(project.area).toFixed(2)} ha`
            : "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Valor",
      render: (project: Project) => (
        <span className="text-sm text-zinc-300">
          {project.price && parseFloat(project.price) > 0
            ? `R$ ${parseFloat(project.price).toFixed(2)}`
            : "—"}
        </span>
      ),
    },
    
    {
      key: "status",
      header: "Status",
      render: (project: Project) => {
        const config = projectStatusConfig[project.status] || {
          label: project.status,
          variant: "gray" as const,
        };
        return <StatusBadge label={config.label} variant={config.variant} />;
      },
    },
    {
      key: "createdAt",
      header: "Criado em",
      render: (project: Project) => (
        <span className="text-sm text-zinc-500">{project.createdAt}</span>
      ),
    },
  ];

  return (
    <div>
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

      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-800">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const count = tab.value === "all" ? counts.all : counts[tab.value];
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? tab.value === "archived"
                          ? "bg-zinc-700/50 text-zinc-400"
                          : "bg-green-500/20 text-green-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto" />
            <p className="text-zinc-400">Carregando projetos...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50">
          <FolderOpen className="mb-4 h-12 w-12 text-zinc-600" />
          <p className="text-zinc-400">
            {activeTab === "all"
              ? "Nenhum projeto encontrado"
              : activeTab === "archived"
                ? "Nenhum projeto arquivado"
                : `Nenhum projeto com status "${projectStatusConfig[activeTab]?.label}"`}
          </p>
          {activeTab !== "all" && (
            <button
              onClick={() => setActiveTab("all")}
              className="mt-2 text-sm text-green-400 hover:text-green-300"
            >
              Ver todos os projetos
            </button>
          )}
        </div>
      ) : (
        /* Data Table */
        <DataTable
          columns={columns}
          data={projects}
          keyExtractor={(project) => project.id}
          rowAction={(project) => (
            <Link href={`/admin/projects/${project.id}`}>
              <Button variant="ghost" size="sm">
                Ver detalhes
              </Button>
            </Link>
          )}
        />
      )}
    </div>
  );
}
