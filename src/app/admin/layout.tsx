import { LayoutDashboard, FolderOpen, Users, ScrollText, Settings } from "lucide-react";
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
  {
    label: "Configurações",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
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
      {/* Main content: no margin on mobile, sidebar margin on desktop */}
      <main className="pt-4 lg:ml-64">
        <div className="p-4 pb-20 lg:p-8 lg:pb-8">{children}</div>
      </main>
    </>
  );
}
