import Link from "next/link";
import { ArrowLeft, ShieldX } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";

interface BlockedAccessMessageProps {
  backUrl: string;
  onBackClick: () => void;
}

export function BlockedAccessMessage({
  backUrl,
  onBackClick,
}: BlockedAccessMessageProps) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <Link
          href={backUrl}
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <ShieldX className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-white sm:text-xl">
            Acesso Bloqueado
          </h2>
          <p className="mb-6 max-w-md text-center text-sm text-zinc-400">
            Sua permissão para criar novos projetos está temporariamente
            desativada. Entre em contato com o administrador para mais
            informações.
          </p>
          <Button variant="ghost" onClick={onBackClick}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
