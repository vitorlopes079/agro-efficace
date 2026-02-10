// src/app/admin/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, DataTable, StatusBadge } from "@/components/ui";
import { InviteUserModal } from "@/components/admin/InviteUserModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
}

const columns = [
  {
    key: "name",
    header: "Usuário",
    render: (user: User) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
          {user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-zinc-500">{user.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Função",
    render: (user: User) => (
      <span
        className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
          user.role === "admin"
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-zinc-700 text-zinc-300"
        }`}
      >
        {user.role === "admin" ? "Admin" : "Usuário"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (user: User) => {
      const statusMap = {
        active: { label: "Ativo", variant: "green" as const },
        pending: { label: "Pendente", variant: "amber" as const },
        inactive: { label: "Inativo", variant: "gray" as const },
        suspended: { label: "Suspenso", variant: "red" as const },
      };
      const status =
        statusMap[user.status as keyof typeof statusMap] || statusMap.inactive;
      return <StatusBadge label={status.label} variant={status.variant} />;
    },
  },
  {
    key: "lastLogin",
    header: "Último acesso",
    render: (user: User) => (
      <span className="text-sm text-zinc-500">{user.lastLogin}</span>
    ),
  },
  {
    key: "createdAt",
    header: "Criado em",
    render: (user: User) => (
      <span className="text-sm text-zinc-500">{user.createdAt}</span>
    ),
  },
];

export default function AdminUsersPage() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Buscar usuários ao carregar a página
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsFetching(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        console.error("Error fetching users:", data.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleInviteUser = async (userData: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    role: "admin" | "user";
  }): Promise<string> => {
    try {
      const payload = {
        ...userData,
        role: userData.role.toUpperCase(),
      };

      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar convite");
      }

      // Recarregar lista de usuários em segundo plano

      // Retornar o link de convite (ajuste o campo conforme sua API retorna)
      // Pode ser data.inviteLink, data.link, data.url, etc.
      return data.invitationLink; // ← CORRIGIDO
    } catch (error) {
      console.error("Error inviting user:", error);
      throw error; // Re-throw para que o modal possa lidar com o erro
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-zinc-400">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {users.length} {users.length === 1 ? "usuário" : "usuários"}{" "}
            cadastrado
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>Convidar</Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id}
        rowAction={(user) => (
          <Link href={`/admin/users/${user.id}`}>
            <Button variant="ghost" size="sm">
              Ver detalhes
            </Button>
          </Link>
        )}
      />

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteUser}
      />
    </div>
  );
}
