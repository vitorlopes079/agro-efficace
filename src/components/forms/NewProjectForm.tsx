// src/app/(dashboard)/projects/new/NewProjectForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, CreatingProjectOverlay, useToast } from "@/components/ui";
import { usePermissions } from "@/providers/PermissionProvider";
import { useProjectFormState } from "@/hooks/useProjectFormState";
import { useMultipleFileUploads } from "@/hooks/useMultipleFileUploads";
import { DualFileUploadSection } from "./project-form/DualFileUploadSection";
import {
  BlockedAccessMessage,
  ProjectInfoSection,
  FileUploadSection,
  NotesSection,
} from "./project-form";

interface FormOption {
  value: string;
  label: string;
}

interface NewProjectFormProps {
  initialData: {
    projectTypes: FormOption[];
    cultures: FormOption[];
  };
}

interface SelectedUser {
  id: string;
  name: string;
  email: string;
}

export function NewProjectForm({ initialData }: NewProjectFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { canUpload } = usePermissions();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const backUrl = isAdmin ? "/admin/projects" : "/dashboard";

  const { formData, handleInputChange } = useProjectFormState();
  const uploads = useMultipleFileUploads();

  const handleOrtomosaicoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      await uploads.ortomosaico.addFiles(e.target.files);
    }
  };

  const handleFotosChange = async (
    // ← NOVO
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      await uploads.fotos.addFiles(e.target.files);
    }
  };

  const handlePerimetroChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      await uploads.perimetro.addFiles(e.target.files);
    }
  };

  const handleOutrosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploads.outros.addFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (isAdmin && !selectedUser) {
      setError("Selecione o proprietário do projeto");
      return;
    }

    // ← ATUALIZADO: ortomosaico OU fotos são válidos
    if (
      uploads.ortomosaico.completedFiles.length === 0 &&
      uploads.fotos.completedFiles.length === 0
    ) {
      setError("É necessário enviar o ortomosaico ou as fotos do drone");
      return;
    }

    if (uploads.isUploading) {
      setError("Aguarde os arquivos terminarem de fazer upload");
      return;
    }

    setIsSubmitting(true);

    try {
      const completedFiles = uploads.getAllCompletedFiles();

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: formData.projectName,
          projectType: formData.projectType.toUpperCase(),
          culture: formData.culture.toUpperCase(),
          notes: formData.notes || null,
          ...(isAdmin && selectedUser ? { userId: selectedUser.id } : {}),
          files: [
            ...completedFiles.ortomosaico.map((f) => ({
              fileKey: f.fileKey,
              pendingUploadId: f.pendingUploadId,
              category: "INPUT_ORTOMOSAICO",
            })),
            // ← NOVO
            ...completedFiles.fotos.map((f) => ({
              fileKey: f.fileKey,
              pendingUploadId: f.pendingUploadId,
              category: "INPUT_FOTOS",
            })),
            ...completedFiles.perimetro.map((f) => ({
              fileKey: f.fileKey,
              pendingUploadId: f.pendingUploadId,
              category: "INPUT_PERIMETRO",
            })),
            ...completedFiles.outros.map((f) => ({
              fileKey: f.fileKey,
              pendingUploadId: f.pendingUploadId,
              category: "INPUT_OTHER",
            })),
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsSubmitting(false);
        setError(data.error || "Erro ao criar projeto");
        toast.error(
          "Erro ao criar projeto",
          data.error || "Ocorreu um erro ao processar sua solicitação.",
        );
        return;
      }

      toast.success(
        "Projeto criado com sucesso!",
        "Seu projeto foi enviado para processamento.",
      );
      router.push(backUrl);
    } catch (error) {
      console.error("Error creating project:", error);
      setIsSubmitting(false);
      setError("Erro ao conectar com o servidor");
      toast.error(
        "Erro de conexão",
        "Não foi possível conectar com o servidor. Tente novamente.",
      );
    }
  };

  if (!canUpload && !isAdmin) {
    return (
      <BlockedAccessMessage
        backUrl={backUrl}
        onBackClick={() => router.push(backUrl)}
      />
    );
  }

  return (
    <>
      {isSubmitting && <CreatingProjectOverlay />}

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <Link
            href={backUrl}
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-white">Novo Envio</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Preencha os dados do projeto para iniciar o processamento
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <ProjectInfoSection
            formData={formData}
            projectTypes={initialData.projectTypes}
            cultures={initialData.cultures}
            isAdmin={isAdmin}
            selectedUser={selectedUser}
            onSelectedUserChange={setSelectedUser}
            onInputChange={handleInputChange}
            disabled={isSubmitting}
          />

          {/* ← SUBSTITUIU os dois FileUploadSection separados */}
          <DualFileUploadSection
            title="Ortomosaico ou Fotos"
            required={true}
            leftUpload={{
              description: "Upload do Ortomosaico",
              fileTypes: "TIF, TIFF, ECW",
              files: uploads.ortomosaico.files,
              onChange: handleOrtomosaicoChange,
              onRemove: uploads.ortomosaico.removeFile,
              hoverBorderColor: "hover:border-green-500/50",
            }}
            rightUpload={{
              description: "Upload das Fotos",
              fileTypes: "ZIP, RAR, 7Z",
              files: uploads.fotos.files,
              onChange: handleFotosChange,
              onRemove: uploads.fotos.removeFile,
              hoverBorderColor: "hover:border-blue-500/50",
            }}
            disabled={isSubmitting}
          />

          <FileUploadSection
            title="Perímetros de Análise"
            required={false}
            description="Upload dos Perímetros"
            fileTypes="SHP, KML, GeoJSON (Shapefiles e vetores)"
            files={uploads.perimetro.files}
            onFileChange={handlePerimetroChange}
            onRemoveFile={uploads.perimetro.removeFile}
            hoverBorderColor="hover:border-blue-500/50"
            disabled={isSubmitting}
          />

          <FileUploadSection
            title="Outros Arquivos"
            required={false}
            description="Upload de Outros Arquivos"
            fileTypes="Arquivos adicionais do projeto"
            files={uploads.outros.files}
            onFileChange={handleOutrosChange}
            onRemoveFile={uploads.outros.removeFile}
            disabled={isSubmitting}
          />

          <NotesSection
            value={formData.notes}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(backUrl)}
              disabled={isSubmitting || uploads.isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || uploads.isUploading || uploads.hasErrors
              }
            >
              {isSubmitting
                ? "Criando..."
                : uploads.isUploading
                  ? "Aguarde o upload..."
                  : "Criar Projeto"}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
