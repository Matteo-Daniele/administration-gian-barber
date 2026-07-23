"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";

export default function EditUserForm({ user }: { user: Profile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(user.full_name || "");
  const [role, setRole] = useState<"admin" | "barber">(user.role as "admin" | "barber");
  const [barberPct, setBarberPct] = useState(user.barber_share_pct);
  const [shopPct, setShopPct] = useState(user.shop_share_pct);
  const [isActive, setIsActive] = useState(user.is_active);
  const [error, setError] = useState("");

  const handleBarberPctChange = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setBarberPct(clamped);
    setShopPct(100 - clamped);
  };

  const handleShopPctChange = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setShopPct(clamped);
    setBarberPct(100 - clamped);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("role", role);
    formData.set("barber_share_pct", String(barberPct));
    formData.set("shop_share_pct", String(shopPct));
    formData.set("is_active", isActive ? "on" : "");

    startTransition(async () => {
      const result = await updateUser(user.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/users");
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Editar Usuario</h1>
        <p className="text-zinc-500">Modificar datos de {user.full_name || user.email}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700">
            Nombre completo
          </label>
          <input
            type="text"
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-zinc-700">
            Rol
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "barber")}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="barber">Barbero</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="barber_share_pct" className="block text-sm font-medium text-zinc-700">
              % Barbero
            </label>
            <input
              type="number"
              id="barber_share_pct"
              min="0"
              max="100"
              value={barberPct}
              onChange={(e) => handleBarberPctChange(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="shop_share_pct" className="block text-sm font-medium text-zinc-700">
              % Local
            </label>
            <input
              type="number"
              id="shop_share_pct"
              min="0"
              max="100"
              value={shopPct}
              onChange={(e) => handleShopPctChange(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-center text-sm text-zinc-500">
          Total: {barberPct + shopPct}%
          {barberPct + shopPct !== 100 && (
            <span className="ml-2 text-red-500 font-medium">(debe ser 100%)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500"
          />
          <label htmlFor="is_active" className="text-sm text-zinc-700">
            Usuario activo
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending || barberPct + shopPct !== 100}
          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}
