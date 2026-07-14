import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CutsList from "@/components/CutsList";
import type { Cut } from "@/lib/types";

export default async function CutsPage() {
  const { user, supabase } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("cuts")
    .select("*")
    .gte("created_at", today.toISOString())
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const cuts = (data || []) as Cut[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Registrar Corte</h1>
        <p className="text-zinc-500">Agrega un nuevo corte a tu registro diario</p>
      </div>

      <CutsList initialCuts={cuts} />
    </div>
  );
}
