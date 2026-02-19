import { X } from "lucide-react";
import { Button } from "@/components/ui";

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isArchiving: boolean;
  projectName: string;
}

export function ArchiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isArchiving,
  projectName,
}: ArchiveConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white sm:text-lg">Arquivar Projeto</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            disabled={isArchiving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Tem certeza que deseja arquivar o projeto{" "}
            <strong className="text-white">{projectName}</strong>?
          </p>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-400">
              <strong>⚠️ Atenção:</strong> Os arquivos serão movidos para
              armazenamento de acesso infrequente (Infrequent Access).
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-300/80">
              <li>• Reduz custos de armazenamento em 33%</li>
              <li>• Cobrança de R$ 0,01/GB ao acessar os arquivos</li>
              <li>• Ideal para projetos antigos raramente acessados</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isArchiving}
            fullWidth
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} loading={isArchiving} fullWidth>
            {isArchiving ? "Arquivando..." : "Arquivar Projeto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
