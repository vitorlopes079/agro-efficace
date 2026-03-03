"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DataTable, SearchInput, StatusBadge, LoadingSpinner } from "@/components/ui";
import { projectStatusConfig } from "@/lib/constants/status-configs";
import { useConfigLabels } from "@/hooks/useConfigLabels";

interface Project {
  id: string;
  name: string;
  projectTypes: string[]; // Changed to array
  culture: string;
  status: string;
  area: string | null;
  price: string;
  filesCount: number;
  createdAt: string;
}

// Columns factory function that uses labels
function createColumns(
  getProjectTypesLabel: (keys: string[]) => string,
  getCultureLabel: (key: string) => string
) {
  return [
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
          <p className="text-xs text-zinc-500">{getProjectTypesLabel(project.projectTypes)}</p>
        </div>
      ),
    },
    {
      key: "culture",
      header: "Cultura",
      render: (project: Project) => (
        <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
          {getCultureLabel(project.culture)}
        </span>
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
        const config = projectStatusConfig[project.status];
        return config ? (
          <StatusBadge label={config.label} variant={config.variant} />
        ) : null;
      },
    },
  ];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProjectsSectionProps {
  initialProjects: Project[];
  initialPagination: Pagination;
}

export default function ProjectsSection({
  initialProjects,
  initialPagination,
}: ProjectsSectionProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [pagination, setPagination] = useState<Pagination>(initialPagination);

  // Get dynamic labels from config
  const { getProjectTypesLabel, getCultureLabel } = useConfigLabels();

  // Create columns with dynamic labels
  const columns = createColumns(getProjectTypesLabel, getCultureLabel);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch projects when debounced search or page changes
  useEffect(() => {
    // Don't fetch on initial mount if we have no search query
    if (pagination.page === 1 && debouncedSearchQuery === "") {
      return;
    }
    fetchProjects(pagination.page, debouncedSearchQuery);
  }, [pagination.page, debouncedSearchQuery]);

  const fetchProjects = async (page: number, search: string = "") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const projectsRes = await fetch(`/api/projects?${params.toString()}`);
      const projectsData = await projectsRes.json();

      if (projectsRes.ok) {
        setProjects(projectsData.projects);
        setPagination(projectsData.pagination);
      } else {
        console.error("Error fetching projects:", projectsData.error);
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

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchInput
        placeholder="Buscar projeto, cultura..."
        value={searchQuery}
        onChange={handleSearchChange}
      />

      {/* Projects Table */}
      {isLoading ? (
        <LoadingSpinner text="Carregando projetos..." minHeight="400px" />
      ) : (
        <DataTable
          title="Meus Projetos"
          columns={columns}
          data={projects}
          keyExtractor={(project) => project.id}
          onRowClick={(project) => router.push(`/projects/${project.id}`)}
          rowAction={(project) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${project.id}`);
              }}
              className="cursor-pointer rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-zinc-700"
            >
              Abrir
            </button>
          )}
          mobileRender={(project: Project, action?: ReactNode) => {
            const config = projectStatusConfig[project.status] || {
              label: project.status,
              variant: "gray" as const,
            };
            return (
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-zinc-800/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {project.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StatusBadge label={config.label} variant={config.variant} />
                    <span className="text-xs text-zinc-500">
                      {getCultureLabel(project.culture)}
                    </span>
                    {project.area && parseFloat(project.area) > 0 && (
                      <span className="text-xs text-zinc-500">
                        {parseFloat(project.area).toFixed(2)} ha
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{getProjectTypesLabel(project.projectTypes)}</span>
                    <span>•</span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                {action}
              </Link>
            );
          }}
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
