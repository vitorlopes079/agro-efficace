import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/components/project";
import type { ProjectData } from "@/components/project";

interface ProjectPaymentSummaryCardProps {
  project: ProjectData;
  onRegisterPayment: () => void;
  isRegisteringPayment: boolean;
}

export function ProjectPaymentSummaryCard({
  project,
  onRegisterPayment,
  isRegisteringPayment,
}: ProjectPaymentSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumo do Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Valor
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {formatCurrency(project.price)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
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
          {!project.isPaid && (
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={onRegisterPayment}
                loading={isRegisteringPayment}
              >
                Registrar Pagamento
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
