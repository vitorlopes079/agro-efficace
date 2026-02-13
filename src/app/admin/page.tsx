// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
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

interface AdminStats {
  totalRevenue: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalProjects: number;
  projectsThisMonth: number;
  monthlyRevenue: MonthlyRevenue[];
  revenueByCulture: CultureRevenue[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    activeUsers: 0,
    newUsersThisWeek: 0,
    totalProjects: 0,
    projectsThisMonth: 0,
    monthlyRevenue: [],
    revenueByCulture: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/stats");

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Stats data received:", data); // ← ADD THIS
        setStats(data);
      } else {
        console.error("Error fetching stats:", await response.json());
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-zinc-400">Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Painel Administrativo</h1>

      {/* Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Receita Total
              <InfoTooltip text="Dinheiro total recebido de projetos que foram finalizados e pagos" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {stats.totalRevenue > 0
                ? `R$ ${(stats.totalRevenue / 1000).toFixed(1)}k`
                : "R$ 0"}
            </p>
            <p className="mt-1 text-sm text-zinc-400">Projetos pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Usuários Ativos
              <InfoTooltip text="Usuários que criaram algum projeto nos últimos 30 dias" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.activeUsers}</p>
            <p className="mt-1 flex items-center text-sm text-zinc-400">
              {stats.newUsersThisWeek} novos esta semana
              <InfoTooltip text="Usuários que se cadastraram nos últimos 7 dias" />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Total de Projetos
              <InfoTooltip text="Todos os projetos já criados, independente do status" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalProjects}</p>
            <p className="mt-1 flex items-center text-sm text-zinc-400">
              {stats.projectsThisMonth} projetos este mês
              <InfoTooltip text="Projetos criados desde o primeiro dia do mês atual" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receita Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Receita Mensal
              <InfoTooltip text="Dinheiro recebido por mês de projetos finalizados e pagos nos últimos 6 meses" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthlyRevenue}>
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

        {/* Receita por Cultura */}
        {stats.revenueByCulture.length > 0 ? (
          <ReceitaPorCulturaChart data={stats.revenueByCulture} />
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
    </div>
  );
}
