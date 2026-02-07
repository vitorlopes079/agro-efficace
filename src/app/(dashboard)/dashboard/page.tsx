"use client";

import { DataTable, SearchInput, StatCard, StatusBadge } from "@/components/ui";

// Mock data - will come from database later
const stats = {
  projectsThisMonth: 15,
  areaProcessed: 100,
  balanceToPay: 230,
};

const projects = [
  {
    id: "#124",
    title: "Daninhas — Bloco 3 Quadra 8",
    culture: "Cana",
    area: 212,
    date: "03/11/2025",
    status: "Executando",
    statusVariant: "cyan" as const,
  },
  {
    id: "#123",
    title: "Falhas — Bloco 2 Quadra 4",
    culture: "Milho",
    area: 76,
    date: "01/11/2025",
    status: "Concluído",
    statusVariant: "green" as const,
  },
  {
    id: "#121",
    title: "Daninhas — Bloco 1 Quadra 2",
    culture: "Soja",
    area: 98,
    date: "27/10/2025",
    status: "Na fila",
    statusVariant: "amber" as const,
  },
  {
    id: "#120",
    title: "Falhas — Bloco 9 Quadra 5",
    culture: "Milho",
    area: 65,
    date: "25/10/2025",
    status: "Concluído",
    statusVariant: "green" as const,
  },
  {
    id: "#119",
    title: "Daninhas — Bloco 4 Quadra 3",
    culture: "Cana",
    area: 187,
    date: "22/10/2025",
    status: "Executando",
    statusVariant: "cyan" as const,
  },
  {
    id: "#118",
    title: "Restituição — Bloco 6 Quadra 2",
    culture: "Eucalipto",
    area: 120,
    date: "18/10/2025",
    status: "Na fila",
    statusVariant: "amber" as const,
  },
];

// Icons as components for cleaner code
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

// Table column definitions
const columns = [
  {
    key: "id",
    header: "ID",
    render: (project: (typeof projects)[0]) => (
      <span className="text-sm font-medium text-zinc-500">{project.id}</span>
    ),
  },
  {
    key: "title",
    header: "Título",
    render: (project: (typeof projects)[0]) => (
      <span className="text-sm font-medium text-white">{project.title}</span>
    ),
  },
  {
    key: "culture",
    header: "Cultura",
    render: (project: (typeof projects)[0]) => (
      <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
        {project.culture}
      </span>
    ),
  },
  {
    key: "area",
    header: "Área (HA)",
    render: (project: (typeof projects)[0]) => (
      <span className="text-sm text-zinc-300">{project.area}</span>
    ),
  },
  {
    key: "date",
    header: "Data",
    render: (project: (typeof projects)[0]) => (
      <span className="text-sm text-zinc-500">{project.date}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (project: (typeof projects)[0]) => (
      <StatusBadge label={project.status} variant={project.statusVariant} />
    ),
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      {/* Search */}
      <div className="mb-8">
        <SearchInput placeholder="Buscar projeto, município, cultura..." />
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Projetos neste Mês"
          value={stats.projectsThisMonth}
          icon={<GridIcon />}
          iconColor="blue"
          trend={{ value: "12%", label: "vs. mês anterior" }}
        />
        <StatCard
          title="Área Processada"
          value={stats.areaProcessed}
          unit="ha"
          icon={<MapPinIcon />}
          iconColor="emerald"
          trend={{ value: "8%", label: "vs. mês anterior" }}
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
        rowAction={() => (
          <button className="rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-medium text-white opacity-0 transition-all hover:bg-zinc-700 group-hover:opacity-100">
            Abrir
          </button>
        )}
        pagination={{
          showing: 6,
          total: 24,
          hasPrevious: false,
          hasNext: true,
        }}
      />
    </main>
  );
}
