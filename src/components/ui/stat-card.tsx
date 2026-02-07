"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type IconColor = "blue" | "emerald" | "amber" | "red" | "green";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  prefix?: string;
  icon: ReactNode;
  iconColor?: IconColor;
  trend?: {
    value: string;
    positive?: boolean;
    label?: string;
  };
  action?: {
    label: string;
    onClick?: () => void;
  };
}

const iconColorClasses: Record<IconColor, string> = {
  blue: "bg-blue-500/10 text-blue-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
  red: "bg-red-500/10 text-red-400",
  green: "bg-green-500/10 text-green-400",
};

export function StatCard({
  title,
  value,
  unit,
  prefix,
  icon,
  iconColor = "blue",
  trend,
  action,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight">
            {prefix && (
              <span className="text-2xl font-medium text-zinc-500">
                {prefix}
              </span>
            )}
            {value}
            {unit && (
              <span className="text-2xl font-medium text-zinc-500"> {unit}</span>
            )}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconColorClasses[iconColor]}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4">
        {trend && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`flex items-center gap-1 ${trend.positive !== false ? "text-emerald-400" : "text-red-400"}`}
            >
              {trend.positive !== false ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}
            </span>
            {trend.label && <span className="text-zinc-500">{trend.label}</span>}
          </div>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-medium text-green-400 transition-colors hover:text-green-300"
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  );
}
