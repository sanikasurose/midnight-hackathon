import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-label="VeriHire">
      <div className="grid h-10 w-10 place-items-center border border-gold/55 bg-charcoal text-sm font-semibold tracking-[0.18em] text-gold shadow-gold-soft">
        VH
      </div>
      <div className="leading-none">
        <div className="text-sm font-semibold tracking-[0.18em] text-zinc-50">VERIHIRE</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.24em] text-platinum">Proof, not exposure</div>
      </div>
    </div>
  );
}
