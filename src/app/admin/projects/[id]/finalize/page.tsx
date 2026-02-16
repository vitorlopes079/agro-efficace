"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  LoadingSpinner,
  useToast,
  FinalizingProjectOverlay,
} from "@/components/ui";
import { useFinalizeProjectUploads } from "@/hooks/useFinalizeProjectUploads";
import { finalizeUploadSections } from "@/lib/config/finalize-upload-sections";
import { FinalizeUploadSection } from "@/components/admin/finalize";
import type { UploadSectionId } from "@/hooks/useFinalizeProjectUploads";

export default function FinalizeProjectPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage all upload sections
  const {
    getUploadHook,
    isAnyUploading,
    hasAnyErrors,
    totalCompletedFiles,
    getAllCompletedFiles,
  } = useFinalizeProjectUploads();

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${id}`);
      const data = await response.json();

      if (response.ok) {
        setProjectName(data.project.name);
      } else {
        toast.error("Erro ao carregar projeto");
        router.push("/admin/projects");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Erro ao carregar projeto");
      router.push("/admin/projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (
    sectionId: UploadSectionId,
    files: FileList | null,
  ) => {
    if (!files) return;
    const hook = getUploadHook(sectionId);
    await hook.addFiles(files);
  };

  const handleRemoveFile = (sectionId: UploadSectionId, fileId: string) => {
    const hook = getUploadHook(sectionId);
    hook.removeFile(fileId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Collect all completed files from all sections
    const allFiles = getAllCompletedFiles();

    // Validate at least one file
    if (allFiles.length === 0) {
      toast.error(
        "Nenhum arquivo enviado",
        "Adicione pelo menos um arquivo para finalizar o projeto",
      );
      return;
    }

    // Check if any uploads are still in progress
    if (isAnyUploading) {
      toast.error(
        "Upload em andamento",
        "Aguarde todos os arquivos terminarem de fazer upload",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${params.id}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: allFiles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Erro ao finalizar projeto", data.error || "Erro desconhecido");
        setIsSubmitting(false);
        return;
      }

      toast.success(
        "Projeto finalizado!",
        `${allFiles.length} arquivo(s) processado(s) com sucesso`,
      );
      router.push(`/admin/projects/${params.id}`);
    } catch (error) {
      console.error("Error finalizing project:", error);
      toast.error("Erro ao conectar com o servidor");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando projeto..." minHeight="400px" />;
  }

  return (
    <>
      {/* Loading Overlay */}
      {isSubmitting && <FinalizingProjectOverlay />}

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/projects/${params.id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Projeto
          </Link>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Finalizar Projeto
              </h1>
              <p className="mt-1 text-sm text-zinc-400">{projectName}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            Faça upload dos arquivos processados para entregar ao cliente. Os
            arquivos serão organizados e disponibilizados para download.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Sections */}
          {finalizeUploadSections.map((section) => {
            const hook = getUploadHook(section.id as UploadSectionId);
            return (
              <FinalizeUploadSection
                key={section.id}
                section={section}
                files={hook.files}
                onFileChange={(files) =>
                  handleFileChange(section.id as UploadSectionId, files)
                }
                onRemoveFile={(fileId) =>
                  handleRemoveFile(section.id as UploadSectionId, fileId)
                }
                disabled={isSubmitting}
              />
            );
          })}

          {/* Summary */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Total de arquivos
                  </p>
                  <p className="text-xs text-zinc-500">
                    {totalCompletedFiles} arquivo(s) pronto(s) para envio
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/admin/projects/${params.id}`)}
              disabled={isSubmitting || isAnyUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isAnyUploading || hasAnyErrors}
            >
              {isSubmitting
                ? "Finalizando..."
                : isAnyUploading
                  ? "Aguarde o upload..."
                  : "Finalizar e Enviar"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
