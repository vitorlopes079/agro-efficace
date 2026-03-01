"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, KeyRound } from "lucide-react";
import Link from "next/link";

interface UserMenuProps {
  user: {
    name: string;
    initials: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 md:px-3 md:py-2 transition-colors hover:bg-zinc-800/50"
      >
        <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-linear-to-br from-zinc-600 to-zinc-700 text-xs md:text-sm font-semibold text-white">
          {user.initials}
        </div>
        {/* Nome e seta escondidos no mobile */}
        <span className="hidden md:block text-sm font-medium text-zinc-300">
          {user.name}
        </span>
        <ChevronDown
          className={`hidden md:block h-4 w-4 text-zinc-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg">
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-500">Usuário</p>
          </div>

          <div className="py-1">
            <Link
              href="/change-password"
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <KeyRound className="h-4 w-4" />
              Alterar Senha
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800/50 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
