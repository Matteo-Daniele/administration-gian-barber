"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { CutType } from "@/lib/types";

export async function addCut(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cutType = formData.get("cut_type") as CutType;
  const clientName = formData.get("client_name") as string;
  const notes = formData.get("notes") as string;

  const prices: Record<CutType, number> = {
    simple: 11000,
    hair_beard: 13000,
    color_change: 25000,
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { error } = await supabase.from("cuts").insert({
    user_id: user.id,
    cut_type: cutType,
    price: prices[cutType],
    client_name: clientName || "",
    notes: notes || null,
    status: isAdmin ? "approved" : "pending",
    approved_by: isAdmin ? user.id : null,
    approved_at: isAdmin ? new Date().toISOString() : null,
  });

  if (error) {
    console.error("Error adding cut:", error);
    redirect("/cuts?error=" + encodeURIComponent(error.message));
  }

  redirect("/cuts?success=true");
}

export async function deleteCut(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("cuts").delete().eq("id", id).eq("user_id", user.id);
  redirect("/cuts");
}
