"use client";

import type {
  ApplicationCreateResponse,
  ProofGenerateResponse,
  ProofStatusResponse,
  ResumeClaims,
  ResumeUploadResponse
} from "../../shared/contracts/http";

const stateKey = "verihire_candidate_state";

export type CandidateState = {
  latestResume?: {
    resume_id: number;
    claims: ResumeClaims;
    credentials: ResumeUploadResponse["credentials"];
    uploaded_at: string;
    original_filename?: string;
  };
  latestProof?: ProofGenerateResponse;
  latestProofStatus?: ProofStatusResponse;
  applications: ApplicationCreateResponse[];
};

export function getCandidateState(): CandidateState {
  if (typeof window === "undefined") return { applications: [] };
  const raw = window.localStorage.getItem(stateKey);
  if (!raw) return { applications: [] };
  try {
    const parsed = JSON.parse(raw) as CandidateState;
    return { ...parsed, applications: parsed.applications ?? [] };
  } catch {
    return { applications: [] };
  }
}

export function setCandidateState(next: CandidateState) {
  window.localStorage.setItem(stateKey, JSON.stringify({ ...next, applications: next.applications ?? [] }));
  window.dispatchEvent(new Event("verihire:candidate-state"));
}

export function saveResumeUpload(upload: ResumeUploadResponse, originalFilename?: string) {
  const current = getCandidateState();
  setCandidateState({
    ...current,
    latestResume: {
      ...upload,
      original_filename: originalFilename,
      uploaded_at: new Date().toISOString()
    }
  });
}

export function saveProof(proof: ProofGenerateResponse) {
  const current = getCandidateState();
  setCandidateState({ ...current, latestProof: proof, latestProofStatus: undefined });
}

export function saveProofStatus(status: ProofStatusResponse) {
  const current = getCandidateState();
  setCandidateState({ ...current, latestProofStatus: status });
}

export function saveApplication(application: ApplicationCreateResponse) {
  const current = getCandidateState();
  setCandidateState({
    ...current,
    applications: [application, ...(current.applications ?? [])]
  });
}
