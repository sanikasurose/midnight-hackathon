"use client";

import { BriefcaseBusiness, Loader2, ShieldCheck, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { ApiError, api } from "@/lib/api";
import type { EmployerApplicationItem, JobListItem } from "../../../shared/contracts/http";

export default function EmployerPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [applications, setApplications] = useState<EmployerApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadEmployerData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [jobData, applicationData] = await Promise.all([
        api.listEmployerJobs(),
        api.listEmployerApplications()
      ]);
      setJobs(jobData);
      setApplications(applicationData);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Could not load employer workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadEmployerData();
    });
  }, [loadEmployerData]);

  const verifiedCount = useMemo(
    () => applications.filter((application) => application.verification_status.toUpperCase() === "VERIFIED").length,
    [applications]
  );

  return (
    <section>
      <PageHeader eyebrow="Employer workspace" title="Proof-first hiring overview.">
        Track roles, review candidate submissions, and keep private details gated behind verified
        claims instead of full resume exposure.
      </PageHeader>

      {loading ? (
        <Panel>
          <div className="grid min-h-[18rem] place-items-center">
            <div className="flex items-center gap-3 text-sm text-platinum">
              <Loader2 className="animate-spin text-gold" size={18} aria-hidden="true" />
              Loading workspace...
            </div>
          </div>
        </Panel>
      ) : loadError ? (
        <Panel>
          <h2 className="text-lg font-semibold text-zinc-50">Workspace unavailable</h2>
          <p className="mt-2 text-sm leading-7 text-rose-200">{loadError}</p>
        </Panel>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Open roles" value={String(jobs.length)} icon={BriefcaseBusiness} />
            <Metric label="Applications" value={String(applications.length)} icon={UsersRound} />
            <Metric label="Verified" value={String(verifiedCount)} icon={ShieldCheck} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <RecentRoles jobs={jobs.slice(0, 3)} />
            <RecentApplications applications={applications.slice(0, 4)} />
          </div>
        </div>
      )}
    </section>
  );
}

function RecentRoles({ jobs }: { jobs: JobListItem[] }) {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">Recent roles</h2>
          <p className="mt-1 text-sm text-platinum">Latest proof-gated openings.</p>
        </div>
        <a className="text-sm font-semibold text-gold hover:text-champagne" href="/employer/jobs">
          Manage
        </a>
      </div>

      {jobs.length ? (
        <div className="divide-y divide-white/10">
          {jobs.map((job) => (
            <article key={job.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gold">Role #{job.id}</p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-50">{job.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-platinum">{job.description || "No description provided."}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs uppercase tracking-[0.16em] text-platinum">Apps</p>
                  <p className="mt-1 text-xl font-semibold text-champagne">{job.application_count ?? 0}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No roles yet" detail="Create a role to start collecting verified applications." />
      )}
    </Panel>
  );
}

function RecentApplications({ applications }: { applications: EmployerApplicationItem[] }) {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">Recent applications</h2>
          <p className="mt-1 text-sm text-platinum">Candidate submissions awaiting review.</p>
        </div>
        <a className="text-sm font-semibold text-gold hover:text-champagne" href="/employer/applications">
          Review
        </a>
      </div>

      {applications.length ? (
        <div className="divide-y divide-white/10">
          {applications.map((application) => (
            <article key={application.application_id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm text-gold">{application.job_title}</p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-50">
                  {application.candidate_email || `Candidate #${application.candidate_id}`}
                </h3>
                <p className="mt-1 text-sm text-platinum">Claim: {application.credential_type || "Not attached"}</p>
              </div>
              <StatusBadge status={application.verification_status} />
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No applications yet" detail="Candidate applications will appear here after they apply to your roles." />
      )}
    </Panel>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BriefcaseBusiness }) {
  return (
    <div className="border border-white/10 bg-charcoal/85 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-platinum">{label}</p>
        <Icon className="text-gold" size={20} aria-hidden="true" />
      </div>
      <p className="mt-5 text-3xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const verified = status.toUpperCase() === "VERIFIED";
  const failed = status.toUpperCase() === "FAILED";

  return (
    <span
      className={[
        "inline-flex w-fit border px-3 py-2 text-sm font-semibold",
        verified
          ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100"
          : failed
            ? "border-rose-400/30 bg-rose-400/[0.08] text-rose-100"
            : "border-gold/35 bg-gold/[0.08] text-champagne"
      ].join(" ")}
    >
      {status}
    </span>
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
