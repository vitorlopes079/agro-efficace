import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import type { ProjectData } from "@/lib/types/project";

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
        <CardTitle className="text-sm sm:text-base">Resumo do Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Valor
              </p>
              <p className="mt-1 text-lg font-semibold text-white sm:text-xl">
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
          </div>
          {!project.isPaid && (
            <div className="sm:ml-auto">
              <Button
                size="sm"
                onClick={onRegisterPayment}
                loading={isRegisteringPayment}
                fullWidth
                className="sm:w-auto"
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
