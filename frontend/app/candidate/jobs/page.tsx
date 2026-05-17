"use client";

import { ArrowRight, BriefcaseBusiness, Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { ApiError, api } from "@/lib/api";
import { saveApplication } from "@/lib/candidate-state";
import type { ApplicationCreateResponse, JobListItem } from "../../../../shared/contracts/http";

type ApplyState = {
  credentialId: string;
  loading: boolean;
  error: string;
  response?: ApplicationCreateResponse;
};

export default function CandidateJobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [applyState, setApplyState] = useState<Record<number, ApplyState>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await api.listJobs();
        if (!cancelled) setJobs(data);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof ApiError ? error.message : "Could not load jobs.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalRequirements = useMemo(
    () => jobs.reduce((count, job) => count + Object.keys(job.requirements ?? {}).length, 0),
    [jobs]
  );

  function updateApplyState(jobId: number, patch: Partial<ApplyState>) {
    setApplyState((current) => ({
      ...current,
      [jobId]: {
        ...(current[jobId] ?? { credentialId: "", loading: false, error: "" }),
        ...patch
      }
    }));
  }

  async function applyToJob(jobId: number) {
    const current = applyState[jobId];
    const credentialId = Number(current?.credentialId);

    if (!Number.isInteger(credentialId) || credentialId <= 0) {
      updateApplyState(jobId, { error: "Enter a valid credential number." });
      return;
    }

    updateApplyState(jobId, { loading: true, error: "", response: undefined });
    try {
      const response = await api.applyToJob(jobId, { credential_id: credentialId });
      saveApplication(response);
      updateApplyState(jobId, { loading: false, response });
    } catch (error) {
      updateApplyState(jobId, {
        loading: false,
        error: error instanceof ApiError ? error.message : "Application failed."
      });
    }
  }

  return (
    <section>
      <PageHeader eyebrow="Matched jobs" title="Roles matched to your verified profile.">
        Apply with a verified claim. Employers should only ask for deeper private evidence
        when the visible proof signals are not enough.
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 border border-white/10 bg-charcoal/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-platinum">
          <SlidersHorizontal size={17} className="text-gold" aria-hidden="true" />
          {isLoading ? "Loading matched roles" : `${jobs.length} roles, ${totalRequirements} verification requirements`}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="border border-gold/40 bg-gold/10 px-3 py-2 text-champagne">Verified profile</span>
          <span className="border border-white/10 px-3 py-2 text-platinum">Credential-gated apply</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid min-h-[18rem] place-items-center border border-white/10 bg-charcoal/70">
          <div className="flex items-center gap-3 text-sm text-platinum">
            <Loader2 className="animate-spin text-gold" size={18} aria-hidden="true" />
            Loading jobs...
          </div>
        </div>
      ) : loadError ? (
        <EmptyState title="Could not load jobs" detail={loadError} />
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs available" detail="There are no matched roles available yet." />
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => {
            const state = applyState[job.id] ?? { credentialId: "", loading: false, error: "" };

            return (
              <article key={job.id} className="border border-white/10 bg-charcoal/80 p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start">
                  <div>
                    <div className="flex items-center gap-3 text-sm text-gold">
                      <BriefcaseBusiness size={17} aria-hidden="true" />
                      Role #{job.id}
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-zinc-50">{job.title}</h2>
                    <p className="mt-3 flex items-center gap-2 text-sm text-platinum">
                      <MapPin size={16} aria-hidden="true" />
                      Location details are not available for this role yet
                    </p>
                    <RequirementList requirements={job.requirements} />
                  </div>

                  <div className="border border-white/10 bg-night/45 p-4">
                    <label className="block">
                      <span className="text-sm font-medium text-zinc-200">Credential number</span>
                      <input
                        value={state.credentialId}
                        onChange={(event) => updateApplyState(job.id, { credentialId: event.target.value, error: "" })}
                        className="mt-2 h-11 w-full border border-white/10 bg-night px-4 text-sm text-zinc-50 outline-none focus:border-gold"
                        inputMode="numeric"
                        placeholder="Your credential number"
                      />
                    </label>

                    <button
                      className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-night shadow-gold-soft disabled:cursor-not-allowed disabled:opacity-70"
                      type="button"
                      disabled={state.loading}
                      onClick={() => void applyToJob(job.id)}
                    >
                      {state.loading ? "Applying..." : "Apply"}
                      <ArrowRight size={17} aria-hidden="true" />
                    </button>

                    {state.error ? <p className="mt-3 text-sm leading-6 text-rose-200">{state.error}</p> : null}
                    {state.response ? (
                      <p className="mt-3 text-sm leading-6 text-champagne">
                        Application #{state.response.application_id} submitted. Status: {state.response.verification_status}.
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RequirementList({ requirements }: { requirements: Record<string, unknown> }) {
  const entries = Object.entries(requirements ?? {});

  if (!entries.length) {
    return <p className="mt-4 text-sm text-platinum">No structured requirements returned.</p>;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span key={key} className="border border-white/10 bg-night px-3 py-1.5 text-sm text-zinc-200">
          {key}: {formatRequirementValue(value)}
        </span>
      ))}
    </div>
  );
}

function formatRequirementValue(value: unknown) {
  if (value === null || value === undefined) return "none";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border border-white/10 bg-charcoal/70 p-6">
      <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-platinum">{detail}</p>
    </div>
  );
}
