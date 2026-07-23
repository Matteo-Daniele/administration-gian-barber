"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CUTS_CONFIG, CUT_STATUS, formatCurrency } from "@/lib/types";
import type { Cut, CutStatus, Profile } from "@/lib/types";
import * as XLSX from "xlsx";
import HistoryFilters from "@/components/HistoryFilters";

interface CutWithBarber extends Cut {
  barber_name?: string;
}

export default function HistoryContent({
  initialCuts,
  isAdmin = false,
  allProfiles = [],
}: {
  initialCuts: CutWithBarber[];
  isAdmin?: boolean;
  allProfiles?: Profile[];
}) {
  const [cuts, setCuts] = useState<CutWithBarber[]>(initialCuts);
  const [filters, setFilters] = useState<{
    type: string;
    from: string;
    to: string;
    userId: string;
  }>({ type: "all", from: "", to: "", userId: "all" });

  const handleFilterChange = (newFilters: { type: string; from: string; to: string; userId: string }) => {
    setFilters(newFilters);
  };

  const exportDayExcel = (date: string, dayCuts: CutWithBarber[]) => {
    const wb = XLSX.utils.book_new();

    const totalRevenue = dayCuts.reduce((sum, c) => sum + Number(c.price), 0);

    const barberEarnings: Record<string, { name: string; total: number; cuts: number; pct: number }> = {};
    dayCuts.forEach((cut) => {
      const profile = allProfiles.find((p) => p.id === cut.user_id);
      const name = cut.barber_name || profile?.full_name || "Desconocido";
      const pct = profile?.barber_share_pct ?? 50;
      if (!barberEarnings[cut.user_id]) {
        barberEarnings[cut.user_id] = { name, total: 0, cuts: 0, pct };
      }
      barberEarnings[cut.user_id].total += Number(cut.price);
      barberEarnings[cut.user_id].cuts++;
    });

    const summaryData = [
      ["RESUMEN DIARIO"],
      [""],
      ["Fecha", date],
      ["Total cortes", dayCuts.length],
      ["Total generado", formatCurrency(totalRevenue)],
      ["", ""],
      ["DESGLOSE POR BARBERO"],
      ["Barbero", "Cortes", "Total generado", "Ganancia barbero", "Ganancia local"],
    ];

    Object.values(barberEarnings).forEach((b) => {
      const barberShare = b.total * (b.pct / 100);
      const shopShare = b.total * ((100 - b.pct) / 100);
      summaryData.push([
        b.name,
        String(b.cuts),
        formatCurrency(b.total),
        formatCurrency(barberShare),
        formatCurrency(shopShare),
      ]);
    });

    const totalBarberEarnings = Object.values(barberEarnings).reduce(
      (sum, b) => sum + b.total * (b.pct / 100), 0
    );
    const totalShopEarnings = totalRevenue - totalBarberEarnings;

    summaryData.push(["", "", "", "", ""]);
    summaryData.push(["TOTAL", "", formatCurrency(totalRevenue), formatCurrency(totalBarberEarnings), formatCurrency(totalShopEarnings)]);

    summaryData.push(["", ""]);
    summaryData.push(["CORTES POR TIPO"]);

    const typeBreakdown: Record<string, number> = {};
    dayCuts.forEach((c) => {
      const label = CUTS_CONFIG[c.cut_type as keyof typeof CUTS_CONFIG]?.label || c.cut_type;
      typeBreakdown[label] = (typeBreakdown[label] || 0) + 1;
    });

    summaryData.push(["Tipo", "Cantidad"]);
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      summaryData.push([type, String(count)]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

    const detailData = [
      ["DETALLE DE CORTES"],
      [""],
      ["Hora", "Barbero", "Cliente", "Tipo", "Precio", "Estado"],
    ];

    dayCuts.forEach((cut) => {
      const config = CUTS_CONFIG[cut.cut_type as keyof typeof CUTS_CONFIG];
      const statusInfo = CUT_STATUS[cut.status as CutStatus];
      const profile = allProfiles.find((p) => p.id === cut.user_id);
      detailData.push([
        new Date(cut.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        cut.barber_name || profile?.full_name || "Desconocido",
        cut.client_name || "-",
        config?.label || cut.cut_type,
        formatCurrency(Number(cut.price)),
        statusInfo?.label || cut.status || "-",
      ]);
    });

    const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
    wsDetail["!cols"] = [{ wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle");

    const fileName = `cortes_${date.replace(/\s+/g, "_").replace(/,/g, "")}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
    if (filters.userId !== "all" && cut.user_id !== filters.userId) return false;
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
      <HistoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        isAdmin={isAdmin}
        allProfiles={allProfiles}
      />

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
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-amber-600">
                      {formatCurrency(dayTotal)} ({dayCuts.length} cortes)
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => exportDayExcel(date, dayCuts)}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-600"
                      >
                        📥 Excel
                      </button>
                    )}
                  </div>
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
                            {isAdmin && cut.barber_name && (
                              <p className="font-semibold text-zinc-900">
                                {cut.barber_name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                              {cut.client_name && <span>{cut.client_name}</span>}
                              <span className="text-xs text-zinc-400">{config?.label}</span>
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
