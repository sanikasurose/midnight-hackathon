import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EmployerShell } from "@/components/employer/employer-shell";

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowRole="EMPLOYER">
      <EmployerShell>{children}</EmployerShell>
    </ProtectedRoute>
  );
}

