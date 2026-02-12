export type StatusVariant = "cyan" | "amber" | "green" | "red" | "gray";

export type StatusConfig = {
  label: string;
  variant: StatusVariant;
};

// Project Status
export const projectStatusConfig: Record<string, StatusConfig> = {
  PENDING: { label: "Pendente", variant: "cyan" },
  PROCESSING: { label: "Em andamento", variant: "amber" },
  COMPLETED: { label: "Concluído", variant: "green" },
  CANCELLED: { label: "Cancelado", variant: "red" },
};

// User Status
export const userStatusConfig: Record<string, StatusConfig> = {
  PENDING: { label: "Pendente", variant: "amber" },
  ACTIVE: { label: "Ativo", variant: "green" },
  INACTIVE: { label: "Inativo", variant: "gray" },
  SUSPENDED: { label: "Suspenso", variant: "red" },
};

// Payment Status
export const paymentStatusConfig: Record<string, StatusConfig> = {
  PAID: { label: "Pago", variant: "green" },
  PENDING: { label: "Pendente", variant: "amber" },
};

// Audit Log Actions
export const auditLogActionConfig: Record<string, StatusConfig> = {
  USER_LOGIN: { label: "Login", variant: "green" },
  USER_INVITED: { label: "Convite Enviado", variant: "cyan" },
  USER_ACCEPTED_INVITE: { label: "Convite Aceito", variant: "green" },
  USER_ROLE_CHANGED: { label: "Role Alterado", variant: "amber" },
  USER_SUSPENDED: { label: "Usuário Suspenso", variant: "red" },
  USER_ACTIVATED: { label: "Usuário Ativado", variant: "green" },
};

// @deprecated Use projectStatusConfig instead
export const statusConfig = projectStatusConfig;

export const projectTypeLabels: Record<string, string> = {
  DANINHAS: "Daninhas",
  FALHAS: "Falhas",
  RESTITUICAO: "Restituição",
  MAPEAMENTO: "Mapeamento",
};

export const cultureLabels: Record<string, string> = {
  CANA: "Cana",
  MILHO: "Milho",
  SOJA: "Soja",
  EUCALIPTO: "Eucalipto",
  CAFE: "Café",
  ALGODAO: "Algodão",
};

export function formatFileSize(bytes: string): string {
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
