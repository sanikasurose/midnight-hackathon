import type { ReactNode } from "react";
import { CandidateShell } from "@/components/candidate/candidate-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowRole="CANDIDATE">
      <CandidateShell>{children}</CandidateShell>
    </ProtectedRoute>
  );
}
