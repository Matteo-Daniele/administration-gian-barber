export type CutType = "simple" | "hair_beard" | "color_change";
export type CutStatus = "pending" | "approved" | "rejected";
export type PaymentType = "cash" | "transfer";

export interface Cut {
  id: string;
  user_id: string;
  cut_type: CutType;
  price: number;
  client_name: string;
  notes: string | null;
  status: CutStatus;
  payment_type: PaymentType | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "barber";
  barber_share_pct: number;
  shop_share_pct: number;
  is_active: boolean;
  created_at: string;
}

export const CUTS_CONFIG: Record<
  CutType,
  { label: string; price: number; emoji: string }
> = {
  simple: { label: "Simple", price: 11000, emoji: "✂️" },
  hair_beard: { label: "Pelo y Barba", price: 13000, emoji: "💈" },
  color_change: { label: "Color", price: 25000, emoji: "🎨" },
};

export const PAYMENT_TYPES: Record<PaymentType, { label: string; emoji: string }> = {
  cash: { label: "Efectivo", emoji: "💵" },
  transfer: { label: "Transferencia", emoji: "🏦" },
};

export const CUT_STATUS: Record<CutStatus, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "amber" },
  approved: { label: "Aprobado", color: "green" },
  rejected: { label: "Rechazado", color: "red" },
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}
