"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowLeft, File, CheckCircle } from "lucide-react";
import { StatusBadge, Button, LoadingSpinner } from "@/components/ui";
import {
  ProjectInfoCard,
  ProjectUserCard,
  FileList,
  MapIcon,
  PolygonIcon,
} from "@/components/project";
import { statusConfig } from "@/lib/constants/status-configs";
import { formatDate } from "@/lib/utils/formatters";
import type { ProjectData } from "@/lib/types/project";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${id}`);
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

  if (isLoading) {
    return <LoadingSpinner text="Carregando projeto..." minHeight="400px" />;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-350 px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-red-400">{error}</p>
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  const statusInfo = statusConfig[project.status] || {
    label: project.status,
    variant: "gray" as const,
  };

  // Filter and group files
  const inputFiles = project.files.filter((f) => f.fileCategory.startsWith("INPUT_"));
  const outputFiles = project.files.filter((f) => f.fileCategory.startsWith("OUTPUT_"));

  // Output file categories
  const outputDJI = outputFiles.filter((f) => f.fileCategory === "OUTPUT_DJI_SHAPEFILE");
  const outputOrtomosaic = outputFiles.filter((f) => f.fileCategory === "OUTPUT_ORTOMOSAIC");
  const outputRelatorio = outputFiles.filter((f) => f.fileCategory === "OUTPUT_RELATORIO");
  const outputDaninhas = outputFiles.filter((f) => f.fileCategory === "OUTPUT_SHAPEFILE_DANINHAS");
  const outputObstaculos = outputFiles.filter((f) => f.fileCategory === "OUTPUT_SHAPEFILE_OBSTACULOS");
  const outputPerimetros = outputFiles.filter((f) => f.fileCategory === "OUTPUT_SHAPEFILE_PERIMETROS");
  const outputOutros = outputFiles.filter((f) => f.fileCategory === "OUTPUT_OTHER");

  // ZIP download handlers
  const handleDownloadInputZip = () => {
    window.open(`/api/projects/${project.id}/download/input-zip`, "_blank");
  };

  const handleDownloadOutputZip = () => {
    window.open(`/api/projects/${project.id}/download/output-zip`, "_blank");
  };

  return (
    <main className="mx-auto max-w-350 px-6 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Link>
      </div>

      {/* Completion Notice Banner */}
      {project.status === "COMPLETED" && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">
                Projeto Finalizado
              </p>
              <p className="mt-1 text-sm text-green-300/80">
                Seu projeto foi concluído com sucesso! Você pode baixar a solução completa usando o botão &quot;Baixar Solução Completa&quot; na seção de arquivos abaixo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-white sm:text-2xl">{project.name}</h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            ID: #{project.id.slice(0, 8)} • Criado em {formatDate(project.createdAt)}
          </p>
        </div>
        <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
      </div>

      {/* Project Details Grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectInfoCard project={project} />
        </div>
        <ProjectUserCard user={project.user} />
      </div>

      {/* Input Files Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <h2 className="text-base font-semibold text-white sm:text-lg">Arquivos de Entrada</h2>
          <div className="flex gap-2">
            {inputFiles.length > 0 && (
              <button
                onClick={handleDownloadInputZip}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white sm:gap-2 sm:px-4"
              >
                <ArrowDown className="h-4 w-4" />
                <span className="sm:hidden">Cliente</span>
                <span className="hidden sm:inline">Baixar Arquivos do Cliente</span>
              </button>
            )}
            {project.status === "COMPLETED" && outputFiles.length > 0 && (
              <button
                onClick={handleDownloadOutputZip}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white sm:gap-2 sm:px-4"
              >
                <ArrowDown className="h-4 w-4" />
                <span className="sm:hidden">Solução</span>
                <span className="hidden sm:inline">Baixar Solução Completa</span>
              </button>
            )}
          </div>
        </div>

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
            icon={<File className="h-5 w-5 text-zinc-400" />}
            title="Outros Arquivos"
            emptyMessage="Nenhum arquivo adicional"
          />
        )}
      </div>

      {/* Output Files Section */}
      {project.status === "COMPLETED" && outputFiles.length > 0 && (
        <div className="mt-8 space-y-6">
          <h2 className="text-base font-semibold text-white sm:text-lg">Arquivos de Saída</h2>

          <div className="grid gap-6 lg:grid-cols-2">
            {outputDJI.length > 0 && (
              <FileList
                files={outputDJI}
                projectId={project.id}
                icon={<File className="h-5 w-5 text-zinc-400" />}
                title="DJI Shapefile"
                emptyMessage="Nenhum arquivo DJI"
              />
            )}

            {outputOrtomosaic.length > 0 && (
              <FileList
                files={outputOrtomosaic}
                projectId={project.id}
                icon={<MapIcon />}
                title="Ortomosaico Processado"
                emptyMessage="Nenhum ortomosaico processado"
              />
            )}

            {outputRelatorio.length > 0 && (
              <FileList
                files={outputRelatorio}
                projectId={project.id}
                icon={<File className="h-5 w-5 text-zinc-400" />}
                title="Relatórios"
                emptyMessage="Nenhum relatório"
              />
            )}

            {outputDaninhas.length > 0 && (
              <FileList
                files={outputDaninhas}
                projectId={project.id}
                icon={<PolygonIcon />}
                title="Shapefile - Daninhas"
                emptyMessage="Nenhum shapefile de daninhas"
              />
            )}

            {outputObstaculos.length > 0 && (
              <FileList
                files={outputObstaculos}
                projectId={project.id}
                icon={<PolygonIcon />}
                title="Shapefile - Obstáculos"
                emptyMessage="Nenhum shapefile de obstáculos"
              />
            )}

            {outputPerimetros.length > 0 && (
              <FileList
                files={outputPerimetros}
                projectId={project.id}
                icon={<PolygonIcon />}
                title="Shapefile - Perímetros"
                emptyMessage="Nenhum shapefile de perímetros"
              />
            )}

            {outputOutros.length > 0 && (
              <FileList
                files={outputOutros}
                projectId={project.id}
                icon={<File className="h-5 w-5 text-zinc-400" />}
                title="Outros Arquivos"
                emptyMessage="Nenhum arquivo adicional"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
