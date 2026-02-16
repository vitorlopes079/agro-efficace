import { Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type UserContactInfoCardProps = {
  email: string;
  phone: string | null;
};

export function UserContactInfoCard({ email, phone }: UserContactInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações de Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-zinc-500" />
          <div>
            <p className="text-xs text-zinc-500">Email</p>
            <p className="text-sm text-white">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-zinc-500" />
          <div>
            <p className="text-xs text-zinc-500">Telefone</p>
            <p className="text-sm text-white">{phone || "Não informado"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
