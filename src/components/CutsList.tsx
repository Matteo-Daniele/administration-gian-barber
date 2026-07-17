"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CUTS_CONFIG, PAYMENT_TYPES, CUT_STATUS, formatCurrency } from "@/lib/types";
import type { Cut, CutStatus, PaymentType } from "@/lib/types";
import CutForm from "@/components/CutForm";

export default function CutsList({ initialCuts }: { initialCuts: Cut[] }) {
  const [cuts, setCuts] = useState<Cut[]>(initialCuts);
  const supabase = createClient();

  const handleCutUpdate = (cut: Cut) => {
    const id = cut.id;

    if (id.startsWith("rollback:")) {
      const tempId = id.replace("rollback:", "");
      setCuts((prev) => prev.filter((c) => c.id !== tempId));
      return;
    }

    if (id.startsWith("replace:")) {
      const [, tempId, realId] = id.split(":");
      setCuts((prev) =>
        prev.map((c) => (c.id === tempId ? { ...cut, id: realId } : c))
      );
      return;
    }

    setCuts((prev) => [cut, ...prev]);
  };

  const handleDelete = async (id: string) => {
    const previousCuts = cuts;
    setCuts((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from("cuts").delete().eq("id", id);

    if (error) {
      setCuts(previousCuts);
    }
  };

  const approvedCuts = cuts.filter((c) => c.status === "approved");
  const totalApproved = approvedCuts.reduce((sum, c) => sum + Number(c.price), 0);

  const getStatusColor = (status: CutStatus) => {
    const colors = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[status];
  };

  const getPaymentLabel = (paymentType: PaymentType | null) => {
    if (!paymentType) return null;
    const payment = PAYMENT_TYPES[paymentType];
    return payment ? `${payment.emoji} ${payment.label}` : null;
  };

  return (
    <>
      <CutForm onCutAdded={handleCutUpdate} />

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Cortes de hoy</h2>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            Aprobados: {formatCurrency(totalApproved)}
          </span>
        </div>

        {cuts.length === 0 ? (
          <p className="py-8 text-center text-zinc-400">
            No hay cortes registrados hoy
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {cuts.map((cut) => {
              const config = CUTS_CONFIG[cut.cut_type as keyof typeof CUTS_CONFIG];
              const isOptimistic = cut.user_id === "temp";
              const statusInfo = CUT_STATUS[cut.status as CutStatus];
              return (
                <div
                  key={cut.id}
                  className={`flex items-center justify-between py-3 transition-opacity ${
                    isOptimistic ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{config?.emoji}</span>
                    <div>
                      <p className="font-medium text-zinc-900">
                        {config?.label}
                        {cut.client_name && (
                          <span className="ml-2 text-sm text-zinc-400">
                            - {cut.client_name}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        {cut.notes && <span>{cut.notes}</span>}
                        {cut.payment_type && (
                          <span className="text-xs">
                            {getPaymentLabel(cut.payment_type)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        getStatusColor(cut.status as CutStatus)
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
                    {!isOptimistic && cut.status === "pending" && (
                      <button
                        onClick={() => handleDelete(cut.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        x
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
