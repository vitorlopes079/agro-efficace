"use client";

import { Button, DataTable, StatusBadge } from "@/components/ui";

type ProjectStatus = "active" | "pending" | "inactive";

interface Project {
  id: string;
  name: string;
  owner: string;
  area: number;
  status: ProjectStatus;
  createdAt: string;
}

const projects: Project[] = [
  {
    id: "1",
    name: "Fazenda São João",
    owner: "Guilherme Silva",
    area: 450,
    status: "active",
    createdAt: "2025-01-15",
  },
  {
    id: "2",
    name: "Sítio Boa Vista",
    owner: "Maria Santos",
    area: 120,
    status: "active",
    createdAt: "2025-01-10",
  },
  {
    id: "3",
    name: "Fazenda Aurora",
    owner: "João Pereira",
    area: 890,
    status: "pending",
    createdAt: "2025-01-08",
  },
  {
    id: "4",
    name: "Rancho Estrela",
    owner: "Ana Costa",
    area: 230,
    status: "inactive",
    createdAt: "2024-12-20",
  },
];

const statusVariants: Record<ProjectStatus, "green" | "amber" | "gray"> = {
  active: "green",
  pending: "amber",
  inactive: "gray",
};

const statusLabels: Record<ProjectStatus, string> = {
  active: "Ativo",
  pending: "Pendente",
  inactive: "Inativo",
};

const columns = [
  {
    key: "id",
    header: "ID",
    render: (project: Project) => (
      <span className="text-sm text-zinc-500">#{project.id}</span>
    ),
  },
  {
    key: "name",
    header: "Nome do Projeto",
    render: (project: Project) => (
      <span className="text-sm font-medium text-white">{project.name}</span>
    ),
  },
  {
    key: "owner",
    header: "Proprietário",
    render: (project: Project) => (
      <span className="text-sm text-zinc-300">{project.owner}</span>
    ),
  },
  {
    key: "area",
    header: "Área (ha)",
    render: (project: Project) => (
      <span className="text-sm text-zinc-300">{project.area}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (project: Project) => (
      <StatusBadge
        label={statusLabels[project.status]}
        variant={statusVariants[project.status]}
      />
    ),
  },
  {
    key: "createdAt",
    header: "Criado em",
    render: (project: Project) => (
      <span className="text-sm text-zinc-500">{project.createdAt}</span>
    ),
  },
];

export default function AdminProjectsPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Button>Novo Projeto</Button>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        keyExtractor={(project) => project.id}
        rowAction={() => (
          <Button variant="ghost" size="sm">
            Editar
          </Button>
        )}
        pagination={{
          showing: 4,
          total: 124,
          hasPrevious: false,
          hasNext: true,
        }}
      />
    </div>
  );
}
