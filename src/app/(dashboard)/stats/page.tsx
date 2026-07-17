import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatsContent from "@/components/StatsContent";
import type { Profile, Cut } from "@/lib/types";

export default async function StatsPage() {
  const { user, supabase } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profileRes = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileRes.data as Profile | null;

  const isAdmin = profile?.role === "admin";

  const cutsQuery = supabase
    .from("cuts")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    cutsQuery.eq("user_id", user.id);
  }

  const { data: cutsData } = await cutsQuery;
  const cuts = (cutsData || []) as Cut[];

  let allProfiles: Profile[] = [];
  if (isAdmin) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*");
    allProfiles = (profilesData || []) as Profile[];
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Estadisticas</h1>
        <p className="text-zinc-500">Analisis de ingresos y rendimiento</p>
      </div>

      <StatsContent cuts={cuts} profile={profile} allProfiles={allProfiles} />
    </div>
  );
}
