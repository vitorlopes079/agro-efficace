"use client";

import { useState } from "react";
import { StatCard, BalanceDetailsModal } from "@/components/ui";

const GridIcon = () => (
  <svg
    className="h-5 w-5 sm:h-6 sm:w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
  </svg>
);

const MapPinIcon = () => (
  <svg
    className="h-5 w-5 sm:h-6 sm:w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CurrencyIcon = () => (
  <svg
    className="h-5 w-5 sm:h-6 sm:w-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 18V6" />
  </svg>
);

interface Stats {
  projects: { thisMonth: number; allTime: number };
  area: { thisMonth: number; allTime: number };
  balanceToPay: number;
}

interface DashboardStatsProps {
  stats: Stats;
  isLoading?: boolean;
}

export default function DashboardStats({
  stats,
  isLoading = false,
}: DashboardStatsProps) {
  const [showProjectsAllTime, setShowProjectsAllTime] = useState(false);
  const [showAreaAllTime, setShowAreaAllTime] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  if (isLoading) {
    return (
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex h-[100px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 sm:h-[120px]">
          <div className="text-xs text-zinc-400 sm:text-sm">Carregando...</div>
        </div>
        <div className="flex h-[100px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 sm:h-[120px]">
          <div className="text-xs text-zinc-400 sm:text-sm">Carregando...</div>
        </div>
        <div className="flex h-[100px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 sm:h-[120px]">
          <div className="text-xs text-zinc-400 sm:text-sm">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title={`Projetos Concluídos ${showProjectsAllTime ? "(total)" : "(este mês)"}`}
        value={
          showProjectsAllTime
            ? stats.projects.allTime
            : stats.projects.thisMonth
        }
        icon={<GridIcon />}
        iconColor="blue"
        action={{
          label: showProjectsAllTime ? "ver este mês" : "ver total",
          onClick: () => setShowProjectsAllTime(!showProjectsAllTime),
        }}
      />
      <StatCard
        title={`Área Processada ${showAreaAllTime ? "(total)" : "(este mês)"}`}
        value={showAreaAllTime ? stats.area.allTime : stats.area.thisMonth}
        unit="ha"
        icon={<MapPinIcon />}
        iconColor="emerald"
        action={{
          label: showAreaAllTime ? "ver este mês" : "ver total",
          onClick: () => setShowAreaAllTime(!showAreaAllTime),
        }}
      />
      <StatCard
        title="Saldo a Pagar"
        value={stats.balanceToPay}
        prefix="R$"
        icon={<CurrencyIcon />}
        iconColor="amber"
        action={{
          label: "Ver detalhes",
          onClick: () => setShowBalanceModal(true)
        }}
      />

      {/* Balance Details Modal */}
      <BalanceDetailsModal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        totalBalance={stats.balanceToPay}
      />
    </div>
  );
}
