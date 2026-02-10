"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge, Button } from "@/components/ui";
import {
  ProjectInfoCard,
  ProjectUserCard,
  FileList,
  MapIcon,
  PolygonIcon,
  statusConfig,
  formatDate,
} from "@/components/project";
import type { ProjectData } from "@/components/project";

const ArrowLeftIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

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
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-zinc-400">Carregando projeto...</div>
      </div>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-[1400px] px-6 py-8">
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

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeftIcon />
          Voltar ao Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
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
    </main>
  );
}
