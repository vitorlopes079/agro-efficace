// src/app/(dashboard)/projects/new/NewProjectForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Upload, ShieldX } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CreatingProjectOverlay,
  Input,
  Select,
  useToast,
} from "@/components/ui";
import { usePermissions } from "@/providers/PermissionProvider";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileUploadItem } from "@/components/FileUploadItem/FileUploadItem";
import { UserSearchSelect } from "@/components/admin/UserSearchSelect";

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

  // Hook separado para Ortomosaico
  const {
    files: ortomosaicoFiles,
    addFiles: addOrtomosaicoFiles,
    removeFile: removeOrtomosaicoFile,
    isUploading: isUploadingOrtomosaico,
    hasErrors: hasErrorsOrtomosaico,
    completedFiles: completedOrtomosaicoFiles,
  } = useFileUpload();

  // Hook separado para Perímetros
  const {
    files: perimetroFiles,
    addFiles: addPerimetroFiles,
    removeFile: removePerimetroFile,
    isUploading: isUploadingPerimetro,
    hasErrors: hasErrorsPerimetro,
    completedFiles: completedPerimetroFiles,
  } = useFileUpload();

  // Hook separado para Outros Arquivos
  const {
    files: outrosFiles,
    addFiles: addOutrosFiles,
    removeFile: removeOutrosFile,
    isUploading: isUploadingOutros,
    hasErrors: hasErrorsOutros,
    completedFiles: completedOutrosFiles,
  } = useFileUpload();

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

  const handleOrtomosaicoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      await addOrtomosaicoFiles(e.target.files);
    }
  };

  const handlePerimetroChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      await addPerimetroFiles(e.target.files);
    }
  };

  const handleOutrosChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      await addOutrosFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Admin must select a user
    if (isAdmin && !selectedUser) {
      setError("Selecione o proprietário do projeto");
      return;
    }

    // Validar que tem pelo menos 1 ortomosaico
    if (completedOrtomosaicoFiles.length === 0) {
      setError("É necessário enviar pelo menos um ortomosaico");
      return;
    }

    // Verificar se ainda tem uploads pendentes
    if (isUploadingOrtomosaico || isUploadingPerimetro || isUploadingOutros) {
      setError("Aguarde os arquivos terminarem de fazer upload");
      return;
    }

    setIsSubmitting(true);

    try {
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
          // Include userId when admin creates for another user
          ...(isAdmin && selectedUser ? { userId: selectedUser.id } : {}),
          files: [
            // Ortomosaicos
            ...completedOrtomosaicoFiles.map((f) => ({
              fileKey: f.fileKey,
              pendingUploadId: f.pendingUploadId,
              category: "INPUT_ORTOMOSAICO",
            })),
            // Perímetros
            ...completedPerimetroFiles.map((f) => ({
              fileKey: f.fileKey,
              pendingUploadId: f.pendingUploadId,
              category: "INPUT_PERIMETRO",
            })),
            // Outros Arquivos
            ...completedOutrosFiles.map((f) => ({
              fileKey: f.fileKey,
              pendingUploadId: f.pendingUploadId,
              category: "INPUT_OTHER",
            })),
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // CRITICAL: Reset submitting state BEFORE showing error
        setIsSubmitting(false);
        setError(data.error || "Erro ao criar projeto");

        // Also show a toast for better visibility
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

      // CRITICAL: Reset submitting state BEFORE showing error
      setIsSubmitting(false);
      setError("Erro ao conectar com o servidor");

      // Also show a toast for better visibility
      toast.error(
        "Erro de conexão",
        "Não foi possível conectar com o servidor. Tente novamente.",
      );
    }
  };

  const isUploading = isUploadingOrtomosaico || isUploadingPerimetro || isUploadingOutros;
  const hasErrors = hasErrorsOrtomosaico || hasErrorsPerimetro || hasErrorsOutros;

  // If user can't upload (and is not admin), show blocked message
  if (!canUpload && !isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <Link
            href={backUrl}
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <ShieldX className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">
              Acesso Bloqueado
            </h2>
            <p className="mb-6 max-w-md text-center text-sm text-zinc-400">
              Sua permissão para criar novos projetos está temporariamente
              desativada. Entre em contato com o administrador para mais
              informações.
            </p>
            <Button variant="ghost" onClick={() => router.push(backUrl)}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
      {/* Loading Overlay */}
      {isSubmitting && <CreatingProjectOverlay />}

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
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
          {/* Error Message */}
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Project Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Selection - Admin Only */}
              {isAdmin && (
                <UserSearchSelect
                  value={selectedUser}
                  onChange={setSelectedUser}
                  disabled={isSubmitting}
                  required
                />
              )}

              <Input
                label="Nome do Projeto / Fazenda"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                placeholder="Ex: Fazenda Santa Rita"
                required
                disabled={isSubmitting}
              />

              <Select
                label="Tipo de Projeto"
                name="projectType"
                value={formData.projectType}
                onChange={handleInputChange}
                options={initialData.projectTypes}
                placeholder="Selecione o tipo"
                required
                disabled={isSubmitting}
              />

              <Select
                label="Cultura"
                name="culture"
                value={formData.culture}
                onChange={handleInputChange}
                options={initialData.cultures}
                placeholder="Selecione a cultura"
                required
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          {/* SEÇÃO 1: Ortomosaico */}
          <Card>
            <CardHeader>
              <CardTitle>
                Ortomosaico
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  (Obrigatório)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-6 py-10 transition-colors hover:border-green-500/50 hover:bg-zinc-800">
                <Upload className="mb-3 h-10 w-10 text-zinc-500" />
                <p className="text-sm font-medium text-zinc-300">
                  Upload do Ortomosaico
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  TIF, TIFF, ECW (Imagens georreferenciadas)
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleOrtomosaicoChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>

              {ortomosaicoFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-300">
                    Arquivos: {ortomosaicoFiles.length}
                  </p>
                  {ortomosaicoFiles.map((file) => (
                    <FileUploadItem
                      key={file.id}
                      file={file}
                      onRemove={removeOrtomosaicoFile}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEÇÃO 2: Perímetros de Análise */}
          <Card>
            <CardHeader>
              <CardTitle>
                Perímetros de Análise
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  (Opcional)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-6 py-10 transition-colors hover:border-blue-500/50 hover:bg-zinc-800">
                <Upload className="mb-3 h-10 w-10 text-zinc-500" />
                <p className="text-sm font-medium text-zinc-300">
                  Upload dos Perímetros
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  SHP, KML, GeoJSON (Shapefiles e vetores)
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handlePerimetroChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>

              {perimetroFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-300">
                    Arquivos: {perimetroFiles.length}
                  </p>
                  {perimetroFiles.map((file) => (
                    <FileUploadItem
                      key={file.id}
                      file={file}
                      onRemove={removePerimetroFile}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEÇÃO 3: Outros Arquivos */}
          <Card>
            <CardHeader>
              <CardTitle>
                Outros Arquivos
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  (Opcional)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 px-6 py-10 transition-colors hover:border-zinc-500/50 hover:bg-zinc-800">
                <Upload className="mb-3 h-10 w-10 text-zinc-500" />
                <p className="text-sm font-medium text-zinc-300">
                  Upload de Outros Arquivos
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Arquivos adicionais do projeto
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleOutrosChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>

              {outrosFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-300">
                    Arquivos: {outrosFiles.length}
                  </p>
                  {outrosFiles.map((file) => (
                    <FileUploadItem
                      key={file.id}
                      file={file}
                      onRemove={removeOutrosFile}
                      disabled={isSubmitting}
                    />
                  ))}
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
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(backUrl)}
              disabled={isSubmitting || isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || hasErrors}
            >
              {isSubmitting
                ? "Criando..."
                : isUploading
                  ? "Aguarde o upload..."
                  : "Criar Projeto"}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
