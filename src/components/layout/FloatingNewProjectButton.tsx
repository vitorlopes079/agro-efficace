// src/components/layout/FloatingNewProjectButton.tsx
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

export function FloatingNewProjectButton() {
  const pathname = usePathname();

  // Only show on dashboard, not in admin routes
  const isAdminRoute = pathname?.startsWith("/admin");
  const isDashboardPage = pathname === "/dashboard";
  const shouldShow = !isAdminRoute && isDashboardPage;

  if (!shouldShow) return null;

  return (
    <Link
      href="/projects/new"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-2xl shadow-green-500/50 transition-all hover:scale-110 hover:shadow-green-500/70 active:scale-95 sm:hidden"
      aria-label="Novo envio"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
