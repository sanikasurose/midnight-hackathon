import { Eye, LockKeyhole, ShieldCheck, UnlockKeyhole, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/candidate/page-header";

const stats = [
  { label: "Profile mode", value: "Selective", icon: ShieldCheck },
  { label: "Access requests", value: "2 pending", icon: UnlockKeyhole },
  { label: "Recruiter views", value: "18 this week", icon: UsersRound }
];

const publicSignals = [
  { label: "Education", value: "Computer Science degree", visibility: "Public" },
  { label: "Core skills", value: "Python, APIs, PostgreSQL", visibility: "Public" },
  { label: "Availability", value: "Remote or hybrid", visibility: "Public" },
  { label: "Exact GPA", value: "Hidden until approved", visibility: "Private" }
];

const requests = [
  {
    company: "Northstar Labs",
    request: "Transcript confirmation and Python project evidence",
    received: "Today, 09:40"
  },
  {
    company: "Cedar Finance",
    request: "Employment dates for backend role",
    received: "Yesterday"
  }
];

export default function CandidateDashboardPage() {
  return (
    <section>
      <PageHeader eyebrow="Candidate workspace" title="Your profile is visible. Your details are not.">
        Manage what recruiters can discover publicly and which private details are waiting for your
        approval.
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
              <h2 className="mt-5 text-2xl font-semibold text-zinc-50">{stat.value}</h2>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="border border-white/10 bg-charcoal/80">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">Profile visibility</h2>
              <p className="mt-1 text-sm text-platinum">What recruiters can see before asking.</p>
            </div>
            <Eye className="text-gold" size={20} aria-hidden="true" />
          </div>
          <div className="divide-y divide-white/10">
            {publicSignals.map((signal) => (
              <div key={signal.label} className="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
                <span className="text-sm text-platinum">{signal.label}</span>
                <span className="text-sm font-medium text-zinc-100">{signal.value}</span>
                <span className={signal.visibility === "Public" ? "text-xs font-semibold uppercase tracking-[0.16em] text-gold" : "text-xs font-semibold uppercase tracking-[0.16em] text-platinum"}>
                  {signal.visibility}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-white/10 bg-charcoal/80">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">Access requests</h2>
              <p className="mt-1 text-sm text-platinum">Review before anything private is shared.</p>
            </div>
            <LockKeyhole className="text-gold" size={20} aria-hidden="true" />
          </div>
          <div className="divide-y divide-white/10">
            {requests.map((request) => (
              <div key={request.company} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-zinc-50">{request.company}</p>
                  <span className="text-xs text-platinum">{request.received}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-platinum">{request.request}</p>
                <div className="mt-4 flex gap-2">
                  <button className="h-9 border border-gold/45 bg-gold/10 px-3 text-sm font-semibold text-champagne" type="button">
                    Review
                  </button>
                  <button className="h-9 border border-white/10 px-3 text-sm text-platinum" type="button">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
