"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredRole, getStoredToken, type StoredRole } from "@/components/auth/auth-storage";

type ProtectedRouteProps = {
  children: ReactNode;
  allowRole?: StoredRole;
};

export function ProtectedRoute({ children, allowRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const role = getStoredRole();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (allowRole && role && role !== allowRole) {
      router.replace(role === "EMPLOYER" ? "/employer" : "/candidate/dashboard");
      return;
    }

    setReady(true);
  }, [allowRole, router]);

  if (!ready) return null;
  return <>{children}</>;
}

