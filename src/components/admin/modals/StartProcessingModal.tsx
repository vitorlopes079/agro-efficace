import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { ProjectData } from "@/components/project";

interface StartProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onSave: (price: string, area: string) => Promise<void>;
}

export function StartProcessingModal({
  isOpen,
  onClose,
  project,
  onSave,
}: StartProcessingModalProps) {
  const [price, setPrice] = useState(project.price || "0");
  const [area, setArea] = useState(project.areaProcessed || "0");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPrice(project.price || "0");
    setArea(project.areaProcessed || "0");
  }, [project]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(price, area);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Iniciar Processamento
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Área Processada (ha)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Valor (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-sm text-green-400">
              Ao confirmar, o status do projeto será alterado para{" "}
              <strong>Em andamento</strong>.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={isSaving} fullWidth>
            {isSaving ? "Salvando..." : "Iniciar Processamento"}
          </Button>
        </div>
      </div>
    </div>
  );
}
