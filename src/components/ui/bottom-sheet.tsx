"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  // Handle ESC key and body scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 animate-in slide-in-from-bottom duration-300">
        <div className="rounded-t-2xl border-t border-zinc-800 bg-zinc-900 shadow-2xl">
          {/* Handle bar */}
          <div className="flex justify-center pt-3">
            <div className="h-1 w-10 rounded-full bg-zinc-700" />
          </div>

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
