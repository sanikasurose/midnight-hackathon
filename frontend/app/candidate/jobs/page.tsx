import { ArrowRight, BriefcaseBusiness, MapPin, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/candidate/page-header";

const jobs = [
  {
    title: "Backend Engineer, Identity Systems",
    company: "Northstar Labs",
    location: "Toronto or remote",
    match: "92%",
    request: "May request transcript confirmation"
  },
  {
    title: "Privacy Platform Developer",
    company: "Amani Cloud",
    location: "Kigali hybrid",
    match: "88%",
    request: "Public profile enough to apply"
  },
  {
    title: "Applied AI Infrastructure Engineer",
    company: "Cedar Finance",
    location: "London remote",
    match: "81%",
    request: "May request employment dates"
  }
];

export default function CandidateJobsPage() {
  return (
    <section>
      <PageHeader eyebrow="Matched jobs" title="Roles matched to your public profile.">
        Apply using visible verified signals first. Employers can request private evidence only when
        they need it.
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 border border-white/10 bg-charcoal/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-platinum">
          <SlidersHorizontal size={17} className="text-gold" aria-hidden="true" />
          Showing roles that match visible profile signals
        </div>
        <div className="flex gap-2 text-sm">
          <button className="border border-gold/40 bg-gold/10 px-3 py-2 text-champagne" type="button">Best match</button>
          <button className="border border-white/10 px-3 py-2 text-platinum" type="button">Remote</button>
          <button className="border border-white/10 px-3 py-2 text-platinum" type="button">Requests likely</button>
        </div>
      </div>

      <div className="grid gap-3">
        {jobs.map((job) => (
          <article key={job.title} className="border border-white/10 bg-charcoal/80 p-5 md:flex md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 text-sm text-gold">
                <BriefcaseBusiness size={17} aria-hidden="true" />
                {job.company}
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-zinc-50">{job.title}</h2>
              <p className="mt-3 flex items-center gap-2 text-sm text-platinum">
                <MapPin size={16} aria-hidden="true" />
                {job.location}
              </p>
              <p className="mt-2 text-sm text-platinum">{job.request}</p>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 md:mt-0">
              <div className="text-right">
                <p className="text-sm text-platinum">Profile match</p>
                <p className="text-2xl font-semibold text-champagne">{job.match}</p>
              </div>
              <button className="grid h-11 w-11 place-items-center rounded-full bg-gold text-night" type="button" aria-label={`Apply to ${job.title}`}>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
