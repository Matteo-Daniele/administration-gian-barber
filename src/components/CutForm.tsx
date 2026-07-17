"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { CUTS_CONFIG, PAYMENT_TYPES, formatCurrency } from "@/lib/types";
import type { CutType, PaymentType, Cut } from "@/lib/types";

export default function CutForm({
  onCutAdded,
}: {
  onCutAdded?: (cut: Cut) => void;
}) {
  const [selectedType, setSelectedType] = useState<CutType>("simple");
  const [selectedPayment, setSelectedPayment] = useState<PaymentType>("cash");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const config = CUTS_CONFIG[selectedType];
  const totalPrice = config.price * quantity;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const clientName = formData.get("client_name") as string;
    const notes = formData.get("notes") as string;

    const prices: Record<CutType, number> = {
      simple: 11000,
      hair_beard: 13000,
      color_change: 25000,
    };

    const tempIds: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const tempId = crypto.randomUUID();
      tempIds.push(tempId);

      const optimisticCut: Cut = {
        id: tempId,
        user_id: "temp",
        cut_type: selectedType,
        price: prices[selectedType],
        client_name: clientName || "",
        notes: notes || null,
        status: "pending",
        payment_type: selectedPayment,
        approved_by: null,
        approved_at: null,
        created_at: new Date().toISOString(),
      };

      if (onCutAdded) onCutAdded(optimisticCut);
    }

    form.reset();
    setSelectedType("simple");
    setSelectedPayment("cash");
    setQuantity(1);

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No autenticado");
        tempIds.forEach((id) => {
          if (onCutAdded) onCutAdded({ id: `rollback:${id}`, user_id: "temp" } as Cut);
        });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const isAdmin = profile?.role === "admin";

      const inserts = Array.from({ length: quantity }, () => ({
        user_id: user.id,
        cut_type: selectedType,
        price: prices[selectedType],
        client_name: clientName || "",
        notes: notes || null,
        status: isAdmin ? ("approved" as const) : ("pending" as const),
        payment_type: selectedPayment,
        approved_by: isAdmin ? user.id : null,
        approved_at: isAdmin ? new Date().toISOString() : null,
      }));

      const { data, error: insertError } = await supabase
        .from("cuts")
        .insert(inserts)
        .select();

      if (insertError) {
        setError(insertError.message);
        tempIds.forEach((id) => {
          if (onCutAdded) onCutAdded({ id: `rollback:${id}`, user_id: "temp" } as Cut);
        });
      } else if (data) {
        data.forEach((realCut, i) => {
          if (onCutAdded) {
            onCutAdded({ ...realCut, id: `replace:${tempIds[i]}:${realCut.id}` } as Cut);
          }
        });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-6"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          El corte quedará como <strong>pendiente</strong> hasta que un admin lo apruebe.
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-zinc-700">
            Tipo de corte
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.entries(CUTS_CONFIG) as [CutType, typeof config][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedType === key
                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <p className="mt-1 font-semibold text-zinc-900">{cfg.label}</p>
                  <p className="text-sm text-zinc-500">{formatCurrency(cfg.price)}</p>
                </button>
              )
            )}
          </div>
          <input type="hidden" name="cut_type" value={selectedType} />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-zinc-700">
            Tipo de pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(PAYMENT_TYPES) as [PaymentType, { label: string; emoji: string }][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPayment(key)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPayment === key
                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/20"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <p className="mt-1 font-semibold text-zinc-900">{cfg.label}</p>
                </button>
              )
            )}
          </div>
          <input type="hidden" name="payment_type" value={selectedPayment} />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-zinc-700">
            Cantidad
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 text-lg font-bold text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              -
            </button>
            <span className="w-12 text-center text-xl font-bold text-zinc-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 text-lg font-bold text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              +
            </button>
            {quantity > 1 && (
              <span className="text-sm text-zinc-400">
                ({quantity} x {formatCurrency(config.price)})
              </span>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="client_name"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Nombre del cliente (opcional)
          </label>
          <input
            id="client_name"
            name="client_name"
            type="text"
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            placeholder="Nombre del cliente"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Notas (opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            placeholder="Detalles adicionales..."
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
          <span className="text-zinc-600">Total:</span>
          <span className="text-2xl font-bold text-zinc-900">
            {formatCurrency(totalPrice)}
          </span>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-amber-500 py-3 text-lg font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : quantity > 1 ? `Registrar ${quantity} cortes` : "Registrar corte"}
        </button>
      </div>
    </form>
  );
}
