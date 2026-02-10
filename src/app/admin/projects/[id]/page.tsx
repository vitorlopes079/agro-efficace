"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, DollarSign, X, Check } from "lucide-react";
import { StatusBadge, Button, Card, CardHeader, CardTitle, CardContent, Input } from "@/components/ui";
import {
  ProjectInfoCard,
  ProjectUserCard,
  FileList,
  MapIcon,
  PolygonIcon,
  statusConfig,
  formatDate,
  formatCurrency,
} from "@/components/project";
import type { ProjectData } from "@/components/project";

const FileIcon = () => (
  <svg
    className="h-5 w-5 text-zinc-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onSave: (price: string, isPaid: boolean) => Promise<void>;
}

function PaymentModal({ isOpen, onClose, project, onSave }: PaymentModalProps) {
  const [price, setPrice] = useState(project.price);
  const [isPaid, setIsPaid] = useState(project.isPaid);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPrice(project.price);
    setIsPaid(project.isPaid);
  }, [project]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(price, isPaid);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Gerenciar Pagamento</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Valor (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Status do Pagamento
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  !isPaid
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                Pendente
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  isPaid
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  Pago
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={isSaving} fullWidth>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/projects/${id}`);
      const data = await response.json();

      if (response.ok) {
        setProject(data.project);
      } else {
        setError(data.error || "Erro ao carregar projeto");
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Erro ao carregar projeto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePayment = async (price: string, isPaid: boolean) => {
    if (!project) return;

    const response = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price, isPaid }),
    });

    if (response.ok) {
      const data = await response.json();
      setProject((prev) =>
        prev
          ? {
              ...prev,
              price: data.project.price,
              isPaid: data.project.isPaid,
              paidAt: data.project.paidAt,
            }
          : null
      );
    }
  };

  const handleUploadSolution = () => {
    // TODO: Implement upload solution functionality
    alert("Funcionalidade em desenvolvimento");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto" />
          <p className="text-zinc-400">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-red-400">{error}</p>
        <Button variant="secondary" onClick={() => router.push("/admin/projects")}>
          Voltar aos Projetos
        </Button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const statusInfo = statusConfig[project.status] || {
    label: project.status,
    variant: "gray" as const,
  };

  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos Projetos
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            ID: #{project.id.slice(0, 8)} • Criado em {formatDate(project.createdAt)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <DollarSign className="h-4 w-4" />
            Pagamento
          </Button>
          <Button onClick={handleUploadSolution}>
            <Upload className="h-4 w-4" />
            Upload Solução
          </Button>
        </div>
      </div>

      {/* Payment Summary Card */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo do Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Valor
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {formatCurrency(project.price)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </p>
                <div className="mt-1">
                  {project.isPaid ? (
                    <StatusBadge label="Pago" variant="green" />
                  ) : (
                    <StatusBadge label="Pendente" variant="amber" />
                  )}
                </div>
              </div>
              {project.isPaid && project.paidAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Pago em
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {formatDate(project.paidAt)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details Grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectInfoCard project={project} showPaymentInfo={false} />
        </div>
        <ProjectUserCard user={project.user} />
      </div>

      {/* Files Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-white">Arquivos</h2>

        <div className="grid gap-6 lg:grid-cols-2">
          <FileList
            files={project.filesGrouped.ortomosaico}
            projectId={project.id}
            icon={<MapIcon />}
            title="Ortomosaicos"
            emptyMessage="Nenhum ortomosaico enviado"
          />

          <FileList
            files={project.filesGrouped.perimetros}
            projectId={project.id}
            icon={<PolygonIcon />}
            title="Perímetros de Análise"
            emptyMessage="Nenhum perímetro enviado"
          />
        </div>

        {project.filesGrouped.outros.length > 0 && (
          <FileList
            files={project.filesGrouped.outros}
            projectId={project.id}
            icon={<FileIcon />}
            title="Outros Arquivos"
            emptyMessage="Nenhum arquivo adicional"
          />
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        project={project}
        onSave={handleSavePayment}
      />
    </div>
  );
}
