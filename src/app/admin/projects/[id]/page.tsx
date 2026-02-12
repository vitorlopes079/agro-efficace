"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, Archive, Play, CheckCircle } from "lucide-react";
import {
  StatusBadge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  useToast,
} from "@/components/ui";
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

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isArchiving: boolean;
  projectName: string;
}

function ArchiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isArchiving,
  projectName,
}: ArchiveConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Arquivar Projeto</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            disabled={isArchiving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Tem certeza que deseja arquivar o projeto{" "}
            <strong className="text-white">{projectName}</strong>?
          </p>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-400">
              <strong>⚠️ Atenção:</strong> Os arquivos serão movidos para
              armazenamento de acesso infrequente (Infrequent Access).
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-300/80">
              <li>• Reduz custos de armazenamento em 33%</li>
              <li>• Cobrança de R$ 0,01/GB ao acessar os arquivos</li>
              <li>• Ideal para projetos antigos raramente acessados</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isArchiving}
            fullWidth
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} loading={isArchiving} fullWidth>
            {isArchiving ? "Arquivando..." : "Arquivar Projeto"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface StartProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onSave: (price: string, area: string) => Promise<void>;
}

function StartProcessingModal({
  isOpen,
  onClose,
  project,
  onSave,
}: StartProcessingModalProps) {
  const [price, setPrice] = useState(project.price || "0");
  const [area, setArea] = useState(project.areaProcessed || "0");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPrice(project.price || "0");
    setArea(project.areaProcessed || "0");
  }, [project]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(price, area);
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
          <h2 className="text-lg font-semibold text-white">
            Iniciar Processamento
          </h2>
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
              Área Processada (ha)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="0,00"
            />
          </div>

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

          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-sm text-green-400">
              Ao confirmar, o status do projeto será alterado para{" "}
              <strong>Em andamento</strong>.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={isSaving} fullWidth>
            {isSaving ? "Salvando..." : "Iniciar Processamento"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);

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

  const handleStartProcessing = async (price: string, area: string) => {
    if (!project) return;

    const response = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price,
        areaProcessed: area,
        status: "PROCESSING",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setProject((prev) =>
        prev
          ? {
              ...prev,
              price: data.project.price,
              areaProcessed: data.project.areaProcessed,
              status: data.project.status,
            }
          : null,
      );
      toast.success("Processamento iniciado com sucesso!");
    } else {
      const data = await response.json();
      toast.error(data.error || "Erro ao iniciar processamento");
    }
  };

  const handleFinalizeProject = () => {
    // TODO: Implement finalize project functionality
    toast.info("Em breve", "Esta funcionalidade está em desenvolvimento.");
  };

  const handleRegisterPayment = async () => {
    if (!project) return;

    setIsRegisteringPayment(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setProject((prev) =>
          prev
            ? {
                ...prev,
                isPaid: data.project.isPaid,
                paidAt: data.project.paidAt,
              }
            : null,
        );
        toast.success("Pagamento registrado com sucesso!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao registrar pagamento");
      }
    } catch (error) {
      console.error("Error registering payment:", error);
      toast.error("Erro ao registrar pagamento");
    } finally {
      setIsRegisteringPayment(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!project) return;

    setIsArchiving(true);
    try {
      const response = await fetch(
        `/api/admin/projects/${project.id}/archive`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Projeto arquivado com sucesso!");
        setIsArchiveModalOpen(false);
        // Refresh project data
        await fetchProject(project.id);
      } else {
        toast.error(data.error || "Erro ao arquivar projeto");
      }
    } catch (error) {
      console.error("Error archiving project:", error);
      toast.error("Erro ao arquivar projeto");
    } finally {
      setIsArchiving(false);
    }
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
        <Button
          variant="secondary"
          onClick={() => router.push("/admin/projects")}
        >
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

      {/* Archived Notice Banner */}
      {project.isArchived && project.archivedAt && (
        <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="flex items-start gap-3">
            <Archive className="h-5 w-5 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-300">
                Projeto Arquivado
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Este projeto foi arquivado em {formatDate(project.archivedAt)}.
                Os arquivos estão armazenados em acesso infrequente para reduzir
                custos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <StatusBadge
              label={statusInfo.label}
              variant={statusInfo.variant}
            />
            {project.isArchived && (
              <StatusBadge label="Arquivado" variant="gray" />
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            ID: #{project.id.slice(0, 8)} • Criado em{" "}
            {formatDate(project.createdAt)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {project.status === "PENDING" && (
            <Button onClick={() => setIsProcessingModalOpen(true)}>
              <Play className="h-4 w-4" />
              Iniciar Processamento
            </Button>
          )}
          {project.status === "PROCESSING" && (
            <Button onClick={handleFinalizeProject}>
              <CheckCircle className="h-4 w-4" />
              Finalizar Projeto
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setIsArchiveModalOpen(true)}
            disabled={project.isArchived}
          >
            <Archive className="h-4 w-4" />
            {project.isArchived ? "Arquivado" : "Arquivar"}
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
              {!project.isPaid && (
                <div className="ml-auto">
                  <Button
                    size="sm"
                    onClick={handleRegisterPayment}
                    loading={isRegisteringPayment}
                  >
                    Registrar Pagamento
                  </Button>
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

      {/* Archive Modal */}
      <ArchiveConfirmModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveProject}
        isArchiving={isArchiving}
        projectName={project.name}
      />

      {/* Start Processing Modal */}
      <StartProcessingModal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
        project={project}
        onSave={handleStartProcessing}
      />
    </div>
  );
}
