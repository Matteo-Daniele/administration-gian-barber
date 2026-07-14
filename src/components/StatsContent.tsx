"use client";

import { useState } from "react";
import { CUTS_CONFIG, formatCurrency } from "@/lib/types";
import type { Cut, Profile } from "@/lib/types";

type Period = "today" | "week" | "month" | "all";

function filterByPeriod(cuts: Cut[], period: Period): Cut[] {
  const now = new Date();
  if (period === "all") return cuts;

  const start = new Date();
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
  }

  return cuts.filter((c) => new Date(c.created_at) >= start);
}

export default function StatsContent({
  cuts,
  profile,
}: {
  cuts: Cut[];
  profile: Profile | null;
}) {
  const [period, setPeriod] = useState<Period>("today");

  const filtered = filterByPeriod(cuts, period);
  const total = filtered.reduce((sum, c) => sum + Number(c.price), 0);
  const totalCuts = filtered.length;

  const cutTypeBreakdown = Object.entries(CUTS_CONFIG).map(([key, config]) => {
    const typeCuts = filtered.filter((c) => c.cut_type === key);
    const typeTotal = typeCuts.reduce((sum, c) => sum + Number(c.price), 0);
    return {
      type: key,
      label: config.label,
      emoji: config.emoji,
      count: typeCuts.length,
      total: typeTotal,
      percentage: total > 0 ? (typeTotal / total) * 100 : 0,
    };
  });

  const now = new Date();
  const days =
    period === "today"
      ? 1
      : period === "week"
        ? 7
        : period === "month"
          ? 30
          : Math.max(
              1,
              Math.ceil(
                (now.getTime() -
                  new Date(cuts[cuts.length - 1]?.created_at || now).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) || 1
            );
  const dailyAvg = total / days;

  // Revenue split (admin only)
  const isOwner = profile?.role === "admin";
  const barberPct = profile?.barber_share_pct ?? 100;
  const shopPct = profile?.shop_share_pct ?? 0;
  const barberAmount = total * (barberPct / 100);
  const shopAmount = total * (shopPct / 100);

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "Hoy" },
    { key: "week", label: "7 dias" },
    { key: "month", label: "Mes" },
    { key: "all", label: "Todo" },
  ];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p.key
                ? "bg-amber-500 text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-100"
            } border border-zinc-200`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-500">Total generado</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-500">Cortes realizados</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">{totalCuts}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-500">Promedio diario</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {formatCurrency(dailyAvg)}
          </p>
        </div>
      </div>

      {/* Cut type breakdown */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Desglose por tipo
        </h2>
        <div className="space-y-4">
          {cutTypeBreakdown.map((item) => (
            <div key={item.type}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-zinc-700">
                  {item.emoji} {item.label}
                </span>
                <span className="text-sm text-zinc-500">
                  {item.count} cortes &middot; {formatCurrency(item.total)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-zinc-400">
                {item.percentage.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue split - Admin only */}
      {isOwner && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
              Admin
            </span>
            Distribucion de ingresos
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Barbero ({barberPct}%)</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(barberAmount)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${barberPct}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Local ({shopPct}%)</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(shopAmount)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${shopPct}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            Para cambiar los porcentajes, edita tu perfil en Supabase o contacta al desarrollador.
          </p>
        </div>
      )}

      {/* Empty state */}
      {totalCuts === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <span className="text-4xl">📊</span>
          <p className="mt-4 text-zinc-400">
            No hay datos para mostrar en este periodo
          </p>
        </div>
      )}
    </div>
  );
}
