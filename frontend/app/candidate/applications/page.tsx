import { Clock, Eye, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/candidate/page-header";

const applications = [
  {
    role: "Backend Engineer, Identity Systems",
    company: "Northstar Labs",
    status: "Access requested",
    detail: "Employer requested transcript confirmation and Python experience evidence.",
    icon: Eye
  },
  {
    role: "Privacy Platform Developer",
    company: "Amani Cloud",
    status: "Proof shared",
    detail: "You approved CS degree and GPA threshold proof.",
    icon: ShieldCheck
  },
  {
    role: "Applied AI Infrastructure Engineer",
    company: "Cedar Finance",
    status: "Pending review",
    detail: "Application submitted with public profile only.",
    icon: Clock
  }
];

export default function CandidateApplicationsPage() {
  return (
    <section>
      <PageHeader eyebrow="Applications" title="Requests, approvals, and proof history.">
        Keep track of where you applied and what private information each employer is allowed to see.
      </PageHeader>

      <div className="overflow-hidden border border-white/10 bg-charcoal/80">
        <div className="hidden grid-cols-[1.1fr_0.8fr_0.8fr] border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-platinum md:grid">
          <span>Role</span>
          <span>Status</span>
          <span>Disclosure scope</span>
        </div>
        {applications.map((application) => {
          const Icon = application.icon;

          return (
            <article key={application.role} className="border-b border-white/10 p-5 last:border-b-0">
              <div className="grid gap-4 md:grid-cols-[1.1fr_0.8fr_0.8fr] md:items-center">
                <div>
                  <p className="text-sm text-gold">{application.company}</p>
                  <h2 className="mt-1 text-lg font-semibold text-zinc-50">{application.role}</h2>
                </div>
                <div className="inline-flex w-fit items-center gap-2 border border-gold/35 bg-gold/[0.08] px-3 py-2 text-sm font-semibold text-champagne">
                  <Icon size={16} aria-hidden="true" />
                  {application.status}
                </div>
                <p className="text-sm leading-6 text-platinum">{application.detail}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
