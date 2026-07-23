"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

async function getAdminClient() {
  const { user, supabase } = await import("@/lib/supabase/server").then((m) =>
    m.getUser()
  );

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { user, supabase };
}

async function getAdminAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function createUser(formData: FormData) {
  await getAdminClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as "admin" | "barber";
  const barberSharePct = parseFloat(formData.get("barber_share_pct") as string) ?? 50;
  const shopSharePct = parseFloat(formData.get("shop_share_pct") as string) ?? 50;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("Create user error:", res.status, body);
    redirect("/admin/create-user?error=" + encodeURIComponent(`Error ${res.status}: ${body}`));
  }

  const { id: newUserId } = await res.json();

  if (newUserId) {
    const adminSupabase = await getAdminAuthClient();
    await adminSupabase
      .from("profiles")
      .update({
        role,
        full_name: fullName,
        barber_share_pct: barberSharePct,
        shop_share_pct: shopSharePct,
      })
      .eq("id", newUserId);
  }

  redirect("/admin/users?message=" + encodeURIComponent("Usuario creado exitosamente."));
}

export async function updateUser(userId: string, formData: FormData) {
  await getAdminClient();
  const adminSupabase = await getAdminAuthClient();

  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as "admin" | "barber";
  const barberSharePct = parseFloat(formData.get("barber_share_pct") as string) ?? 50;
  const shopSharePct = parseFloat(formData.get("shop_share_pct") as string) ?? 50;
  const isActive = formData.get("is_active") === "on";

  const { error } = await adminSupabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      barber_share_pct: barberSharePct,
      shop_share_pct: shopSharePct,
      is_active: isActive,
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteUser(userId: string) {
  await getAdminClient();
  const adminSupabase = await getAdminAuthClient();

  await adminSupabase.from("cuts").delete().eq("user_id", userId);
  await adminSupabase.from("cuts").update({ approved_by: null }).eq("approved_by", userId);
  await adminSupabase.from("profiles").delete().eq("id", userId);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("Delete user error:", res.status, body);
    redirect("/admin/users?error=" + encodeURIComponent(`Error ${res.status}: ${body}`));
  }

  redirect("/admin/users?message=" + encodeURIComponent("Usuario eliminado exitosamente."));
}

export async function approveCut(cutId: string) {
  const { user, supabase } = await getAdminClient();

  const { error } = await supabase
    .from("cuts")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", cutId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function rejectCut(cutId: string) {
  const { user, supabase } = await getAdminClient();

  const { error } = await supabase
    .from("cuts")
    .update({
      status: "rejected",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", cutId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getUsers(): Promise<Profile[]> {
  const { supabase } = await getAdminClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (data || []) as Profile[];
}

export async function getUserById(userId: string): Promise<Profile | null> {
  const { supabase } = await getAdminClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data as Profile | null;
}

export async function getPendingCuts() {
  const { supabase } = await getAdminClient();

  const { data } = await supabase
    .from("cuts")
    .select("*, profiles:user_id(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return data || [];
}
