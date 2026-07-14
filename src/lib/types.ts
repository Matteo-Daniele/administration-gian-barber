export type CutType = "simple" | "hair_beard" | "color_change";

export interface Cut {
  id: string;
  user_id: string;
  cut_type: CutType;
  price: number;
  client_name: string;
  notes: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "barber";
  barber_share_pct: number;
  shop_share_pct: number;
  created_at: string;
}

export const CUTS_CONFIG: Record<
  CutType,
  { label: string; price: number; emoji: string }
> = {
  simple: { label: "Simple", price: 11000, emoji: "✂️" },
  hair_beard: { label: "Pelo y Barba", price: 13000, emoji: "💈" },
  color_change: { label: "Cambio de Color", price: 25000, emoji: "🎨" },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}
