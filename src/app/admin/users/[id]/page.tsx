// src/app/admin/users/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Ban,
  Upload,
  UserX,
  CheckCircle,
  Edit2,
  Save,
  X,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
  useToast,
} from "@/components/ui";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "USER";
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
  notes: string | null;
  canUpload: boolean;
  invitedBy: { name: string } | null;
  invitedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

const statusConfig = {
  PENDING: { label: "Pendente", variant: "amber" as const },
  ACTIVE: { label: "Ativo", variant: "green" as const },
  INACTIVE: { label: "Inativo", variant: "gray" as const },
  SUSPENDED: { label: "Banido", variant: "red" as const },
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erro ao carregar usuário");
          return;
        }

        setUser(data.user);
        setNotesValue(data.user.notes || "");
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Erro ao carregar usuário");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleBanUser = async () => {
    if (!user) return;

    if (
      !confirm(
        `Tem certeza que deseja ${user.status === "SUSPENDED" ? "desbanir" : "banir"} este usuário?`
      )
    ) {
      return;
    }

    setIsActionLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Erro", data.error || "Erro ao atualizar status");
        return;
      }

      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.user.status,
          canUpload: data.user.canUpload,
        };
      });

      toast.success(
        "Status atualizado",
        data.user.status === "SUSPENDED" ? "Usuário banido com sucesso." : "Usuário reativado com sucesso."
      );
    } catch (err) {
      console.error("Error banning user:", err);
      toast.error("Erro", "Erro ao atualizar status do usuário");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleUpload = async () => {
    if (!user) return;

    if (
      !confirm(
        `Tem certeza que deseja ${user.canUpload ? "desativar" : "ativar"} o envio de projetos?`
      )
    ) {
      return;
    }

    setIsActionLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/upload`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Erro", data.error || "Erro ao atualizar permissão");
        return;
      }

      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, canUpload: data.user.canUpload };
      });

      toast.success(
        "Permissão atualizada",
        data.user.canUpload ? "Envio de projetos ativado." : "Envio de projetos desativado."
      );
    } catch (err) {
      console.error("Error toggling upload:", err);
      toast.error("Erro", "Erro ao atualizar permissão de envio");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsActionLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Erro", data.error || "Erro ao salvar observações");
        return;
      }

      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, notes: data.user.notes };
      });
      setIsEditingNotes(false);
      toast.success("Salvo", "Observações atualizadas com sucesso.");
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error("Erro", "Erro ao salvar observações");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setNotesValue(user?.notes || "");
    setIsEditingNotes(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto" />
          <p className="text-zinc-400">Carregando usuário...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="mb-4 text-zinc-400">{error || "Usuário não encontrado"}</p>
        <Button variant="ghost" onClick={() => router.push("/admin/users")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para usuários
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700 text-xl font-bold text-white">
              {getInitials(user.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <div className="mt-1 flex items-center gap-3">
                <StatusBadge
                  label={statusConfig[user.status].label}
                  variant={statusConfig[user.status].variant}
                />
                <span
                  className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {user.role === "ADMIN" ? "Admin" : "Usuário"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="text-sm text-white">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Telefone</p>
                  <p className="text-sm text-white">
                    {user.phone || "Não informado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
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
                    <p className="text-sm text-white">
                      {user.invitedAt || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Convidado por</p>
                    <p className="text-sm text-white">
                      {user.invitedBy?.name || "Sistema"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Último acesso</p>
                    <p className="text-sm text-white">
                      {user.lastLoginAt || "Nunca acessou"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Conta criada em</p>
                    <p className="text-sm text-white">{user.createdAt}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Observações</CardTitle>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={4}
                    placeholder="Adicione observações sobre este usuário..."
                    className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isActionLoading}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={isActionLoading}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isActionLoading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-300">
                  {user.notes || "Nenhuma observação adicionada."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Enviar Projetos
                    </p>
                    <p className="text-xs text-zinc-500">
                      Criar novos projetos
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    user.canUpload ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {user.canUpload ? "Ativo" : "Bloqueado"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Toggle Upload Permission */}
              <button
                onClick={handleToggleUpload}
                disabled={isActionLoading || user.status === "SUSPENDED"}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  user.canUpload
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                }`}
              >
                {user.canUpload ? (
                  <UserX className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {user.canUpload ? "Desativar Envios" : "Ativar Envios"}
                  </p>
                  <p className="text-xs opacity-70">
                    {user.canUpload
                      ? "Bloquear criação de projetos"
                      : "Permitir criação de projetos"}
                  </p>
                </div>
              </button>

              {/* Ban/Unban User */}
              <button
                onClick={handleBanUser}
                disabled={isActionLoading}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  user.status === "SUSPENDED"
                    ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                    : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                }`}
              >
                {user.status === "SUSPENDED" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Ban className="h-5 w-5" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {user.status === "SUSPENDED"
                      ? "Desbanir Usuário"
                      : "Banir Usuário"}
                  </p>
                  <p className="text-xs opacity-70">
                    {user.status === "SUSPENDED"
                      ? "Restaurar acesso à plataforma"
                      : "Bloquear acesso à plataforma"}
                  </p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
