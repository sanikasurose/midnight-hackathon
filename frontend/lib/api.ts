import type {
  ApplicationCreateRequest,
  ApplicationCreateResponse,
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthResponse,
  EmployerApplicationItem,
  JobCreateRequest,
  JobCreateResponse,
  JobListItem,
  ProofGenerateRequest,
  ProofGenerateResponse,
  ProofStatusResponse,
  ResumeListItem,
  ResumeUploadResponse
} from "../../shared/contracts/http";
import { clearAuthStorage, getStoredToken } from "@/components/auth/auth-storage";

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

function extractErrorMessage(detail: unknown) {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "detail" in detail) {
    const value = (detail as { detail?: unknown }).detail;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map((item) => JSON.stringify(item)).join(", ");
  }
  return "Request failed";
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, auth = true, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (!(body instanceof FormData) && body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getStoredToken();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: requestHeaders,
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    throw new ApiError("Backend unavailable. Please try again.", 0, error);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => "");

  if (!response.ok) {
    if (response.status === 401) clearAuthStorage();
    throw new ApiError(extractErrorMessage(data), response.status, data);
  }

  return data as T;
}

export const api = {
  register: (payload: AuthRegisterRequest) =>
    apiRequest<AuthResponse>("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload: AuthLoginRequest) =>
    apiRequest<AuthResponse>("/auth/login", { method: "POST", body: payload, auth: false }),
  uploadResume: (payload: { userId: number; file: File }) => {
    const formData = new FormData();
    formData.append("user_id", String(payload.userId));
    formData.append("file", payload.file);
    return apiRequest<ResumeUploadResponse>("/resume/upload", {
      method: "POST",
      body: formData
    });
  },
  listUserResumes: (userId: number) => apiRequest<ResumeListItem[]>(`/resume/user/${userId}`),
  generateProof: (payload: ProofGenerateRequest) =>
    apiRequest<ProofGenerateResponse>("/proof/generate", { method: "POST", body: payload }),
  getProofStatus: (proofId: string) =>
    apiRequest<ProofStatusResponse>(`/proof/status/${encodeURIComponent(proofId)}`),
  listJobs: () => apiRequest<JobListItem[]>("/jobs", { auth: false }),
  createJob: (payload: JobCreateRequest) =>
    apiRequest<JobCreateResponse>("/jobs", { method: "POST", body: payload }),
  listEmployerJobs: () => apiRequest<JobListItem[]>("/jobs/employer/mine"),
  listEmployerApplications: () => apiRequest<EmployerApplicationItem[]>("/jobs/employer/applications"),
  applyToJob: (jobId: number, payload: ApplicationCreateRequest) =>
    apiRequest<ApplicationCreateResponse>(`/jobs/${jobId}/apply`, { method: "POST", body: payload })
};
