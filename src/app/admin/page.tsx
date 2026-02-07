// src/app/admin/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
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

// Dados mock - virão do banco depois
const receitaMensal = [
  { mes: "Jan", receita: 12400 },
  { mes: "Fev", receita: 15800 },
  { mes: "Mar", receita: 18200 },
  { mes: "Abr", receita: 16900 },
  { mes: "Mai", receita: 21500 },
  { mes: "Jun", receita: 23100 },
];

const receitaPorCultura = [
  { cultura: "Cana", valor: 45000, porcentagem: 38 },
  { cultura: "Milho", valor: 32000, porcentagem: 27 },
  { cultura: "Soja", valor: 28000, porcentagem: 24 },
  { cultura: "Eucalipto", valor: 13000, porcentagem: 11 },
];

export default function AdminDashboard() {
  const receitaTotal = receitaPorCultura.reduce(
    (acc, item) => acc + item.valor,
    0,
  );

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Painel Administrativo</h1>

      {/* Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              R$ {(receitaTotal / 1000).toFixed(0)}k
            </p>
            <p className="mt-1 text-sm text-zinc-400">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">48</p>
            <p className="mt-1 text-sm text-zinc-400">5 novos esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">124</p>
            <p className="mt-1 text-sm text-zinc-400">32 projetos este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receita Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={receitaMensal}>
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
                    `R$ ${Number(value).toLocaleString()}`,
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
          </CardContent>
        </Card>

        {/* Receita por Cultura */}
        <ReceitaPorCulturaChart data={receitaPorCultura} />
      </div>
    </div>
  );
}
