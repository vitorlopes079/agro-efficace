"use client";

import { projectStatusConfig } from "@/components/project";

type ProjectStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
type TabValue = "all" | ProjectStatus | "archived";

interface StatusCounts {
  all: number;
  PENDING: number;
  PROCESSING: number;
  COMPLETED: number;
  CANCELLED: number;
  archived: number;
}

interface StatusTabsProps {
  activeTab: TabValue;
  counts: StatusCounts;
  onTabChange: (tab: TabValue) => void;
}

const tabs: { value: TabValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "PROCESSING", label: "Em andamento" },
  { value: "COMPLETED", label: "Concluídos" },
  { value: "CANCELLED", label: "Cancelados" },
  { value: "archived", label: "Arquivados" },
];

export default function StatusTabs({
  activeTab,
  counts,
  onTabChange,
}: StatusTabsProps) {
  return (
    <div className="mb-6 border-b border-zinc-800">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const count = tab.value === "all" ? counts.all : counts[tab.value];
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? "text-white" : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? tab.value === "archived"
                        ? "bg-zinc-700/50 text-zinc-400"
                        : "bg-green-500/20 text-green-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
