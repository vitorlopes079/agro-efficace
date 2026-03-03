"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Plus } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  LoadingSpinner,
  useToast,
  FinalizingProjectOverlay,
} from "@/components/ui";
import { useDynamicFinalizeUploads } from "@/hooks/useDynamicFinalizeUploads";
import { DynamicUploadSection } from "@/components/admin/finalize/DynamicUploadSection";

export default function FinalizeProjectPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadState, setUploadState] = useState({
    isAnyUploading: false,
    hasAnyErrors: false,
    totalCompletedFiles: 0,
  });

  const {
    sections,
    addSection,
    removeSection,
    updateSectionTitle,
    registerSectionFiles,
    getAllCompletedFiles,
    getUploadingState,
    validateSections,
  } = useDynamicFinalizeUploads();

  // Update upload state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setUploadState(getUploadingState());
    }, 500);
    return () => clearInterval(interval);
  }, [getUploadingState]);

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

  const handleFilesChange = useCallback(
    (sectionId: string, files: import("@/hooks/useFileUpload").FileItem[]) => {
      registerSectionFiles(sectionId, files);
    },
    [registerSectionFiles]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate sections have titles
    const validation = validateSections();
    if (!validation.isValid) {
      toast.error(
        "Seções sem nome",
        "Todas as seções com arquivos precisam ter um nome"
      );
      return;
    }

    // Collect all completed files
    const allFiles = getAllCompletedFiles();

    // Validate at least one file
    if (allFiles.length === 0) {
      toast.error(
        "Nenhum arquivo enviado",
        "Adicione pelo menos um arquivo para finalizar o projeto"
      );
      return;
    }

    // Check if any uploads are still in progress
    if (uploadState.isAnyUploading) {
      toast.error(
        "Upload em andamento",
        "Aguarde todos os arquivos terminarem de fazer upload"
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
        `${allFiles.length} arquivo(s) processado(s) com sucesso`
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
            <CheckCircle className="h-6 w-6 text-green-500 sm:h-8 sm:w-8" />
            <div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Finalizar Projeto
              </h1>
              <p className="mt-1 text-xs text-zinc-400 sm:text-sm">{projectName}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-400 sm:text-sm">
            Faça upload dos arquivos processados para entregar ao cliente. Os
            arquivos serão organizados pelo nome das seções que você definir.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dynamic Upload Sections */}
          {sections.map((section) => (
            <DynamicUploadSection
              key={section.id}
              sectionId={section.id}
              title={section.title}
              onTitleChange={(title) => updateSectionTitle(section.id, title)}
              onRemove={() => removeSection(section.id)}
              onFilesChange={handleFilesChange}
              canRemove={sections.length > 1}
              disabled={isSubmitting}
            />
          ))}

          {/* Add Section Button */}
          <Button
            type="button"
            variant="secondary"
            onClick={addSection}
            disabled={isSubmitting}
            fullWidth
            className="border-2 border-dashed border-zinc-700 bg-transparent hover:border-zinc-600 hover:bg-zinc-800/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Seção
          </Button>

          {/* Summary */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Total de arquivos
                  </p>
                  <p className="text-xs text-zinc-500">
                    {uploadState.totalCompletedFiles} arquivo(s) pronto(s) para envio
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/admin/projects/${params.id}`)}
              disabled={isSubmitting || uploadState.isAnyUploading}
              fullWidth
              className="sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploadState.isAnyUploading || uploadState.hasAnyErrors}
              fullWidth
              className="sm:w-auto"
            >
              {isSubmitting
                ? "Finalizando..."
                : uploadState.isAnyUploading
                  ? "Aguarde o upload..."
                  : "Finalizar e Enviar"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
