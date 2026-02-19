"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { projectStatusConfig } from "@/lib/constants/status-configs";

interface UnpaidProject {
  id: string;
  name: string;
  projectType: string;
  culture: string;
  status: string;
  price: string;
  area: string | null;
  completedAt: string | null;
}

interface BalanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalBalance: number;
}

export function BalanceDetailsModal({
  isOpen,
  onClose,
  totalBalance,
}: BalanceDetailsModalProps) {
  const [projects, setProjects] = useState<UnpaidProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unpaid projects when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchUnpaidProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/projects/unpaid");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Falha ao carregar projetos");
        }

        setProjects(data.projects);
      } catch (err) {
        console.error("Error fetching unpaid projects:", err);
        setError(
          err instanceof Error ? err.message : "Erro ao carregar projetos"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnpaidProjects();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white sm:text-xl">Saldo a Pagar</h2>
            <p className="text-xl font-bold text-green-500 sm:text-2xl">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto p-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="text-sm text-zinc-400">Carregando projetos...</div>
            </div>
          ) : error ? (
            /* Error State */
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center text-zinc-500">
              Nenhum projeto concluído encontrado
            </div>
          ) : (
            /* Projects List */
            <div className="space-y-3">
              {projects.map((project) => {
                const statusConfig = projectStatusConfig[project.status];
                return (
                  <div
                    key={project.id}
                    className="group rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <button
                            onClick={() => {
                              // Navigate to project details
                              window.location.href = `/projects/${project.id}`;
                            }}
                            className="text-base font-medium text-white transition-colors hover:text-green-400"
                          >
                            {project.name}
                          </button>
                          {statusConfig && (
                            <StatusBadge
                              label={statusConfig.label}
                              variant={statusConfig.variant}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                          <span>
                            {project.projectType} • {project.culture}
                          </span>
                          {project.area && parseFloat(project.area) > 0 && (
                            <span>{parseFloat(project.area).toFixed(2)} ha</span>
                          )}
                          {project.completedAt && (
                            <span>
                              Concluído em {formatDate(project.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">
                          {formatCurrency(project.price)}
                        </div>
                        <button
                          onClick={() => {
                            window.location.href = `/projects/${project.id}`;
                          }}
                          className="mt-1 text-xs text-green-400 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          Ver detalhes →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="border-t border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <div className="text-sm">
            <p className="font-medium text-white">
              {projects.length}{" "}
              {projects.length === 1
                ? "projeto concluído"
                : "projetos concluídos"}{" "}
              pendente{projects.length === 1 ? "" : "s"} de pagamento
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
