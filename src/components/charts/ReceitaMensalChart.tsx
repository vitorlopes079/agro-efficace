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

interface MonthlyRevenue {
  mes: string;
  receita: number;
}

interface ReceitaMensalChartProps {
  data: MonthlyRevenue[];
}

export function ReceitaMensalChart({ data }: ReceitaMensalChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Receita Mensal
          <InfoTooltip text="Dinheiro recebido por mês de projetos finalizados e pagos nos últimos 6 meses" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
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
  );
}
