// Phase 0 shared request/response shapes (mirrors PRD quick reference).

export type Role = "CANDIDATE" | "EMPLOYER";

export type AuthRegisterRequest = {
  email: string;
  password: string;
  role: Role;
};
export type AuthLoginRequest = { email: string; password: string };
export interface AuthResponse {
  token: string;
  user_id: number;
  role: "CANDIDATE" | "EMPLOYER";
}

export type ResumeUploadResponse = {
  resume_id: number;
  claims: Record<string, unknown>;
};

export type ProofGenerateRequest = { resume_id: number; claim_type: string };
export type ProofGenerateResponse = { proof_id: string; tx_hash: string };

export type ProofVerifyRequest = {
  proof_id: string;
  requirements: Record<string, unknown>;
};
export type ProofVerifyResponse = {
  verified: boolean;
  details: Record<string, unknown>;
};

export type JobCreateRequest = {
  title: string;
  description: string;
  requirements: Record<string, unknown>;
};
export type JobCreateResponse = { job_id: number };

export type JobApplyRequest = { candidate_id: number; proof_id: string };
export type JobApplyResponse = {
  application_id: number;
  status: "PENDING" | "PASS" | "FAIL";
};
