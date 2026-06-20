import { differenceInCalendarDays, parseISO } from "date-fns";

export type Checkin = {
  checkin_date: string;
  sleep_score: number;
  readiness_score: number;
  comments?: string | null;
};

export type Session = {
  session_date: string;
  session_type: string;
  duration_minutes: number;
  rpe: number;
  session_load: number;
};

export type RiskLevel = "green" | "amber" | "red";

/** Sum session_load for sessions within the last N days (inclusive of today). */
export function sumLoadInWindow(sessions: Session[], days: number, asOf: Date = new Date()) {
  return sessions
    .filter((s) => {
      const diff = differenceInCalendarDays(asOf, parseISO(s.session_date));
      return diff >= 0 && diff < days;
    })
    .reduce((sum, s) => sum + s.session_load, 0);
}

/** Acute (7 day) and Chronic (28 day) load + ACWR ratio. */
export function calcACWR(sessions: Session[], asOf: Date = new Date()) {
  const acute = sumLoadInWindow(sessions, 7, asOf);
  const chronicTotal = sumLoadInWindow(sessions, 28, asOf);
  // Chronic is expressed as a weekly average over 4 weeks for a fair ratio
  const chronic = chronicTotal / 4;
  const acwr = chronic > 0 ? acute / chronic : 0;
  return { acute, chronic: Math.round(chronic), acwr: Number(acwr.toFixed(2)) };
}

export function latestReadiness(checkins: Checkin[]): number | null {
  if (checkins.length === 0) return null;
  const sorted = [...checkins].sort((a, b) => (a.checkin_date < b.checkin_date ? 1 : -1));
  return sorted[0].readiness_score;
}

export function averageSleep(checkins: Checkin[], days = 7, asOf: Date = new Date()): number | null {
  const recent = checkins.filter(
    (c) => differenceInCalendarDays(asOf, parseISO(c.checkin_date)) < days
  );
  if (recent.length === 0) return null;
  return Number((recent.reduce((s, c) => s + c.sleep_score, 0) / recent.length).toFixed(1));
}

/**
 * Risk logic (per spec):
 * RED   if readiness <= 2 OR acwr > 1.5
 * AMBER if readiness == 3 OR acwr between 1.3 and 1.5
 * GREEN otherwise
 */
export function calcRiskStatus(readiness: number | null, acwr: number): RiskLevel {
  if (readiness !== null && readiness <= 2) return "red";
  if (acwr > 1.5) return "red";
  if (readiness === 3) return "amber";
  if (acwr >= 1.3 && acwr <= 1.5) return "amber";
  return "green";
}

export function daysSinceLastCheckin(checkins: Checkin[], asOf: Date = new Date()): number | null {
  if (checkins.length === 0) return null;
  const sorted = [...checkins].sort((a, b) => (a.checkin_date < b.checkin_date ? 1 : -1));
  return differenceInCalendarDays(asOf, parseISO(sorted[0].checkin_date));
}

export function daysUntil(dateStr: string, asOf: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(dateStr), asOf);
}

/** Detects a spike: most recent 7-day load > 1.5x the prior 7-day load. */
export function hasLoadSpike(sessions: Session[], asOf: Date = new Date()): boolean {
  const last7 = sumLoadInWindow(sessions, 7, asOf);
  const prior7 = sessions
    .filter((s) => {
      const diff = differenceInCalendarDays(asOf, parseISO(s.session_date));
      return diff >= 7 && diff < 14;
    })
    .reduce((sum, s) => sum + s.session_load, 0);
  if (prior7 === 0) return last7 > 0 ? false : false;
  return last7 > prior7 * 1.5;
}

export const riskColor: Record<RiskLevel, string> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

export const riskLabel: Record<RiskLevel, string> = {
  green: "On track",
  amber: "Monitor",
  red: "At risk",
};
