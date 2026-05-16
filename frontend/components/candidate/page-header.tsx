import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <div className="mb-7">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-zinc-50 md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-platinum">{children}</p>
    </div>
  );
}
