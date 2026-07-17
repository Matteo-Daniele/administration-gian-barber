"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/cuts", label: "Cortes", icon: "✂️" },
  { href: "/stats", label: "Estadisticas", icon: "📊" },
  { href: "/history", label: "Historial", icon: "📋" },
];

const ADMIN_NAV_ITEMS = [
  { href: "/admin/users", label: "Usuarios", icon: "👥" },
  { href: "/admin/cuts", label: "Pendientes", icon: "⏳" },
];

export default function Navbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  return (
    <header className="border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">💈</span>
          <span className="text-xl font-bold text-zinc-900">Gian Barber</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-amber-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <span className="mx-1 text-zinc-300">|</span>
              {ADMIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? "bg-amber-500 text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-500 sm:block">
            {profile?.full_name || profile?.email}
            {isAdmin && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Admin
              </span>
            )}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              Salir
            </button>
          </form>
        </div>
      </div>

      <nav className="flex border-t border-zinc-100 px-4 py-2 md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
              pathname === item.href
                ? "text-amber-600"
                : "text-zinc-400"
            }`}
          >
            <span className="block text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
              pathname.startsWith("/admin")
                ? "text-amber-600"
                : "text-zinc-400"
            }`}
          >
            <span className="block text-lg">⚙️</span>
            Admin
          </Link>
        )}
      </nav>
    </header>
  );
}
