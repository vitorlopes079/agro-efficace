// src/components/admin/UserSearchSelect.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, X, Loader2 } from "lucide-react";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserSearchSelectProps {
  value: UserOption | null;
  onChange: (user: UserOption | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export function UserSearchSelect({
  value,
  onChange,
  disabled = false,
  required = false,
}: UserSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        if (response.ok) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: UserOption) => {
    onChange(user);
    setQuery("");
    setIsOpen(false);
    setUsers([]);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        Proprietário do Projeto
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div ref={containerRef} className="relative">
        {/* Selected User Display */}
        {value ? (
          <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                <User className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{value.name}</p>
                <p className="text-xs text-zinc-400">{value.email}</p>
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Buscar usuário por nome ou email..."
                disabled={disabled}
                className="
                  w-full rounded-lg border border-zinc-800 bg-zinc-900/50 pl-10 pr-4 py-3 text-sm text-white
                  placeholder-zinc-500 transition-all
                  focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:border-zinc-700 focus:ring-green-500/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />
            </div>

            {/* Dropdown */}
            {isOpen && users.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 shadow-lg max-h-60 overflow-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-600">
                      <User className="h-4 w-4 text-zinc-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {isOpen && query.trim() && !isLoading && users.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 shadow-lg px-4 py-3">
                <p className="text-sm text-zinc-400">
                  Nenhum usuário encontrado
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
