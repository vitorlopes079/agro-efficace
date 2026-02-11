// src/app/reset-password/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Button, useToast } from "@/components/ui";

const Logo = () => (
  <div className="relative h-[62.5px] w-56">
    <Image
      src="/logo-branco.png"
      alt="Agro Efficace Logo"
      fill
      className="object-contain"
      priority
    />
  </div>
);

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const token = searchParams.get("token");

  type Status = "loading" | "valid" | "invalid" | "expired" | "success";

  const [status, setStatus] = useState<Status>(token ? "loading" : "invalid");
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      try {
        const response = await fetch(
          `/api/auth/validate-reset-token?token=${token}`
        );
        const data = await response.json();

        if (!response.ok) {
          if (data.error === "Reset token expired") {
            setStatus("expired");
          } else {
            setStatus("invalid");
          }
          return;
        }

        setUserData(data.user);
        setStatus("valid");
      } catch (error) {
        console.error("Error validating token:", error);
        setStatus("invalid");
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError("A senha deve ter no mínimo 8 caracteres");
      return false;
    }

    if (password !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    if (!token) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Erro", data.error || "Erro ao redefinir senha");
        setIsSubmitting(false);
        return;
      }

      setStatus("success");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Erro", "Erro ao redefinir senha. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto"></div>
          <p className="text-zinc-400">Validando link...</p>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="w-full max-w-md rounded-lg bg-zinc-900 p-8 text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h1 className="mb-2 text-2xl font-bold text-white">Link Inválido</h1>
          <p className="mb-6 text-zinc-400">
            Este link de redefinição de senha não é válido ou já foi usado.
          </p>
          <Button onClick={() => router.push("/forgot-password")}>
            Solicitar novo link
          </Button>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="w-full max-w-md rounded-lg bg-zinc-900 p-8 text-center">
          <div className="mb-4 text-6xl">⏰</div>
          <h1 className="mb-2 text-2xl font-bold text-white">Link Expirado</h1>
          <p className="mb-6 text-zinc-400">
            Este link de redefinição de senha expirou. Solicite um novo link
            para continuar.
          </p>
          <Button onClick={() => router.push("/forgot-password")}>
            Solicitar novo link
          </Button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="w-full max-w-md rounded-lg bg-zinc-900 p-8 text-center">
          <div className="mb-4 text-6xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold text-white">
            Senha Redefinida!
          </h1>
          <p className="mb-6 text-zinc-400">
            Sua senha foi alterada com sucesso. Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-lg bg-zinc-900 p-8">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-white">
              Redefinir Senha
            </h1>
            <p className="text-zinc-400">Digite sua nova senha</p>
          </div>

          <div className="mb-6 space-y-3 rounded-lg bg-zinc-800 p-4">
            <div>
              <p className="text-xs text-zinc-500">Nome</p>
              <p className="text-sm font-medium text-white">{userData?.name}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-sm font-medium text-white">
                {userData?.email}
              </p>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Nova Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Mínimo 8 caracteres"
                minLength={8}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Confirmar Nova Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Digite a senha novamente"
                minLength={8}
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto"></div>
            <p className="text-zinc-400">Carregando...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
