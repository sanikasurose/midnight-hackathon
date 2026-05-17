"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import type { AuthLoginRequest, AuthRegisterRequest, AuthResponse, Role } from "../../../shared/contracts/http";
import { api, ApiError } from "@/lib/api";
import { storeAuthSession } from "@/components/auth/auth-storage";

type AuthMode = "login" | "register";

type AuthPageProps = {
  initialMode: AuthMode;
};

type FormState = AuthRegisterRequest & {
  name: string;
};

const modeCopy = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to VeriHire",
    body: "Continue managing verified profile access, recruiter requests, and private disclosures.",
    submit: "Sign in",
    swapText: "Need a verified profile?",
    swapAction: "Create one"
  },
  register: {
    eyebrow: "Create verified access",
    title: "Join VeriHire",
    body: "Start with a privacy-controlled professional profile built for verified discovery.",
    submit: "Create account",
    swapText: "Already have an account?",
    swapAction: "Sign in"
  }
};

const roles: Array<{ value: Role; label: string; helper: string }> = [
  { value: "CANDIDATE", label: "Candidate", helper: "Control profile visibility" },
  { value: "EMPLOYER", label: "Employer", helper: "Request verified access" }
];

export function AuthPage({ initialMode }: AuthPageProps) {
  console.log("AuthPage component mounted, initialMode:", initialMode);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    role: "CANDIDATE"
  });

  const copy = modeCopy[mode];
  const isRegister = mode === "register";

  const passwordLabel = useMemo(() => (isRegister ? "Create password" : "Password"), [isRegister]);

  useEffect(() => {
    function syncModeFromPath() {
      setMode(window.location.pathname.includes("register") ? "register" : "login");
      setNotice("");
    }

    window.addEventListener("popstate", syncModeFromPath);
    return () => window.removeEventListener("popstate", syncModeFromPath);
  }, []);

  function switchMode(nextMode: AuthMode) {
    setNotice("");
    setMode(nextMode);
    window.history.pushState(null, "", `/${nextMode}`);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const payload: AuthLoginRequest | AuthRegisterRequest = isRegister
      ? { email: form.email, password: form.password, role: form.role }
      : { email: form.email, password: form.password };

    console.log("Submitting auth request:", { mode, payload });

    try {
      const auth: AuthResponse = isRegister
        ? await api.register(payload as AuthRegisterRequest)
        : await api.login(payload as AuthLoginRequest);
      console.log("Auth response:", auth);
      storeAuthSession(auth, payload.email);

      const redirectTo = auth.role === "EMPLOYER" ? "/employer" : "/candidate/dashboard";
      window.location.assign(redirectTo);
    } catch (error) {
      console.error("Auth error:", error);
      setNotice(error instanceof ApiError ? error.message : "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid h-dvh overflow-hidden bg-night text-zinc-50 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden border-r border-white/10 bg-charcoal/40 px-10 py-8 lg:flex lg:flex-col">
        <a href="/landing" className="inline-flex w-fit items-center gap-3 text-sm text-platinum transition-colors hover:text-zinc-50">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to landing
        </a>

        <div className="my-auto max-w-xl">
          <Logo />
          <p className="mt-16 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Verified discovery, consent-first access
          </p>
          <h1 className="mt-5 text-balance text-5xl font-semibold leading-tight text-zinc-50">
            Professional identity with private data boundaries.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-platinum">
            Candidates decide when detailed evidence is shared. Employers get cleaner verified context
            without turning every profile into an open background check.
          </p>

          <div className="mt-10 grid gap-3">
            {[
              "Public profile shows relevant verified signals.",
              "Private details unlock through scoped requests.",
              "Candidate approval controls every reveal."
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-zinc-200">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                  <Check size={14} aria-hidden="true" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid h-dvh place-items-center px-5 py-5 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Logo />
            <a href="/landing" className="text-sm text-platinum transition-colors hover:text-zinc-50">
              Landing
            </a>
          </div>

          <motion.div
            layout
            className="auth-perspective"
            transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                layout
                initial={{
                  rotateY: mode === "register" ? -92 : 92,
                  opacity: 0,
                  scale: 0.985
                }}
                animate={{
                  rotateY: 0,
                  opacity: 1,
                  scale: 1,
                  transition: {
                    duration: 0.72,
                    ease: [0.16, 1, 0.3, 1],
                    opacity: { duration: 0.28, delay: 0.12 }
                  }
                }}
                exit={{
                  rotateY: mode === "register" ? 92 : -92,
                  opacity: 0,
                  scale: 0.985,
                  transition: {
                    duration: 0.62,
                    ease: [0.7, 0, 0.84, 0],
                    opacity: { duration: 0.22, delay: 0.2 }
                  }
                }}
                className="auth-card overflow-hidden border border-white/10 bg-charcoal/92 p-5 shadow-2xl shadow-black/45 sm:p-7"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{copy.eyebrow}</p>
                    <h2 className="mt-3 text-3xl font-semibold text-zinc-50">{copy.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-platinum">{copy.body}</p>
                  </div>
                  <div className="grid h-11 w-11 shrink-0 place-items-center border border-gold/40 bg-gold/10 text-gold">
                    {isRegister ? <BriefcaseBusiness size={20} aria-hidden="true" /> : <LockKeyhole size={20} aria-hidden="true" />}
                  </div>
                </div>

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                  {isRegister ? (
                    <label className="block">
                      <span className="text-sm font-medium text-zinc-200">Full name</span>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        className="mt-2 h-11 w-full border border-white/10 bg-night px-4 text-sm text-zinc-50 outline-none transition-colors placeholder:text-platinum/55 focus:border-gold"
                        placeholder="Amina Niyonsenga"
                        autoComplete="name"
                        required
                      />
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-200">Email address</span>
                    <input
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="mt-2 h-11 w-full border border-white/10 bg-night px-4 text-sm text-zinc-50 outline-none transition-colors placeholder:text-platinum/55 focus:border-gold"
                      placeholder="you@company.com"
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-200">{passwordLabel}</span>
                    <div className="mt-2 flex h-11 border border-white/10 bg-night focus-within:border-gold">
                      <input
                        value={form.password}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-zinc-50 outline-none placeholder:text-platinum/55"
                        placeholder="Minimum 8 characters"
                        type={showPassword ? "text" : "password"}
                        autoComplete={isRegister ? "new-password" : "current-password"}
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="grid w-11 place-items-center text-platinum transition-colors hover:text-zinc-50 focus:outline-none focus-visible:text-gold"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                      </button>
                    </div>
                  </label>

                  {isRegister ? (
                    <fieldset>
                      <legend className="text-sm font-medium text-zinc-200">Account type</legend>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {roles.map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, role: role.value }))}
                            className={cn(
                              "border px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                              form.role === role.value
                                ? "border-gold bg-gold/10 text-zinc-50"
                                : "border-white/10 bg-night text-platinum hover:border-white/20"
                            )}
                          >
                            <span className="block text-sm font-semibold">{role.label}</span>
                            <span className="mt-1 block text-xs leading-4 text-platinum">{role.helper}</span>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-night shadow-gold-soft transition-colors hover:bg-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-night disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => console.log("Button clicked!")}
                  >
                    {isSubmitting ? "Preparing..." : copy.submit}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>

                  {notice ? (
                    <p className="border border-gold/25 bg-gold/[0.08] px-4 py-3 text-sm leading-6 text-champagne">
                      {notice}
                    </p>
                  ) : null}
                </form>

                <div className="mt-5 flex items-center justify-center gap-2 text-sm text-platinum">
                  <span>{copy.swapText}</span>
                  <a
                    href={isRegister ? "/login" : "/register"}
                    onClick={(event) => {
                      event.preventDefault();
                      switchMode(isRegister ? "login" : "register");
                    }}
                    className="font-semibold text-champagne underline decoration-gold/45 underline-offset-4 transition-colors hover:text-gold"
                  >
                    {copy.swapAction}
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <p className="mt-4 text-center text-xs leading-5 text-platinum">
            By continuing, you agree to use VeriHire for consent-based credential access.
          </p>
        </div>
      </section>
    </main>
  );
}
