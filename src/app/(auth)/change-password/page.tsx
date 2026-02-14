"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Lock, ArrowLeft } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import Link from "next/link";
import Image from "next/image";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Client-side validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation checks
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Todos os campos são obrigatórios");
      return;
    }

    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (currentPassword === newPassword) {
      setError("A nova senha deve ser diferente da senha atual");
      return;
    }

    // API call
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao alterar senha");
      }

      // Success - redirect based on user role
      const redirectUrl = session?.user.role === "ADMIN"
        ? "/admin?passwordChanged=true"
        : "/dashboard?passwordChanged=true";
      router.push(redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="text-zinc-400">Carregando...</div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Image
          src="/logo-branco.png"
          alt="Logo"
          width={224}
          height={62.5}
          className="h-[62.5px] w-56"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Senha Atual <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                icon={<Lock className="h-5 w-5" />}
                disabled={isLoading}
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Nova Senha <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                icon={<Lock className="h-5 w-5" />}
                minLength={8}
                disabled={isLoading}
                required
              />
              <p className="mt-1 text-xs text-zinc-500">
                Mínimo de 8 caracteres
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Confirmar Nova Senha <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente a nova senha"
                icon={<Lock className="h-5 w-5" />}
                minLength={8}
                disabled={isLoading}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>

          {/* Back to Dashboard Link */}
          <div className="mt-4 text-center">
            <Link
              href={session?.user.role === "ADMIN" ? "/admin" : "/dashboard"}
              className="inline-flex items-center text-sm text-zinc-400 transition-colors hover:text-zinc-300"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar ao painel
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
