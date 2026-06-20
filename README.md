# Pat Performance — Athlete Tracker

A full athlete monitoring platform: athletes check in daily and log sessions,
you see everyone's readiness and training load risk on one coach dashboard.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + Postgres) · Recharts

---

## 1. Set up Supabase

1. Go to supabase.com → create a project (Free tier is enough for 20–50 athletes).
2. Open **SQL Editor** → paste the entire contents of `supabase/schema.sql` → Run.
   This creates all tables, relationships, row-level security, and an automatic
   trigger that builds a profile when someone signs up.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret, only used server-side)

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the three values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3. Install and run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — it'll redirect to `/login`.

## 4. Create your coach account

1. On the login screen, click **Create account**.
2. Choose **"I'm the coach"**, fill in your details, sign up.
3. You're now in the Coach Dashboard (empty — no athletes yet).

## 5. Add athletes

Athletes sign up themselves the same way, choosing **"I'm an athlete"**.
After they sign up, you need to link them to you as their coach:

1. In Supabase → **Table Editor → athletes**.
2. Find the new athlete's row, set `coach_id` to your own user id
   (find your id in **Table Editor → profiles**, the row where `role = coach`).

Once linked, they'll appear on your Coach Dashboard automatically.

> Tip: if you're onboarding 20+ athletes at once, you can bulk-update `coach_id`
> with one SQL statement in the SQL Editor:
> `update athletes set coach_id = '<your-coach-id>' where coach_id is null;`

## 6. Deploy

1. Push this project to a GitHub repo.
2. Go to vercel.com → **New Project** → import the repo.
3. Add the same three environment variables in Vercel's project settings.
4. Deploy. You'll get a live URL (e.g. `pat-performance.vercel.app`).
5. In Supabase → **Authentication → URL Configuration**, add your Vercel URL
   to the allowed redirect URLs.

That's it — £0/month on the free tiers of Supabase and Vercel, good for roughly
20–50 athletes before you'd need to consider Supabase Pro (~$25/mo).

---

## How the numbers work

- **Session load** = duration (minutes) × RPE — calculated automatically by the database.
- **Acute load** = total session load in the last 7 days.
- **Chronic load** = total session load in the last 28 days, expressed as a weekly average (÷4).
- **ACWR** = acute ÷ chronic.
- **Risk status**:
  - 🔴 Red — readiness ≤ 2, or ACWR > 1.5
  - 🟠 Amber — readiness = 3, or ACWR between 1.3 and 1.5
  - 🟢 Green — everything else

## Project structure

```
app/
  login/            Sign in / sign up
  dashboard/         Athlete dashboard
  checkin/           Daily check-in form
  sessions/          Training session log
  calendar/          Important dates (fights, comps, holidays, injuries)
  coach/             Coach dashboard (all athletes)
  coach/[athleteId]/ Individual athlete drill-down for the coach
  actions.ts         Server actions (form submissions)
components/          Sidebar, KPI cards, risk badges, trend charts
lib/
  risk.ts            Training load & risk calculations
  supabase/          Browser + server Supabase clients
supabase/schema.sql  Full database schema, RLS policies, triggers
```

## Notes

- Row Level Security is on for every table: athletes only ever see their own
  data, coaches see everything for athletes assigned to them via `coach_id`.
- The "no check-in for 3+ days" and "load spike" insights on the coach dashboard
  recalculate live from the data — no separate job needed at this scale.
