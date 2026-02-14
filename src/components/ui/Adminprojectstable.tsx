"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, DataTable, SearchInput, StatusBadge, LoadingSpinner } from "@/components/ui";
import {
  projectStatusConfig,
  projectTypeLabels,
  cultureLabels,
} from "@/components/project";
import { FolderOpen } from "lucide-react";
import StatusTabs from "./StatusTabel";

type ProjectStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
type TabValue = "all" | ProjectStatus | "archived";

interface Project {
  id: string;
  name: string;
  projectType: string;
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

interface StatusCounts {
  all: number;
  PENDING: number;
  PROCESSING: number;
  COMPLETED: number;
  CANCELLED: number;
  archived: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminProjectsTableProps {
  initialProjects: Project[];
  initialPagination: Pagination;
  initialCounts: StatusCounts;
}

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

export default function AdminProjectsTable({
  initialProjects,
  initialPagination,
  initialCounts,
}: AdminProjectsTableProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [counts, setCounts] = useState<StatusCounts>(initialCounts);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [pagination, setPagination] = useState<Pagination>(initialPagination);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch when tab, search, or page changes
  useEffect(() => {
    // Don't fetch on initial mount
    if (
      activeTab === "all" &&
      pagination.page === 1 &&
      debouncedSearchQuery === ""
    ) {
      return;
    }
    fetchProjects(activeTab, pagination.page, debouncedSearchQuery);
  }, [activeTab, pagination.page, debouncedSearchQuery]);

  const fetchProjects = async (
    status: TabValue,
    page: number,
    search: string = "",
  ) => {
    setIsLoading(true);
    console.log("🔍 [AdminProjectsTable] fetchProjects called with:", {
      status,
      page,
      search,
      searchTrimmed: search.trim(),
    });

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (status !== "all") {
        params.set("status", status);
        console.log("📌 [AdminProjectsTable] Added status filter:", status);
      }

      if (search.trim()) {
        params.append("search", search.trim());
        console.log(
          "🔎 [AdminProjectsTable] Added search term:",
          search.trim(),
        );
      }

      const url = `/api/admin/projects?${params.toString()}`;
      console.log("🌐 [AdminProjectsTable] Fetching URL:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("✅ [AdminProjectsTable] Response received:", {
        projectsCount: data.projects?.length,
        total: data.pagination?.total,
      });

      if (response.ok) {
        setProjects(data.projects);
        setCounts(data.counts);
        setPagination(data.pagination);
      } else {
        console.error("Error fetching projects:", data.error);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <StatusTabs
        activeTab={activeTab}
        counts={counts}
        onTabChange={handleTabChange}
      />

      {/* Search Bar */}
      <SearchInput
        placeholder="Buscar projeto, proprietário, cultura..."
        value={searchQuery}
        onChange={handleSearchChange}
      />

      {/* Loading State */}
      {isLoading ? (
        <LoadingSpinner text="Carregando projetos..." />
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
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            onPageChange: handlePageChange,
          }}
        />
      )}
    </div>
  );
}
