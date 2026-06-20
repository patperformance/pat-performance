"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitCheckin(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const checkin_date = formData.get("checkin_date") as string;
  const sleep_score = Number(formData.get("sleep_score"));
  const readiness_score = Number(formData.get("readiness_score"));
  const comments = (formData.get("comments") as string) || null;

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      athlete_id: user.id,
      checkin_date,
      sleep_score,
      readiness_score,
      comments,
    },
    { onConflict: "athlete_id,checkin_date" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/checkin");
}

export async function submitSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const session_date = formData.get("session_date") as string;
  const session_type = formData.get("session_type") as string;
  const duration_minutes = Number(formData.get("duration_minutes"));
  const rpe = Number(formData.get("rpe"));
  const comments = (formData.get("comments") as string) || null;

  const { error } = await supabase.from("training_sessions").insert({
    athlete_id: user.id,
    session_date,
    session_type,
    duration_minutes,
    rpe,
    comments,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/sessions");
}

export async function deleteSession(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const { error } = await supabase.from("training_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/sessions");
}

export async function addImportantDate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const event_date = formData.get("event_date") as string;
  const event_type = formData.get("event_type") as string;
  const title = formData.get("title") as string;
  const notes = (formData.get("notes") as string) || null;
  const athlete_id = (formData.get("athlete_id") as string) || user.id;

  const { error } = await supabase.from("important_dates").insert({
    athlete_id,
    event_date,
    event_type,
    title,
    notes,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}
