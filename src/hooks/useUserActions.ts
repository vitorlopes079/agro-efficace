import { useState } from "react";
import { useToast } from "@/components/ui";

export type User = {
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

type UseUserActionsProps = {
  userId: string;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

export function useUserActions({ userId, user, setUser }: UseUserActionsProps) {
  const toast = useToast();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleBanUser = async (onSuccess?: () => void) => {
    if (!user) return;

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
        data.user.status === "SUSPENDED"
          ? "Usuário banido com sucesso."
          : "Usuário reativado com sucesso."
      );
      onSuccess?.();
    } catch (err) {
      console.error("Error banning user:", err);
      toast.error("Erro", "Erro ao atualizar status do usuário");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleUpload = async (onSuccess?: () => void) => {
    if (!user) return;

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
        data.user.canUpload
          ? "Envio de projetos ativado."
          : "Envio de projetos desativado."
      );
      onSuccess?.();
    } catch (err) {
      console.error("Error toggling upload:", err);
      toast.error("Erro", "Erro ao atualizar permissão de envio");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveNotes = async (notes: string, onSuccess?: () => void) => {
    setIsActionLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
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
      toast.success("Salvo", "Observações atualizadas com sucesso.");
      onSuccess?.();
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error("Erro", "Erro ao salvar observações");
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    isActionLoading,
    handleBanUser,
    handleToggleUpload,
    handleSaveNotes,
  };
}
