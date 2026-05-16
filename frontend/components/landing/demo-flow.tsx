import { proofFlow } from "@/lib/landing-data";
import { SectionHeading } from "@/components/ui/section-heading";

export function DemoFlow() {
  return (
    <section id="flow" className="border-y border-white/[0.08] bg-charcoal/45 px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Consent-based hiring" title="Public signal first. Private detail by approval.">
          VeriHire gives candidates a professional profile that is searchable like a talent network,
          but detailed records open only through scoped, candidate-approved requests.
        </SectionHeading>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {proofFlow.map((step, index) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="story-step border border-white/10 bg-night p-6">
                <div className="mb-8 flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center border border-gold/40 bg-gold/10 text-gold">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-platinum">0{index + 1}</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                  {step.label}
                </p>
                <h3 className="mt-4 text-xl font-semibold text-zinc-50">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-platinum">{step.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
