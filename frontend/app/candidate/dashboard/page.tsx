"use client";

import { Eye, FileText, LockKeyhole, ShieldCheck, UnlockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { getAuthSession } from "@/components/auth/auth-storage";
import { api } from "@/lib/api";
import { getCandidateState, type CandidateState } from "@/lib/candidate-state";
import type { ResumeListItem } from "../../../../shared/contracts/http";

export default function CandidateDashboardPage() {
  const [state, setState] = useState<CandidateState>({ applications: [] });
  const [savedResumes, setSavedResumes] = useState<ResumeListItem[]>([]);

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

  useEffect(() => {
    const session = getAuthSession();
    if (!session) return;
    const userId = session.userId;

    let cancelled = false;
    async function loadSavedResumes() {
      try {
        const data = await api.listUserResumes(userId);
        if (!cancelled) setSavedResumes(data);
      } catch {
        if (!cancelled) setSavedResumes([]);
      }
    }

    void loadSavedResumes();
    return () => {
      cancelled = true;
    };
  }, []);

  const claims = state.latestResume?.claims;
  const stats = useMemo(
    () => [
      { label: "Saved resumes", value: String(savedResumes.length), icon: FileText },
      { label: "Generated proof", value: state.latestProof ? state.latestProof.status : "None", icon: ShieldCheck },
      { label: "Applications", value: String(state.applications?.length ?? 0), icon: UnlockKeyhole }
    ],
    [savedResumes.length, state]
  );

  const publicSignals = [
    { label: "Name", value: claims?.name || "Upload resume first", visibility: "Profile" },
    { label: "Education", value: claims?.degree || "No parsed degree", visibility: "Claim" },
    { label: "GPA", value: claims?.gpa === null || claims?.gpa === undefined ? "No parsed GPA" : String(claims.gpa), visibility: "Private" },
    { label: "Skills", value: claims?.skills?.length ? claims.skills.slice(0, 4).join(", ") : "No parsed skills", visibility: "Claim" }
  ];

  return (
    <section>
      <PageHeader eyebrow="Candidate workspace" title="Your verified hiring profile.">
        Review the claims VeriHire has prepared from your resume, the proofs you have generated,
        and the applications you have submitted.
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article key={stat.label} className="border border-white/10 bg-charcoal/80 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-platinum">{stat.label}</p>
                <Icon className="text-gold" size={20} aria-hidden="true" />
              </div>
              <h2 className="mt-5 break-all text-2xl font-semibold text-zinc-50">{stat.value}</h2>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="border border-white/10 bg-charcoal/80">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">Latest parsed profile</h2>
              <p className="mt-1 text-sm text-platinum">Visible claims you can choose to prove selectively.</p>
            </div>
            <Eye className="text-gold" size={20} aria-hidden="true" />
          </div>
          <div className="divide-y divide-white/10">
            {publicSignals.map((signal) => (
              <div key={signal.label} className="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
                <span className="text-sm text-platinum">{signal.label}</span>
                <span className="text-sm font-medium text-zinc-100">{signal.value}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{signal.visibility}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-white/10 bg-charcoal/80">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">Proof status</h2>
              <p className="mt-1 text-sm text-platinum">Your latest private claim proof.</p>
            </div>
            <LockKeyhole className="text-gold" size={20} aria-hidden="true" />
          </div>
          {state.latestProof ? (
            <div className="divide-y divide-white/10">
              <StatusRow label="Proof ID" value={state.latestProof.proof_id} />
              <StatusRow label="Proof type" value={state.latestProof.proof_type} />
              <StatusRow label="Generated status" value={state.latestProof.status} />
              <StatusRow label="Polled status" value={state.latestProofStatus?.status ?? "Not polled yet"} />
              <StatusRow label="Verified" value={String(state.latestProofStatus?.verified ?? false)} />
            </div>
          ) : (
            <div className="p-5 text-sm leading-7 text-platinum">
              No proof generated yet. Upload a resume and create a GPA threshold proof from the upload page.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_1fr]">
      <span className="text-sm text-platinum">{label}</span>
      <span className="break-all text-sm font-medium text-zinc-100">{value}</span>
    </div>
  );
}
