"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { CUTS_CONFIG, formatCurrency } from "@/lib/types";
import type { CutType, Cut } from "@/lib/types";

export default function CutForm({
  onCutAdded,
}: {
  onCutAdded?: (cut: Cut) => void;
}) {
  const [selectedType, setSelectedType] = useState<CutType>("simple");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const config = CUTS_CONFIG[selectedType];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const clientName = formData.get("client_name") as string;
    const notes = formData.get("notes") as string;

    // Generate temp ID for optimistic insert
    const tempId = crypto.randomUUID();
    const prices: Record<CutType, number> = {
      simple: 11000,
      hair_beard: 13000,
      color_change: 25000,
    };

    const optimisticCut: Cut = {
      id: tempId,
      user_id: "temp",
      cut_type: selectedType,
      price: prices[selectedType],
      client_name: clientName || "",
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    // Add to UI immediately
    if (onCutAdded) onCutAdded(optimisticCut);

    // Reset form instantly
    form.reset();
    setSelectedType("simple");

    // Fire-and-forget to Supabase
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No autenticado");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("cuts")
        .insert({
          user_id: user.id,
          cut_type: selectedType,
          price: prices[selectedType],
          client_name: clientName || "",
          notes: notes || null,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        // Emit a "rollback" event so parent removes the optimistic entry
        if (onCutAdded) {
          onCutAdded({ ...optimisticCut, id: `rollback:${tempId}` } as Cut);
        }
      } else if (data) {
        // Emit a "replace" event so parent swaps temp with real data
        if (onCutAdded) {
          onCutAdded({ ...data, id: `replace:${tempId}:${data.id}` } as Cut);
        }
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
          <span className="text-zinc-600">Precio:</span>
          <span className="text-2xl font-bold text-zinc-900">
            {formatCurrency(config.price)}
          </span>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-amber-500 py-3 text-lg font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Registrar corte"}
        </button>
      </div>
    </form>
  );
}
