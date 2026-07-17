import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CUTS_CONFIG, formatCurrency } from "@/lib/types";
import type { Cut, Profile } from "@/lib/types";

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

  const profileRes = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileRes.data as Profile | null;
  const isAdmin = profile?.role === "admin";

  let todayCuts: (Cut & { barber_name?: string })[] = [];
  let totalToday = 0;
  let cutsToday = 0;
  let monthTotal = 0;
  let monthCount = 0;

  if (isAdmin) {
    const [todayRes, monthRes, allTodayRes] = await Promise.all([
      supabase
        .from("cuts")
        .select("*, profiles:user_id(full_name)")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("cuts")
        .select("price")
        .gte("created_at", thisMonth.toISOString()),
      supabase
        .from("cuts")
        .select("id")
        .gte("created_at", today.toISOString()),
    ]);

    todayCuts = (allTodayRes.data || []).length > 0
      ? (todayRes.data || []).map((item) => {
          const cut = item as unknown as Cut & { profiles: { full_name: string } | null };
          return {
            ...cut,
            barber_name: cut.profiles?.full_name || "Desconocido",
          };
        })
      : [];
    cutsToday = allTodayRes.data?.length || 0;
    totalToday = todayCuts.reduce((sum, c) => sum + Number(c.price), 0);
    monthTotal = (monthRes.data || []).reduce(
      (sum, c) => sum + Number(c.price),
      0
    );
    monthCount = monthRes.data?.length || 0;
  } else {
    const [todayRes, monthRes] = await Promise.all([
      supabase
        .from("cuts")
        .select("*")
        .gte("created_at", today.toISOString())
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("cuts")
        .select("price")
        .gte("created_at", thisMonth.toISOString())
        .eq("user_id", user.id),
    ]);

    todayCuts = (todayRes.data || []) as Cut[];
    totalToday = todayCuts.reduce((sum, c) => sum + Number(c.price), 0);
    cutsToday = todayCuts.length;
    monthTotal = (monthRes.data || []).reduce(
      (sum, c) => sum + Number(c.price),
      0
    );
    monthCount = monthRes.data?.length || 0;
  }

  const cutTypeCounts: Record<string, number> = {};
  todayCuts.forEach((c) => {
    cutTypeCounts[c.cut_type] = (cutTypeCounts[c.cut_type] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500">
          {isAdmin ? "Resumen de actividad de todos los barberos" : "Resumen de tu actividad"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Hoy - Cortes" value={String(cutsToday)} icon="✂️" />
        <StatCard title="Hoy - Total" value={formatCurrency(totalToday)} icon="💰" />
        <StatCard title="Este Mes - Cortes" value={String(monthCount)} icon="📅" />
        <StatCard title="Este Mes - Total" value={formatCurrency(monthTotal)} icon="📈" />
      </div>

      {cutsToday > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            {isAdmin ? "Ultimos cortes de hoy (10 max)" : "Tus cortes de hoy (10 max)"}
          </h2>
          <div className="space-y-3">
            {todayCuts.map((cut) => {
              const config = CUTS_CONFIG[cut.cut_type as keyof typeof CUTS_CONFIG];
              return (
                <div key={cut.id} className="flex items-center justify-between">
                  <span className="text-zinc-600">
                    {config?.emoji} {config?.label}
                    {cut.client_name && (
                      <span className="ml-2 text-sm text-zinc-400">- {cut.client_name}</span>
                    )}
                    {isAdmin && cut.barber_name && (
                      <span className="ml-2 text-sm text-amber-600 font-medium">
                        {cut.barber_name}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        cut.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : cut.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {cut.status === "approved"
                        ? "Aprobado"
                        : cut.status === "rejected"
                          ? "Rechazado"
                          : "Pendiente"}
                    </span>
                    <span className="font-medium text-zinc-900">
                      {formatCurrency(Number(cut.price))}
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
