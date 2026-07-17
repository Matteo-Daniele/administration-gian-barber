import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Usuarios", icon: "👥" },
  { href: "/admin/cuts", label: "Pendientes", icon: "⏳" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <span className="text-lg font-bold text-zinc-900 sm:text-xl">Admin</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {ADMIN_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            Dashboard
          </Link>
        </div>

        <nav className="flex border-t border-zinc-100 px-2 py-1 md:hidden">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 py-2 text-center text-xs font-medium text-zinc-400 transition-colors hover:text-amber-600"
            >
              <span className="block text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
