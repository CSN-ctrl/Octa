/**
 * Local Database Schema using Dexie.js (IndexedDB)
 * Replaces Supabase for local-first data storage
 */

import Dexie, { Table } from 'dexie';

// Portfolio interfaces
export interface Portfolio {
  id?: string;
  owner_wallet: string;
  name: string;
  description?: string;
  initial_investment: number;
  current_value: number;
  roi_percent: number;
  created_at: string;
  updated_at: string;
  status: 'active' | 'paused' | 'closed';
  risk_level: string;
  auto_reinvest_enabled: boolean;
  auto_reinvest_percent: number;
  performance_history?: any;
  // Portfolio structure for FinancialHub
  portfolio_type?: 'primary' | 'secondary' | 'speculative';
  holdings?: Array<{
    asset_type: string;
    identifier: string;
    cost_basis: number;
    current_value?: number;
    yield_annual?: number;
    metadata?: any;
  }>;
  total_value?: number;
  recurring_investment_monthly?: number;
  wallet?: string; // Alias for owner_wallet for compatibility
}

export interface PortfolioManager {
  id?: string;
  wallet_address: string;
  display_name: string;
  bio?: string;
  verified: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  roi_annualized: number;
  sharpe_ratio: number;
  total_followers: number;
  performance_start_date?: string;
  applied_at: string;
  approved_at?: string;
  track_record?: any;
  management_fee_percent: number;
}

export interface PortfolioFollower {
  id?: string;
  follower_wallet: string;
  manager_wallet: string;
  allocation_amount: number;
  copy_percent: number;
  active: boolean;
  created_at: string;
}

export interface AutomationSetting {
  id?: string;
  owner_wallet: string;
  portfolio_id?: string;
  automation_type: 'auto_reinvest' | 'recurring_deposit' | 'rebalance';
  enabled: boolean;
  config: any;
  created_at: string;
  last_executed?: string;
}

export interface RecurringPayment {
  id?: string;
  from_wallet: string;
  to_wallet?: string;
  amount: number;
  token_type: string;
  frequency: string;
  next_payment_date: string;
  enabled: boolean;
  created_at: string;
  last_payment_date?: string;
  payment_count: number;
}

export interface MarketplaceListing {
  id?: string;
  seller_wallet: string;
  asset_type: string;
  asset_id: string;
  price: number;
  token_type: string;
  description?: string;
  metadata?: any;
  listed_at: string;
  sold_at?: string;
  buyer_wallet?: string;
  status: string;
}

export interface PlotPurchase {
  id?: string;
  plot_id: number;
  buyer_address: string;
  purchase_price: string; // In wei (bigint as string)
  purchase_price_formatted: number; // In xBGL (formatted)
  currency: string; // 'xBGL' | 'AVAX' | 'USDC'
  transaction_hash: string;
  block_number?: number;
  timestamp: string;
  coordinates?: {
    x: number;
    y: number;
  };
  planet_id?: string;
  level?: number;
  metadata?: any;
}

export interface PlotRegistry {
  id?: string;
  plot_id: number;
  x: number;
  y: number;
  level: number;
  issued: boolean;
  purchased: boolean;
  price: string; // In wei (bigint as string)
  price_formatted: number; // In xBGL (formatted)
  planet_id: string;
  owner_address?: string;
  last_synced: string;
  metadata?: any;
}

class ChaosStarLocalDB extends Dexie {
  portfolios!: Table<Portfolio, string>;
  portfolioManagers!: Table<PortfolioManager, string>;
  portfolioFollowers!: Table<PortfolioFollower, string>;
  automationSettings!: Table<AutomationSetting, string>;
  recurringPayments!: Table<RecurringPayment, string>;
  marketplaceListings!: Table<MarketplaceListing, string>;
  plotPurchases!: Table<PlotPurchase, string>;
  plotRegistry!: Table<PlotRegistry, string>;

  constructor() {
    super('ChaosStarDB');
    
    this.version(1).stores({
      portfolios: 'id, owner_wallet, created_at, status',
      portfolioManagers: 'id, wallet_address, approval_status, roi_annualized',
      portfolioFollowers: 'id, follower_wallet, manager_wallet, active',
      automationSettings: 'id, owner_wallet, automation_type, enabled',
      recurringPayments: 'id, from_wallet, enabled, next_payment_date',
      marketplaceListings: 'id, seller_wallet, asset_type, status, listed_at',
    });
    
    this.version(2).stores({
      portfolios: 'id, owner_wallet, created_at, status',
      portfolioManagers: 'id, wallet_address, approval_status, roi_annualized',
      portfolioFollowers: 'id, follower_wallet, manager_wallet, active',
      automationSettings: 'id, owner_wallet, automation_type, enabled',
      recurringPayments: 'id, from_wallet, enabled, next_payment_date',
      marketplaceListings: 'id, seller_wallet, asset_type, status, listed_at',
      plotPurchases: 'id, plot_id, buyer_address, transaction_hash, timestamp',
      plotRegistry: 'id, plot_id, x, y, issued, purchased, owner_address, last_synced',
    }).upgrade(async (tx) => {
      // Migration from v1 to v2 - add new tables
      console.log('Migrating database to v2: adding plot tables');
    });
  }
}

export const db = new ChaosStarLocalDB();

// Initialize database
export async function initLocalDB() {
  try {
    await db.open();
    console.log('✅ Local database initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize local database:', error);
    return false;
  }
}

// Helper function to generate unique IDs
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

