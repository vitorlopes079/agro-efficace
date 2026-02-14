"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InfoTooltip,
} from "@/components/ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Receita Mensal
            <InfoTooltip text="Dinheiro recebido por mês de projetos finalizados e pagos nos últimos 6 meses" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="mes"
                  stroke="#71717a"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#71717a"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(value: number) => `R$ ${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => [
                    `R$ ${Number(value).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    "Receita",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-zinc-500">
              Nenhum dado disponível ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Culture Chart */}
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
            <div className="flex h-[300px] items-center justify-center text-zinc-500">
              Nenhum dado disponível ainda
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
