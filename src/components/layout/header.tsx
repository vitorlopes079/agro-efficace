// src/components/layout/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserMenu } from "./UserMenu";
import { headers } from "next/headers";

export async function Header() {
  const session = await getServerSession(authOptions);
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Verificar se está em rota admin
  const isAdminRoute = pathname.startsWith("/admin");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const currentUser = session?.user
    ? {
        name: session.user.name || "User",
        initials: getInitials(session.user.name || "User"),
      }
    : { name: "Guest", initials: "GU" };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full items-center justify-between px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {/* Square logo for mobile */}
          <div className="relative h-14 w-14 md:hidden">
            <Image
              src="/logo-square.png"
              alt="Agro Efficace Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          {/* Full logo for larger screens */}
          <div className="relative hidden h-16 w-56 md:block">
            <Image
              src="/logo-branco.png"
              alt="Agro Efficace Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {!isAdminRoute && (
            <>
              <Link
                href="/projects/new"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:shadow-green-500/40 hover:brightness-110"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Novo envio
              </Link>
              <div className="h-6 w-px bg-zinc-800" />
            </>
          )}
          <UserMenu user={currentUser} />
        </div>
      </div>
    </header>
  );
}
