import { Calendar, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type UserAccountInfoCardProps = {
  invitedAt: string | null;
  invitedByName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

export function UserAccountInfoCard({
  invitedAt,
  invitedByName,
  lastLoginAt,
  createdAt,
}: UserAccountInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Conta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Convidado em</p>
              <p className="text-sm text-white">{invitedAt || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Convidado por</p>
              <p className="text-sm text-white">{invitedByName || "Sistema"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Último acesso</p>
              <p className="text-sm text-white">
                {lastLoginAt || "Nunca acessou"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-zinc-500" />
            <div>
              <p className="text-xs text-zinc-500">Conta criada em</p>
              <p className="text-sm text-white">{createdAt}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
