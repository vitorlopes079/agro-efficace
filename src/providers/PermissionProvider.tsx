"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

interface PermissionContextType {
  canUpload: boolean;
  status: UserStatus | null;
  isChecking: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined
);

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [canUpload, setCanUpload] = useState(true);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Flag to ensure we only check once per page load
  const hasChecked = useRef(false);

  // Effect 1: Check permissions ONCE when session is ready
  useEffect(() => {
    const checkPermissions = async () => {
      // Only check if session is ready, we have a session, and haven't checked yet
      if (sessionStatus === "loading" || !session || hasChecked.current) {
        if (sessionStatus !== "loading" && !session) {
          setIsChecking(false);
        }
        return;
      }

      console.log(
        "🔐 [PERMISSION] Checking permissions (once per page load)..."
      );
      hasChecked.current = true;

      try {
        const response = await fetch("/api/auth/check-permissions");

        if (!response.ok) {
          console.error("❌ [PERMISSION] Failed to check permissions");
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        const { user } = data;

        setStatus(user.status);
        setCanUpload(user.canUpload);

        // If user is SUSPENDED, log them out immediately
        if (user.status === "SUSPENDED") {
          console.log("⛔ [PERMISSION] User is banned - logging out...");
          await signOut({ redirect: false });
          router.push("/login?error=banned");
          return;
        }

        console.log("✅ [PERMISSION] Permissions checked successfully", {
          status: user.status,
          canUpload: user.canUpload,
        });
      } catch (error) {
        console.error("❌ [PERMISSION] Error checking permissions:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPermissions();
  }, [sessionStatus, session, router]);

  // Show loading state while checking permissions
  if (isChecking && sessionStatus !== "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionContext.Provider value={{ canUpload, status, isChecking }}>
      {children}
    </PermissionContext.Provider>
  );
}
