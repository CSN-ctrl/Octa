export type AdminTab =
  | "star-systems"
  | "planets"
  | "cities"
  | "resources"
  | "documents"
  | "transactions"
  | "users"
  | "treasury"
  | "affiliates";

export type AdminDomain = "content" | "users" | "treasury" | "affiliates";

export interface UserData {
  email: string;
  name?: string;
  wallet_address: string | null;
  /** Wallet from auth.users raw_user_meta_data.wallet_address (Supabase Auth metadata). */
  auth_wallet_address?: string | null;
  wallets: string[];
  balance: {
    xbgl_balance: number;
    avax_balance: number;
    chaos_balance: number;
    sc_balance?: number;
  } | null;
  plots: number;
  portfolios: number;
  totalValue: number;
}

export interface AdminTabDescriptor {
  key: AdminTab;
  label: string;
  domain: AdminDomain;
}
