import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { addImportantDate } from "@/app/actions";
import { format, parseISO } from "date-fns";

const EVENT_TYPES = ["Fight", "Competition", "Holiday", "Injury", "Other"] as const;
const eventColor: Record<string, string> = {
  Fight: "#ef4444",
  Competition: "#22c55e",
  Holiday: "#60a5fa",
  Injury: "#f59e0b",
  Other: "#8a8a8a",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const isCoach = profile?.role === "coach";

  let athletes: { id: string; full_name: string }[] = [];
  let dates: any[] = [];

  if (isCoach) {
    const { data: athleteRows } = await supabase
      .from("athletes")
      .select("id, profiles!inner(full_name)")
      .eq("coach_id", user.id);
    athletes = (athleteRows ?? []).map((a: any) => ({ id: a.id, full_name: a.profiles.full_name }));

    const { data } = await supabase
      .from("important_dates")
      .select("*, athletes!inner(profiles!inner(full_name))")
      .order("event_date", { ascending: true });
    dates = data ?? [];
  } else {
    const { data } = await supabase
      .from("important_dates")
      .select("*")
      .eq("athlete_id", user.id)
      .order("event_date", { ascending: true });
    dates = data ?? [];
  }

  return (
    <div className="flex">
      <Sidebar role={isCoach ? "coach" : "athlete"} name={profile?.full_name ?? "User"} />
      <main className="flex-1 p-5 sm:p-8 max-w-3xl">
        <h1 className="font-display text-2xl font-semibold mb-1">Calendar</h1>
        <p className="text-sm text-brand-muted mb-8">
          Fights, competitions, holidays and injuries — all in one timeline.
        </p>

        <form action={addImportantDate} className="card p-6 grid sm:grid-cols-2 gap-4 mb-8">
          {isCoach && (
            <div className="sm:col-span-2">
              <Field label="Athlete">
                <select name="athlete_id" required className="input">
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          <Field label="Date">
            <input type="date" name="event_date" required className="input" />
          </Field>
          <Field label="Type">
            <select name="event_type" required className="input">
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Title">
              <input type="text" name="title" required className="input" placeholder="e.g. Regional Qualifier" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes (optional)">
              <textarea name="notes" rows={2} className="input resize-none" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-green text-black font-semibold text-sm hover:bg-brand-greendark transition-colors focus-ring">
              Add to calendar
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {dates.map((d) => (
            <div key={d.id} className="card p-4 flex items-start gap-4">
              <div className="text-center w-14 shrink-0">
                <p className="text-xs text-brand-muted">{format(parseISO(d.event_date), "MMM")}</p>
                <p className="font-display text-xl font-semibold">{format(parseISO(d.event_date), "d")}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ color: eventColor[d.event_type], backgroundColor: `${eventColor[d.event_type]}1a` }}
                  >
                    {d.event_type}
                  </span>
                  {isCoach && (
                    <span className="text-xs text-brand-muted">{d.athletes?.profiles?.full_name}</span>
                  )}
                </div>
                <p className="font-medium">{d.title}</p>
                {d.notes && <p className="text-sm text-brand-muted mt-0.5">{d.notes}</p>}
              </div>
            </div>
          ))}
          {dates.length === 0 && (
            <p className="text-center text-brand-muted text-sm py-8">No dates added yet.</p>
          )}
        </div>

        <style jsx global>{`
          .input { width: 100%; background: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 10px; padding: 10px 12px; font-size: 14px; color: white; }
          .input:focus { outline: 2px solid #22c55e; outline-offset: 1px; }
        `}</style>
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
