import { supabase } from "@/integrations/supabase/client";

export interface AffiliateReferral {
  id?: string;
  affiliate_code: string;
  referrer_wallet: string;
  referred_wallet: string;
  referred_email?: string;
  commission_rate: number; // 0.15 for 15%
  commission_amount: number;
  purchase_amount: number;
  plot_ids: number[];
  status: 'pending' | 'paid' | 'cancelled';
  created_at?: string;
  paid_at?: string;
}

export interface AffiliateStats {
  total_referrals: number;
  total_commission: number;
  paid_commission: number;
  pending_commission: number;
}

export interface Affiliate {
  id?: string;
  wallet_address: string;
  affiliate_code: string;
  commission_rate: number;
  total_referrals: number;
  total_commission: number;
  status?: 'pending' | 'approved' | 'rejected';
  application_reason?: string;
  application_date?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generate or get affiliate code for a wallet (only if approved)
 */
export async function getOrCreateAffiliateCode(walletAddress: string): Promise<string | null> {
  try {
    // Check if affiliate code exists and is approved
    const { data: existing } = await (supabase as any)
      .from("affiliates")
      .select("affiliate_code, status")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (existing?.affiliate_code && existing.status === 'approved') {
      return existing.affiliate_code;
    }

    // If not approved, return null
    return null;
  } catch (error: any) {
    console.error("Failed to get affiliate code:", error);
    return null;
  }
}

/**
 * Get affiliate code from URL or localStorage, then store in Supabase
 * FIRST TAG STICKS: Never overwrites an existing tag
 */
export async function getAndStoreAffiliateCode(walletAddress: string | null): Promise<string | null> {
  try {
    // FIRST TAG STICKS: Check if we already have a tag stored
    const existingTag = localStorage.getItem('chaosstar_affiliate_code');
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('ref') || urlParams.get('affiliate');
    
    if (codeFromUrl) {
      const normalized = codeFromUrl.trim().toUpperCase();
      
      // FIRST TAG STICKS: Only set if no existing tag
      if (!existingTag) {
        localStorage.setItem('chaosstar_affiliate_code', normalized);
      }
      
      // Store in Supabase if we have an identifier (but don't overwrite existing)
      if (walletAddress) {
        await storeAffiliateCodeInSupabase(walletAddress, normalized);
      }
      
      // Return existing tag if present, otherwise the new one
      return existingTag || normalized;
    }

    // No URL param - return existing tag and optionally persist it
    if (existingTag && walletAddress) {
      // Store in Supabase if not already stored (won't overwrite)
      await storeAffiliateCodeInSupabase(walletAddress, existingTag);
    }
    
    return existingTag;
  } catch (error) {
    console.error("Failed to get/store affiliate code:", error);
    // Fallback to localStorage only
    return localStorage.getItem('chaosstar_affiliate_code');
  }
}

/**
 * Store affiliate code in Supabase for a wallet
 * FIRST TAG STICKS: If user already has ANY affiliate code, don't overwrite
 */
async function storeAffiliateCodeInSupabase(walletAddress: string, affiliateCode: string): Promise<void> {
  try {
    // FIRST TAG STICKS: Check if this user already has ANY affiliate code stored
    const { data: existing } = await (supabase as any)
      .from("user_affiliate_codes")
      .select("id, affiliate_code")
      .eq("wallet_address", walletAddress.toLowerCase())
      .limit(1)
      .maybeSingle();

    // If user already has a tag, don't overwrite it
    if (existing) {
      console.debug(`User ${walletAddress} already has affiliate code ${existing.affiliate_code}, not overwriting with ${affiliateCode}`);
      return;
    }

    // Store new affiliate code reference (first tag for this user)
    await (supabase as any)
      .from("user_affiliate_codes")
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        affiliate_code: affiliateCode.toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  } catch (error: any) {
    // If table doesn't exist yet, just log and continue
    console.debug("Failed to store affiliate code in Supabase:", error.message);
  }
}

/**
 * Get stored affiliate code for a wallet from Supabase
 */
export async function getStoredAffiliateCode(walletAddress: string): Promise<string | null> {
  try {
    const { data } = await (supabase as any)
      .from("user_affiliate_codes")
      .select("affiliate_code")
      .eq("wallet_address", walletAddress.toLowerCase())
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    return data?.affiliate_code || null;
  } catch (error) {
    console.debug("Failed to get stored affiliate code:", error);
    return null;
  }
}

/**
 * Record affiliate referral and calculate commission
 */
export async function recordAffiliateReferral(
  affiliateCode: string,
  referredWallet: string,
  referredEmail: string,
  purchaseAmount: number,
  plotIds: number[]
): Promise<{ success: boolean; commission?: number; error?: string }> {
  try {
    // Get referrer wallet from affiliate code
    const { data: affiliate } = await (supabase as any)
      .from("affiliates")
      .select("wallet_address, commission_rate, status")
      .eq("affiliate_code", affiliateCode.toUpperCase())
      .single();

    if (!affiliate) {
      return { success: false, error: "Invalid affiliate code" };
    }

    // Check if affiliate is approved
    if (affiliate.status !== 'approved') {
      return { success: false, error: "Affiliate code is not active" };
    }

    // Prevent self-referral
    if (affiliate.wallet_address.toLowerCase() === referredWallet.toLowerCase()) {
      return { success: false, error: "Cannot refer yourself" };
    }

    // Check if already referred (one referral per wallet)
    const { data: existing } = await (supabase as any)
      .from("affiliate_referrals")
      .select("id")
      .eq("referred_wallet", referredWallet.toLowerCase())
      .single();

    if (existing) {
      return { success: false, error: "Wallet already referred" };
    }

    // Calculate commission (15% of purchase amount)
    const commissionRate = affiliate.commission_rate || 0.15;
    const commissionAmount = purchaseAmount * commissionRate;

    // Create referral record
    const { data: referral, error: referralError } = await (supabase as any)
      .from("affiliate_referrals")
      .insert({
        affiliate_code: affiliateCode.toUpperCase(),
        referrer_wallet: affiliate.wallet_address,
        referred_wallet: referredWallet.toLowerCase(),
        referred_email: referredEmail,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        purchase_amount: purchaseAmount,
        plot_ids: plotIds,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (referralError) throw referralError;

    // Update affiliate stats using RPC or direct update
    const { data: currentAffiliate } = await (supabase as any)
      .from("affiliates")
      .select("total_referrals, total_commission")
      .eq("wallet_address", affiliate.wallet_address)
      .single();

    await (supabase as any)
      .from("affiliates")
      .update({
        total_referrals: (currentAffiliate?.total_referrals || 0) + 1,
        total_commission: (currentAffiliate?.total_commission || 0) + commissionAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", affiliate.wallet_address);

    return {
      success: true,
      commission: commissionAmount,
    };
  } catch (error: any) {
    console.error("Failed to record affiliate referral:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get affiliate stats for a wallet
 */
export async function getAffiliateStats(walletAddress: string): Promise<AffiliateStats | null> {
  try {
    const { data: affiliate } = await (supabase as any)
      .from("affiliates")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (!affiliate) return null;

    const { data: referrals } = await (supabase as any)
      .from("affiliate_referrals")
      .select("commission_amount, status")
      .eq("referrer_wallet", walletAddress.toLowerCase());

    const paid = referrals?.filter((r: any) => r.status === 'paid')
      .reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0) || 0;
    
    const pending = referrals?.filter((r: any) => r.status === 'pending')
      .reduce((sum: number, r: any) => sum + (r.commission_amount || 0), 0) || 0;

    return {
      total_referrals: affiliate.total_referrals || 0,
      total_commission: affiliate.total_commission || 0,
      paid_commission: paid,
      pending_commission: pending,
    };
  } catch (error) {
    console.error("Failed to get affiliate stats:", error);
    return null;
  }
}

/**
 * Get all referrals for an affiliate
 */
export async function getAffiliateReferrals(walletAddress: string): Promise<AffiliateReferral[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("affiliate_referrals")
      .select("*")
      .eq("referrer_wallet", walletAddress.toLowerCase())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to get affiliate referrals:", error);
    return [];
  }
}

/**
 * Get affiliate info by code
 */
export async function getAffiliateByCode(affiliateCode: string): Promise<Affiliate | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("affiliates")
      .select("*")
      .eq("affiliate_code", affiliateCode.toUpperCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to get affiliate by code:", error);
    return null;
  }
}

/**
 * Apply for affiliate program
 */
export async function applyForAffiliate(
  walletAddress: string,
  applicationReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already applied
    const { data: existing } = await (supabase as any)
      .from("affiliates")
      .select("id, status")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (existing) {
      if (existing.status === 'approved') {
        return { success: false, error: "You are already an approved affiliate" };
      }
      if (existing.status === 'pending') {
        return { success: false, error: "Your application is already pending review" };
      }
      // If rejected, allow re-application
    }

    // Generate affiliate code
    const code = `CS${walletAddress.slice(2, 8).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create or update affiliate record with pending status
    if (existing) {
      // Update existing rejected application
      const { error } = await (supabase as any)
        .from("affiliates")
        .update({
          status: 'pending',
          application_reason: applicationReason || null,
          application_date: new Date().toISOString(),
          rejection_reason: null, // Clear previous rejection
          updated_at: new Date().toISOString(),
        })
        .eq("wallet_address", walletAddress.toLowerCase());

      if (error) throw error;
    } else {
      // Create new application
      const { error } = await (supabase as any)
        .from("affiliates")
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          affiliate_code: code,
          commission_rate: 0.15, // 15%
          total_referrals: 0,
          total_commission: 0,
          status: 'pending',
          application_reason: applicationReason || null,
          application_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to apply for affiliate:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get affiliate application status
 */
export async function getAffiliateStatus(walletAddress: string): Promise<Affiliate | null> {
  try {
    const normalizedWallet = walletAddress.toLowerCase();
    console.log("getAffiliateStatus - querying for:", normalizedWallet);
    
    // Try fetching all and filtering client-side to avoid 406 errors
    console.log("Fetching all affiliates to filter client-side...");
    const { data: allData, error: allError } = await (supabase as any)
      .from("affiliates")
      .select("*");
    
    if (allError) {
      console.error("getAffiliateStatus error fetching all:", allError);
      // If that fails, try the direct query as fallback
      const { data, error } = await (supabase as any)
        .from("affiliates")
        .select("*")
        .eq("wallet_address", normalizedWallet)
        .maybeSingle();
      
      if (error) {
        console.error("getAffiliateStatus direct query error:", error);
        if (error.code === "PGRST116") return null; // Not found
        return null;
      }
      console.log("getAffiliateStatus - result (direct):", data);
      return data;
    }
    
    if (allData && Array.isArray(allData)) {
      const match = allData.find((aff: any) => 
        aff.wallet_address?.toLowerCase() === normalizedWallet
      );
      if (match) {
        console.log("getAffiliateStatus - found via client-side filter:", match);
        return match;
      }
      console.log("getAffiliateStatus - no match found. Total affiliates:", allData.length);
      console.log("Sample wallet addresses:", allData.slice(0, 3).map((a: any) => a.wallet_address));
    }
    
    return null;
  } catch (error) {
    console.error("Failed to get affiliate status:", error);
    return null;
  }
}

/**
 * Approve affiliate application (Admin only)
 */
export async function approveAffiliate(
  walletAddress: string,
  reviewedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from("affiliates")
      .update({
        status: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress.toLowerCase());

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Failed to approve affiliate:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject affiliate application (Admin only)
 */
export async function rejectAffiliate(
  walletAddress: string,
  reviewedBy: string,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from("affiliates")
      .update({
        status: 'rejected',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress.toLowerCase());

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Failed to reject affiliate:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all affiliate applications (Admin only)
 */
export async function getAllAffiliateApplications(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<Affiliate[]> {
  try {
    let query = (supabase as any)
      .from("affiliates")
      .select("*")
      .order("application_date", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to get affiliate applications:", error);
    return [];
  }
}

/**
 * Check if affiliate is approved (can use affiliate code)
 */
export async function isAffiliateApproved(walletAddress: string): Promise<boolean> {
  try {
    const { data } = await (supabase as any)
      .from("affiliates")
      .select("status")
      .eq("wallet_address", walletAddress.toLowerCase())
      .eq("status", "approved")
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Promote user to affiliate (Admin only - no application needed)
 * Creates affiliate record with approved status directly
 */
export async function promoteToAffiliate(
  walletAddress: string,
  promotedBy: string
): Promise<{ success: boolean; affiliateCode?: string; error?: string }> {
  try {
    const normalizedWallet = walletAddress.toLowerCase();

    // Check if already an affiliate
    const { data: existing } = await (supabase as any)
      .from("affiliates")
      .select("affiliate_code, status")
      .eq("wallet_address", normalizedWallet)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'approved') {
        return { 
          success: true, 
          affiliateCode: existing.affiliate_code,
          error: "User is already an approved affiliate" 
        };
      }
      // If pending/rejected, update to approved
      const { error: updateError } = await (supabase as any)
        .from("affiliates")
        .update({
          status: 'approved',
          reviewed_by: promotedBy,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("wallet_address", normalizedWallet);

      if (updateError) throw updateError;
      return { success: true, affiliateCode: existing.affiliate_code };
    }

    // Generate affiliate code
    const code = `CS${normalizedWallet.slice(2, 8).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create new affiliate with approved status
    const { error: insertError } = await (supabase as any)
      .from("affiliates")
      .insert({
        wallet_address: normalizedWallet,
        affiliate_code: code,
        commission_rate: 0.15, // 15%
        total_referrals: 0,
        total_commission: 0,
        status: 'approved',
        reviewed_by: promotedBy,
        reviewed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    return { success: true, affiliateCode: code };
  } catch (error: any) {
    console.error("Failed to promote to affiliate:", error);
    return { success: false, error: error.message };
  }
}
