"use client";

export type StoredRole = "CANDIDATE" | "EMPLOYER";

const keys = ["verihire_token", "verihire_role", "verihire_user_id", "verihire_email"] as const;

type JwtPayload = {
  user_id?: number;
  email?: string;
  role?: StoredRole;
  exp?: number;
};

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  if (typeof window !== "undefined") return window.atob(padded);
  return "";
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

export function storeAuthSession(auth: { token: string; user_id: number; role: StoredRole }, email: string) {
  if (typeof window === "undefined") return;
  const decoded = decodeJwt(auth.token);
  window.localStorage.setItem("verihire_token", auth.token);
  window.localStorage.setItem("verihire_user_id", String(decoded?.user_id ?? auth.user_id));
  window.localStorage.setItem("verihire_role", decoded?.role ?? auth.role);
  window.localStorage.setItem("verihire_email", decoded?.email ?? email);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("verihire_token");
}

export function getStoredRole(): StoredRole | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem("verihire_role");
  return role === "CANDIDATE" || role === "EMPLOYER" ? role : null;
}

export function getStoredUserId(): number | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem("verihire_user_id");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getAuthSession() {
  if (typeof window === "undefined") return null;
  const token = getStoredToken();
  const role = getStoredRole();
  const userId = getStoredUserId();
  const email = window.localStorage.getItem("verihire_email");

  if (!token || !role || !userId) return null;
  if (isTokenExpired(token)) {
    clearAuthStorage();
    return null;
  }

  return { token, role, userId, email };
}

