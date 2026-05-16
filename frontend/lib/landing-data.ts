import {
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Send,
  ShieldCheck
} from "lucide-react";

export const proofFlow = [
  {
    icon: FileText,
    label: "Public profile",
    title: "Relevant signals are visible",
    body: "Recruiters can discover verified skills, role fit, location preference, and availability without seeing transcripts, exact scores, documents, or private history."
  },
  {
    icon: Send,
    label: "Access request",
    title: "Recruiters ask for more",
    body: "When deeper context is needed, the employer sends a scoped request for specific private details instead of receiving the whole candidate record by default."
  },
  {
    icon: KeyRound,
    label: "Candidate approval",
    title: "The candidate controls disclosure",
    body: "Candidates approve, decline, or limit what is shared. VeriHire turns private career data into consent-based access, not a public feed."
  },
  {
    icon: ShieldCheck,
    label: "Verified reveal",
    title: "Details unlock with proof",
    body: "Approved employers receive the requested verified details and proof status while unrelated sensitive data stays hidden."
  }
];

export const productStats = [
  { value: "Public", label: "verified professional signal" },
  { value: "Consent", label: "candidate-approved access" },
  { value: "Private", label: "documents stay protected" }
];

export const trustSignals = [
  "Skills and education summary visible",
  "Transcript details require approval",
  "Exact GPA hidden from public profile",
  "Recruiter request is scoped and auditable"
];

export const testimonials = [
  {
    quote:
      "VeriHire feels like a professional network where trust is built in and privacy is not an afterthought.",
    name: "Amina Niyonsenga",
    role: "People Operations Lead, Kigali"
  },
  {
    quote:
      "The strongest part is consent. Recruiters can ask for more, but candidates stay in control of the unlock.",
    name: "Leyla Aliyeva",
    role: "Security Program Manager, Baku"
  },
  {
    quote:
      "It gives employers enough signal to move fast without turning every profile into a permanent background check.",
    name: "Kwame Mensah",
    role: "Talent Systems Advisor, Accra"
  }
];

export const roleCards = [
  {
    icon: BadgeCheck,
    title: "For candidates",
    body: "Create a verified profile, show only relevant career signals publicly, and approve private detail requests one by one."
  },
  {
    icon: BriefcaseBusiness,
    title: "For employers",
    body: "Search qualified talent, request specific private evidence when needed, and review verified context without over-collecting."
  }
];
