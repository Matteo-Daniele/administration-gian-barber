"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { approveCut, rejectCut } from "@/lib/actions/admin";
import { CUTS_CONFIG, formatCurrency } from "@/lib/types";
import type { Cut } from "@/lib/types";

interface PendingCut extends Cut {
  profiles?: { full_name: string; email: string } | null;
}

export default function PendingCutsPage() {
  const [cuts, setCuts] = useState<PendingCut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("cuts")
        .select("*, profiles:user_id(full_name, email)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setCuts((data || []) as PendingCut[]);
      setLoading(false);
    }
    load();
  }, []);

  const handleApprove = async (cutId: string) => {
    const result = await approveCut(cutId);
    if (result.success) {
      setCuts((prev) => prev.filter((c) => c.id !== cutId));
    }
  };

  const handleReject = async (cutId: string) => {
    const result = await rejectCut(cutId);
    if (result.success) {
      setCuts((prev) => prev.filter((c) => c.id !== cutId));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Cortes Pendientes</h1>
        <p className="text-zinc-500">Aprobar o rechazar cortes cargados por barberos</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200" />
          ))}
        </div>
      ) : cuts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <span className="text-4xl">✅</span>
          <p className="mt-4 text-zinc-400">No hay cortes pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cuts.map((cut) => {
            const config = CUTS_CONFIG[cut.cut_type as keyof typeof CUTS_CONFIG];
            return (
              <div
                key={cut.id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config?.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">
                        {config?.label}
                        {cut.client_name && (
                          <span className="ml-2 text-sm text-zinc-400">
                            - {cut.client_name}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-zinc-400">
                        {cut.profiles?.full_name || cut.profiles?.email || "Usuario desconocido"}
                      </p>
                      <p className="text-xs text-zinc-300">
                        {new Date(cut.created_at).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-lg font-bold text-zinc-900">
                    {formatCurrency(Number(cut.price))}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleApprove(cut.id)}
                    className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReject(cut.id)}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
