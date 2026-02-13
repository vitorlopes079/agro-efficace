"use client";

import { ReactNode, useEffect, useState } from "react";
import { X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Button } from "./button";

type DialogVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<
  DialogVariant,
  {
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    confirmButtonClass: string;
  }
> = {
  danger: {
    icon: <AlertTriangle className="h-6 w-6" />,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    confirmButtonClass:
      "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25",
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6" />,
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    confirmButtonClass:
      "bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/25",
  },
  info: {
    icon: <Info className="h-6 w-6" />,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    confirmButtonClass:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25",
  },
  success: {
    icon: <CheckCircle className="h-6 w-6" />,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-400",
    confirmButtonClass:
      "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-4 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}
              >
                {config.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
              </div>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-sm text-zinc-300 leading-relaxed">
              {description}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 p-6">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              type="button"
            >
              {cancelText}
            </Button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`
                inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
                transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${config.confirmButtonClass}
              `}
            >
              {isLoading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolveCallback, setResolveCallback] = useState<
    ((value: boolean) => void) | null
  >(null);

  const confirm = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsOpen(true);
      setResolveCallback(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolveCallback) {
      resolveCallback(true);
    }
    setIsOpen(false);
    setIsLoading(false);
  };

  const handleCancel = () => {
    if (resolveCallback) {
      resolveCallback(false);
    }
    setIsOpen(false);
    setIsLoading(false);
  };

  return {
    isOpen,
    isLoading,
    setIsLoading,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
