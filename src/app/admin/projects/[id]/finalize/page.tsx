"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSpinner,
  useToast,
  FinalizingProjectOverlay,
} from "@/components/ui";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileUploadItem } from "@/components/FileUploadItem/FileUploadItem";

interface UploadSection {
  id: string;
  title: string;
  description: string;
  acceptedTypes: string;
}

export default function FinalizeProjectPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload hooks for each section
  const djiShapefile = useFileUpload();
  const ortomosaic = useFileUpload();
  const reports = useFileUpload();
  const shapefileWeeds = useFileUpload();
  const shapefileObstacles = useFileUpload();
  const shapefilePerimeters = useFileUpload();
  const outros = useFileUpload();

  // Upload sections matching the folder structure
  const uploadSections: UploadSection[] = [
    {
      id: "dji-shapefile",
      title: "DJI / SHAPEFILE",
      description: "Buffers do drone DJI",
      acceptedTypes: ".shp, .shx, .dbf, .prj, .cpg, .qmd",
    },
    {
      id: "ortomosaic",
      title: "ORTOMOSAICO COMPRIMIDO",
      description: "Ortomosaico comprimido da área mapeada",
      acceptedTypes: ".ecw, .tif, .tiff",
    },
    {
      id: "reports",
      title: "RELATÓRIOS",
      description: "Relatórios de análise e resultados",
      acceptedTypes: ".pdf, .doc, .docx",
    },
    {
      id: "shapefile-weeds",
      title: "SHAPEFILE / Daninhas Folha Larga",
      description: "Mapeamento de plantas daninhas de folha larga",
      acceptedTypes: ".shp, .shx, .dbf, .prj, .cpg",
    },
    {
      id: "shapefile-obstacles",
      title: "SHAPEFILE / Obstáculos",
      description: "Mapeamento de obstáculos na área",
      acceptedTypes: ".shp, .shx, .dbf, .prj, .cpg, .qmd",
    },
    {
      id: "shapefile-perimeters",
      title: "SHAPEFILE / Perímetros",
      description: "Delimitação de talhões e perímetros",
      acceptedTypes: ".shp, .shx, .dbf, .prj, .cpg",
    },
    {
      id: "outros",
      title: "OUTROS ARQUIVOS",
      description: "Arquivos adicionais do projeto",
      acceptedTypes: "Todos os tipos de arquivo",
    },
  ];

  // Map section IDs to their upload hooks
  const getSectionHook = (sectionId: string) => {
    switch (sectionId) {
      case "dji-shapefile":
        return djiShapefile;
      case "ortomosaic":
        return ortomosaic;
      case "reports":
        return reports;
      case "shapefile-weeds":
        return shapefileWeeds;
      case "shapefile-obstacles":
        return shapefileObstacles;
      case "shapefile-perimeters":
        return shapefilePerimeters;
      case "outros":
        return outros;
      default:
        return djiShapefile;
    }
  };

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
    sectionId: string,
    files: FileList | null,
  ) => {
    if (!files) return;
    const hook = getSectionHook(sectionId);
    await hook.addFiles(files);
  };

  const handleRemoveFile = (sectionId: string, fileId: string) => {
    const hook = getSectionHook(sectionId);
    hook.removeFile(fileId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Category mapping
    const categoryMapping: Record<string, string> = {
      "dji-shapefile": "OUTPUT_DJI_SHAPEFILE",
      ortomosaic: "OUTPUT_ORTOMOSAIC",
      reports: "OUTPUT_RELATORIO",
      "shapefile-weeds": "OUTPUT_SHAPEFILE_DANINHAS",
      "shapefile-obstacles": "OUTPUT_SHAPEFILE_OBSTACULOS",
      "shapefile-perimeters": "OUTPUT_SHAPEFILE_PERIMETROS",
      outros: "OUTPUT_OTHER",
    };

    // Collect all completed files from all sections
    const allFiles: Array<{
      pendingUploadId: string;
      category: string;
      sectionId: string;
    }> = [];

    uploadSections.forEach((section) => {
      const hook = getSectionHook(section.id);
      hook.completedFiles.forEach((file) => {
        if (file.pendingUploadId) {
          allFiles.push({
            pendingUploadId: file.pendingUploadId,
            category: categoryMapping[section.id],
            sectionId: section.id,
          });
        }
      });
    });

    // Validate at least one file
    if (allFiles.length === 0) {
      toast.error(
        "Nenhum arquivo enviado",
        "Adicione pelo menos um arquivo para finalizar o projeto",
      );
      return;
    }

    // Check if any uploads are still in progress
    const isAnyUploading = [
      djiShapefile,
      ortomosaic,
      reports,
      shapefileWeeds,
      shapefileObstacles,
      shapefilePerimeters,
      outros,
    ].some((hook) => hook.isUploading);

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

  // Check if any uploads are in progress
  const isAnyUploading = [
    djiShapefile,
    ortomosaic,
    reports,
    shapefileWeeds,
    shapefileObstacles,
    shapefilePerimeters,
    outros,
  ].some((hook) => hook.isUploading);

  const hasAnyErrors = [
    djiShapefile,
    ortomosaic,
    reports,
    shapefileWeeds,
    shapefileObstacles,
    shapefilePerimeters,
    outros,
  ].some((hook) => hook.hasErrors);

  // Calculate total files
  const totalCompletedFiles = [
    djiShapefile,
    ortomosaic,
    reports,
    shapefileWeeds,
    shapefileObstacles,
    shapefilePerimeters,
    outros,
  ].reduce((acc, hook) => acc + hook.completedFiles.length, 0);

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
          {uploadSections.map((section) => {
            const hook = getSectionHook(section.id);
            return (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <p className="text-sm text-zinc-400">{section.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <label
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
                      hook.files.length > 0
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
                    }`}
                  >
                    <Upload
                      className={`mb-3 h-8 w-8 ${
                        hook.files.length > 0 ? "text-green-500" : "text-zinc-500"
                      }`}
                    />
                    <p className="text-sm font-medium text-zinc-300">
                      {hook.files.length > 0
                        ? `${hook.files.length} arquivo(s) selecionado(s)`
                        : "Clique ou arraste arquivos aqui"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Tipos aceitos: {section.acceptedTypes}
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileChange(section.id, e.target.files)}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </label>

                  {/* File List */}
                  {hook.files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-300">
                        Arquivos: {hook.files.length}
                      </p>
                      {hook.files.map((file) => (
                        <FileUploadItem
                          key={file.id}
                          file={file}
                          onRemove={() => handleRemoveFile(section.id, file.id)}
                          disabled={isSubmitting}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
