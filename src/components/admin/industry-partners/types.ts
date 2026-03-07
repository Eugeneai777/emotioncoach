export interface IndustryPartner {
  id: string;
  partner_code: string;
  status: string;
  partner_type: string;
  total_referrals: number;
  total_l2_referrals: number;
  total_earnings: number;
  pending_balance: number;
  available_balance: number;
  withdrawn_amount: number;
  prepurchase_count: number;
  default_entry_type: string | null;
  default_entry_price: number | null;
  default_quota_amount: number | null;
  default_product_type: string | null;
  selected_experience_packages: any;
  created_at: string;
  user_id: string | null;
  company_name: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  cooperation_note: string | null;
  custom_commission_rate_l1: number | null;
  custom_commission_rate_l2: number | null;
  commission_rate_l1: number | null;
  commission_rate_l2: number | null;
  traffic_source: string | null;
  settlement_cycle: string | null;
  custom_product_packages: any | null;
  partner_level: string | null;
  partner_expires_at: string | null;
  nickname?: string;
}

export interface CreatePartnerForm {
  company_name: string;
  contact_person: string;
  contact_phone: string;
  cooperation_note: string;
  commission_l1: string;
  traffic_source: string;
  settlement_cycle: string;
}

export const DEFAULT_FORM: CreatePartnerForm = {
  company_name: "",
  contact_person: "",
  contact_phone: "",
  cooperation_note: "",
  commission_l1: "0.20",
  traffic_source: "",
  settlement_cycle: "monthly",
};

export function generatePartnerCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "IND-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
