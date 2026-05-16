import { AlertTriangle, CheckCircle2, CircleGauge, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

export function TrustReportSection() {
  return (
    <section id="trust" className="bg-charcoal/45 px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Trusted recruiter view" title="Better hiring context, without default exposure.">
          VeriHire can explain profile fit, verification strength, and approved disclosures while
          keeping non-requested private data outside the employer workspace.
        </SectionHeading>

        <div className="mt-16 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="reveal border border-white/10 bg-night p-6 md:p-8">
            <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-platinum">Approved access</p>
                <h3 className="mt-2 text-3xl font-semibold text-zinc-50">Verified profile detail</h3>
              </div>
              <div className="inline-flex items-center gap-2 self-start border border-gold/45 bg-gold/10 px-3 py-2 text-sm font-semibold text-champagne">
                <CheckCircle2 size={16} aria-hidden="true" /> VERIFIED
              </div>
            </div>

            <div className="grid gap-5 py-7 md:grid-cols-3">
              {[
                ["92", "profile fit"],
                ["3", "details approved"],
                ["0", "extra records exposed"]
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="text-4xl font-semibold text-champagne">{value}</div>
                  <div className="mt-1 text-sm text-platinum">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3">
              {[
                "Education summary is public; transcript confirmation was approved.",
                "Experience evidence matches the recruiter request scope.",
                "References and unrelated identity data remain private."
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-200">
                  <Sparkles className="mt-0.5 shrink-0 text-gold" size={16} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="reveal border border-white/10 bg-night p-6 md:p-8">
            <CircleGauge className="text-gold" size={28} aria-hidden="true" />
            <h3 className="mt-6 text-2xl font-semibold text-zinc-50">Built for fast judgment.</h3>
            <p className="mt-4 text-sm leading-7 text-platinum">
              The product should make the tradeoff obvious: discover talent quickly, ask for more
              when there is intent, and let candidates control the reveal.
            </p>
            <div className="mt-8 border border-amber-300/20 bg-amber-300/[0.06] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-gold" size={17} aria-hidden="true" />
                <p className="text-sm leading-6 text-champagne">
                  Request scope: transcript confirmation and GPA threshold only. References were not
                  included in this approval.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
