"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession, type StoredRole } from "@/components/auth/auth-storage";

type ProtectedRouteProps = {
  children: ReactNode;
  allowRole?: StoredRole;
};

export function ProtectedRoute({ children, allowRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const session = mounted ? getAuthSession() : null;
  const isAllowed = Boolean(session && (!allowRole || session.role === allowRole));

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (allowRole && session.role !== allowRole) {
      router.replace(session.role === "EMPLOYER" ? "/employer" : "/candidate/dashboard");
    }
  }, [allowRole, mounted, router, session]);

  if (!isAllowed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-night px-6 text-center text-zinc-50">
        <div>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border border-gold/20 border-t-gold" />
          <p className="mt-4 text-sm text-platinum">Checking secure session...</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

