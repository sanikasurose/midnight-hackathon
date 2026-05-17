"use client";

export type StoredRole = "CANDIDATE" | "EMPLOYER";

const keys = ["verihire_token", "verihire_role", "verihire_user_id", "verihire_email"] as const;

export function clearAuthStorage() {
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem("verihire_token");
}

export function getStoredRole(): StoredRole | null {
  const role = window.localStorage.getItem("verihire_role");
  return role === "CANDIDATE" || role === "EMPLOYER" ? role : null;
}

