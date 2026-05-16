import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { productStats } from "@/lib/landing-data";
import { ProofVisual } from "./proof-visual";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-5 pb-20 pt-32 md:px-8 md:pb-28 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-5xl text-center">
          <p className="hero-reveal text-xs font-semibold uppercase tracking-[0.32em] text-gold">
            A privacy-first professional network for verified hiring
          </p>
          <h1 className="hero-reveal mt-6 text-balance text-5xl font-semibold leading-[0.95] text-zinc-50 md:text-7xl lg:text-8xl">
            Be discoverable without being exposed.
          </h1>
          <p className="hero-reveal mx-auto mt-7 max-w-3xl text-pretty text-lg leading-8 text-platinum md:text-xl">
            VeriHire works like a trusted talent network: employers see relevant verified signals,
            then request access to deeper private details only when the candidate approves.
          </p>
          <div className="hero-reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/register">
              Create profile <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <Button href="/login" variant="secondary">
              <Play size={16} aria-hidden="true" /> Login
            </Button>
          </div>
        </div>

        <ProofVisual />

        <div className="hero-reveal mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
          {productStats.map((stat) => (
            <div key={stat.label} className="border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
              <div className="text-2xl font-semibold text-champagne">{stat.value}</div>
              <div className="mt-1 text-sm text-platinum">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
