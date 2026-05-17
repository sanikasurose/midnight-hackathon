"use client";

import { CheckCircle2, Clock, Loader2, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { ApiError, api } from "@/lib/api";
import type { EmployerApplicationItem } from "../../../../shared/contracts/http";

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<EmployerApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setApplications(await api.listEmployerApplications());
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadApplications();
    });
  }, [loadApplications]);

  return (
    <section>
      <PageHeader eyebrow="Applications" title="Review candidate submissions.">
        See which candidates applied, which claim they shared, and whether the verification status is
        ready for review.
      </PageHeader>

      <Panel>
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Application queue</h2>
            <p className="mt-1 text-sm text-platinum">Minimal candidate data with proof status attached.</p>
          </div>
          <UsersRound className="text-gold" size={20} aria-hidden="true" />
        </div>

        {loading ? (
          <div className="grid min-h-[18rem] place-items-center">
            <div className="flex items-center gap-3 text-sm text-platinum">
              <Loader2 className="animate-spin text-gold" size={18} aria-hidden="true" />
              Loading applications...
            </div>
          </div>
        ) : loadError ? (
          <EmptyState title="Could not load applications" detail={loadError} />
        ) : applications.length ? (
          <div className="divide-y divide-white/10">
            {applications.map((application) => (
              <article
                key={application.application_id}
                className="grid gap-4 py-4 lg:grid-cols-[1fr_12rem_9rem] lg:items-center"
              >
                <div>
                  <p className="text-sm text-gold">{application.job_title}</p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                    {application.candidate_email || `Candidate #${application.candidate_id}`}
                  </h3>
                  <p className="mt-2 text-sm text-platinum">Application #{application.application_id}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-platinum">Shared claim</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">{application.credential_type || "Not attached"}</p>
                </div>

                <StatusBadge status={application.verification_status} />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No applications yet" detail="Applications will appear here after candidates apply to your roles." />
        )}
      </Panel>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const verified = normalized === "VERIFIED";
  const failed = normalized === "FAILED";
  const Icon = verified ? CheckCircle2 : Clock;

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

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="border border-white/10 bg-charcoal/85 p-5">{children}</div>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="py-8">
      <h3 className="text-lg font-semibold text-zinc-50">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-platinum">{detail}</p>
    </div>
  );
}
