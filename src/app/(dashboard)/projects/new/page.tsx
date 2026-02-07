// src/app/(dashboard)/projects/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, FileText } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from "@/components/ui";

interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
}

const projectTypes = [
  { value: "daninhas", label: "Daninhas" },
  { value: "falhas", label: "Falhas" },
  { value: "restituicao", label: "Restituição" },
  { value: "mapeamento", label: "Mapeamento" },
];

const cultures = [
  { value: "cana", label: "Cana" },
  { value: "milho", label: "Milho" },
  { value: "soja", label: "Soja" },
  { value: "eucalipto", label: "Eucalipto" },
  { value: "cafe", label: "Café" },
  { value: "algodao", label: "Algodão" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);

  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "",
    culture: "",
    notes: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileItem[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: API integration
    console.log("Form data:", formData);
    console.log("Files:", files);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    // router.push("/dashboard");
  };

  const inputClassName =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white">Novo Envio</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Preencha os dados do projeto para iniciar o processamento
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Name */}
            <Input
              label="Nome do Projeto / Fazenda"
              name="projectName"
              value={formData.projectName}
              onChange={handleInputChange}
              placeholder="Ex: Fazenda Santa Rita"
              required
            />

            {/* Project Type */}
            <Select
              label="Tipo de Projeto"
              name="projectType"
              value={formData.projectType}
              onChange={handleInputChange}
              options={projectTypes}
              placeholder="Selecione o tipo"
              required
            />

            {/* Culture */}
            <Select
              label="Cultura"
              name="culture"
              value={formData.culture}
              onChange={handleInputChange}
              options={cultures}
              placeholder="Selecione a cultura"
              required
            />
          </CardContent>
        </Card>

        {/* File Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Arquivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-6 py-10 transition-colors hover:border-green-500/50 hover:bg-zinc-800">
              <Upload className="mb-3 h-10 w-10 text-zinc-500" />
              <p className="text-sm font-medium text-zinc-300">
                Clique para enviar ou arraste os arquivos
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Suporta: TIF, TIFF, SHP, KML, GeoJSON (máx. 500MB)
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".tif,.tiff,.shp,.kml,.geojson,.json"
              />
            </label>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">
                  Arquivos selecionados ({files.length})
                </p>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-zinc-400" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-zinc-500">{file.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Informações adicionais sobre o projeto..."
              className={`${inputClassName} resize-none`}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Criar Projeto"}
          </Button>
        </div>
      </form>
    </main>
  );
}
