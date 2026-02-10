import { Header } from "@/components/layout";
import { PermissionProvider } from "@/providers/PermissionProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionProvider>
      <Header />
      {children}
    </PermissionProvider>
  );
}
