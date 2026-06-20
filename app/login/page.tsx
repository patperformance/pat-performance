"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"athlete" | "coach">("athlete");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Signature panel: a live readiness pulse line, the one thing this page is remembered by */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-brand-black border-r border-brand-border overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <PulseField />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
            <span className="font-display font-semibold text-lg tracking-tight">Pat Performance</span>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            Know how every athlete is doing.
            <span className="text-brand-green"> Before it's too late.</span>
          </h1>
          <p className="mt-4 text-brand-muted text-sm leading-relaxed">
            Daily readiness, training load and ACWR tracked automatically —
            replacing the spreadsheet with one dashboard for you and one app for them.
          </p>
        </div>
        <div className="relative z-10 text-xs text-brand-muted">
          Readiness · Sleep · Training Load · ACWR
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-[#0a0a0a]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
            <span className="font-display font-semibold text-lg tracking-tight">Pat Performance</span>
          </div>

          <div className="flex gap-1 mb-8 p-1 rounded-full bg-brand-surface2 border border-brand-border w-fit">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus-ring ${
                  mode === m ? "bg-brand-green text-black" : "text-brand-muted hover:text-white"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-semibold mb-1">
            {mode === "signin" ? "Welcome back" : "Set up your account"}
          </h2>
          <p className="text-sm text-brand-muted mb-8">
            {mode === "signin"
              ? "Sign in to check in or view your dashboard."
              : "Athletes log daily check-ins. Coaches monitor everyone."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {(["athlete", "coach"] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors focus-ring ${
                        role === r
                          ? "border-brand-green bg-brand-green/10 text-brand-green"
                          : "border-brand-border text-brand-muted hover:border-brand-muted"
                      }`}
                    >
                      {r === "athlete" ? "I'm an athlete" : "I'm the coach"}
                    </button>
                  ))}
                </div>
                <Field label="Full name">
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    placeholder="Jane Smith"
                  />
                </Field>
              </>
            )}

            <Field label="Email">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password">
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="text-sm text-brand-red bg-brand-red/10 border border-brand-red/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-green text-black font-semibold text-sm hover:bg-brand-greendark transition-colors focus-ring disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          color: white;
        }
        .input:focus {
          outline: 2px solid #22c55e;
          outline-offset: 1px;
          border-color: #22c55e;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-brand-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

/** Ambient signature: rows of staggered heartbeat-style pulse lines, the visual thesis of the brand. */
function PulseField() {
  const rows = 6;
  return (
    <svg viewBox="0 0 600 800" className="w-full h-full">
      {Array.from({ length: rows }).map((_, i) => {
        const y = 80 + i * 130;
        const d = `M0 ${y} L80 ${y} L100 ${y - 40} L120 ${y + 60} L140 ${y - 20} L160 ${y} L600 ${y}`;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeOpacity={0.5 - i * 0.06}
          />
        );
      })}
    </svg>
  );
}
