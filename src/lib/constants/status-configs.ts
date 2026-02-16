export type StatusVariant = "cyan" | "amber" | "green" | "red" | "gray";

export type StatusConfig = {
  label: string;
  variant: StatusVariant;
};

export const projectStatusConfig: Record<string, StatusConfig> = {
  PENDING: { label: "Pendente", variant: "cyan" },
  PROCESSING: { label: "Em andamento", variant: "amber" },
  COMPLETED: { label: "Concluído", variant: "green" },
  CANCELLED: { label: "Cancelado", variant: "red" },
};

export const userStatusConfig: Record<string, StatusConfig> = {
  PENDING: { label: "Pendente", variant: "amber" },
  ACTIVE: { label: "Ativo", variant: "green" },
  INACTIVE: { label: "Inativo", variant: "gray" },
  SUSPENDED: { label: "Suspenso", variant: "red" },
};

export const paymentStatusConfig: Record<string, StatusConfig> = {
  PAID: { label: "Pago", variant: "green" },
  PENDING: { label: "Pendente", variant: "amber" },
};

export const auditLogActionConfig: Record<string, StatusConfig> = {
  USER_LOGIN: { label: "Login", variant: "green" },
  USER_INVITED: { label: "Convite Enviado", variant: "cyan" },
  USER_ACCEPTED_INVITE: { label: "Convite Aceito", variant: "green" },
  USER_ROLE_CHANGED: { label: "Role Alterado", variant: "amber" },
  USER_SUSPENDED: { label: "Usuário Suspenso", variant: "red" },
  USER_ACTIVATED: { label: "Usuário Ativado", variant: "green" },
};

/** @deprecated Use projectStatusConfig instead */
export const statusConfig = projectStatusConfig;
