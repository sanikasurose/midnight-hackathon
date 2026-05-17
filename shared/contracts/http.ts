export type Role = "CANDIDATE" | "EMPLOYER";

export type AuthRegisterRequest = { email: string; password: string; role: Role };
export type AuthLoginRequest = { email: string; password: string };
export type AuthResponse = { token: string; user_id: number; role: Role };

export type ExperienceItem = {
  company: string;
  role: string;
  duration: string;
  description?: string | null;
};

export type ResumeClaims = {
  name: string;
  degree: string;
  gpa?: number | null;
  skills: string[];
  experience: ExperienceItem[];
  certifications: string[];
};

export type ResumeCredential = {
  id: number;
  claim_type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION" | string;
  label: string;
  verification_status: string;
};

export type ResumeUploadResponse = {
  resume_id: number;
  claims: ResumeClaims;
  credentials: ResumeCredential[];
};

export type ResumeListItem = {
  resume_id: number;
  original_filename?: string | null;
  created_at: string;
  claims: ResumeClaims;
  credentials: ResumeCredential[];
};

export type ResumeClaimsResponse = { resume_id: number; claims: ResumeClaims };

export type ProofGenerateRequest = {
  credential_id: string;
  threshold: number;
  gpa_value?: number;
  proof_type?: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";
};

export type ProofGenerateResponse = {
  proof_id: string;
  proof_hash: string;
  credential_hash?: string | null;
  proof_type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";
  public_inputs: {
    threshold: number;
    commitment?: string;
  };
  proof?: string;
  status: "generated" | "pending" | "verified" | "failed";
  timestamp: string;
  tx_hash?: string;
  error?: string | null;
};

export type ProofStatusResponse = {
  proof_id: string;
  proof_hash?: string | null;
  status: "generated" | "pending" | "verified" | "failed";
  proof_type?: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION" | null;
  verified?: boolean | null;
  timestamp: string;
  contract_status?: {
    stored_on_chain: boolean;
    transaction_hash?: string;
    block_number?: number;
  } | null;
};

export type JobRequirement = {
  type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";
  operator: ">" | ">=" | "==" | "<" | "<=";
  value: number;
};

export type JobCreateRequest = {
  title: string;
  description: string;
  requirements: JobRequirement[] | Record<string, unknown>;
};

export type JobCreateResponse = {
  job_id: number;
  title: string;
  description?: string;
  requirements?: JobRequirement[] | Record<string, unknown>;
  created_at?: string;
};

export type JobListItem = {
  id: number;
  title: string;
  description?: string | null;
  requirements: Record<string, unknown>;
  application_count?: number;
  created_at?: string | null;
};

export type JobResponse = {
  id?: number;
  job_id?: number;
  title: string;
  description: string;
  requirements: Record<string, unknown>;
};

export type ApplicationCreateRequest = { credential_id: number };
export type ApplicationCreateResponse = {
  application_id: number;
  job_id: number;
  verification_status: "PENDING" | "VERIFIED" | "FAILED" | string;
};

export type EmployerApplicationItem = {
  application_id: number;
  job_id: number;
  job_title: string;
  candidate_id: number;
  candidate_email?: string | null;
  credential_id?: number | null;
  credential_type?: string | null;
  verification_status: "PENDING" | "VERIFIED" | "FAILED" | string;
  created_at?: string | null;
};

export type MidnightConfig = {
  rpc_url: string;
  proof_server_url: string;
  contract_address: string;
  network: "devnet" | "preview" | "mainnet";
};

export type ErrorResponse = {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};
