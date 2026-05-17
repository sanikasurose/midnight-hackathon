"use client";

import {
  CheckCircle2,
  FileText,
  FileUp,
  Hash,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { getAuthSession } from "@/components/auth/auth-storage";
import { ApiError, api } from "@/lib/api";
import { saveProof, saveProofStatus, saveResumeUpload } from "@/lib/candidate-state";
import { cn } from "@/lib/utils";
import type {
  ProofGenerateResponse,
  ProofStatusResponse,
  ResumeClaims,
  ResumeCredential,
  ResumeListItem
} from "../../../../shared/contracts/http";

type QueueStatus = "WAITING" | "ACTIVE" | "READY";

const baseParsingSteps: Array<{ label: string; status: QueueStatus }> = [
  { label: "Extract education", status: "WAITING" },
  { label: "Identify skills", status: "WAITING" },
  { label: "Prepare private claims", status: "WAITING" }
];

function getStatusLabel(status: QueueStatus) {
  if (status === "WAITING") return "WAITING";
  if (status === "ACTIVE") return "ACTIVE";
  return "READY";
}

export default function CandidateUploadPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [claims, setClaims] = useState<ResumeClaims | null>(null);
  const [credentials, setCredentials] = useState<ResumeCredential[]>([]);
  const [resumeLibrary, setResumeLibrary] = useState<ResumeListItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [steps, setSteps] = useState(baseParsingSteps);

  const [selectedCredentialId, setSelectedCredentialId] = useState("");
  const [threshold, setThreshold] = useState("3.5");
  const [gpaValue, setGpaValue] = useState("");
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofError, setProofError] = useState("");
  const [proof, setProof] = useState<ProofGenerateResponse | null>(null);
  const [proofStatus, setProofStatus] = useState<ProofStatusResponse | null>(null);
  const proofableCredentials = credentials.filter((credential) => credential.claim_type === "GPA");

  const loadResumeLibrary = useCallback(async () => {
    const session = getAuthSession();
    if (!session) {
      setLibraryLoading(false);
      return;
    }

    setLibraryLoading(true);
    setLibraryError("");
    try {
      const data = await api.listUserResumes(session.userId);
      setResumeLibrary(data);
    } catch (error) {
      setLibraryError(error instanceof ApiError ? error.message : "Could not load saved resumes.");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadResumeLibrary();
    });
  }, [loadResumeLibrary]);

  useEffect(() => {
    if (!proof?.proof_id) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const status = await api.getProofStatus(proof.proof_hash || proof.proof_id);
        if (!cancelled) {
          setProofStatus(status);
          saveProofStatus(status);
        }
      } catch {
        // Polling is best-effort because generated proofs may be mock/local only.
      }
    };

    void poll();
    const id = window.setInterval(poll, 3500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [proof]);

  function setQueueStatus(index: number, status: QueueStatus) {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, status } : step)));
  }

  function resetQueue() {
    setSteps(baseParsingSteps);
  }

  function validatePdf(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) return "PDF only";
    if (file.type && file.type !== "application/pdf") return "PDF only";
    return "";
  }

  async function uploadPdf(file: File) {
    setUploadError("");
    setProofError("");
    setClaims(null);
    setCredentials([]);
    setResumeId(null);
    setProof(null);
    setProofStatus(null);
    setSelectedCredentialId("");
    setSelectedFileName(file.name);
    resetQueue();

    const validationError = validatePdf(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    const session = getAuthSession();
    if (!session) {
      setUploadError("Please sign in again.");
      return;
    }

    setIsUploading(true);
    setQueueStatus(0, "ACTIVE");

    try {
      const data = await api.uploadResume({ userId: session.userId, file });
      setQueueStatus(0, "READY");
      setQueueStatus(1, "ACTIVE");
      setQueueStatus(1, "READY");
      setQueueStatus(2, "ACTIVE");

      setResumeId(data.resume_id);
      setClaims(data.claims);
      setCredentials(data.credentials);
      saveResumeUpload(data, file.name);

      const gpaCredential = data.credentials.find((credential) => credential.claim_type === "GPA");
      setSelectedCredentialId(String(gpaCredential?.id ?? ""));

      if (data.claims.gpa !== null && data.claims.gpa !== undefined) {
        setGpaValue(String(data.claims.gpa));
      }

      setQueueStatus(2, "READY");
      await loadResumeLibrary();
    } catch (error) {
      setUploadError(error instanceof ApiError ? error.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function generateProof() {
    setProofError("");
    setProof(null);
    setProofStatus(null);

    const selectedCredential = proofableCredentials.find((credential) => String(credential.id) === selectedCredentialId);

    if (!selectedCredential) {
      setProofError("Upload a resume with a GPA claim before generating this proof.");
      return;
    }

    const parsedThreshold = Number(threshold);
    if (!Number.isFinite(parsedThreshold)) {
      setProofError("Enter a valid threshold.");
      return;
    }

    const parsedGpa = gpaValue.trim() ? Number(gpaValue) : undefined;
    if (parsedGpa !== undefined && !Number.isFinite(parsedGpa)) {
      setProofError("Enter a valid GPA value.");
      return;
    }

    setIsGeneratingProof(true);
    try {
      const generated = await api.generateProof({
        credential_id: String(selectedCredential.id),
        threshold: parsedThreshold,
        gpa_value: parsedGpa,
        proof_type: selectedCredential.claim_type as "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION"
      });
      setProof(generated);
      saveProof(generated);
    } catch (error) {
      setProofError(error instanceof ApiError ? error.message : "Proof generation failed.");
    } finally {
      setIsGeneratingProof(false);
    }
  }

  return (
    <section>
      <PageHeader eyebrow="Resume intake" title="Turn a private resume into shareable proof.">
        Upload a resume, review what was detected, and generate a selective proof without exposing
        the full document to employers.
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.82fr]">
        <div className="space-y-5">
          <div className="border border-white/10 bg-charcoal/80 p-5">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">Upload source document</h2>
                <p className="mt-1 text-sm text-platinum">PDF only, 10 MB max. Your resume stays private.</p>
              </div>
              <FileText className="text-gold" size={21} aria-hidden="true" />
            </div>
            <div
              className={cn("grid min-h-[16rem] place-items-center text-center", isUploading ? "opacity-80" : "opacity-100")}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) void uploadPdf(file);
              }}
            >
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/45 bg-gold/10 text-gold">
                  <FileUp size={26} aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-zinc-50">Drop resume here</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-platinum">
                  VeriHire extracts reusable claims from your resume. You decide which one becomes proof.
                </p>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadPdf(file);
                    event.target.value = "";
                  }}
                />
                <button
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-night shadow-gold-soft disabled:cursor-not-allowed disabled:opacity-70"
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? "Uploading..." : "Choose file"}
                </button>

                {selectedFileName ? <p className="mt-4 text-xs text-platinum">Selected: {selectedFileName}</p> : null}
                {uploadError ? <ErrorMessage>{uploadError}</ErrorMessage> : null}
              </div>
            </div>
          </div>

          {claims ? <ClaimsPanel resumeId={resumeId} claims={claims} credentials={credentials} /> : <EmptyClaimsPanel />}
          <ResumeLibraryPanel resumes={resumeLibrary} loading={libraryLoading} error={libraryError} />
        </div>

        <aside className="space-y-5">
          <article className="border border-white/10 bg-charcoal/80 p-5">
            <h2 className="text-lg font-semibold text-zinc-50">Parsing queue</h2>
            <div className="mt-5 divide-y divide-white/10">
              {steps.map((step) => (
                <div key={step.label} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-gold" size={17} aria-hidden="true" />
                    <span className="text-sm text-zinc-200">{step.label}</span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] text-platinum">{getStatusLabel(step.status)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-white/10 bg-charcoal/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">Generate proof</h2>
                <p className="mt-1 text-sm text-platinum">Create a proof from one of your private claims.</p>
              </div>
              <Hash className="text-gold" size={21} aria-hidden="true" />
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-200">Claim to prove</span>
                <select
                  value={selectedCredentialId}
                  onChange={(event) => setSelectedCredentialId(event.target.value)}
                  className="mt-2 h-11 w-full border border-white/10 bg-night px-4 text-sm text-zinc-50 outline-none focus:border-gold"
                  disabled={!proofableCredentials.length}
                >
                  {proofableCredentials.length ? (
                    proofableCredentials.map((credential) => (
                      <option key={credential.id} value={credential.id}>
                        {credential.label}
                      </option>
                    ))
                  ) : (
                    <option value="">No GPA claim detected yet</option>
                  )}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">Minimum GPA</span>
                <input
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  className="mt-2 h-11 w-full border border-white/10 bg-night px-4 text-sm text-zinc-50 outline-none focus:border-gold"
                  inputMode="decimal"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">Private GPA value</span>
                <input
                  value={gpaValue}
                  onChange={(event) => setGpaValue(event.target.value)}
                  className="mt-2 h-11 w-full border border-white/10 bg-night px-4 text-sm text-zinc-50 outline-none focus:border-gold"
                  placeholder="Used only to generate the proof"
                  inputMode="decimal"
                />
                <span className="mt-2 block text-xs leading-5 text-platinum">
                  This value is used to produce a pass/fail proof and is not shown to employers.
                </span>
              </label>

              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-night shadow-gold-soft disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={isGeneratingProof}
                onClick={() => void generateProof()}
              >
                {isGeneratingProof ? "Generating..." : "Generate proof"}
                <ShieldCheck size={16} aria-hidden="true" />
              </button>

              {proofError ? <ErrorMessage>{proofError}</ErrorMessage> : null}
            </div>
          </article>

          {proof ? (
            <ProofPanel
              proof={proof}
              status={proofStatus}
              onRefresh={async () => {
                const status = await api.getProofStatus(proof.proof_hash || proof.proof_id);
                setProofStatus(status);
                saveProofStatus(status);
              }}
            />
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function ClaimsPanel({
  resumeId,
  claims,
  credentials
}: {
  resumeId: number | null;
  claims: ResumeClaims;
  credentials: ResumeCredential[];
}) {
  return (
    <article className="border border-white/10 bg-charcoal/80">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          Parsed claims {resumeId ? `#${resumeId}` : ""}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-50">{claims.name || "Candidate profile"}</h2>
      </div>

      <div className="grid gap-0 md:grid-cols-3">
        <ClaimMetric label="Degree" value={claims.degree || "Not found"} />
        <ClaimMetric label="GPA" value={claims.gpa === null || claims.gpa === undefined ? "Not found" : String(claims.gpa)} />
        <ClaimMetric label="Certifications" value={claims.certifications.length ? String(claims.certifications.length) : "None"} />
      </div>

      <div className="border-t border-white/10 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-platinum">Proof-ready claims</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {credentials.length ? (
            credentials.map((credential) => (
              <span key={credential.id} className="border border-gold/25 bg-gold/[0.08] px-3 py-1.5 text-sm text-champagne">
                {credential.label}
              </span>
            ))
          ) : (
            <p className="text-sm text-platinum">No proof-ready claims detected from this upload.</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-platinum">Skills</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {claims.skills.length ? (
            claims.skills.map((skill) => (
              <span key={skill} className="border border-white/10 bg-night px-3 py-1.5 text-sm text-zinc-200">
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-platinum">No skills extracted.</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-platinum">Experience</h3>
        <div className="mt-3 divide-y divide-white/10">
          {claims.experience.length ? (
            claims.experience.map((item) => (
              <div key={`${item.company}-${item.role}-${item.duration}`} className="py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-zinc-50">{item.role}</p>
                  <p className="text-xs text-platinum">{item.duration}</p>
                </div>
                <p className="mt-1 text-sm text-gold">{item.company}</p>
                {item.description ? <p className="mt-2 text-sm leading-6 text-platinum">{item.description}</p> : null}
              </div>
            ))
          ) : (
            <p className="py-3 text-sm text-platinum">No experience extracted.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyClaimsPanel() {
  return (
    <article className="border border-white/10 bg-charcoal/60 p-5">
      <h2 className="text-lg font-semibold text-zinc-50">No parsed claims yet</h2>
      <p className="mt-2 text-sm leading-7 text-platinum">
        Upload a PDF resume to see extracted name, degree, GPA, skills, experience, and
        certifications here.
      </p>
    </article>
  );
}

function ResumeLibraryPanel({
  resumes,
  loading,
  error
}: {
  resumes: ResumeListItem[];
  loading: boolean;
  error: string;
}) {
  return (
    <article className="border border-white/10 bg-charcoal/80">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Saved resumes</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">Resume library</h2>
        </div>
        <FileText className="text-gold" size={21} aria-hidden="true" />
      </div>

      {loading ? (
        <div className="p-5 text-sm text-platinum">Loading saved resumes...</div>
      ) : error ? (
        <div className="p-5 text-sm leading-6 text-rose-200">{error}</div>
      ) : resumes.length ? (
        <div className="divide-y divide-white/10">
          {resumes.map((resume) => (
            <div key={resume.resume_id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-semibold text-zinc-50">
                  {resume.original_filename || `Resume #${resume.resume_id}`}
                </p>
                <p className="mt-1 text-sm text-platinum">
                  {resume.claims.name || "Candidate"} · {resume.claims.degree || "Education not detected"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {resume.credentials.length ? (
                    resume.credentials.map((credential) => (
                      <span key={credential.id} className="border border-white/10 bg-night px-2.5 py-1 text-xs text-zinc-200">
                        {credential.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-platinum">No proof-ready claims</span>
                  )}
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-platinum">Stored</p>
                <p className="mt-1 text-sm text-champagne">{formatStoredDate(resume.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 text-sm leading-7 text-platinum">
          No saved resumes yet. Your uploads will appear here after they are stored.
        </div>
      )}
    </article>
  );
}

function ClaimMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/10 p-5 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-xs uppercase tracking-[0.16em] text-platinum">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function formatStoredDate(value: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Stored";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ProofPanel({
  proof,
  status,
  onRefresh
}: {
  proof: ProofGenerateResponse;
  status: ProofStatusResponse | null;
  onRefresh: () => Promise<void>;
}) {
  return (
    <article className="border border-white/10 bg-charcoal/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Generated proof</p>
          <h2 className="mt-2 break-all text-lg font-semibold text-zinc-50">{proof.proof_id}</h2>
        </div>
        <button
          className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 text-platinum hover:text-zinc-50"
          type="button"
          aria-label="Refresh proof status"
          onClick={() => void onRefresh()}
        >
          <RefreshCw size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-5 grid gap-3 text-sm">
        <ProofRow label="Status" value={status?.status ?? proof.status} />
        <ProofRow label="Verified" value={String(status?.verified ?? false)} />
        <ProofRow label="Proof hash" value={proof.proof_hash} />
        <ProofRow label="Threshold" value={String(proof.public_inputs.threshold)} />
      </div>
    </article>
  );
}

function ProofRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border border-white/10 bg-night/60 px-3 py-2">
      <span className="text-xs uppercase tracking-[0.16em] text-platinum">{label}</span>
      <span className="break-all text-zinc-100">{value}</span>
    </div>
  );
}

function ErrorMessage({ children }: { children: string }) {
  return (
    <p className="mx-auto mt-4 max-w-md border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-sm leading-6 text-rose-100">
      {children}
    </p>
  );
}
