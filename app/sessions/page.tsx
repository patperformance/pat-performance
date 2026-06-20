import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { submitSession, deleteSession } from "@/app/actions";
import { format, parseISO } from "date-fns";

const SESSION_TYPES = [
  "Strength",
  "Conditioning",
  "Sparring",
  "Technical",
  "Skills",
  "Recovery",
  "Competition",
  "Other",
];

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("athlete_id", user.id)
    .order("session_date", { ascending: false });

  return (
    <div className="flex">
      <Sidebar role="athlete" name={profile?.full_name ?? "Athlete"} />
      <main className="flex-1 p-5 sm:p-8 max-w-3xl">
        <h1 className="font-display text-2xl font-semibold mb-1">Session log</h1>
        <p className="text-sm text-brand-muted mb-8">
          Log every session. Load is calculated automatically as duration × RPE.
        </p>

        <form action={submitSession} className="card p-6 grid sm:grid-cols-2 gap-4 mb-8">
          <Field label="Date">
            <input type="date" name="session_date" defaultValue={format(new Date(), "yyyy-MM-dd")} required className="input" />
          </Field>
          <Field label="Session type">
            <select name="session_type" required className="input">
              {SESSION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Duration (minutes)">
            <input type="number" name="duration_minutes" min={1} max={600} required className="input" placeholder="60" />
          </Field>
          <Field label="RPE (1–10)">
            <input type="number" name="rpe" min={1} max={10} required className="input" placeholder="7" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Comments (optional)">
              <textarea name="comments" rows={2} className="input resize-none" placeholder="How did it feel?" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-brand-green text-black font-semibold text-sm hover:bg-brand-greendark transition-colors focus-ring"
            >
              Save session
            </button>
          </div>
        </form>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface2 text-brand-muted text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">RPE</th>
                <th className="text-left px-4 py-3 font-medium">Load</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(sessions ?? []).map((s) => (
                <tr key={s.id} className="border-t border-brand-border">
                  <td className="px-4 py-3">{format(parseISO(s.session_date), "d MMM yyyy")}</td>
                  <td className="px-4 py-3">{s.session_type}</td>
                  <td className="px-4 py-3">{s.duration_minutes} min</td>
                  <td className="px-4 py-3">{s.rpe}</td>
                  <td className="px-4 py-3 font-medium text-brand-green">{s.session_load}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteSession}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-brand-muted hover:text-brand-red text-xs">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!sessions || sessions.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted text-sm">
                    No sessions logged yet. Add your first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
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
