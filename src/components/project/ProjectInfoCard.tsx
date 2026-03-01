"use client";

import { Card, CardHeader, CardTitle, CardContent, StatusBadge } from "@/components/ui";
import { statusConfig } from "@/lib/constants/status-configs";
import { projectTypeLabels, cultureLabels } from "@/lib/constants/project-constants";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";
import type { ProjectData } from "@/lib/types/project";

interface ProjectInfoCardProps {
  project: ProjectData;
  showPaymentInfo?: boolean;
}

export function ProjectInfoCard({ project, showPaymentInfo = false }: ProjectInfoCardProps) {
  const statusInfo = statusConfig[project.status] || {
    label: project.status,
    variant: "gray" as const,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base">Informações do Projeto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tipo de Projeto
            </p>
            <p className="mt-1 text-sm text-white">
              {projectTypeLabels[project.projectType] || project.projectType}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Cultura
            </p>
            <p className="mt-1 text-sm text-white">
              {cultureLabels[project.culture] || project.culture}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Área Processada
            </p>
            <p className="mt-1 text-sm text-white">
              {project.areaProcessed && parseFloat(project.areaProcessed) > 0
                ? `${parseFloat(project.areaProcessed).toFixed(2)} ha`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
            </p>
            <div className="mt-1">
              <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
            </div>
          </div>
          {project.completedAt && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Concluído em
              </p>
              <p className="mt-1 text-sm text-white">
                {formatDate(project.completedAt)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Última Atualização
            </p>
            <p className="mt-1 text-sm text-white">
              {formatDate(project.updatedAt)}
            </p>
          </div>
          {showPaymentInfo && (
            <>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Valor
                </p>
                <p className="mt-1 text-sm text-white">
                  {formatCurrency(project.price)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Pagamento
                </p>
                <div className="mt-1">
                  {project.isPaid ? (
                    <StatusBadge label="Pago" variant="green" />
                  ) : (
                    <StatusBadge label="Pendente" variant="amber" />
                  )}
                </div>
              </div>
              {project.isPaid && project.paidAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Pago em
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {formatDate(project.paidAt)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        {project.notes && (
          <div className="mt-6 border-t border-zinc-800 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Observações
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
              {project.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
