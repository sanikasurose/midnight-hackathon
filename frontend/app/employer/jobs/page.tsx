"use client";

import { BriefcaseBusiness, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { ApiError, api } from "@/lib/api";
import type { JobListItem } from "../../../../shared/contracts/http";

type RequirementDraft = {
  type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";
  operator: ">" | ">=" | "==" | "<" | "<=";
  value: string;
};

const initialRequirement: RequirementDraft = { type: "GPA", operator: ">=", value: "3.5" };

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirement, setRequirement] = useState<RequirementDraft>(initialRequirement);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setJobs(await api.listEmployerJobs());
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Could not load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs();
    });
  }, [loadJobs]);

  async function createJob() {
    setCreateError("");

    const threshold = Number(requirement.value);
    if (title.trim().length < 3) {
      setCreateError("Add a clear role title.");
      return;
    }
    if (description.trim().length < 10) {
      setCreateError("Add a short role description.");
      return;
    }
    if (!Number.isFinite(threshold)) {
      setCreateError("Requirement value must be a number.");
      return;
    }

    setCreating(true);
    try {
      await api.createJob({
        title: title.trim(),
        description: description.trim(),
        requirements: {
          [requirement.type]: {
            operator: requirement.operator,
            value: threshold
          }
        }
      });
      setTitle("");
      setDescription("");
      setRequirement(initialRequirement);
      await loadJobs();
    } catch (error) {
      setCreateError(error instanceof ApiError ? error.message : "Could not create role.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <PageHeader eyebrow="Roles" title="Create proof-gated openings.">
        Keep requirements explicit so candidates can apply with a minimal proof instead of exposing
        unnecessary private details.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr]">
        <CreateJobPanel
          title={title}
          description={description}
          requirement={requirement}
          creating={creating}
          error={createError}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onRequirementChange={setRequirement}
          onSubmit={createJob}
        />

        <Panel>
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">Posted roles</h2>
              <p className="mt-1 text-sm text-platinum">Roles currently visible to candidates.</p>
            </div>
            <BriefcaseBusiness className="text-gold" size={20} aria-hidden="true" />
          </div>

          {loading ? (
            <div className="grid min-h-[18rem] place-items-center">
              <div className="flex items-center gap-3 text-sm text-platinum">
                <Loader2 className="animate-spin text-gold" size={18} aria-hidden="true" />
                Loading roles...
              </div>
            </div>
          ) : loadError ? (
            <EmptyState title="Could not load roles" detail={loadError} />
          ) : jobs.length ? (
            <div className="divide-y divide-white/10">
              {jobs.map((job) => (
                <article key={job.id} className="grid gap-4 py-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-sm text-gold">Role #{job.id}</p>
                    <h3 className="mt-1 text-xl font-semibold text-zinc-50">{job.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-platinum">
                      {job.description || "No description provided."}
                    </p>
                    <RequirementPills requirements={job.requirements} />
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs uppercase tracking-[0.16em] text-platinum">Applications</p>
                    <p className="mt-1 text-2xl font-semibold text-champagne">{job.application_count ?? 0}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No roles posted" detail="Create your first role to start receiving proof-first applications." />
          )}
        </Panel>
      </div>
    </section>
  );
}

function CreateJobPanel({
  title,
  description,
  requirement,
  creating,
  error,
  onTitleChange,
  onDescriptionChange,
  onRequirementChange,
  onSubmit
}: {
  title: string;
  description: string;
  requirement: RequirementDraft;
  creating: boolean;
  error: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRequirementChange: (value: RequirementDraft) => void;
  onSubmit: () => void;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">Create role</h2>
          <p className="mt-1 text-sm text-platinum">Define one verification requirement for matching.</p>
        </div>
        <Plus className="text-gold" size={20} aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-200">Role title</span>
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="mt-2 h-11 w-full border border-white/10 bg-night px-4 text-sm text-zinc-50 outline-none focus:border-gold"
            placeholder="Privacy Platform Engineer"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-200">Description</span>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className="mt-2 min-h-28 w-full resize-none border border-white/10 bg-night px-4 py-3 text-sm leading-6 text-zinc-50 outline-none focus:border-gold"
            placeholder="Describe the role and what evidence matters."
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr_0.7fr]">
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Requirement</span>
            <select
              value={requirement.type}
              onChange={(event) => onRequirementChange({ ...requirement, type: event.target.value as RequirementDraft["type"] })}
              className="mt-2 h-11 w-full border border-white/10 bg-night px-3 text-sm text-zinc-50 outline-none focus:border-gold"
            >
              <option value="GPA">GPA</option>
              <option value="EXPERIENCE">Experience</option>
              <option value="DEGREE">Degree</option>
              <option value="CERTIFICATION">Certification</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Rule</span>
            <select
              value={requirement.operator}
              onChange={(event) => onRequirementChange({ ...requirement, operator: event.target.value as RequirementDraft["operator"] })}
              className="mt-2 h-11 w-full border border-white/10 bg-night px-3 text-sm text-zinc-50 outline-none focus:border-gold"
            >
              <option value=">=">At least</option>
              <option value=">">Greater than</option>
              <option value="==">Equals</option>
              <option value="<=">At most</option>
              <option value="<">Less than</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Value</span>
            <input
              value={requirement.value}
              onChange={(event) => onRequirementChange({ ...requirement, value: event.target.value })}
              className="mt-2 h-11 w-full border border-white/10 bg-night px-4 text-sm text-zinc-50 outline-none focus:border-gold"
              inputMode="decimal"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={creating}
          onClick={() => void onSubmit()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-night shadow-gold-soft disabled:cursor-not-allowed disabled:opacity-70"
        >
          {creating ? "Creating..." : "Create role"}
          <BriefcaseBusiness size={16} aria-hidden="true" />
        </button>

        {error ? <p className="text-sm leading-6 text-rose-200">{error}</p> : null}
      </div>
    </Panel>
  );
}

function RequirementPills({ requirements }: { requirements: Record<string, unknown> }) {
  const entries = Object.entries(requirements ?? {});
  if (!entries.length) return <p className="mt-3 text-sm text-platinum">No proof requirements set.</p>;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span key={key} className="border border-white/10 bg-night px-3 py-1.5 text-sm text-zinc-200">
          {key}: {formatRequirement(value)}
        </span>
      ))}
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

function formatRequirement(value: unknown) {
  if (value && typeof value === "object") {
    const item = value as { operator?: unknown; value?: unknown };
    return `${String(item.operator ?? "")} ${String(item.value ?? "")}`.trim();
  }
  return String(value ?? "none");
}
