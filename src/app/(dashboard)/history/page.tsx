import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HistoryContent from "@/components/HistoryContent";
import type { Cut } from "@/lib/types";

export default async function HistoryPage() {
  const { user, supabase } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("cuts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const cuts = (data || []) as Cut[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Historial</h1>
        <p className="text-zinc-500">Todos tus cortes registrados</p>
      </div>

      <HistoryContent initialCuts={cuts} />
    </div>
  );
}
