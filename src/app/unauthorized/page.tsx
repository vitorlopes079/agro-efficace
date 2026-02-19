// src/app/unauthorized/page.tsx
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md rounded-lg bg-zinc-900 p-8 text-center">
        <div className="mb-4 flex justify-center">
          <ShieldX className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl">Acesso Negado</h1>
        <p className="mb-6 text-zinc-400">
          Você não tem permissão para acessar esta página.
        </p>
        <Link href="/">
          <Button>Voltar para Home</Button>
        </Link>
      </div>
    </div>
  );
}
