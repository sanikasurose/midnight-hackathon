"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAuthStorage } from "@/components/auth/auth-storage";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  function onLogout() {
    clearAuthStorage();
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className={cn(
        "flex w-full items-center gap-3 rounded-sm border border-white/10 px-4 py-3 text-left text-sm text-platinum transition-colors hover:border-rose-500/40 hover:bg-rose-500/[0.06] hover:text-zinc-50",
        className
      )}
    >
      <LogOut size={18} aria-hidden="true" />
      Log out
    </button>
  );
}
