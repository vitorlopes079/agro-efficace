"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Archive, Play, CheckCircle, XCircle, Trash2 } from "lucide-react";
import {
  StatusBadge,
  Button,
  ConfirmDialog,
  LoadingSpinner,
} from "@/components/ui";
import {
  ProjectInfoCard,
  ProjectUserCard,
  statusConfig,
  formatDate,
} from "@/components/project";
import { ArchiveConfirmModal, StartProcessingModal } from "@/components/admin/modals";
import {
  ProjectPaymentSummaryCard,
  ProjectInputFilesSection,
  ProjectOutputFilesSection,
} from "@/components/admin/project-detail";
import { useAdminProjectDetail } from "@/hooks/useAdminProjectDetail";
import { useProjectFileGrouping } from "@/hooks/useProjectFileGrouping";

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    project,
    isLoading,
    error,
    isArchiving,
    isRegisteringPayment,
    isCanceling,
    isDeleting,
    handleStartProcessing,
    handleRegisterPayment,
    handleArchiveProject,
    handleCancelProject,
    handleDeleteProject,
    handleFinalizeProject,
  } = useAdminProjectDetail(params.id);

  const {
    inputFiles,
    outputFiles,
    outputDJI,
    outputOrtomosaic,
    outputRelatorio,
    outputDaninhas,
    outputObstaculos,
    outputPerimetros,
    outputOutros,
  } = useProjectFileGrouping(project);

  const handleDownloadInputZip = () => {
    if (!project) return;
    window.open(`/api/projects/${project.id}/download/input-zip`, "_blank");
  };

  const handleDownloadOutputZip = () => {
    if (!project) return;
    window.open(`/api/projects/${project.id}/download/output-zip`, "_blank");
  };

  const handleArchiveConfirm = async () => {
    await handleArchiveProject();
    setIsArchiveModalOpen(false);
  };

  const handleCancelConfirm = async () => {
    await handleCancelProject();
    setShowCancelDialog(false);
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando projeto..." minHeight="400px" />;
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
          {project.status !== "CANCELLED" && (
            <Button
              variant="secondary"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="h-4 w-4" />
              Cancelar Projeto
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
          <Button
            variant="secondary"
            onClick={() => setShowDeleteDialog(true)}
            className="border-red-800 text-red-400 hover:bg-red-500/10 hover:border-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Deletar Projeto
          </Button>
        </div>
      </div>

      {/* Payment Summary Card */}
      <div className="mb-8">
        <ProjectPaymentSummaryCard
          project={project}
          onRegisterPayment={handleRegisterPayment}
          isRegisteringPayment={isRegisteringPayment}
        />
      </div>

      {/* Project Details Grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectInfoCard project={project} showPaymentInfo={false} />
        </div>
        <ProjectUserCard user={project.user} />
      </div>

      {/* Input Files Section */}
      <ProjectInputFilesSection
        project={project}
        hasInputFiles={inputFiles.length > 0}
        hasOutputFiles={outputFiles.length > 0}
        onDownloadInputZip={handleDownloadInputZip}
        onDownloadOutputZip={handleDownloadOutputZip}
      />

      {/* Output Files Section */}
      {project.status === "COMPLETED" && outputFiles.length > 0 && (
        <ProjectOutputFilesSection
          projectId={project.id}
          outputDJI={outputDJI}
          outputOrtomosaic={outputOrtomosaic}
          outputRelatorio={outputRelatorio}
          outputDaninhas={outputDaninhas}
          outputObstaculos={outputObstaculos}
          outputPerimetros={outputPerimetros}
          outputOutros={outputOutros}
        />
      )}

      {/* Archive Modal */}
      <ArchiveConfirmModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveConfirm}
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

      {/* Cancel Project Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelConfirm}
        title="Cancelar Projeto"
        description={
          <>
            Tem certeza que deseja cancelar o projeto{" "}
            <strong>{project.name}</strong>?
            <br />
            <br />
            O status será alterado para <strong>Cancelado</strong>. Os arquivos
            permanecerão no armazenamento e você poderá reativar o projeto
            posteriormente se necessário.
          </>
        }
        confirmText="Cancelar Projeto"
        cancelText="Voltar"
        variant="warning"
        isLoading={isCanceling}
      />

      {/* Delete Project Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteProject}
        title="Deletar Projeto Permanentemente"
        description={
          <>
            <strong className="text-red-400">⚠️ ATENÇÃO: Esta ação é irreversível!</strong>
            <br />
            <br />
            Você está prestes a deletar permanentemente o projeto{" "}
            <strong>{project.name}</strong>.
            <br />
            <br />
            Isso irá:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>Remover todos os arquivos do armazenamento (R2)</li>
              <li>Deletar o projeto e seus dados do banco de dados</li>
              <li>Impossibilitar a recuperação dos dados</li>
            </ul>
            <br />
            <strong>Esta ação não pode ser desfeita.</strong>
          </>
        }
        confirmText="Deletar Permanentemente"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
