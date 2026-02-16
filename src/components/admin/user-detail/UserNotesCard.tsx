import { Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type UserNotesCardProps = {
  notes: string | null;
  isEditing: boolean;
  editValue: string;
  isLoading: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
};

export function UserNotesCard({
  notes,
  isEditing,
  editValue,
  isLoading,
  onStartEdit,
  onCancelEdit,
  onSave,
  onValueChange,
}: UserNotesCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Observações</CardTitle>
          {!isEditing && (
            <button
              onClick={onStartEdit}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => onValueChange(e.target.value)}
              rows={4}
              placeholder="Adicione observações sobre este usuário..."
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancelEdit}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {isLoading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-300">
            {notes || "Nenhuma observação adicionada."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
