import { CheckCircle2, FileText, FileUp, LockKeyhole, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/candidate/page-header";

const parsingSteps = [
  { label: "Extract education", status: "Ready" },
  { label: "Identify skills", status: "Ready" },
  { label: "Prepare private claims", status: "Waiting" }
];

export default function CandidateUploadPage() {
  return (
    <section>
      <PageHeader eyebrow="Resume intake" title="Turn a private resume into controlled profile signals.">
        Upload a resume, review extracted claims, then decide what belongs on your public profile.
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="border border-white/10 bg-charcoal/80 p-5">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">Upload source document</h2>
              <p className="mt-1 text-sm text-platinum">PDF only, 10 MB max.</p>
            </div>
            <FileText className="text-gold" size={21} aria-hidden="true" />
          </div>
          <div className="grid min-h-[18rem] place-items-center text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/45 bg-gold/10 text-gold">
                <FileUp size={26} aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-zinc-50">Drop resume here</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-platinum">
                The parser will extract candidate-owned claims. Nothing becomes public until you
                review and publish it.
              </p>
              <button
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-night shadow-gold-soft"
                type="button"
              >
                Choose file
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <article className="border border-white/10 bg-charcoal/80 p-5">
            <h2 className="text-lg font-semibold text-zinc-50">Parsing queue</h2>
            <div className="mt-5 divide-y divide-white/10">
              {parsingSteps.map((step) => (
                <div key={step.label} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-gold" size={17} aria-hidden="true" />
                    <span className="text-sm text-zinc-200">{step.label}</span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] text-platinum">{step.status}</span>
                </div>
              ))}
            </div>
          </article>
          {[
            {
              icon: LockKeyhole,
              title: "Source stays private",
              body: "The resume is a source document, not a public asset. Recruiters see only the signals you publish."
            },
            {
              icon: ShieldCheck,
              title: "Claims need review",
              body: "Extracted claims should be confirmed by the candidate before they appear in the profile or proof flow."
            }
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="border border-white/10 bg-charcoal/80 p-5">
                <Icon className="text-gold" size={22} aria-hidden="true" />
                <h2 className="mt-5 text-xl font-semibold text-zinc-50">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-platinum">{item.body}</p>
              </article>
            );
          })}
        </aside>
      </div>
    </section>
  );
}
