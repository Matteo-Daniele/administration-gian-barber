"use client";

import type { Profile } from "@/lib/types";

export default function HistoryFilters({
  filters,
  onFilterChange,
  isAdmin = false,
  allProfiles = [],
}: {
  filters: { type: string; from: string; to: string; userId: string };
  onFilterChange: (f: { type: string; from: string; to: string; userId: string }) => void;
  isAdmin?: boolean;
  allProfiles?: Profile[];
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      {isAdmin && allProfiles.length > 0 && (
        <div>
          <label className="mb-1 block text-sm text-zinc-500">Barbero</label>
          <select
            value={filters.userId}
            onChange={(e) =>
              onFilterChange({ ...filters, userId: e.target.value })
            }
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-500"
          >
            <option value="all">Todos</option>
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm text-zinc-500">Tipo</label>
        <select
          value={filters.type}
          onChange={(e) =>
            onFilterChange({ ...filters, type: e.target.value })
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-500"
        >
          <option value="all">Todos</option>
          <option value="simple">Simple</option>
          <option value="hair_beard">Pelo y Barba</option>
          <option value="color_change">Cambio de Color</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-500">Desde</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) =>
            onFilterChange({ ...filters, from: e.target.value })
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-500">Hasta</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) =>
            onFilterChange({ ...filters, to: e.target.value })
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );
}
