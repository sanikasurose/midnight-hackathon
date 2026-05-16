import { Check, LockKeyhole, ScanLine, ShieldCheck } from "lucide-react";
import { trustSignals } from "@/lib/landing-data";

export function ProofVisual() {
  return (
    <div className="hero-reveal mx-auto mt-12 w-full max-w-6xl overflow-hidden border border-white/10 bg-charcoal/72 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="grid border-b border-white/10 px-4 py-3 text-xs text-platinum sm:grid-cols-3">
        <div>Public talent profile</div>
        <div className="hidden text-center sm:block">Access request</div>
        <div className="hidden text-right sm:block">Approved employer view</div>
      </div>
      <div className="grid gap-0 md:grid-cols-[1fr_0.72fr_1fr]">
        <section className="proof-lane min-h-[260px] border-b border-white/10 p-5 md:border-b-0 md:border-r">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-platinum">Visible profile</p>
              <h3 className="mt-2 text-xl font-semibold text-zinc-50">Priya Raman</h3>
            </div>
            <ScanLine className="text-gold" size={22} aria-hidden="true" />
          </div>
          {["Verified CS degree", "Backend engineering", "Python, databases", "Open to remote roles"].map(
            (item) => (
              <div key={item} className="mb-3 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-gold" />
                <span className="text-sm text-zinc-200">{item}</span>
              </div>
            )
          )}
          <div className="mt-6 border border-white/10 bg-night/70 p-4">
            <div className="h-2 w-full bg-white/8">
              <div className="signal-line h-full w-[68%] bg-gold" />
            </div>
            <p className="mt-3 text-xs leading-5 text-platinum">
              Exact GPA, transcript PDF, references, and identity documents are hidden by default.
            </p>
          </div>
        </section>

        <section className="proof-lane min-h-[260px] border-b border-white/10 p-5 md:border-b-0 md:border-r">
          <div className="grid h-full place-items-center">
            <div className="text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-gold/45 bg-gold/10">
                <LockKeyhole className="text-gold" size={28} aria-hidden="true" />
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.24em] text-platinum">Scoped request</p>
              <h3 className="mt-3 text-2xl font-semibold text-zinc-50">Candidate approves</h3>
              <p className="mx-auto mt-4 max-w-[15rem] text-sm leading-6 text-platinum">
                Employer requests GPA threshold, transcript confirmation, and project evidence.
              </p>
            </div>
          </div>
        </section>

        <section className="proof-lane min-h-[260px] p-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-platinum">Shared after consent</p>
              <h3 className="mt-2 text-xl font-semibold text-zinc-50">Verified detail</h3>
            </div>
            <ShieldCheck className="text-gold" size={24} aria-hidden="true" />
          </div>
          <div className="mb-5 inline-flex items-center gap-2 border border-gold/45 bg-gold/10 px-3 py-2 text-sm font-semibold text-champagne">
            <Check size={16} aria-hidden="true" /> APPROVED
          </div>
          <div className="space-y-3">
            {trustSignals.map((signal) => (
              <div key={signal} className="flex items-start gap-3 text-sm text-zinc-200">
                <Check className="mt-0.5 shrink-0 text-gold" size={15} aria-hidden="true" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
