"use client";

import { CheckCircle2, FileText, FileUp, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { cn } from "@/lib/utils";

type QueueStatus = "WAITING" | "ACTIVE" | "READY";

const baseParsingSteps: Array<{ label: string; status: QueueStatus }> = [
  { label: "Extract education", status: "WAITING" },
  { label: "Identify skills", status: "WAITING" },
  { label: "Prepare private claims", status: "WAITING" }
];

export default function CandidateUploadPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [steps, setSteps] = useState(baseParsingSteps);

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
    setError("");
    setClaims(null);
    setResumeId(null);
    setSelectedFileName(file.name);
    resetQueue();

    const validationError = validatePdf(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const userId = window.localStorage.getItem("verihire_user_id");
    if (!userId) {
      setError("Please sign in again.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const url = `${apiUrl}/resume/upload`;

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("file", file);

    const token = window.localStorage.getItem("verihire_token");

    setIsUploading(true);
    setQueueStatus(0, "ACTIVE");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });

      const data = (await response.json().catch(() => null)) as
        | { resume_id: number; claims: Record<string, unknown> }
        | { detail?: string }
        | null;

      if (!response.ok) {
        const message =
          (data && typeof data === "object" && "detail" in data && typeof data.detail === "string" && data.detail) ||
          "Upload failed";
        setError(message);
        return;
      }

      setQueueStatus(0, "READY");
      setQueueStatus(1, "ACTIVE");
      setQueueStatus(1, "READY");
      setQueueStatus(2, "ACTIVE");

      const ok = data as { resume_id: number; claims: Record<string, unknown> };
      setResumeId(ok.resume_id);
      setClaims(ok.claims);

      setQueueStatus(2, "READY");
    } catch {
      setError("Backend unavailable. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

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
          <div
            className={cn(
              "grid min-h-[18rem] place-items-center text-center",
              isUploading ? "opacity-80" : "opacity-100"
            )}
            onDragOver={(event) => {
              event.preventDefault();
            }}
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
                The parser will extract candidate-owned claims. Nothing becomes public until you
                review and publish it.
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
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-night shadow-gold-soft"
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? "Uploading..." : "Choose file"}
              </button>

              {selectedFileName ? (
                <p className="mt-4 text-xs text-platinum">Selected: {selectedFileName}</p>
              ) : null}

              {error ? (
                <p className="mx-auto mt-4 max-w-md border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-sm leading-6 text-rose-100">
                  {error}
                </p>
              ) : null}

              {claims ? (
                <div className="mx-auto mt-6 max-w-md text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    Parsed claims {resumeId ? `(resume #${resumeId})` : ""}
                  </p>
                  <pre className="mt-3 overflow-auto border border-white/10 bg-night/70 p-4 text-xs text-zinc-100">
                    {JSON.stringify(claims, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <article className="border border-white/10 bg-charcoal/80 p-5">
            <h2 className="text-lg font-semibold text-zinc-50">Parsing queue</h2>
            <div className="mt-5 divide-y divide-white/10">
              {steps.map((step) => (
                <div key={step.label} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-gold" size={17} aria-hidden="true" />
                    <span className="text-sm text-zinc-200">{step.label}</span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] text-platinum">
                    {step.status === "WAITING" ? "WAITING" : step.status === "ACTIVE" ? "ACTIVE" : "READY"}
                  </span>
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
