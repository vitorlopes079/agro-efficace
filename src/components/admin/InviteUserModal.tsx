"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Copy, Check, AlertCircle } from "lucide-react";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (userData: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    role: "admin" | "user";
  }) => Promise<string>;
}

export function InviteUserModal({
  isOpen,
  onClose,
  onInvite,
}: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    role: "user" as "admin" | "user",
  });

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const link = await onInvite({
        ...formData,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
      });

      setInviteLink(link);
    } catch (error) {
      console.error("Error sending invite:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Algo deu errado. Por favor, tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleClose = () => {
    // Reset everything
    setFormData({
      name: "",
      email: "",
      phone: "",
      notes: "",
      role: "user",
    });
    setInviteLink(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-6 text-lg font-bold text-white sm:text-xl">Convidar Usuário</h2>

        {!inviteLink ? (
          // Form view
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">
                    Erro ao enviar convite
                  </p>
                  <p className="text-xs text-red-300/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Ex: Maria Silva"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="maria@email.com"
              />
            </div>

            {/* Telefone (Opcional) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Telefone{" "}
                <span className="text-xs text-zinc-500">(opcional)</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="+55 11 99999-9999"
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Função <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "admin" | "user",
                  })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Notas/Observações */}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Notas ou Observações{" "}
                <span className="text-xs text-zinc-500">(opcional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Informações adicionais sobre o usuário..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Convite"}
              </Button>
            </div>
          </form>
        ) : (
          // Success view with link
          <div className="space-y-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <p className="text-sm text-green-400 font-medium mb-2">
                ✓ Convite enviado com sucesso!
              </p>
              <p className="text-xs text-zinc-400">
                O link de convite foi enviado para {formData.email}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Link de Convite
              </label>
              <p className="text-xs text-zinc-400 mb-2">
                Você pode copiar este link e enviar via WhatsApp ou outro canal:
              </p>

              <div className="flex gap-2">
                <div className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white overflow-x-auto">
                  <code className="text-xs break-all">{inviteLink}</code>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="shrink-0"
                  title="Copiar link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {copied && (
                <p className="mt-2 text-xs text-green-400">Link copiado!</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={handleClose} className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
