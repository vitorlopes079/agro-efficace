"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  ConfirmDialog,
  LoadingSpinner,
} from "@/components/ui";
import {
  Plus,
  Trash2,
  Save,
  HardDrive,
  AlertTriangle,
  FileWarning,
  RefreshCw,
  User,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ConfigItem {
  id: string;
  key: string;
  label: string;
}

interface OrphanFile {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileKey: string;
  createdAt: string;
  expiresAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface OrphanSummary {
  totalFiles: number;
  totalSizeBytes: string;
  totalSizeMb: string;
  totalSizeGb: string;
  byUser: {
    user: { id: string; name: string; email: string };
    count: number;
    totalSizeMb: string;
  }[];
}

function generateKey(label: string): string {
  return label
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "_");
}

function ConfigSection({
  title,
  description,
  items,
  onAdd,
  onRemove,
  onUpdate,
}: {
  title: string;
  description: string;
  items: ConfigItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, label: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-zinc-500">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-900/30 px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-zinc-600 w-4">{index + 1}</span>
                <Input
                  value={item.label}
                  onChange={(e) => onUpdate(item.id, e.target.value)}
                  className="flex-1 border-0 bg-transparent px-2 py-0.5 text-sm h-7 focus:bg-zinc-800/50"
                  placeholder="Nome"
                />
              </div>
              <button
                type="button" // ← ADD THIS
                onClick={() => onRemove(item.id)}
                className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 shrink-0"
                title="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <Button
          onClick={onAdd}
          variant="secondary"
          size="sm"
          className="mt-3 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const [projectTypes, setProjectTypes] = useState<ConfigItem[]>([]);
  const [cultures, setCultures] = useState<ConfigItem[]>([]);
  const [storageLimit, setStorageLimit] = useState("5");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [orphanFiles, setOrphanFiles] = useState<OrphanFile[]>([]);
  const [orphanSummary, setOrphanSummary] = useState<OrphanSummary | null>(null);
  const [isLoadingOrphans, setIsLoadingOrphans] = useState(false);

  const markAsChanged = () => setHasChanges(true);

  // Fetch orphan files
  const fetchOrphanFiles = async () => {
    try {
      setIsLoadingOrphans(true);
      const response = await fetch("/api/admin/orphan-files");

      if (!response.ok) {
        throw new Error("Failed to fetch orphan files");
      }

      const data = await response.json();
      setOrphanFiles(data.files || []);
      setOrphanSummary(data.summary || null);
    } catch (error) {
      console.error("Error fetching orphan files:", error);
      toast.error("Erro ao carregar arquivos órfãos");
    } finally {
      setIsLoadingOrphans(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        setIsLoading(true);

        const [projectTypesRes, culturesRes, systemRes] = await Promise.all([
          fetch("/api/admin/settings/project-types"),
          fetch("/api/admin/settings/cultures"),
          fetch("/api/admin/settings/system"),
        ]);

        if (!projectTypesRes.ok || !culturesRes.ok || !systemRes.ok) {
          throw new Error("Failed to fetch settings");
        }

        const [projectTypesData, culturesData, systemData] = await Promise.all([
          projectTypesRes.json(),
          culturesRes.json(),
          systemRes.json(),
        ]);

        setProjectTypes(projectTypesData.projectTypes || []);
        setCultures(culturesData.cultures || []);
        setStorageLimit(
          systemData.settings?.orphanFilesLimitGb?.toString() || "5",
        );

        // Fetch orphan files after settings load
        await fetchOrphanFiles();
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Erro ao carregar configurações");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Project Types handlers
  const addProjectType = () => {
    const newItem: ConfigItem = {
      id: Date.now().toString(),
      key: "NOVO_TIPO",
      label: "Novo Tipo",
    };
    setProjectTypes([...projectTypes, newItem]);
    markAsChanged();
  };

  const removeProjectType = (id: string) => {
    setProjectTypes(projectTypes.filter((item) => item.id !== id));
    markAsChanged();
  };

  const updateProjectType = (id: string, label: string) => {
    setProjectTypes(
      projectTypes.map((item) =>
        item.id === id ? { ...item, label, key: generateKey(label) } : item,
      ),
    );
    markAsChanged();
  };

  // Cultures handlers
  const addCulture = () => {
    const newItem: ConfigItem = {
      id: Date.now().toString(),
      key: "NOVA_CULTURA",
      label: "Nova Cultura",
    };
    setCultures([...cultures, newItem]);
    markAsChanged();
  };

  const removeCulture = (id: string) => {
    setCultures(cultures.filter((item) => item.id !== id));
    markAsChanged();
  };

  const updateCulture = (id: string, label: string) => {
    setCultures(
      cultures.map((item) =>
        item.id === id ? { ...item, label, key: generateKey(label) } : item,
      ),
    );
    markAsChanged();
  };

  // Open cleanup confirmation dialog
  const handleCleanupOrphans = () => {
    setShowCleanupDialog(true);
  };

  // Execute cleanup after confirmation
  const executeCleanup = async () => {
    try {
      setIsCleaningUp(true);

      const response = await fetch("/api/admin/cleanup-orphans", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao limpar arquivos");
      }

      // Show success message with summary
      const message = `${data.r2FilesDeleted} arquivos removidos, ${data.storageFreedMb}MB liberados`;
      toast.success("Arquivos órfãos removidos com sucesso!", message);

      // Log detailed results to console
      console.log("Cleanup results:", data);

      if (data.errors && data.errors.length > 0) {
        console.warn("Cleanup errors:", data.errors);
      }

      // Refresh orphan files list
      await fetchOrphanFiles();

      // Close dialog
      setShowCleanupDialog(false);
    } catch (error) {
      console.error("Error cleaning up orphans:", error);
      toast.error("Erro ao limpar arquivos órfãos");
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Save handler
  const handleSave = async () => {

    console.log("🔵 START handleSave");
    
    try {
      setIsSaving(true);

      // Prepare data for API
      const projectTypesData = projectTypes.map((pt) => ({
        key: pt.key,
        label: pt.label,
      }));

      const culturesData = cultures.map((c) => ({
        key: c.key,
        label: c.label,
      }));

      const storageLimitNumber = parseInt(storageLimit, 10);

      // Validate storage limit
      if (isNaN(storageLimitNumber) || storageLimitNumber < 1) {
        toast.error("O limite de armazenamento deve ser um número maior que 0");
        return;
      }

      // Save all settings in parallel
      const [projectTypesRes, culturesRes, systemRes] = await Promise.all([
        fetch("/api/admin/settings/project-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectTypes: projectTypesData }),
        }),
        fetch("/api/admin/settings/cultures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cultures: culturesData }),
        }),
        fetch("/api/admin/settings/system", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orphanFilesLimitGb: storageLimitNumber }),
        }),
      ]);

      if (!projectTypesRes.ok || !culturesRes.ok || !systemRes.ok) {
        throw new Error("Failed to save settings");
      }

      // Mark as saved - no refetch needed!
      setHasChanges(false);

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando configurações..." minHeight="400px" />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Configurações</h1>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Gerencie as configurações do sistema
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Project Types Section */}
        <ConfigSection
          title="Tipos de Projeto"
          description="Configure os tipos de projeto disponíveis para seleção."
          items={projectTypes}
          onAdd={addProjectType}
          onRemove={removeProjectType}
          onUpdate={updateProjectType}
        />

        {/* Cultures Section */}
        <ConfigSection
          title="Culturas"
          description="Configure as culturas disponíveis para seleção."
          items={cultures}
          onAdd={addCulture}
          onRemove={removeCulture}
          onUpdate={updateCulture}
        />

        {/* Storage Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5 text-zinc-400" />
              Armazenamento
            </CardTitle>
            <p className="text-sm text-zinc-400">
              Configure o limite máximo de armazenamento por usuário para
              arquivos órfãos.
            </p>
          </CardHeader>
          <CardContent>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Limite por Usuário
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={storageLimit}
                  onChange={(e) => {
                    setStorageLimit(e.target.value);
                    markAsChanged();
                  }}
                  className="w-32"
                  min="1"
                  placeholder="5"
                />
                <span className="text-sm text-zinc-400">GB</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Cada usuário poderá ter no máximo este limite de arquivos órfãos
                (não vinculados a projetos). Ao exceder, novos uploads serão
                bloqueados.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Orphan Files Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileWarning className="h-5 w-5 text-amber-500" />
                  Arquivos Órfãos
                </CardTitle>
                <p className="text-sm text-zinc-400 mt-1">
                  Arquivos enviados que não estão vinculados a nenhum projeto.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchOrphanFiles}
                disabled={isLoadingOrphans}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingOrphans ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOrphans ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
                <span className="ml-2 text-sm text-zinc-500">
                  Carregando...
                </span>
              </div>
            ) : orphanSummary ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="text-xs text-zinc-500">Total de Arquivos</p>
                    <p className="text-xl font-semibold text-white">
                      {orphanSummary.totalFiles}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="text-xs text-zinc-500">Espaço Usado</p>
                    <p className="text-xl font-semibold text-white">
                      {parseFloat(orphanSummary.totalSizeMb) > 1024
                        ? `${orphanSummary.totalSizeGb} GB`
                        : `${orphanSummary.totalSizeMb} MB`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="text-xs text-zinc-500">Usuários Afetados</p>
                    <p className="text-xl font-semibold text-white">
                      {orphanSummary.byUser.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="text-xs text-zinc-500">Média por Arquivo</p>
                    <p className="text-xl font-semibold text-white">
                      {orphanSummary.totalFiles > 0
                        ? (
                            parseFloat(orphanSummary.totalSizeMb) /
                            orphanSummary.totalFiles
                          ).toFixed(1)
                        : "0"}{" "}
                      MB
                    </p>
                  </div>
                </div>

                {/* Files Table */}
                {orphanFiles.length > 0 ? (
                  <div className="rounded-lg border border-zinc-800">
                    <div className="max-h-[400px] overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-zinc-400">
                              Arquivo
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-zinc-400">
                              Usuário
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-zinc-400">
                              Tamanho
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-zinc-400">
                              Criado em
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {orphanFiles.map((file) => {
                            const fileSizeMb = (
                              parseInt(file.fileSize) /
                              (1024 * 1024)
                            ).toFixed(2);
                            const createdAt = new Date(file.createdAt);
                            const now = new Date();
                            const ageMinutes = Math.floor(
                              (now.getTime() - createdAt.getTime()) / 60000
                            );

                            return (
                              <tr
                                key={file.id}
                                className="hover:bg-zinc-800/50"
                              >
                                <td className="px-4 py-2">
                                  <div className="flex flex-col">
                                    <span
                                      className="truncate max-w-[200px] text-zinc-200"
                                      title={file.fileName}
                                    >
                                      {file.fileName}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                      {file.fileType}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-zinc-500" />
                                    <span
                                      className="truncate max-w-[120px] text-zinc-300"
                                      title={file.user.email}
                                    >
                                      {file.user.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-zinc-300">
                                  {fileSizeMb} MB
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                                    <span
                                      className={`text-xs ${
                                        ageMinutes > 30
                                          ? "text-amber-400"
                                          : "text-zinc-400"
                                      }`}
                                    >
                                      {ageMinutes < 60
                                        ? `${ageMinutes}min atrás`
                                        : ageMinutes < 1440
                                          ? `${Math.floor(ageMinutes / 60)}h atrás`
                                          : `${Math.floor(ageMinutes / 1440)}d atrás`}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileWarning className="h-10 w-10 text-zinc-600 mb-2" />
                    <p className="text-zinc-400">
                      Nenhum arquivo órfão encontrado
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Todos os arquivos estão vinculados a projetos
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileWarning className="h-10 w-10 text-zinc-600 mb-2" />
                <p className="text-zinc-400">
                  Clique em &quot;Atualizar&quot; para carregar os dados
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <p className="text-sm text-zinc-400">
              Ações irreversíveis que afetam todo o sistema.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-red-900/30 bg-red-950/20 p-4">
              <div>
                <p className="font-medium text-zinc-300">
                  Limpar Arquivos Órfãos Antigos
                </p>
                <p className="text-sm text-zinc-500">
                  Remove todos os arquivos órfãos com mais de 30 minutos de
                  todos os usuários.
                </p>
              </div>
              <Button
                variant="secondary"
                className="border-red-800 text-red-400 hover:bg-red-500/10 hover:border-red-700"
                onClick={handleCleanupOrphans}
                disabled={isCleaningUp}
              >
                {isCleaningUp ? "Limpando..." : "Limpar Agora"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cleanup Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCleanupDialog}
        onClose={() => setShowCleanupDialog(false)}
        onConfirm={executeCleanup}
        title="Limpar Arquivos Órfãos"
        description={
          <>
            Tem certeza que deseja limpar todos os arquivos órfãos com mais de
            30 minutos?
            <br />
            <br />
            <strong>Esta ação não pode ser desfeita.</strong> Todos os arquivos
            pendentes não vinculados a projetos serão permanentemente removidos
            do armazenamento.
          </>
        }
        confirmText="Limpar Agora"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isCleaningUp}
      />
    </div>
  );
}
