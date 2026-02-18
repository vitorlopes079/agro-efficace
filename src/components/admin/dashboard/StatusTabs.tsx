"use client";

import { useState } from "react";
import { Filter, Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const activeTabLabel =
    tabs.find((tab) => tab.value === activeTab)?.label || "Todos";
  const activeCount = activeTab === "all" ? counts.all : counts[activeTab];

  const handleMobileSelect = (tab: TabValue) => {
    onTabChange(tab);
    setIsSheetOpen(false);
  };

  return (
    <>
      {/* Mobile: Filter Button */}
      <div className="mb-6 md:hidden">
        <button
          onClick={() => setIsSheetOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-zinc-400" />
            <span className="font-medium text-white">{activeTabLabel}</span>
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
              {activeCount}
            </span>
          </div>
          <span className="text-sm text-zinc-500">Filtrar</span>
        </button>
      </div>

      {/* Mobile: Bottom Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Filtrar por status"
      >
        <div className="space-y-1">
          {tabs.map((tab) => {
            const count = tab.value === "all" ? counts.all : counts[tab.value];
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => handleMobileSelect(tab.value)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 transition-colors ${
                  isActive
                    ? "bg-green-500/10 text-white"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                {isActive && <Check className="h-5 w-5 text-green-400" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Desktop: Horizontal Tabs */}
      <div className="mb-6 hidden border-b border-zinc-800 md:block">
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
    </>
  );
}
