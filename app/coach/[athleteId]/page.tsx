import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { KPICard, RiskBadge } from "@/components/Cards";
import { TrendChart } from "@/components/TrendChart";
import {
  calcACWR,
  calcRiskStatus,
  latestReadiness,
  averageSleep,
  sumLoadInWindow,
  Checkin,
  Session,
} from "@/lib/risk";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "coach") redirect("/dashboard");

  const { data: athleteProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", athleteId)
    .single();

  const [{ data: checkins }, { data: sessions }, { data: dates }] = await Promise.all([
    supabase.from("daily_checkins").select("*").eq("athlete_id", athleteId).order("checkin_date"),
    supabase.from("training_sessions").select("*").eq("athlete_id", athleteId).order("session_date"),
    supabase.from("important_dates").select("*").eq("athlete_id", athleteId).order("event_date"),
  ]);

  const checkinList = (checkins ?? []) as Checkin[];
  const sessionList = (sessions ?? []) as Session[];

  const readiness = latestReadiness(checkinList);
  const sleep = averageSleep(checkinList);
  const weeklyLoad = sumLoadInWindow(sessionList, 7);
  const monthlyLoad = sumLoadInWindow(sessionList, 28);
  const { acute, chronic, acwr } = calcACWR(sessionList);
  const risk = calcRiskStatus(readiness, acwr);

  const readinessTrend = checkinList.slice(-21).map((c) => ({
    date: format(parseISO(c.checkin_date), "d MMM"),
    value: c.readiness_score,
  }));
  const sleepTrend = checkinList.slice(-21).map((c) => ({
    date: format(parseISO(c.checkin_date), "d MMM"),
    value: c.sleep_score,
  }));
  const loadTrend = sessionList.slice(-21).map((s) => ({
    date: format(parseISO(s.session_date), "d MMM"),
    value: s.session_load,
  }));

  return (
    <div className="flex">
      <Sidebar role="coach" name={profile?.full_name ?? "Coach"} />
      <main className="flex-1 p-5 sm:p-8 max-w-6xl">
        <Link href="/coach" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-white mb-4 focus-ring">
          <ArrowLeft size={15} /> All athletes
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">{athleteProfile?.full_name}</h1>
            <p className="text-sm text-brand-muted">{athleteProfile?.email}</p>
          </div>
          <RiskBadge level={risk} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard label="Current readiness" value={readiness ?? "—"} suffix={readiness ? "/5" : ""} accent />
          <KPICard label="Average sleep (7d)" value={sleep ?? "—"} suffix={sleep ? "/5" : ""} />
          <KPICard label="Weekly training load" value={weeklyLoad} />
          <KPICard label="Monthly training load" value={monthlyLoad} />
        </div>

        <div className="card p-5 mb-8">
          <h2 className="font-display font-semibold mb-1">Acute : Chronic Workload Ratio</h2>
          <p className="text-xs text-brand-muted mb-4">Acute = last 7 days · Chronic = last 28 days, weekly average</p>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Acute load" value={acute} />
            <Stat label="Chronic load" value={chronic} />
            <Stat label="ACWR" value={acwr.toFixed(2)} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          <ChartCard title="Readiness trend"><TrendChart data={readinessTrend} color="#22c55e" yDomain={[1, 5]} /></ChartCard>
          <ChartCard title="Sleep trend"><TrendChart data={sleepTrend} color="#60a5fa" yDomain={[1, 5]} /></ChartCard>
          <ChartCard title="Training load trend"><TrendChart data={loadTrend} color="#f59e0b" /></ChartCard>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-medium mb-3">Recent check-ins</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {checkinList.slice(-10).reverse().map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-brand-border pb-2 last:border-0">
                  <span className="text-brand-muted">{format(parseISO(c.checkin_date), "d MMM")}</span>
                  <span>Sleep {c.sleep_score}/5 · Readiness {c.readiness_score}/5</span>
                </div>
              ))}
              {checkinList.length === 0 && <p className="text-sm text-brand-muted">No check-ins yet.</p>}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-medium mb-3">Important dates</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(dates ?? []).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm border-b border-brand-border pb-2 last:border-0">
                  <span>{d.title} <span className="text-brand-muted">({d.event_type})</span></span>
                  <span className="text-brand-muted">{format(parseISO(d.event_date), "d MMM yyyy")}</span>
                </div>
              ))}
              {(!dates || dates.length === 0) && <p className="text-sm text-brand-muted">No dates added yet.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-brand-muted mb-1">{label}</p>
      <p className="font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
