// Synced with Supabase project (Cursor MCP user-supabase).
// Regenerate: MCP generate_typescript_types or supabase gen types.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      affiliate_referrals: {
        Row: {
          affiliate_code: string
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          paid_at: string | null
          plot_ids: number[]
          purchase_amount: number
          referred_email: string | null
          referred_wallet: string
          referrer_wallet: string
          status: string | null
        }
        Insert: {
          affiliate_code: string
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          plot_ids: number[]
          purchase_amount: number
          referred_email?: string | null
          referred_wallet: string
          referrer_wallet: string
          status?: string | null
        }
        Update: {
          affiliate_code?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          plot_ids?: number[]
          purchase_amount?: number
          referred_email?: string | null
          referred_wallet?: string
          referrer_wallet?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_referrer_wallet_fkey"
            columns: ["referrer_wallet"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          application_date: string | null
          application_reason: string | null
          commission_rate: number | null
          created_at: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          total_commission: number | null
          total_referrals: number | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          affiliate_code: string
          application_date?: string | null
          application_reason?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          total_commission?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          affiliate_code?: string
          application_date?: string | null
          application_reason?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          total_commission?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          automation_type: Database["public"]["Enums"]["automation_type"]
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          last_executed: string | null
          owner_wallet: string
          portfolio_id: string | null
        }
        Insert: {
          automation_type: Database["public"]["Enums"]["automation_type"]
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_executed?: string | null
          owner_wallet: string
          portfolio_id?: string | null
        }
        Update: {
          automation_type?: Database["public"]["Enums"]["automation_type"]
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_executed?: string | null
          owner_wallet?: string
          portfolio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_settings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      black_market_invites: {
        Row: {
          invite_code: string
          invited_at: string | null
          invited_by: string | null
          used: boolean | null
          wallet_address: string
        }
        Insert: {
          invite_code: string
          invited_at?: string | null
          invited_by?: string | null
          used?: boolean | null
          wallet_address: string
        }
        Update: {
          invite_code?: string
          invited_at?: string | null
          invited_by?: string | null
          used?: boolean | null
          wallet_address?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          planet_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          planet_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          planet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_planet_id_fkey"
            columns: ["planet_id"]
            isOneToOne: false
            referencedRelation: "planets"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_identities: {
        Row: {
          avatar_cid: string | null
          created_at: string | null
          id: string
          identity_type: string | null
          metadata_cid: string | null
          name: string
          wallet_address: string
        }
        Insert: {
          avatar_cid?: string | null
          created_at?: string | null
          id?: string
          identity_type?: string | null
          metadata_cid?: string | null
          name: string
          wallet_address: string
        }
        Update: {
          avatar_cid?: string | null
          created_at?: string | null
          id?: string
          identity_type?: string | null
          metadata_cid?: string | null
          name?: string
          wallet_address?: string
        }
        Relationships: []
      }
      economy_ticks: {
        Row: {
          chaos_tokens_generated: number | null
          id: string
          plot_id: number | null
          processed_at: string | null
          resources_generated: Json | null
          tick_number: number
        }
        Insert: {
          chaos_tokens_generated?: number | null
          id?: string
          plot_id?: number | null
          processed_at?: string | null
          resources_generated?: Json | null
          tick_number: number
        }
        Update: {
          chaos_tokens_generated?: number | null
          id?: string
          plot_id?: number | null
          processed_at?: string | null
          resources_generated?: Json | null
          tick_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "economy_ticks_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          from_token: string
          id: string
          rate: number
          to_token: string
          updated_at: string | null
        }
        Insert: {
          from_token: string
          id?: string
          rate: number
          to_token: string
          updated_at?: string | null
        }
        Update: {
          from_token?: string
          id?: string
          rate?: number
          to_token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expert_applications: {
        Row: {
          assigned_consultant: string | null
          budget_range: string
          contacted_at: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          investment_goals: string | null
          message: string | null
          notes: string | null
          phone: string | null
          preferred_contact: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_consultant?: string | null
          budget_range: string
          contacted_at?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          investment_goals?: string | null
          message?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_consultant?: string | null
          budget_range?: string
          contacted_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          investment_goals?: string | null
          message?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      factions: {
        Row: {
          created_at: string | null
          founder_wallet: string
          governance_model: string | null
          id: string
          member_wallets: string[] | null
          name: string
          plot_ids: number[] | null
          treasury_balance: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          founder_wallet: string
          governance_model?: string | null
          id?: string
          member_wallets?: string[] | null
          name: string
          plot_ids?: number[] | null
          treasury_balance?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          founder_wallet?: string
          governance_model?: string | null
          id?: string
          member_wallets?: string[] | null
          name?: string
          plot_ids?: number[] | null
          treasury_balance?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      genesis_prizes: {
        Row: {
          awarded: boolean | null
          awarded_at: string | null
          created_at: string | null
          id: string
          prize_type: string
          prize_value: string | null
          wallet_address: string
        }
        Insert: {
          awarded?: boolean | null
          awarded_at?: string | null
          created_at?: string | null
          id?: string
          prize_type: string
          prize_value?: string | null
          wallet_address: string
        }
        Update: {
          awarded?: boolean | null
          awarded_at?: string | null
          created_at?: string | null
          id?: string
          prize_type?: string
          prize_value?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      genesis_stats: {
        Row: {
          btc_winner_selected: boolean | null
          btc_winner_wallet: string | null
          eligible_for_btc: number | null
          eligible_for_structure: number | null
          id: string
          ilo_closed: boolean | null
          secondary_market_active: boolean | null
          structures_distributed: number | null
          total_participants: number | null
          updated_at: string | null
        }
        Insert: {
          btc_winner_selected?: boolean | null
          btc_winner_wallet?: string | null
          eligible_for_btc?: number | null
          eligible_for_structure?: number | null
          id: string
          ilo_closed?: boolean | null
          secondary_market_active?: boolean | null
          structures_distributed?: number | null
          total_participants?: number | null
          updated_at?: string | null
        }
        Update: {
          btc_winner_selected?: boolean | null
          btc_winner_wallet?: string | null
          eligible_for_btc?: number | null
          eligible_for_structure?: number | null
          id?: string
          ilo_closed?: boolean | null
          secondary_market_active?: boolean | null
          structures_distributed?: number | null
          total_participants?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hot_wallets: {
        Row: {
          address: string
          created_at: string | null
          id: string
          is_active: boolean | null
          network_id: string
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          network_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          network_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ilo_participants: {
        Row: {
          created_at: string | null
          eligible_for_btc: boolean | null
          eligible_for_structure: boolean | null
          email: string | null
          id: string
          participation_number: number | null
          phase_1_early_access: boolean | null
          plot_id: number | null
          plot_purchased: boolean | null
          purchase_date: string | null
          received_structure: boolean | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          eligible_for_btc?: boolean | null
          eligible_for_structure?: boolean | null
          email?: string | null
          id?: string
          participation_number?: number | null
          phase_1_early_access?: boolean | null
          plot_id?: number | null
          plot_purchased?: boolean | null
          purchase_date?: string | null
          received_structure?: boolean | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          eligible_for_btc?: boolean | null
          eligible_for_structure?: boolean | null
          email?: string | null
          id?: string
          participation_number?: number | null
          phase_1_early_access?: boolean | null
          plot_id?: number | null
          plot_purchased?: boolean | null
          purchase_date?: string | null
          received_structure?: boolean | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "ilo_participants_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      ilo_phases: {
        Row: {
          closed_at: string | null
          created_at: string | null
          current_participants: number | null
          id: string
          max_participants: number | null
          phase_name: string
          phase_status: string | null
          plot_price_eur: number | null
          plot_price_usdc: number | null
          plot_price_xbgl: number | null
          secondary_market_active: boolean | null
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          current_participants?: number | null
          id?: string
          max_participants?: number | null
          phase_name: string
          phase_status?: string | null
          plot_price_eur?: number | null
          plot_price_usdc?: number | null
          plot_price_xbgl?: number | null
          secondary_market_active?: boolean | null
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          current_participants?: number | null
          id?: string
          max_participants?: number | null
          phase_name?: string
          phase_status?: string | null
          plot_price_eur?: number | null
          plot_price_usdc?: number | null
          plot_price_xbgl?: number | null
          secondary_market_active?: boolean | null
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ilo_stats: {
        Row: {
          campaign_end_date: string | null
          campaign_start_date: string | null
          id: string
          is_active: boolean
          participants_count: number
          spots_taken: number
          total_raised_eur: number
          total_raised_usdc: number
          total_spots: number
          updated_at: string | null
        }
        Insert: {
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          id?: string
          is_active?: boolean
          participants_count?: number
          spots_taken?: number
          total_raised_eur?: number
          total_raised_usdc?: number
          total_spots?: number
          updated_at?: string | null
        }
        Update: {
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          id?: string
          is_active?: boolean
          participants_count?: number
          spots_taken?: number
          total_raised_eur?: number
          total_raised_usdc?: number
          total_spots?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          asset_id: string
          asset_type: string
          buyer_wallet: string | null
          description: string | null
          id: string
          listed_at: string | null
          metadata: Json | null
          price: number
          seller_wallet: string
          sold_at: string | null
          status: string | null
          token_type: string | null
        }
        Insert: {
          asset_id: string
          asset_type: string
          buyer_wallet?: string | null
          description?: string | null
          id?: string
          listed_at?: string | null
          metadata?: Json | null
          price: number
          seller_wallet: string
          sold_at?: string | null
          status?: string | null
          token_type?: string | null
        }
        Update: {
          asset_id?: string
          asset_type?: string
          buyer_wallet?: string | null
          description?: string | null
          id?: string
          listed_at?: string | null
          metadata?: Json | null
          price?: number
          seller_wallet?: string
          sold_at?: string | null
          status?: string | null
          token_type?: string | null
        }
        Relationships: []
      }
      npcs: {
        Row: {
          assigned_plot_id: number | null
          created_at: string | null
          employer_wallet: string | null
          employment_history: Json | null
          id: string
          loyalty_score: number | null
          nft_id: number | null
          personality_vector: Json | null
          skills: Json | null
          updated_at: string | null
        }
        Insert: {
          assigned_plot_id?: number | null
          created_at?: string | null
          employer_wallet?: string | null
          employment_history?: Json | null
          id?: string
          loyalty_score?: number | null
          nft_id?: number | null
          personality_vector?: Json | null
          skills?: Json | null
          updated_at?: string | null
        }
        Update: {
          assigned_plot_id?: number | null
          created_at?: string | null
          employer_wallet?: string | null
          employment_history?: Json | null
          id?: string
          loyalty_score?: number | null
          nft_id?: number | null
          personality_vector?: Json | null
          skills?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "npcs_assigned_plot_id_fkey"
            columns: ["assigned_plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_registry: {
        Row: {
          email: string
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          email: string
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          email?: string
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      planets: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          name: string
          node_type: string | null
          owner_wallet: string
          planet_type: string | null
          star_system_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          name: string
          node_type?: string | null
          owner_wallet: string
          planet_type?: string | null
          star_system_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          name?: string
          node_type?: string | null
          owner_wallet?: string
          planet_type?: string | null
          star_system_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planets_star_system_id_fkey"
            columns: ["star_system_id"]
            isOneToOne: false
            referencedRelation: "star_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_documents: {
        Row: {
          created_at: string | null
          document_type: string
          document_url: string
          filename: string | null
          id: string
          owner_wallet: string | null
          plot_id: number
        }
        Insert: {
          created_at?: string | null
          document_type: string
          document_url: string
          filename?: string | null
          id?: string
          owner_wallet?: string | null
          plot_id: number
        }
        Update: {
          created_at?: string | null
          document_type?: string
          document_url?: string
          filename?: string | null
          id?: string
          owner_wallet?: string | null
          plot_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "plot_documents_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_fractional_shares: {
        Row: {
          created_at: string | null
          id: string
          owner_email: string
          owner_wallet: string | null
          plot_id: number
          share_percentage: number
          shares: number
          total_shares: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_email: string
          owner_wallet?: string | null
          plot_id: number
          share_percentage: number
          shares: number
          total_shares?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_email?: string
          owner_wallet?: string | null
          plot_id?: number
          share_percentage?: number
          shares?: number
          total_shares?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plot_fractional_shares_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_purchases: {
        Row: {
          buyer_wallet: string
          created_at: string | null
          currency: string | null
          id: string
          plot_id: number
          purchase_price: number
          status: string | null
        }
        Insert: {
          buyer_wallet: string
          created_at?: string | null
          currency?: string | null
          id?: string
          plot_id: number
          purchase_price: number
          status?: string | null
        }
        Update: {
          buyer_wallet?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          plot_id?: number
          purchase_price?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plot_purchases_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          booking_status: string | null
          building_stage: number | null
          coord_x: number
          coord_y: number
          created_at: string | null
          id: number
          last_tick: string | null
          metadata_cid: string | null
          owner_wallet: string | null
          planet_id: string | null
          production_rate: number | null
          updated_at: string | null
          workers: Json | null
          zone_type: string | null
        }
        Insert: {
          booking_status?: string | null
          building_stage?: number | null
          coord_x: number
          coord_y: number
          created_at?: string | null
          id?: number
          last_tick?: string | null
          metadata_cid?: string | null
          owner_wallet?: string | null
          planet_id?: string | null
          production_rate?: number | null
          updated_at?: string | null
          workers?: Json | null
          zone_type?: string | null
        }
        Update: {
          booking_status?: string | null
          building_stage?: number | null
          coord_x?: number
          coord_y?: number
          created_at?: string | null
          id?: number
          last_tick?: string | null
          metadata_cid?: string | null
          owner_wallet?: string | null
          planet_id?: string | null
          production_rate?: number | null
          updated_at?: string | null
          workers?: Json | null
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plots_planet_id_fkey"
            columns: ["planet_id"]
            isOneToOne: false
            referencedRelation: "planets"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_followers: {
        Row: {
          active: boolean | null
          allocation_amount: number | null
          copy_percent: number | null
          follower_wallet: string
          id: string
          manager_wallet: string
          started_at: string | null
        }
        Insert: {
          active?: boolean | null
          allocation_amount?: number | null
          copy_percent?: number | null
          follower_wallet: string
          id?: string
          manager_wallet: string
          started_at?: string | null
        }
        Update: {
          active?: boolean | null
          allocation_amount?: number | null
          copy_percent?: number | null
          follower_wallet?: string
          id?: string
          manager_wallet?: string
          started_at?: string | null
        }
        Relationships: []
      }
      portfolio_managers: {
        Row: {
          applied_at: string | null
          approval_status: Database["public"]["Enums"]["manager_status"] | null
          approved_at: string | null
          bio: string | null
          display_name: string
          id: string
          management_fee_percent: number | null
          performance_start_date: string | null
          roi_annualized: number | null
          sharpe_ratio: number | null
          total_followers: number | null
          track_record: Json | null
          verified: boolean | null
          wallet_address: string
        }
        Insert: {
          applied_at?: string | null
          approval_status?: Database["public"]["Enums"]["manager_status"] | null
          approved_at?: string | null
          bio?: string | null
          display_name: string
          id?: string
          management_fee_percent?: number | null
          performance_start_date?: string | null
          roi_annualized?: number | null
          sharpe_ratio?: number | null
          total_followers?: number | null
          track_record?: Json | null
          verified?: boolean | null
          wallet_address: string
        }
        Update: {
          applied_at?: string | null
          approval_status?: Database["public"]["Enums"]["manager_status"] | null
          approved_at?: string | null
          bio?: string | null
          display_name?: string
          id?: string
          management_fee_percent?: number | null
          performance_start_date?: string | null
          roi_annualized?: number | null
          sharpe_ratio?: number | null
          total_followers?: number | null
          track_record?: Json | null
          verified?: boolean | null
          wallet_address?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          auto_reinvest_enabled: boolean | null
          auto_reinvest_percent: number | null
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          initial_investment: number | null
          name: string
          owner_wallet: string
          performance_history: Json | null
          risk_level: string | null
          roi_percent: number | null
          status: Database["public"]["Enums"]["portfolio_status"] | null
          updated_at: string | null
        }
        Insert: {
          auto_reinvest_enabled?: boolean | null
          auto_reinvest_percent?: number | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          initial_investment?: number | null
          name: string
          owner_wallet: string
          performance_history?: Json | null
          risk_level?: string | null
          roi_percent?: number | null
          status?: Database["public"]["Enums"]["portfolio_status"] | null
          updated_at?: string | null
        }
        Update: {
          auto_reinvest_enabled?: boolean | null
          auto_reinvest_percent?: number | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          initial_investment?: number | null
          name?: string
          owner_wallet?: string
          performance_history?: Json | null
          risk_level?: string | null
          roi_percent?: number | null
          status?: Database["public"]["Enums"]["portfolio_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_payments: {
        Row: {
          amount: number
          created_at: string | null
          enabled: boolean | null
          frequency: string
          from_wallet: string
          id: string
          last_payment_date: string | null
          next_payment_date: string
          payment_count: number | null
          to_wallet: string | null
          token_type: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          enabled?: boolean | null
          frequency: string
          from_wallet: string
          id?: string
          last_payment_date?: string | null
          next_payment_date: string
          payment_count?: number | null
          to_wallet?: string | null
          token_type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string
          from_wallet?: string
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string
          payment_count?: number | null
          to_wallet?: string | null
          token_type?: string | null
        }
        Relationships: []
      }
      social_media_verifications: {
        Row: {
          action_type: string
          comment_timestamp: string | null
          created_at: string | null
          id: string
          platform: string
          verification_code: string | null
          verification_url: string | null
          verified: boolean | null
          verified_at: string | null
          wallet_address: string
        }
        Insert: {
          action_type: string
          comment_timestamp?: string | null
          created_at?: string | null
          id?: string
          platform: string
          verification_code?: string | null
          verification_url?: string | null
          verified?: boolean | null
          verified_at?: string | null
          wallet_address: string
        }
        Update: {
          action_type?: string
          comment_timestamp?: string | null
          created_at?: string | null
          id?: string
          platform?: string
          verification_code?: string | null
          verification_url?: string | null
          verified?: boolean | null
          verified_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      star_systems: {
        Row: {
          chain_id: number | null
          created_at: string | null
          id: string
          name: string
          owner_wallet: string
          planets: string[] | null
          rpc_url: string | null
          status: string | null
          subnet_id: string | null
          treasury_balance: Json | null
          tribute_percent: number | null
          updated_at: string | null
        }
        Insert: {
          chain_id?: number | null
          created_at?: string | null
          id?: string
          name: string
          owner_wallet: string
          planets?: string[] | null
          rpc_url?: string | null
          status?: string | null
          subnet_id?: string | null
          treasury_balance?: Json | null
          tribute_percent?: number | null
          updated_at?: string | null
        }
        Update: {
          chain_id?: number | null
          created_at?: string | null
          id?: string
          name?: string
          owner_wallet?: string
          planets?: string[] | null
          rpc_url?: string | null
          status?: string | null
          subnet_id?: string | null
          treasury_balance?: Json | null
          tribute_percent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          block_number: number | null
          created_at: string | null
          from_address: string
          id: string
          metadata: Json | null
          plot_id: number | null
          status: string | null
          to_address: string | null
          token_type: string | null
          transaction_type: string | null
          tx_hash: string
          type: string
        }
        Insert: {
          amount?: number | null
          block_number?: number | null
          created_at?: string | null
          from_address: string
          id?: string
          metadata?: Json | null
          plot_id?: number | null
          status?: string | null
          to_address?: string | null
          token_type?: string | null
          transaction_type?: string | null
          tx_hash: string
          type: string
        }
        Update: {
          amount?: number | null
          block_number?: number | null
          created_at?: string | null
          from_address?: string
          id?: string
          metadata?: Json | null
          plot_id?: number | null
          status?: string | null
          to_address?: string | null
          token_type?: string | null
          transaction_type?: string | null
          tx_hash?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      usdc_deposits: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          hot_wallet_address: string
          id: string
          metadata: Json | null
          network_id: string
          status: string
          tx_hash: string | null
          usdc_amount: number
          user_email: string
          user_wallet: string | null
          xbgl_amount: number
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          hot_wallet_address: string
          id?: string
          metadata?: Json | null
          network_id: string
          status?: string
          tx_hash?: string | null
          usdc_amount: number
          user_email: string
          user_wallet?: string | null
          xbgl_amount: number
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          hot_wallet_address?: string
          id?: string
          metadata?: Json | null
          network_id?: string
          status?: string
          tx_hash?: string | null
          usdc_amount?: number
          user_email?: string
          user_wallet?: string | null
          xbgl_amount?: number
        }
        Relationships: []
      }
      user_affiliate_codes: {
        Row: {
          affiliate_code: string
          created_at: string | null
          id: string
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          affiliate_code: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          affiliate_code?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          avax_balance: number | null
          chaos_balance: number | null
          last_synced: string | null
          sc_balance: number | null
          wallet_address: string
          xbgl_balance: number | null
        }
        Insert: {
          avax_balance?: number | null
          chaos_balance?: number | null
          last_synced?: string | null
          sc_balance?: number | null
          wallet_address: string
          xbgl_balance?: number | null
        }
        Update: {
          avax_balance?: number | null
          chaos_balance?: number | null
          last_synced?: string | null
          sc_balance?: number | null
          wallet_address?: string
          xbgl_balance?: number | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          id: string
          last_updated: string | null
          total_users: number | null
        }
        Insert: {
          id: string
          last_updated?: string | null
          total_users?: number | null
        }
        Update: {
          id?: string
          last_updated?: string | null
          total_users?: number | null
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          connected_at: string | null
          id: string
          last_used_at: string | null
          user_id: string
          wallet_address: string
          wallet_label: string | null
        }
        Insert: {
          connected_at?: string | null
          id?: string
          last_used_at?: string | null
          user_id: string
          wallet_address: string
          wallet_label?: string | null
        }
        Update: {
          connected_at?: string | null
          id?: string
          last_used_at?: string | null
          user_id?: string
          wallet_address?: string
          wallet_label?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_treasury_role: {
        Args: { p_treasury_role: string; p_user_id: string }
        Returns: undefined
      }
      admin_set_treasury_role_by_email: {
        Args: { p_email: string; p_treasury_role: string }
        Returns: undefined
      }
      burn_tokens: {
        Args: {
          p_amount: number
          p_from_address: string
          p_metadata?: Json
          p_token_type?: string
          p_tx_hash?: string
        }
        Returns: Json
      }
      get_all_auth_users: {
        Args: never
        Returns: {
          account_name: string
          auth_wallet_address: string | null
          avax_balance: number
          chaos_balance: number
          email: string
          id: string
          plots_count: number
          portfolios_count: number
          wallet_address: string
          xbgl_balance: number
        }[]
      }
      get_all_balances: { Args: { p_wallet_address: string }; Returns: Json }
      get_ilo_stats: {
        Args: never
        Returns: {
          is_active: boolean
          participants_count: number
          progress_percentage: number
          spots_remaining: number
          spots_taken: number
          total_raised_eur: number
          total_raised_usdc: number
          total_spots: number
        }[]
      }
      get_ledger_balance: {
        Args: { p_token_type?: string; p_user_email: string }
        Returns: number
      }
      get_plot_ownership: { Args: { p_plot_id: number }; Returns: Json }
      get_plot_total_ownership: { Args: { p_plot_id: number }; Returns: number }
      get_token_balance: {
        Args: { p_token_type?: string; p_wallet_address: string }
        Returns: number
      }
      get_treasury_managers: {
        Args: never
        Returns: {
          email: string
          id: string
          user_metadata: Json
        }[]
      }
      get_user_fractional_shares: {
        Args: { p_user_email: string }
        Returns: {
          plot_id: number
          share_percentage: number
          shares: number
          total_shares: number
        }[]
      }
      is_dashboard_admin: { Args: never; Returns: boolean }
      mint_tokens: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_to_address: string
          p_token_type?: string
          p_tx_hash?: string
        }
        Returns: Json
      }
      purchase_plot: {
        Args: {
          p_buyer_email: string
          p_buyer_wallet: string
          p_currency?: string
          p_plot_id: number
          p_price: number
        }
        Returns: Json
      }
      reconcile_balance: { Args: { p_user_email: string }; Returns: Json }
      transfer_tokens: {
        Args: {
          p_amount: number
          p_from_address: string
          p_metadata?: Json
          p_to_address: string
          p_token_type?: string
          p_tx_hash?: string
        }
        Returns: Json
      }
      admin_treasury_transfer: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_recipient: string
          p_tx_hash: string
        }
        Returns: Json
      }
    }
    Enums: {
      automation_type: "auto_reinvest" | "recurring_deposit" | "rebalance"
      manager_status: "pending" | "approved" | "rejected"
      portfolio_status: "active" | "paused" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

/** Plot row alias for components that expect a `Plot` type from generated schema. */
export type Plot = Tables<"plots">

export const Constants = {
  public: {
    Enums: {
      automation_type: ["auto_reinvest", "recurring_deposit", "rebalance"],
      manager_status: ["pending", "approved", "rejected"],
      portfolio_status: ["active", "paused", "closed"],
    },
  },
} as const
