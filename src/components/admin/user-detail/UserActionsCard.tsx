import { Ban, CheckCircle, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type UserActionsCardProps = {
  canUpload: boolean;
  isSuspended: boolean;
  isLoading: boolean;
  onToggleUploadClick: () => void;
  onBanClick: () => void;
};

export function UserActionsCard({
  canUpload,
  isSuspended,
  isLoading,
  onToggleUploadClick,
  onBanClick,
}: UserActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Toggle Upload Permission */}
        <button
          onClick={onToggleUploadClick}
          disabled={isLoading || isSuspended}
          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            canUpload
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
          }`}
        >
          {canUpload ? (
            <UserX className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <div>
            <p className="text-sm font-medium">
              {canUpload ? "Desativar Envios" : "Ativar Envios"}
            </p>
            <p className="text-xs opacity-70">
              {canUpload
                ? "Bloquear criação de projetos"
                : "Permitir criação de projetos"}
            </p>
          </div>
        </button>

        {/* Ban/Unban User */}
        <button
          onClick={onBanClick}
          disabled={isLoading}
          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isSuspended
              ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
              : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          }`}
        >
          {isSuspended ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Ban className="h-5 w-5" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isSuspended ? "Desbanir Usuário" : "Banir Usuário"}
            </p>
            <p className="text-xs opacity-70">
              {isSuspended
                ? "Restaurar acesso à plataforma"
                : "Bloquear acesso à plataforma"}
            </p>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
