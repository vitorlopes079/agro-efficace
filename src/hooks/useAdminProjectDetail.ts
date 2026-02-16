import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import type { ProjectData } from "@/components/project";

export function useAdminProjectDetail(projectId: string | string[] | undefined) {
  const router = useRouter();
  const toast = useToast();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProject = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/projects/${id}`);
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

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId as string);
    }
  }, [projectId]);

  const handleStartProcessing = async (price: string, area: string) => {
    if (!project) return;

    const response = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price,
        areaProcessed: area,
        status: "PROCESSING",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setProject((prev) =>
        prev
          ? {
              ...prev,
              price: data.project.price,
              areaProcessed: data.project.areaProcessed,
              status: data.project.status,
            }
          : null,
      );
      toast.success("Processamento iniciado com sucesso!");
    } else {
      const data = await response.json();
      toast.error(data.error || "Erro ao iniciar processamento");
    }
  };

  const handleRegisterPayment = async () => {
    if (!project) return;

    setIsRegisteringPayment(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setProject((prev) =>
          prev
            ? {
                ...prev,
                isPaid: data.project.isPaid,
                paidAt: data.project.paidAt,
              }
            : null,
        );
        toast.success("Pagamento registrado com sucesso!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao registrar pagamento");
      }
    } catch (error) {
      console.error("Error registering payment:", error);
      toast.error("Erro ao registrar pagamento");
    } finally {
      setIsRegisteringPayment(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!project) return;

    setIsArchiving(true);
    try {
      const response = await fetch(
        `/api/admin/projects/${project.id}/archive`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Projeto arquivado com sucesso!");
        await fetchProject(project.id);
      } else {
        toast.error(data.error || "Erro ao arquivar projeto");
      }
    } catch (error) {
      console.error("Error archiving project:", error);
      toast.error("Erro ao arquivar projeto");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCancelProject = async () => {
    if (!project) return;

    setIsCanceling(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Projeto cancelado com sucesso!");
        await fetchProject(project.id);
      } else {
        toast.error(data.error || "Erro ao cancelar projeto");
      }
    } catch (error) {
      console.error("Error canceling project:", error);
      toast.error("Erro ao cancelar projeto");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Projeto deletado com sucesso!",
          `${data.filesDeleted} arquivos removidos do armazenamento`,
        );
        router.push("/admin/projects");
      } else {
        toast.error(data.error || "Erro ao deletar projeto");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Erro ao deletar projeto");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinalizeProject = () => {
    if (!project) return;
    router.push(`/admin/projects/${project.id}/finalize`);
  };

  return {
    project,
    isLoading,
    error,
    isArchiving,
    isRegisteringPayment,
    isCanceling,
    isDeleting,
    handleStartProcessing,
    handleRegisterPayment,
    handleArchiveProject,
    handleCancelProject,
    handleDeleteProject,
    handleFinalizeProject,
  };
}
