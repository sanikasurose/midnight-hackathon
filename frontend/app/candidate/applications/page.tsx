"use client";

import { Clock, FileText, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { getCandidateState, type CandidateState } from "@/lib/candidate-state";

export default function CandidateApplicationsPage() {
  const [state, setState] = useState<CandidateState>({ applications: [] });

  useEffect(() => {
    function readState() {
      setState(getCandidateState());
    }

    readState();
    window.addEventListener("storage", readState);
    window.addEventListener("verihire:candidate-state", readState);
    return () => {
      window.removeEventListener("storage", readState);
      window.removeEventListener("verihire:candidate-state", readState);
    };
  }, []);

  return (
    <section>
      <PageHeader eyebrow="Applications" title="Applications submitted through the backend.">
        Track the roles you have applied to and the verification status attached to each submission.
      </PageHeader>

      <div className="overflow-hidden border border-white/10 bg-charcoal/80">
        <div className="hidden grid-cols-[0.7fr_0.7fr_0.8fr] border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-platinum md:grid">
          <span>Application</span>
          <span>Job</span>
          <span>Verification status</span>
        </div>

        {state.applications.length ? (
          state.applications.map((application) => (
            <article key={application.application_id} className="border-b border-white/10 p-5 last:border-b-0">
              <div className="grid gap-4 md:grid-cols-[0.7fr_0.7fr_0.8fr] md:items-center">
                <div>
                  <p className="text-sm text-platinum">Application ID</p>
                  <h2 className="mt-1 text-lg font-semibold text-zinc-50">#{application.application_id}</h2>
                </div>
                <div>
                  <p className="text-sm text-platinum">Job ID</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-50">#{application.job_id}</p>
                </div>
                <StatusBadge status={application.verification_status} />
              </div>
            </article>
          ))
        ) : (
          <div className="grid min-h-[18rem] place-items-center p-6 text-center">
            <div className="max-w-md">
              <FileText className="mx-auto text-gold" size={30} aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold text-zinc-50">No submitted applications yet</h2>
              <p className="mt-3 text-sm leading-7 text-platinum">
                Apply to a matched role with a verified claim. Successful submissions will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const verified = status.toUpperCase() === "VERIFIED";
  const failed = status.toUpperCase() === "FAILED";
  const Icon = verified ? ShieldCheck : Clock;

  return (
    <div
      className={[
        "inline-flex w-fit items-center gap-2 border px-3 py-2 text-sm font-semibold",
        verified
          ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100"
          : failed
            ? "border-rose-400/30 bg-rose-400/[0.08] text-rose-100"
            : "border-gold/35 bg-gold/[0.08] text-champagne"
      ].join(" ")}
    >
      <Icon size={16} aria-hidden="true" />
      {status}
    </div>
  );
}
