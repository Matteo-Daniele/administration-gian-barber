"use client";

import { useState, useMemo } from "react";
import { CUTS_CONFIG, PAYMENT_TYPES, formatCurrency } from "@/lib/types";
import type { Cut, Profile } from "@/lib/types";

type Period = "today" | "week" | "month" | "all";

function filterByPeriod(cuts: Cut[], period: Period): Cut[] {
  if (period === "all") return cuts;

  const now = new Date();
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

function getHourlyDistribution(cuts: Cut[]) {
  const hours: Record<number, { count: number; revenue: number }> = {};
  for (let i = 0; i < 24; i++) {
    hours[i] = { count: 0, revenue: 0 };
  }
  cuts.forEach((cut) => {
    const hour = new Date(cut.created_at).getHours();
    hours[hour].count++;
    hours[hour].revenue += Number(cut.price);
  });
  return hours;
}

interface StatsContentProps {
  cuts: Cut[];
  profile: Profile | null;
  allProfiles?: Profile[];
}

export default function StatsContent({
  cuts,
  profile,
  allProfiles = [],
}: StatsContentProps) {
  const [period, setPeriod] = useState<Period>("all");
  const [selectedBarber, setSelectedBarber] = useState<string>("all");
  const isAdmin = profile?.role === "admin";

  const approvedCuts = isAdmin
    ? cuts.filter((c) => !c.status || c.status !== "rejected")
    : cuts.filter((c) => !c.status || c.status === "approved");
  const periodFiltered = filterByPeriod(approvedCuts, period);

  const filtered = useMemo(() => {
    if (selectedBarber === "all") return periodFiltered;
    return periodFiltered.filter((c) => c.user_id === selectedBarber);
  }, [periodFiltered, selectedBarber]);

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

  const paymentBreakdown = Object.entries(PAYMENT_TYPES).map(([key, config]) => {
    const paymentCuts = filtered.filter((c) => c.payment_type === key);
    const paymentTotal = paymentCuts.reduce((sum, c) => sum + Number(c.price), 0);
    return {
      type: key,
      label: config.label,
      emoji: config.emoji,
      count: paymentCuts.length,
      total: paymentTotal,
      percentage: total > 0 ? (paymentTotal / total) * 100 : 0,
    };
  });

  const hourlyDist = useMemo(() => getHourlyDistribution(filtered), [filtered]);
  const maxHourlyCount = Math.max(...Object.values(hourlyDist).map((h) => h.count), 1);

  const peakHour = Object.entries(hourlyDist).reduce(
    (max, [hour, data]) => (data.count > max.count ? { hour: Number(hour), ...data } : max),
    { hour: 0, count: 0, revenue: 0 }
  );

  const periods: { key: Period; label: string; emoji: string }[] = [
    { key: "today", label: "Hoy", emoji: "📅" },
    { key: "week", label: "7 dias", emoji: "📆" },
    { key: "month", label: "Mes", emoji: "🗓️" },
    { key: "all", label: "Todo", emoji: "📊" },
  ];

  const periods24 = Array.from({ length: 24 }, (_, i) => i);

  if (isAdmin) {
    const barbers = allProfiles.filter((p) => p.id === profile?.id || p.role === "barber");

    const barberStats = barbers
      .map((barber) => {
        const barberCuts = filtered.filter((c) => c.user_id === barber.id);
        const barberTotal = barberCuts.reduce((sum, c) => sum + Number(c.price), 0);
        const barberEarnings = barberTotal * (barber.barber_share_pct / 100);
        const shopEarnings = barberTotal * (barber.shop_share_pct / 100);
        return {
          ...barber,
          cutsCount: barberCuts.length,
          totalRevenue: barberTotal,
          barberEarnings,
          shopEarnings,
        };
      })
      .filter((b) => b.cutsCount > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const maxRevenue = Math.max(...barberStats.map((b) => b.totalRevenue), 1);

    const totalBarberEarnings = barberStats.reduce((sum, b) => sum + b.barberEarnings, 0);
    const totalShopEarnings = barberStats.reduce((sum, b) => sum + b.shopEarnings, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                period === p.key
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                  : "bg-white text-zinc-600 hover:bg-zinc-100"
              } border border-zinc-200`}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {barbers.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Filtrar por barbero
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBarber("all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedBarber === "all"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Todos
              </button>
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => setSelectedBarber(barber.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedBarber === barber.id
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {barber.full_name || barber.email}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4 text-center sm:p-6">
            <p className="text-xs text-amber-600 sm:text-sm">Total generado</p>
            <p className="mt-1 text-xl font-bold text-amber-700 sm:text-3xl">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 text-center sm:p-6">
            <p className="text-xs text-zinc-500 sm:text-sm">Cortes</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 sm:text-3xl">{totalCuts}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 text-center sm:p-6">
            <p className="text-xs text-green-600 sm:text-sm">Barberos</p>
            <p className="mt-1 text-xl font-bold text-green-700 sm:text-3xl">
              {formatCurrency(totalBarberEarnings)}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center sm:p-6">
            <p className="text-xs text-blue-600 sm:text-sm">Local</p>
            <p className="mt-1 text-xl font-bold text-blue-700 sm:text-3xl">
              {formatCurrency(totalShopEarnings)}
            </p>
          </div>
        </div>

        {barberStats.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              💈 Ganancias por barbero
            </h2>
            <div className="space-y-4">
              {barberStats.map((barber, i) => {
                const barWidth = (barber.totalRevenue / maxRevenue) * 100;
                return (
                  <div key={barber.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "💈"}</span>
                        <span className="font-medium text-zinc-900">
                          {barber.full_name || barber.email}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                          {barber.cutsCount} cortes
                        </span>
                      </div>
                      <span className="font-bold text-zinc-900">
                        {formatCurrency(barber.totalRevenue)}
                      </span>
                    </div>
                    <div className="h-6 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="flex h-full items-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 pl-3 transition-all"
                        style={{ width: `${Math.max(barWidth, 8)}%` }}
                      >
                        {barWidth > 25 && (
                          <span className="text-xs font-medium text-white">
                            {formatCurrency(barber.totalRevenue)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-zinc-400">
                      <span className="text-green-600">
                        Barbero: {formatCurrency(barber.barberEarnings)} ({barber.barber_share_pct}%)
                      </span>
                      <span className="text-blue-600">
                        Local: {formatCurrency(barber.shopEarnings)} ({barber.shop_share_pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              🕐 Horarios pico
            </h2>
            {peakHour.count > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                Pico: {peakHour.hour}:00 - {peakHour.hour + 1}:00 ({peakHour.count} cortes)
              </span>
            )}
          </div>
          <div className="flex items-end gap-0.5 overflow-x-auto pb-2">
            {periods24.map((hour) => {
              const data = hourlyDist[hour];
              const height = data.count > 0 ? (data.count / maxHourlyCount) * 100 : 0;
              const isPeak = hour === peakHour.hour;
              return (
                <div key={hour} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-zinc-400">
                    {data.count > 0 ? data.count : ""}
                  </span>
                  <div className="flex w-full items-end justify-center" style={{ height: "80px" }}>
                    <div
                      className={`w-full max-w-[20px] rounded-t transition-all ${
                        isPeak
                          ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-lg shadow-amber-500/30"
                          : data.count > 0
                            ? "bg-gradient-to-t from-amber-400 to-amber-300"
                            : "bg-zinc-100"
                      }`}
                      style={{ height: `${Math.max(height, data.count > 0 ? 15 : 3)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">{hour}h</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              ✂️ Por tipo de corte
            </h2>
            <div className="space-y-3">
              {cutTypeBreakdown.map((item) => (
                <div key={item.type}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-zinc-700">
                      {item.emoji} {item.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {item.count} · {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              💳 Por tipo de pago
            </h2>
            <div className="space-y-3">
              {paymentBreakdown.map((item) => (
                <div key={item.type}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-zinc-700">
                      {item.emoji} {item.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {item.count} · {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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

  const userEarnings = total * (profile?.barber_share_pct ?? 50) / 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p.key
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white text-zinc-600 hover:bg-zinc-100"
            } border border-zinc-200`}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4 text-center sm:p-6">
          <p className="text-xs text-amber-600 sm:text-sm">Total generado</p>
          <p className="mt-1 text-xl font-bold text-amber-700 sm:text-3xl">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 text-center sm:p-6">
          <p className="text-xs text-zinc-500 sm:text-sm">Cortes realizados</p>
          <p className="mt-1 text-xl font-bold text-zinc-900 sm:text-3xl">{totalCuts}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 text-center sm:p-6">
          <p className="text-xs text-green-600 sm:text-sm">Tu ganancia ({profile?.barber_share_pct ?? 50}%)</p>
          <p className="mt-1 text-xl font-bold text-green-700 sm:text-3xl">
            {formatCurrency(userEarnings)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          ✂️ Por tipo de corte
        </h2>
        <div className="space-y-3">
          {cutTypeBreakdown.map((item) => (
            <div key={item.type}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-zinc-700">
                  {item.emoji} {item.label}
                </span>
                <span className="text-xs text-zinc-500">
                  {item.count} · {formatCurrency(item.total)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          💳 Por tipo de pago
        </h2>
        <div className="space-y-3">
          {paymentBreakdown.map((item) => (
            <div key={item.type}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-zinc-700">
                  {item.emoji} {item.label}
                </span>
                <span className="text-xs text-zinc-500">
                  {item.count} · {formatCurrency(item.total)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

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
