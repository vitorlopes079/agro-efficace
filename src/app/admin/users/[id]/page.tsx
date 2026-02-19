// src/app/admin/users/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  StatusBadge,
  LoadingSpinner,
  ConfirmDialog,
} from "@/components/ui";
import { userStatusConfig } from "@/lib/constants/status-configs";
import {
  UserContactInfoCard,
  UserAccountInfoCard,
  UserNotesCard,
  UserPermissionsCard,
  UserActionsCard,
} from "@/components/admin/user-detail";
import { useUserActions, type User } from "@/hooks/useUserActions";
import { useInlineNoteEditor } from "@/hooks/useInlineNoteEditor";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showToggleUploadDialog, setShowToggleUploadDialog] = useState(false);

  const { isActionLoading, handleBanUser, handleToggleUpload, handleSaveNotes } =
    useUserActions({ userId, user, setUser });

  const noteEditor = useInlineNoteEditor({
    initialValue: user?.notes || "",
    onSave: handleSaveNotes,
  });

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
        noteEditor.resetValue(data.user.notes || "");
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Erro ao carregar usuário");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

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
    return <LoadingSpinner text="Carregando usuário..." minHeight="400px" />;
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-base font-bold text-white sm:h-16 sm:w-16 sm:text-xl">
              {getInitials(user.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">{user.name}</h1>
              <div className="mt-1 flex items-center gap-3">
                <StatusBadge
                  label={userStatusConfig[user.status].label}
                  variant={userStatusConfig[user.status].variant}
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
          <UserContactInfoCard email={user.email} phone={user.phone} />

          <UserAccountInfoCard
            invitedAt={user.invitedAt}
            invitedByName={user.invitedBy?.name || null}
            lastLoginAt={user.lastLoginAt}
            createdAt={user.createdAt}
          />

          <UserNotesCard
            notes={user.notes}
            isEditing={noteEditor.isEditing}
            editValue={noteEditor.value}
            isLoading={isActionLoading}
            onStartEdit={noteEditor.startEditing}
            onCancelEdit={noteEditor.cancelEditing}
            onSave={noteEditor.saveChanges}
            onValueChange={noteEditor.updateValue}
          />
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <UserPermissionsCard canUpload={user.canUpload} />

          <UserActionsCard
            canUpload={user.canUpload}
            isSuspended={user.status === "SUSPENDED"}
            isLoading={isActionLoading}
            onToggleUploadClick={() => setShowToggleUploadDialog(true)}
            onBanClick={() => setShowBanDialog(true)}
          />
        </div>
      </div>

      {/* Toggle Upload Permission Dialog */}
      <ConfirmDialog
        isOpen={showToggleUploadDialog}
        onClose={() => setShowToggleUploadDialog(false)}
        onConfirm={() => handleToggleUpload(() => setShowToggleUploadDialog(false))}
        title={user.canUpload ? "Desativar Envios" : "Ativar Envios"}
        description={
          user.canUpload
            ? `Tem certeza que deseja desativar o envio de projetos para ${user.name}? O usuário não poderá criar novos projetos até que esta permissão seja reativada.`
            : `Tem certeza que deseja ativar o envio de projetos para ${user.name}? O usuário poderá criar novos projetos.`
        }
        confirmText={user.canUpload ? "Desativar Envios" : "Ativar Envios"}
        cancelText="Cancelar"
        variant={user.canUpload ? "warning" : "success"}
        isLoading={isActionLoading}
      />

      {/* Ban/Unban User Dialog */}
      <ConfirmDialog
        isOpen={showBanDialog}
        onClose={() => setShowBanDialog(false)}
        onConfirm={() => handleBanUser(() => setShowBanDialog(false))}
        title={user.status === "SUSPENDED" ? "Desbanir Usuário" : "Banir Usuário"}
        description={
          user.status === "SUSPENDED"
            ? `Tem certeza que deseja desbanir ${user.name}? O usuário terá o acesso restaurado à plataforma.`
            : `Tem certeza que deseja banir ${user.name}? O usuário será completamente bloqueado da plataforma e não poderá fazer login.`
        }
        confirmText={user.status === "SUSPENDED" ? "Desbanir Usuário" : "Banir Usuário"}
        cancelText="Cancelar"
        variant={user.status === "SUSPENDED" ? "success" : "danger"}
        isLoading={isActionLoading}
      />
    </div>
  );
}
