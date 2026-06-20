"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ClipboardCheck,
  Dumbbell,
  CalendarDays,
  Users,
  LogOut,
} from "lucide-react";

type Props = {
  role: "athlete" | "coach";
  name: string;
};

export default function Sidebar({ role, name }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const athleteNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/checkin", label: "Daily Check In", icon: ClipboardCheck },
    { href: "/sessions", label: "Sessions", icon: Dumbbell },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
  ];

  const coachNav = [
    { href: "/coach", label: "Coach Dashboard", icon: LayoutDashboard },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
  ];

  const nav = role === "coach" ? coachNav : athleteNav;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:w-60 flex-col justify-between border-r border-brand-border bg-brand-black h-screen sticky top-0 px-4 py-6">
      <div>
        <div className="flex items-center gap-2 px-2 mb-8">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
          <span className="font-display font-semibold tracking-tight">Pat Performance</span>
        </div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-ring ${
                  active
                    ? "bg-brand-green/10 text-brand-green"
                    : "text-brand-muted hover:text-white hover:bg-brand-surface2"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="h-8 w-8 rounded-full bg-brand-surface2 border border-brand-border flex items-center justify-center text-xs font-semibold">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-xs text-brand-muted capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-brand-muted hover:text-white hover:bg-brand-surface2 transition-colors focus-ring"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
