// Shared request/response shapes with Midnight integration
// Mirrors VeriHire PRD and Compact contract data structures

export type Role = "CANDIDATE" | "EMPLOYER";

// ============================================================================
// AUTHENTICATION
// ============================================================================

export type AuthRegisterRequest = { email: string; password: string; role: Role };
export type AuthLoginRequest = { email: string; password: string };
export type AuthResponse = { token: string; user_id: number; role: Role };

// ============================================================================
// RESUME & CREDENTIALS
// ============================================================================

export type ResumeUploadResponse = { resume_id: number; claims: Record<string, unknown> };

// Credential claim extracted from resume
export type CredentialClaim = {
  claim_type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";
  claim_value: string;  // encrypted/hashed reference
  credential_hash: string;  // SHA256 hash of claim (for on-chain storage)
  midnight_tx_id?: string;  // transaction hash from contract.store_credential()
};

// ============================================================================
// PROOF GENERATION & VERIFICATION (Midnight Integration)
// ============================================================================

// Request to generate a ZK proof
export type ProofGenerateRequest = {
  credential_id: string;  // credential to prove
  threshold: number;      // for GPA: 3.5 means "GPA > 3.5"
  proof_type?: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";  // default: GPA
};

// Response from proof generation
export type ProofGenerateResponse = {
  proof_id: string;       // unique proof identifier
  proof_hash: string;     // SHA256 hash of proof (for on-chain lookup)
  credential_hash: string;  // which credential this proof is for
  proof_type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";
  public_inputs: {
    threshold: number;    // what was being proved (GPA > threshold)
    commitment?: string;  // ZK commitment (if applicable)
  };
  proof?: string;         // actual proof bytes (hex-encoded)
  status: "generated" | "pending" | "verified" | "failed";
  timestamp: string;      // ISO datetime
  tx_hash?: string;       // transaction hash from contract.verify_gpa_proof()
};

// Request to verify a proof against requirements
export type ProofVerifyRequest = {
  proof_id: string;
  requirements?: Record<string, { operator: ">=" | ">" | "==" | "<" | "<="; value: number }>;
};

// Response from proof verification
export type ProofVerifyResponse = {
  verified: boolean;      // TRUE if proof is valid
  proof_id: string;
  proof_hash: string;
  proof_type: string;
  status: "verified" | "failed" | "pending";
  timestamp: string;
  details?: Record<string, unknown>;
};

// Request to check proof status
export type ProofStatusRequest = {
  proof_id: string;
};

// Response with proof status
export type ProofStatusResponse = {
  proof_id: string;
  proof_hash: string;
  status: "generated" | "pending" | "verified" | "failed";
  proof_type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";
  verified: boolean;
  timestamp: string;
  contract_status?: {
    stored_on_chain: boolean;
    transaction_hash?: string;
    block_number?: number;
  };
};

// ============================================================================
// JOB REQUIREMENTS & APPLICATIONS
// ============================================================================

export type JobRequirement = {
  type: "GPA" | "EXPERIENCE" | "DEGREE" | "CERTIFICATION";
  operator: ">" | ">=" | "==" | "<" | "<=";
  value: number;  // GPA > value, EXPERIENCE >= value, etc.
};

export type JobCreateRequest = {
  title: string;
  description: string;
  requirements: JobRequirement[] | Record<string, unknown>;
};

// Canonical response used by the current backend `/jobs` POST handler.
export type JobCreateResponse = { job_id: number; title: string };

export type JobResponse = {
  job_id: string;
  title: string;
  description: string;
  requirements: JobRequirement[];
  created_at: string;
};

// Application with ZK proof verification
export type ApplicationSubmitRequest = {
  job_id: string;
  candidate_id: string;
  proof_ids: string[];  // list of proof IDs to verify
};

export type ApplicationResponse = {
  application_id: string;
  job_id: string;
  candidate_id: string;
  proof_ids: string[];
  verified: boolean;
  verification_details?: {
    all_requirements_passed: boolean;
    requirements_status: Record<string, { satisfied: boolean }>;
    timestamp: string;
    contract_result?: boolean;
  };
  status: "pending" | "verified" | "failed";
  created_at: string;
  updated_at: string;
};

// ============================================================================
// MIDNIGHT INTEGRATION TYPES
// ============================================================================

export type MidnightConfig = {
  rpc_url: string;
  proof_server_url: string;
  contract_address: string;
  network: "devnet" | "preview" | "mainnet";
};

// For troubleshooting/logging
export type MidnightDebugInfo = {
  rpc_connected: boolean;
  proof_server_connected: boolean;
  contract_deployed: boolean;
  last_proof_timestamp?: string;
  pending_proofs_count: number;
  errors?: string[];
};

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export type ErrorResponse = {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};
