import { cn } from "@/lib/utils";
import { RiskLevel, riskColor, riskLabel } from "@/lib/risk";

export function KPICard({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-brand-muted mb-2">{label}</p>
      <p className={cn("font-display text-2xl font-semibold", accent && "text-brand-green")}>
        {value}
        {suffix && <span className="text-sm text-brand-muted font-body ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        color: riskColor[level],
        backgroundColor: `${riskColor[level]}1a`,
        border: `1px solid ${riskColor[level]}40`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: riskColor[level] }} />
      {riskLabel[level]}
    </span>
  );
}
