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
} from "@/components/ui";
import { Plus, Trash2, Save, HardDrive, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ConfigItem {
  id: string;
  key: string;
  label: string;
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

  const markAsChanged = () => setHasChanges(true);

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-sm text-zinc-400">
            Carregando configurações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="mt-1 text-sm text-zinc-400">
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
