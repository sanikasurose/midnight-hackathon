"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  UsersRound,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/employer", label: "Overview", icon: LayoutDashboard },
  { href: "/employer/jobs", label: "Roles", icon: BriefcaseBusiness },
  { href: "/employer/applications", label: "Applications", icon: UsersRound }
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>;

export function EmployerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  const nav = <EmployerNavigation pathname={pathname} onNavigate={closeMobileNav} className="mt-8" />;

  return (
    <div className="min-h-dvh bg-night text-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-charcoal/90 px-5 py-6 backdrop-blur-xl lg:block">
        <Logo />
        <EmployerTrustCard />
        {nav}
        <div className="absolute bottom-6 left-5 right-5">
          <LogoutButton />
        </div>
      </aside>

      <div
        className={cn("fixed inset-0 z-50 lg:hidden", mobileNavOpen ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!mobileNavOpen}
      >
        <button
          className={cn("absolute inset-0 bg-black/60 transition-opacity", mobileNavOpen ? "opacity-100" : "opacity-0")}
          type="button"
          aria-label="Close employer navigation"
          onClick={closeMobileNav}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[min(22rem,88vw)] border-r border-white/10 bg-charcoal px-5 py-5 shadow-2xl shadow-black/60 transition-transform duration-300 ease-out",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              className="grid h-10 w-10 place-items-center border border-white/10 text-platinum transition-colors hover:text-zinc-50"
              aria-label="Close employer navigation"
              type="button"
              onClick={closeMobileNav}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <EmployerTrustCard />
          <EmployerNavigation pathname={pathname} onNavigate={closeMobileNav} className="mt-8" />
          <div className="mt-8">
            <LogoutButton />
          </div>
        </aside>
      </div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-night/88 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              className="grid h-10 w-10 place-items-center border border-white/10 text-platinum transition-colors hover:border-gold/45 hover:text-zinc-50"
              aria-label="Open employer navigation"
              type="button"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function EmployerTrustCard() {
  return (
    <div className="mt-10 border border-gold/25 bg-gold/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full border border-gold/45 bg-gold/10 text-gold">
          <ShieldCheck size={18} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-50">Proof-first hiring</p>
          <p className="text-xs text-platinum">Minimal disclosure</p>
        </div>
      </div>
    </div>
  );
}

function EmployerNavigation({
  pathname,
  onNavigate,
  className
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("grid gap-2", className)} aria-label="Employer navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/employer" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 border px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "border-gold/45 bg-gold/10 text-champagne"
                : "border-transparent text-platinum hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-50"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
