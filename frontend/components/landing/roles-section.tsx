import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { roleCards, testimonials } from "@/lib/landing-data";

export function RolesSection() {
  return (
    <section id="demo" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="reveal grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Next pages</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight text-zinc-50 md:text-6xl">
              Professional discovery with boundaries.
            </h2>
          </div>
          <p className="text-lg leading-8 text-platinum">
            Candidates get a profile that creates opportunity. Employers get a cleaner path to
            verified context. The platform mediates what becomes visible, when, and to whom.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {roleCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="reveal border border-white/10 bg-charcoal p-7">
                <Icon className="text-gold" size={28} aria-hidden="true" />
                <h3 className="mt-8 text-2xl font-semibold text-zinc-50">{card.title}</h3>
                <p className="mt-4 text-base leading-8 text-platinum">{card.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="reveal border border-white/10 bg-night p-6">
              <blockquote className="text-base leading-8 text-zinc-200">{item.quote}</blockquote>
              <figcaption className="mt-8 border-t border-white/10 pt-5">
                <div className="font-semibold text-zinc-50">{item.name}</div>
                <div className="mt-1 text-sm text-platinum">{item.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="reveal mt-16 flex flex-col items-start justify-between gap-6 border border-gold/35 bg-gold/[0.07] p-7 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Start with consent</p>
            <h3 className="mt-3 text-2xl font-semibold text-zinc-50">Create a verified profile or sign in.</h3>
          </div>
          <Button href="/register">
            Register <ArrowRight size={17} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
