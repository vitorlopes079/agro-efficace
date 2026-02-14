"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InfoTooltip,
} from "@/components/ui";

export interface AdminStatsData {
  totalRevenue: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalProjects: number;
  projectsThisMonth: number;
}

interface AdminStatsProps {
  stats: AdminStatsData;
  isLoading?: boolean;
}

export default function AdminStats({
  stats,
  isLoading = false,
}: AdminStatsProps) {
  if (isLoading) {
    return (
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-[140px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900"
          >
            <div className="text-sm text-zinc-400">Carregando...</div>
          </div>
        ))}
      </div>
    );
  }

  return (
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
  );
}
