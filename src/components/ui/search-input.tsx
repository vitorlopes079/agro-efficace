"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchInput({
  placeholder = "Buscar...",
  value,
  onChange,
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-zinc-500 transition-all focus:border-zinc-700 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
      />
    </div>
  );
}
