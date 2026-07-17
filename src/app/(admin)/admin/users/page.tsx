"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { deleteUser } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setUsers((data || []) as Profile[]);
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    await deleteUser(userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Usuarios</h1>
          <p className="text-zinc-500">Gestión de usuarios del sistema</p>
        </div>
        <Link
          href="/admin/create-user"
          className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        >
          + Crear Usuario
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <span className="text-4xl">👥</span>
          <p className="mt-4 text-zinc-400">No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                    <span className="text-lg">
                      {user.role === "admin" ? "👑" : "💈"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {user.full_name || "Sin nombre"}
                    </p>
                    <p className="truncate text-sm text-zinc-400">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "Barbero"}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-400">
                  Barbero: {user.barber_share_pct}% | Local: {user.shop_share_pct}%
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/edit-user/${user.id}`}
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-center text-sm text-zinc-600 transition-colors hover:bg-zinc-100 sm:flex-none"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 sm:flex-none"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
