import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CUTS_CONFIG, formatCurrency } from "@/lib/types";
import type { Cut } from "@/lib/types";

export default async function DashboardPage() {
  const { user, supabase } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const [todayRes, monthRes] = await Promise.all([
    supabase
      .from("cuts")
      .select("*")
      .gte("created_at", today.toISOString())
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cuts")
      .select("price")
      .gte("created_at", thisMonth.toISOString())
      .eq("user_id", user.id),
  ]);

  const todayCuts = (todayRes.data || []) as Cut[];
  const monthTotal = (monthRes.data || []).reduce(
    (sum, c) => sum + Number(c.price),
    0
  );
  const monthCount = monthRes.data?.length || 0;

  const totalToday = todayCuts.reduce((sum, c) => sum + Number(c.price), 0);
  const cutsToday = todayCuts.length;

  const cutTypeCounts: Record<string, number> = {};
  todayCuts.forEach((c) => {
    cutTypeCounts[c.cut_type] = (cutTypeCounts[c.cut_type] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500">Resumen de tu actividad</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Hoy - Cortes" value={String(cutsToday)} icon="✂️" />
        <StatCard title="Hoy - Total" value={formatCurrency(totalToday)} icon="💰" />
        <StatCard title="Este Mes - Cortes" value={String(monthCount)} icon="📅" />
        <StatCard title="Este Mes - Total" value={formatCurrency(monthTotal)} icon="📈" />
      </div>

      {cutsToday > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Desglose de hoy</h2>
          <div className="space-y-3">
            {Object.entries(CUTS_CONFIG).map(([key, cfg]) => {
              const count = cutTypeCounts[key] || 0;
              if (count === 0) return null;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-zinc-600">
                    {cfg.emoji} {cfg.label}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400">{count} cortes</span>
                    <span className="font-medium text-zinc-900">
                      {formatCurrency(count * cfg.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link
        href="/cuts"
        className="block rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center transition-colors hover:border-amber-400 hover:bg-amber-100"
      >
        <span className="text-4xl">➕</span>
        <p className="mt-2 text-lg font-semibold text-amber-700">Registrar corte</p>
      </Link>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
