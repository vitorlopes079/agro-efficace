"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InfoTooltip,
} from "@/components/ui";
import { ReceitaMensalChart } from "@/components/charts/ReceitaMensalChart";
import { ReceitaPorCulturaChart } from "@/components/charts/ReceitaPorCulturaChart";

interface MonthlyRevenue {
  mes: string;
  receita: number;
}

interface CultureRevenue {
  cultura: string;
  valor: number;
  porcentagem: number;
}

interface AdminChartsProps {
  monthlyRevenue: MonthlyRevenue[];
  revenueByCulture: CultureRevenue[];
}

export default function AdminCharts({
  monthlyRevenue,
  revenueByCulture,
}: AdminChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ReceitaMensalChart data={monthlyRevenue} />

      {revenueByCulture.length > 0 ? (
        <ReceitaPorCulturaChart data={revenueByCulture} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Receita por Cultura
              <InfoTooltip text="Total de dinheiro recebido dividido por tipo de cultura (somente projetos finalizados e pagos)" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-75 items-center justify-center text-zinc-500">
              Nenhum dado disponível ainda
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
