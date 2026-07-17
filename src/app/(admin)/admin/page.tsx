import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const { user, supabase } = await getUser();

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

  const [usersRes, pendingCutsRes, approvedCutsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("cuts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("cuts").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  const totalUsers = usersRes.count || 0;
  const pendingCuts = pendingCutsRes.count || 0;
  const approvedCuts = approvedCutsRes.count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Panel de Admin</h1>
        <p className="text-zinc-500">Gestión del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-amber-300 hover:bg-amber-50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Usuarios</span>
            <span className="text-2xl">👥</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{totalUsers}</p>
        </Link>

        <Link
          href="/admin/cuts"
          className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-amber-300 hover:bg-amber-50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Cortes Pendientes</span>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">{pendingCuts}</p>
        </Link>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Cortes Aprobados</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-green-600">{approvedCuts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/create-user"
          className="block rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center transition-colors hover:border-amber-400 hover:bg-amber-100"
        >
          <span className="text-4xl">➕</span>
          <p className="mt-2 text-lg font-semibold text-amber-700">Crear Usuario</p>
        </Link>

        <Link
          href="/admin/cuts"
          className="block rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-8 text-center transition-colors hover:border-orange-400 hover:bg-orange-100"
        >
          <span className="text-4xl">⏳</span>
          <p className="mt-2 text-lg font-semibold text-orange-700">Revisar Cortes</p>
        </Link>
      </div>
    </div>
  );
}
