import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type UserPermissionsCardProps = {
  canUpload: boolean;
};

export function UserPermissionsCard({ canUpload }: UserPermissionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-white">Enviar Projetos</p>
              <p className="text-xs text-zinc-500">Criar novos projetos</p>
            </div>
          </div>
          <span
            className={`text-xs font-medium ${
              canUpload ? "text-green-400" : "text-red-400"
            }`}
          >
            {canUpload ? "Ativo" : "Bloqueado"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
