"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { AppStoreProvider } from "@/context/app-store";
import { AppShell } from "@/components/app-shell";

function ShellFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] text-stone-500">
      Loading Physio Vision…
    </div>
  );
}

function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (status === "loading") return;
    if (!user && !isLogin) {
      router.replace("/login");
      return;
    }
    if (user && isLogin) {
      router.replace("/");
    }
  }, [status, user, isLogin, router]);

  if (status === "loading") {
    return <ShellFallback />;
  }

  if (!user) {
    return isLogin ? <>{children}</> : <ShellFallback />;
  }

  if (isLogin) {
    return <ShellFallback />;
  }

  return <AppShell>{children}</AppShell>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppStoreProvider>
        <Suspense fallback={<ShellFallback />}>
          <AppFrame>{children}</AppFrame>
        </Suspense>
      </AppStoreProvider>
    </AuthProvider>
  );
}
