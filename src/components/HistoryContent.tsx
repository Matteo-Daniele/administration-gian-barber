"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CUTS_CONFIG, CUT_STATUS, formatCurrency } from "@/lib/types";
import type { Cut, CutStatus } from "@/lib/types";
import HistoryFilters from "@/components/HistoryFilters";

interface CutWithBarber extends Cut {
  barber_name?: string;
}

export default function HistoryContent({
  initialCuts,
  isAdmin = false,
}: {
  initialCuts: CutWithBarber[];
  isAdmin?: boolean;
}) {
  const [cuts, setCuts] = useState<CutWithBarber[]>(initialCuts);
  const [filters, setFilters] = useState<{
    type: string;
    from: string;
    to: string;
  }>({ type: "all", from: "", to: "" });

  const handleFilterChange = (newFilters: { type: string; from: string; to: string }) => {
    setFilters(newFilters);
  };

  const handleDelete = async (id: string) => {
    const previousCuts = cuts;
    setCuts((prev) => prev.filter((c) => c.id !== id));

    const supabase = createClient();
    const { error } = await supabase.from("cuts").delete().eq("id", id);

    if (error) {
      setCuts(previousCuts);
    }
  };

  const filteredCuts = cuts.filter((cut) => {
    if (filters.type !== "all" && cut.cut_type !== filters.type) return false;
    if (filters.from && new Date(cut.created_at) < new Date(filters.from)) return false;
    if (filters.to) {
      const toDate = new Date(filters.to);
      toDate.setDate(toDate.getDate() + 1);
      if (new Date(cut.created_at) >= toDate) return false;
    }
    return true;
  });

  const grouped: Record<string, CutWithBarber[]> = {};
  filteredCuts.forEach((cut) => {
    const date = new Date(cut.created_at).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(cut);
  });

  return (
    <>
      <HistoryFilters filters={filters} onFilterChange={handleFilterChange} />

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <span className="text-4xl">📋</span>
          <p className="mt-4 text-zinc-400">No hay cortes que mostrar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayCuts]) => {
            const dayTotal = dayCuts.reduce(
              (sum, c) => sum + Number(c.price),
              0
            );
            return (
              <div key={date} className="rounded-xl border border-zinc-200 bg-white">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-3">
                  <h3 className="font-semibold text-zinc-900">{date}</h3>
                  <span className="text-sm font-medium text-amber-600">
                    {formatCurrency(dayTotal)} ({dayCuts.length} cortes)
                  </span>
                </div>
                <div className="divide-y divide-zinc-50">
                  {dayCuts.map((cut) => {
                    const config =
                      CUTS_CONFIG[cut.cut_type as keyof typeof CUTS_CONFIG];
                    const statusInfo = CUT_STATUS[cut.status as CutStatus];
                    return (
                      <div
                        key={cut.id}
                        className="flex items-center justify-between px-6 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span>{config?.emoji}</span>
                          <div>
                            <p className="font-medium text-zinc-900">
                              {config?.label}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              {cut.client_name && <span>{cut.client_name}</span>}
                              {isAdmin && cut.barber_name && (
                                <span className="text-xs text-zinc-300">
                                  - {cut.barber_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
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
                            {statusInfo?.label || cut.status}
                          </span>
                          <span className="font-semibold text-zinc-900">
                            {formatCurrency(Number(cut.price))}
                          </span>
                          <span className="text-xs text-zinc-300">
                            {new Date(cut.created_at).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            onClick={() => handleDelete(cut.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            x
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
