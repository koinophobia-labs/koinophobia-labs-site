export type Role = "owner" | "partner";
export interface Partner {
  id: string;
  name: string;
  role: Role;
  parent_partner_id: string | null;
  commission_rate: number;
  override_rate: number;
  active: boolean;
  code_hash?: string;
}
export interface Lead {
  id: string;
  partner_id: string;
  business: string;
  contact: string;
  phone: string;
  email: string;
  website: string;
  channel: string;
  notes: string;
  created_at: string;
}
export const STAGES = [
  "Lead",
  "Contacted",
  "Site check sent",
  "Quote sent",
  "Won",
  "Client paid",
  "Delivered",
  "Lost",
] as const;
export type Stage = (typeof STAGES)[number];
export interface Deal {
  id: string;
  lead_id: string;
  partner_id: string;
  services: string[];
  price: number | null;
  monthly: number;
  approved: boolean;
  scope: string;
  stage: Stage;
  lost_reason: string;
  created_at: string;
  updated_at: string;
  share_token?: string;
}
export interface Payment {
  id: string;
  deal_id: string;
  amount: number;
  received_at: string;
}
export interface Payout {
  id: string;
  partner_id: string;
  deal_id: string;
  amount: number;
  paid_at: string;
}
export interface Finding {
  name: string;
  status: "pass" | "review" | "unknown";
  detail: string;
}
export interface SiteCheck {
  id: string;
  partner_id: string;
  url: string;
  final_url: string;
  measured_at: string;
  duration_ms: number;
  findings: Finding[];
  share_token?: string;
}
export interface Data {
  partners: Partner[];
  leads: Lead[];
  deals: Deal[];
  payments: Payment[];
  payouts: Payout[];
  site_checks: SiteCheck[];
}
export interface Snapshot extends Data {
  me: Partner;
  fake: boolean;
}
