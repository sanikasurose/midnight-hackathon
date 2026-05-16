import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Placeholder for real auth/role checks once JWT handling is connected.
  return <>{children}</>;
}
