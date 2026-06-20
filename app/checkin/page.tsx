import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { submitCheckin } from "@/app/actions";
import { format } from "date-fns";

export default async function CheckinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: existing } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("athlete_id", user.id)
    .eq("checkin_date", today)
    .maybeSingle();

  return (
    <div className="flex">
      <Sidebar role="athlete" name={profile?.full_name ?? "Athlete"} />
      <main className="flex-1 p-5 sm:p-8 max-w-lg">
        <h1 className="font-display text-2xl font-semibold mb-1">Daily check in</h1>
        <p className="text-sm text-brand-muted mb-8">
          Takes 30 seconds. Be honest — this is what keeps your training safe.
        </p>

        <form action={submitCheckin} className="card p-6 space-y-5">
          <Field label="Date">
            <input
              type="date"
              name="checkin_date"
              defaultValue={existing?.checkin_date ?? today}
              required
              className="input"
            />
          </Field>

          <ScaleField
            label="Sleep quality"
            name="sleep_score"
            defaultValue={existing?.sleep_score ?? 3}
            lowLabel="Poor"
            highLabel="Great"
          />

          <ScaleField
            label="Readiness to train"
            name="readiness_score"
            defaultValue={existing?.readiness_score ?? 3}
            lowLabel="Not ready"
            highLabel="Fully ready"
          />

          <Field label="Comments (optional)">
            <textarea
              name="comments"
              defaultValue={existing?.comments ?? ""}
              rows={3}
              className="input resize-none"
              placeholder="Anything your coach should know today?"
            />
          </Field>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-brand-green text-black font-semibold text-sm hover:bg-brand-greendark transition-colors focus-ring"
          >
            {existing ? "Update check in" : "Submit check in"}
          </button>
        </form>

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

function ScaleField({
  label,
  name,
  defaultValue,
  lowLabel,
  highLabel,
}: {
  label: string;
  name: string;
  defaultValue: number;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <fieldset>
      <legend className="block text-xs font-medium text-brand-muted mb-2">{label}</legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex-1">
            <input
              type="radio"
              name={name}
              value={n}
              defaultChecked={n === defaultValue}
              className="peer hidden"
            />
            <div className="cursor-pointer text-center py-2 rounded-lg border border-brand-border text-sm text-brand-muted peer-checked:bg-brand-green peer-checked:text-black peer-checked:border-brand-green peer-checked:font-semibold transition-colors">
              {n}
            </div>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs text-brand-muted mt-1.5">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </fieldset>
  );
}
