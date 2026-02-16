// src/app/admin/logs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DataTable, StatusBadge, LoadingSpinner } from "@/components/ui";
import { auditLogActionConfig } from "@/lib/constants/status-configs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  userName: string;
  userEmail: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  ipAddress: string;
  createdAt: string;
}

const columns = [
  {
    key: "action",
    header: "Ação",
    render: (log: AuditLog) => {
      const actionInfo = auditLogActionConfig[log.action] || {
        label: log.action,
        variant: "gray" as const,
      };
      return (
        <StatusBadge label={actionInfo.label} variant={actionInfo.variant} />
      );
    },
  },
  {
    key: "user",
    header: "Usuário",
    render: (log: AuditLog) => (
      <div>
        <p className="text-sm font-medium text-white">{log.userName}</p>
        <p className="text-xs text-zinc-500">{log.userEmail}</p>
      </div>
    ),
  },
  {
    key: "entity",
    header: "Entidade",
    render: (log: AuditLog) => (
      <div>
        <p className="text-sm text-zinc-300">{log.entityType}</p>
        {log.entityId !== "-" && (
          <p className="text-xs font-mono text-zinc-500">
            {log.entityId.slice(0, 8)}...
          </p>
        )}
      </div>
    ),
  },
  {
    key: "ipAddress",
    header: "IP",
    render: (log: AuditLog) => (
      <span className="text-sm font-mono text-zinc-400">{log.ipAddress}</span>
    ),
  },
  {
    key: "createdAt",
    header: "Quando",
    render: (log: AuditLog) => {
      const timeAgo = formatDistanceToNow(new Date(log.createdAt), {
        addSuffix: true,
        locale: ptBR,
      });
      return <span className="text-sm text-zinc-500">{timeAgo}</span>;
    },
  },
];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsFetching(true);
    try {
      const response = await fetch("/api/admin/logs");
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
      } else {
        console.error("Error fetching logs:", data.error);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsFetching(false);
    }
  };

  if (isFetching) {
    return <LoadingSpinner text="Carregando logs..." minHeight="400px" />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Histórico de ações no sistema - últimos 100 registros
        </p>
      </div>

      <DataTable columns={columns} data={logs} keyExtractor={(log) => log.id} />
    </div>
  );
}
