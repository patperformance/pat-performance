import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { RiskBadge } from "@/components/Cards";
import {
  calcACWR,
  calcRiskStatus,
  latestReadiness,
  daysSinceLastCheckin,
  daysUntil,
  hasLoadSpike,
  Checkin,
  Session,
} from "@/lib/risk";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default async function CoachDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "coach") redirect("/dashboard");

  const { data: athleteRows } = await supabase
    .from("athletes")
    .select("id, profiles!inner(full_name)")
    .eq("coach_id", user.id);

  const athleteIds = (athleteRows ?? []).map((a: any) => a.id);

  const [{ data: allCheckins }, { data: allSessions }, { data: allDates }] = await Promise.all([
    supabase.from("daily_checkins").select("*").in("athlete_id", athleteIds.length ? athleteIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("training_sessions").select("*").in("athlete_id", athleteIds.length ? athleteIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("important_dates").select("*").in("athlete_id", athleteIds.length ? athleteIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const rows = (athleteRows ?? []).map((a: any) => {
    const checkins = (allCheckins ?? []).filter((c) => c.athlete_id === a.id) as Checkin[];
    const sessions = (allSessions ?? []).filter((s) => s.athlete_id === a.id) as Session[];
    const dates = (allDates ?? []).filter((d) => d.athlete_id === a.id);

    const readiness = latestReadiness(checkins);
    const { acute, acwr } = calcACWR(sessions);
    const risk = calcRiskStatus(readiness, acwr);
    const sinceCheckin = daysSinceLastCheckin(checkins);
    const spike = hasLoadSpike(sessions);

    const upcoming = dates
      .filter((d) => daysUntil(d.event_date) >= 0)
      .sort((x, y) => (x.event_date < y.event_date ? -1 : 1))[0];

    return {
      id: a.id,
      name: a.profiles.full_name as string,
      readiness,
      weeklyLoad: acute,
      acwr,
      risk,
      sinceCheckin,
      spike,
      upcoming,
    };
  });

  const atRisk = rows.filter((r) => r.risk === "red");
  const upcomingFights = (allDates ?? []).filter(
    (d) => d.event_type === "Fight" && daysUntil(d.event_date) >= 0 && daysUntil(d.event_date) <= 21
  );
  const noCheckin3Days = rows.filter((r) => r.sinceCheckin === null || r.sinceCheckin >= 3);
  const spikes = rows.filter((r) => r.spike);

  return (
    <div className="flex">
      <Sidebar role="coach" name={profile?.full_name ?? "Coach"} />
      <main className="flex-1 p-5 sm:p-8 max-w-6xl">
        <h1 className="font-display text-2xl font-semibold mb-1">Coach dashboard</h1>
        <p className="text-sm text-brand-muted mb-8">
          {rows.length} {rows.length === 1 ? "athlete" : "athletes"} under your management.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <InsightCard label="Athletes at risk" value={atRisk.length} tone="red" />
          <InsightCard label="Fights within 21 days" value={upcomingFights.length} tone="green" />
          <InsightCard label="No check-in 3+ days" value={noCheckin3Days.length} tone="amber" />
          <InsightCard label="Load spikes" value={spikes.length} tone="amber" />
        </div>

        <div className="card overflow-x-auto mb-8">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-brand-surface2 text-brand-muted text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Athlete</th>
                <th className="text-left px-4 py-3 font-medium">Readiness</th>
                <th className="text-left px-4 py-3 font-medium">7 day load</th>
                <th className="text-left px-4 py-3 font-medium">ACWR</th>
                <th className="text-left px-4 py-3 font-medium">Upcoming event</th>
                <th className="text-left px-4 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-brand-border hover:bg-brand-surface2 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/coach/${r.id}`} className="font-medium hover:text-brand-green focus-ring">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.readiness ?? "—"}{r.readiness ? "/5" : ""}</td>
                  <td className="px-4 py-3">{r.weeklyLoad}</td>
                  <td className="px-4 py-3">{r.acwr.toFixed(2)}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {r.upcoming ? `${r.upcoming.title} · ${format(parseISO(r.upcoming.event_date), "d MMM")}` : "—"}
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={r.risk} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted text-sm">
                    No athletes yet. Have them sign up, then set their coach in the athletes table.
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

function InsightCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "red" | "amber" | "green";
}) {
  const color = { red: "#ef4444", amber: "#f59e0b", green: "#22c55e" }[tone];
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-brand-muted mb-2">{label}</p>
      <p className="font-display text-2xl font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
