"use client";

export default function HistoryFilters({
  filters,
  onFilterChange,
}: {
  filters: { type: string; from: string; to: string };
  onFilterChange: (f: { type: string; from: string; to: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-200 bg-white p-4">
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
