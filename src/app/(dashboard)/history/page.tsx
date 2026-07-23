import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HistoryContent from "@/components/HistoryContent";
import type { Cut, Profile } from "@/lib/types";

export default async function HistoryPage() {
  const { user, supabase } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  let cuts: (Cut & { barber_name?: string })[] = [];
  let allProfiles: Profile[] = [];

  if (isAdmin) {
    const [cutsRes, profilesRes] = await Promise.all([
      supabase
        .from("cuts")
        .select("*, profiles:user_id(full_name)")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);

    cuts = (cutsRes.data || []).map((item) => {
      const cut = item as unknown as Cut & { profiles: { full_name: string } | null };
      return {
        ...cut,
        barber_name: cut.profiles?.full_name || "Desconocido",
      };
    });
    allProfiles = (profilesRes.data || []) as Profile[];
  } else {
    const { data } = await supabase
      .from("cuts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    cuts = (data || []) as Cut[];
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Historial</h1>
        <p className="text-zinc-500">
          {isAdmin ? "Todos los cortes registrados" : "Tus cortes registrados"}
        </p>
      </div>

      <HistoryContent initialCuts={cuts} isAdmin={isAdmin} allProfiles={allProfiles} />
    </div>
  );
}
