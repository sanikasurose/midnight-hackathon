import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowRole="EMPLOYER">{children}</ProtectedRoute>;
}

