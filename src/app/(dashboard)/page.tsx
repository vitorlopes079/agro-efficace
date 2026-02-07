// src/app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Se não estiver logado, redireciona para login
  if (!session) {
    redirect("/login");
  }

  // Se estiver logado, redireciona baseado no role
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }

  return null;
}
