import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatsContent from "@/components/StatsContent";
import type { Profile, Cut } from "@/lib/types";

export default async function StatsPage() {
  const { user, supabase } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileRes, cutsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("cuts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data as Profile | null;
  const cuts = (cutsRes.data || []) as Cut[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Estadisticas</h1>
        <p className="text-zinc-500">Analisis de ingresos y rendimiento</p>
      </div>

      <StatsContent cuts={cuts} profile={profile} />
    </div>
  );
}
