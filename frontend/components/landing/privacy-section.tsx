import { Lock, Minus, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const disclosureRows = [
  ["Public profile", "Verified CS degree", "Transcript PDF hidden"],
  ["Recruiter request", "GPA threshold proof", "Exact GPA hidden until approved"],
  ["Candidate approval", "Python experience evidence", "Unrelated work history stays private"]
];

export function PrivacySection() {
  return (
    <section id="privacy" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Candidate-controlled disclosure" title="A profile is not permission to see everything.">
          Public discovery should show enough to create opportunity. Private career evidence should
          move only after a clear request and an explicit candidate decision.
        </SectionHeading>

        <div className="mt-16 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="reveal border border-white/10 bg-charcoal p-7">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-gold/45 bg-gold/10 text-gold">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <h3 className="mt-8 text-3xl font-semibold text-zinc-50">Privacy becomes a workflow.</h3>
            <p className="mt-5 text-base leading-8 text-platinum">
              VeriHire separates public professional identity from private evidence. Recruiters can
              discover strong candidates, then ask for exactly what they need to continue.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-zinc-200">
              <div className="flex items-center gap-3">
                <Lock className="text-gold" size={17} aria-hidden="true" />
                Private details unlock only after candidate approval.
              </div>
              <div className="flex items-center gap-3">
                <Minus className="text-gold" size={17} aria-hidden="true" />
                Employers request specific evidence, not the entire profile.
              </div>
            </div>
          </div>

          <div className="reveal overflow-hidden border border-white/10 bg-night">
            <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-platinum">
              <span>Moment</span>
              <span>Shared</span>
              <span>Protected</span>
            </div>
            {disclosureRows.map(([source, proof, hidden]) => (
              <div
                key={source}
                className="grid grid-cols-1 gap-3 border-b border-white/10 px-4 py-5 text-sm last:border-b-0 md:grid-cols-3"
              >
                <div className="text-zinc-50">{source}</div>
                <div className="text-champagne">{proof}</div>
                <div className="text-platinum">{hidden}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
