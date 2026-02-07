import { LayoutDashboard, FolderOpen, Users, ScrollText } from "lucide-react";
import { Header, Sidebar } from "@/components/layout";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Projetos",
    href: "/admin/projects",
    icon: <FolderOpen className="h-5 w-5" />,
  },
  {
    label: "Usuários",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Logs de Auditoria",
    href: "/admin/logs",
    icon: <ScrollText className="h-5 w-5" />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <Sidebar items={navItems} />
      <main className="ml-64 pt-16">
        <div className="p-8">{children}</div>
      </main>
    </>
  );
}
