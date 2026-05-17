import type { ReactNode } from "react";
import { CandidateShell } from "@/components/candidate/candidate-shell";
import { ProtectedRoute } from "@/components/candidate/protected-route";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CandidateShell>{children}</CandidateShell>
    </ProtectedRoute>
  );
}
