// src/components/ui/loading-overlay.tsx
"use client";

import { Upload, Loader2, CheckCircle } from "lucide-react";
import { ReactNode } from "react";

interface LoadingOverlayProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
}

export function LoadingOverlay({
  title = "Processando",
  message = "Aguarde um momento...",
  icon,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900 px-12 py-10 shadow-2xl max-w-sm mx-4">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          {icon || <Upload className="h-8 w-8 text-green-400" />}
        </div>

        {/* Text */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{message}</p>
        </div>

        {/* 3-dot loading animation */}
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full bg-green-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-3 w-3 rounded-full bg-green-500 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="h-3 w-3 rounded-full bg-green-500 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

// Pre-configured overlay for project creation
export function CreatingProjectOverlay() {
  return (
    <LoadingOverlay
      title="Estamos criando seu projeto"
      message="Isso pode levar alguns segundos. Por favor, não feche ou atualize a página."
      icon={<Upload className="h-8 w-8 text-green-400" />}
    />
  );
}

// Pre-configured overlay for project finalization
export function FinalizingProjectOverlay() {
  return (
    <LoadingOverlay
      title="Finalizando projeto"
      message="Processando e organizando os arquivos de entrega. Não feche esta página, o processo será concluído em alguns instantes."
      icon={<CheckCircle className="h-8 w-8 text-green-400" />}
    />
  );
}
