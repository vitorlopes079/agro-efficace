export const statusConfig: Record<string, { label: string; variant: "amber" | "green" | "red" }> = {
  PROCESSING: { label: "Em andamento", variant: "amber" },
  COMPLETED: { label: "Concluído", variant: "green" },
  CANCELLED: { label: "Cancelado", variant: "red" },
};

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
