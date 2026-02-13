// src/app/(dashboard)/projects/new/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewProjectForm } from "@/components/forms/NewProjectForm";

async function getFormData() {
  const [projectTypes, cultures] = await Promise.all([
    prisma.projectTypeConfig.findMany({
      orderBy: { label: "asc" },
    }),
    prisma.cultureConfig.findMany({
      orderBy: { label: "asc" },
    }),
  ]);

  return {
    projectTypes: projectTypes.map((pt) => ({
      value: pt.key.toLowerCase(),
      label: pt.label,
    })),
    cultures: cultures.map((c) => ({
      value: c.key.toLowerCase(),
      label: c.label,
    })),
  };
}

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const formData = await getFormData();

  return <NewProjectForm initialData={formData} />;
}
