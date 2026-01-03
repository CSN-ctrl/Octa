import { supabase } from "@/integrations/supabase/client";
import * as supabaseService from "@/lib/supabase-service";

// Price conversion: 1 EUR = 1.955833 xBGL (initial price, not pegged)
export const EUR_TO_XBGL = 1.955833;
export const PLOT_PRICE_EUR = 100;
export const PLOT_PRICE_XBGL = PLOT_PRICE_EUR * EUR_TO_XBGL; // ~195.58 xBGL
// Payment is made in USDC (equivalent to 100 EUR at time of purchase)

export interface ILOPhase {
  phase_name: string;
  phase_status: 'active' | 'closed' | 'upcoming';
  max_participants: number;
  current_participants: number;
  plot_price_eur: number; // 100 EUR equivalent
  plot_price_usdc: number; // Paid in USDC (equivalent to EUR at time of purchase)
  plot_price_xbgl: number; // Displayed in xBGL (~195.58)
  secondary_market_active: boolean;
}

/**
 * Check ILO status and if it's open for purchases
 */
export async function getILOStatus(): Promise<{
  isOpen: boolean;
  currentPhase: ILOPhase | null;
  plotsRemaining: number;
  secondaryMarketActive: boolean;
}> {
  try {
    const { data: genesisPhase } = await (supabase as any)
      .from("ilo_phases")
      .select("*")
      .eq("phase_name", "genesis")
      .single();

    if (!genesisPhase) {
      // If table doesn't exist, return default open status
      return {
        isOpen: true,
        currentPhase: null,
        plotsRemaining: 10000,
        secondaryMarketActive: false,
      };
    }

    const plotsRemaining = Math.max(0, genesisPhase.max_participants - genesisPhase.current_participants);
    const isOpen = genesisPhase.phase_status === 'active' && plotsRemaining > 0;

    return {
      isOpen,
      currentPhase: genesisPhase as ILOPhase,
      plotsRemaining,
      secondaryMarketActive: genesisPhase.secondary_market_active || false,
    };
  } catch (error) {
    console.error("Failed to get ILO status:", error);
    // Return default open status if table doesn't exist
    return {
      isOpen: true,
      currentPhase: null,
      plotsRemaining: 10000,
      secondaryMarketActive: false,
    };
  }
}

/**
 * Register participant in ILO (Genesis Phase)
 */
export async function registerILOParticipant(
  walletAddress: string,
  plotId: number,
  email?: string
): Promise<{ 
  success: boolean; 
  participationNumber?: number; 
  message: string;
  iloClosed?: boolean;
}> {
  try {
    // Check ILO status
    const iloStatus = await getILOStatus();
    
    if (!iloStatus.isOpen) {
      return {
        success: false,
        message: iloStatus.secondaryMarketActive 
          ? "ILO is closed. Secondary market is now active!" 
          : "ILO is currently closed.",
        iloClosed: true,
      };
    }

    // Check if already registered
    const { data: existing } = await (supabase as any)
      .from("ilo_participants")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (existing) {
      // Update with plot purchase
      const { data, error } = await (supabase as any)
        .from("ilo_participants")
        .update({
          plot_id: plotId,
          purchase_date: new Date().toISOString(),
          email: email || existing.email,
          updated_at: new Date().toISOString(),
        })
        .eq("wallet_address", walletAddress.toLowerCase())
        .select()
        .single();

      if (error) throw error;
      
      return {
        success: true,
        participationNumber: data.participation_number,
        message: `Plot purchase registered! You are participant #${data.participation_number}`,
      };
    }

    // Get current participant count
    const { count } = await (supabase as any)
      .from("ilo_participants")
      .select("*", { count: "exact", head: true });

    if (count && count >= 10000) {
      // Close ILO and activate secondary market
      await closeILOAndActivateSecondaryMarket();
      
      return {
        success: false,
        message: "ILO is full! Secondary market is now active.",
        iloClosed: true,
      };
    }

    // Register new participant
    const participationNumber = (count || 0) + 1;
    const { data, error } = await (supabase as any)
      .from("ilo_participants")
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        email: email,
        plot_id: plotId,
        purchase_date: new Date().toISOString(),
        participation_number: participationNumber,
        phase_1_early_access: true, // Genesis Phase participants get early access
      })
      .select()
      .single();

    if (error) throw error;

    // Update phase count
    await (supabase as any)
      .from("ilo_phases")
      .update({
        current_participants: participationNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("phase_name", "genesis")
      .then(() => {
        // Check if ILO is now full
        if (participationNumber >= 10000) {
          closeILOAndActivateSecondaryMarket();
        }
      });

    // Update stats
    await updateGenesisStats();

    return {
      success: true,
      participationNumber: data.participation_number,
      message: `🎉 Welcome to Genesis Phase! You are participant #${participationNumber}/10,000`,
    };
  } catch (error: any) {
    console.error("Failed to register ILO participant:", error);
    return {
      success: false,
      message: error.message || "Failed to register",
    };
  }
}

/**
 * Close ILO and activate secondary market
 */
async function closeILOAndActivateSecondaryMarket(): Promise<void> {
  try {
    // Close Genesis Phase
    await (supabase as any)
      .from("ilo_phases")
      .update({
        phase_status: 'closed',
        closed_at: new Date().toISOString(),
        secondary_market_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("phase_name", "genesis");

    // Update stats
    const { data: statsData } = await supabase
      .from("genesis_stats")
      .select("id")
      .single();

    await supabase
      .from("genesis_stats")
      .upsert({
        id: statsData?.id || "default",
        ilo_closed: true,
        secondary_market_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id",
      });

    // Create Phase 2 (for early access participants)
    const { data: existingPhase2 } = await (supabase as any)
      .from("ilo_phases")
      .select("*")
      .eq("phase_name", "phase_2")
      .single();

    if (!existingPhase2) {
      await (supabase as any)
        .from("ilo_phases")
        .insert({
          phase_name: "phase_2",
          phase_status: "upcoming",
          max_participants: 0, // TBD
          current_participants: 0,
          plot_price_eur: 400, // Higher price for Phase 2
          plot_price_usdc: 400, // Paid in USDC
          plot_price_xbgl: 400 * EUR_TO_XBGL, // Displayed in xBGL
          secondary_market_active: false,
        });
    }
  } catch (error) {
    console.error("Failed to close ILO:", error);
  }
}

/**
 * Check if user has early access to Phase 2
 */
export async function hasEarlyAccess(walletAddress: string): Promise<boolean> {
  try {
    const { data } = await (supabase as any)
      .from("ilo_participants")
      .select("phase_1_early_access")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    return data?.phase_1_early_access || false;
  } catch (error) {
    return false;
  }
}

/**
 * Get participant info
 */
export async function getILOParticipantInfo(walletAddress: string): Promise<{
  participationNumber?: number;
  hasEarlyAccess: boolean;
  plotId?: number;
  purchaseDate?: string;
} | null> {
  try {
    const { data } = await (supabase as any)
      .from("ilo_participants")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (!data) return null;

    return {
      participationNumber: data.participation_number,
      hasEarlyAccess: data.phase_1_early_access,
      plotId: data.plot_id,
      purchaseDate: data.purchase_date,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Initialize Genesis Phase (run once)
 */
export async function initializeGenesisPhase(): Promise<void> {
  try {
    const { data: existing } = await (supabase as any)
      .from("ilo_phases")
      .select("*")
      .eq("phase_name", "genesis")
      .single();

    if (!existing) {
      await (supabase as any)
        .from("ilo_phases")
        .insert({
          phase_name: "genesis",
          phase_status: "active",
          max_participants: 10000,
          current_participants: 0,
          plot_price_eur: PLOT_PRICE_EUR,
          plot_price_usdc: PLOT_PRICE_EUR, // Paid in USDC (equivalent to 100 EUR)
          plot_price_xbgl: PLOT_PRICE_XBGL, // Displayed in xBGL
          started_at: new Date().toISOString(),
          secondary_market_active: false,
        });
    }
  } catch (error) {
    console.error("Failed to initialize Genesis Phase:", error);
  }
}

/**
 * Generate unique verification code for social media
 */
export async function generateVerificationCode(
  walletAddress: string,
  platform: 'twitter' | 'tiktok' | 'instagram',
  actionType: 'comment' | 'share'
): Promise<{ code: string; message: string }> {
  const code = `CS${walletAddress.slice(2, 8).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
  
  try {
    // Store verification code
    await (supabase as any)
      .from("social_media_verifications")
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        platform,
        action_type: actionType,
        verification_code: code,
        verified: false,
      }, {
        onConflict: "wallet_address,platform,action_type",
      });

    return {
      code,
      message: `Include this code in your ${actionType}: ${code}`,
    };
  } catch (error) {
    // If table doesn't exist, still return code
    return {
      code,
      message: `Include this code in your ${actionType}: ${code}`,
    };
  }
}

/**
 * Verify social media comment (manual verification or API integration)
 */
export async function verifySocialMediaAction(
  walletAddress: string,
  platform: 'twitter' | 'tiktok' | 'instagram',
  actionType: 'comment' | 'share',
  verificationUrl: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get verification record
    const { data: verification } = await (supabase as any)
      .from("social_media_verifications")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .eq("platform", platform)
      .eq("action_type", actionType)
      .single();

    if (!verification) {
      return { success: false, message: "Verification code not found" };
    }

    // For comments, check 3-hour interval
    if (actionType === 'comment') {
      const { data: previousComments } = await (supabase as any)
        .from("social_media_verifications")
        .select("comment_timestamp")
        .eq("wallet_address", walletAddress.toLowerCase())
        .eq("platform", platform)
        .eq("action_type", "comment")
        .eq("verified", true)
        .order("comment_timestamp", { ascending: false })
        .limit(1);

      if (previousComments && previousComments.length > 0) {
        const lastComment = new Date(previousComments[0].comment_timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastComment.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 3) {
          return {
            success: false,
            message: `Please wait ${(3 - hoursDiff).toFixed(1)} more hours before your next comment`,
          };
        }
      }
    }

    // Update verification (manual verification - admin will verify)
    const { error } = await (supabase as any)
      .from("social_media_verifications")
      .update({
        verification_url: verificationUrl,
        verified: true,
        verified_at: new Date().toISOString(),
        comment_timestamp: actionType === 'comment' ? new Date().toISOString() : verification.comment_timestamp,
      })
      .eq("wallet_address", walletAddress.toLowerCase())
      .eq("platform", platform)
      .eq("action_type", actionType);

    if (error) throw error;

    // Check eligibility
    await checkEligibility(walletAddress);

    return { success: true, message: "Verification submitted! Pending admin review." };
  } catch (error: any) {
    return { success: false, message: error.message || "Verification failed" };
  }
}

/**
 * Check if participant is eligible for prizes
 */
export async function checkEligibility(walletAddress: string): Promise<void> {
  try {
    // Check plot purchase
    const { data: participant } = await (supabase as any)
      .from("ilo_participants")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (!participant || !participant.plot_purchased) return;

    // Check social media verifications
    const { data: verifications } = await (supabase as any)
      .from("social_media_verifications")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .eq("verified", true);

    // Check requirements
    const comments = verifications?.filter(v => v.action_type === 'comment') || [];
    const shares = verifications?.filter(v => v.action_type === 'share') || [];

    const has3CommentsOnEach = 
      comments.filter(c => c.platform === 'twitter').length >= 3 &&
      comments.filter(c => c.platform === 'tiktok').length >= 3 &&
      comments.filter(c => c.platform === 'instagram').length >= 3;

    const hasSharedAll3 = 
      shares.filter(s => s.platform === 'twitter').length >= 1 &&
      shares.filter(s => s.platform === 'tiktok').length >= 1 &&
      shares.filter(s => s.platform === 'instagram').length >= 1;

    const eligibleForBTC = has3CommentsOnEach && hasSharedAll3;
    const eligibleForStructure = participant.participation_number && participant.participation_number <= 5000;

    // Update participant eligibility
    await (supabase as any)
      .from("ilo_participants")
      .update({
        eligible_for_btc: eligibleForBTC,
        eligible_for_structure: eligibleForStructure,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress.toLowerCase());

    // Update stats
    await updateGenesisStats();
  } catch (error) {
    console.error("Failed to check eligibility:", error);
  }
}

/**
 * Select random BTC winner from eligible participants
 */
export async function selectBTCWinner(): Promise<{ success: boolean; winner?: string; message: string }> {
  try {
    const { data: eligible } = await (supabase as any)
      .from("ilo_participants")
      .select("wallet_address")
      .eq("eligible_for_btc", true);

    if (!eligible || eligible.length === 0) {
      return { success: false, message: "No eligible participants" };
    }

    // Random selection
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const winner = eligible[randomIndex].wallet_address;

    // Record prize
    await (supabase as any)
      .from("genesis_prizes")
      .insert({
        wallet_address: winner,
        prize_type: "btc",
        prize_value: "1 BTC",
        awarded: true,
        awarded_at: new Date().toISOString(),
      });

    // Update stats
    const { data: statsData } = await supabase
      .from("genesis_stats")
      .select("id")
      .single();

    await supabase
      .from("genesis_stats")
      .upsert({
        id: statsData?.id || "default",
        btc_winner_selected: true,
        btc_winner_wallet: winner,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id",
      });

    return { success: true, winner, message: "BTC winner selected!" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to select winner" };
  }
}

/**
 * Distribute income structures to first 5000 participants
 */
export async function distributeIncomeStructures(): Promise<{ success: boolean; distributed: number; message: string }> {
  try {
    const { data: eligible } = await (supabase as any)
      .from("ilo_participants")
      .select("wallet_address, participation_number")
      .eq("eligible_for_structure", true)
      .eq("received_structure", false)
      .lte("participation_number", 5000)
      .order("participation_number", { ascending: true });

    if (!eligible || eligible.length === 0) {
      return { success: false, distributed: 0, message: "No eligible participants" };
    }

    // Distribute structures
    for (const participant of eligible) {
      await (supabase as any)
        .from("genesis_prizes")
        .insert({
          wallet_address: participant.wallet_address,
          prize_type: "income_structure",
          prize_value: `150 EUR equivalent (~${(150 * EUR_TO_XBGL).toFixed(2)} xBGL) Basic Income Structure`,
          awarded: true,
          awarded_at: new Date().toISOString(),
        });

      await (supabase as any)
        .from("ilo_participants")
        .update({
          received_structure: true,
          updated_at: new Date().toISOString(),
        })
        .eq("wallet_address", participant.wallet_address);
    }

    // Update stats
    await updateGenesisStats();

    return {
      success: true,
      distributed: eligible.length,
      message: `Distributed ${eligible.length} income structures`,
    };
  } catch (error: any) {
    return { success: false, distributed: 0, message: error.message || "Distribution failed" };
  }
}

/**
 * Update campaign statistics
 */
async function updateGenesisStats(): Promise<void> {
  try {
    const { count: total } = await (supabase as any)
      .from("ilo_participants")
      .select("*", { count: "exact", head: true });

    const { count: btcEligible } = await (supabase as any)
      .from("ilo_participants")
      .select("*", { count: "exact", head: true })
      .eq("eligible_for_btc", true);

    const { count: structureEligible } = await (supabase as any)
      .from("ilo_participants")
      .select("*", { count: "exact", head: true })
      .eq("eligible_for_structure", true);

    const { count: structuresDistributed } = await (supabase as any)
      .from("genesis_prizes")
      .select("*", { count: "exact", head: true })
      .eq("prize_type", "income_structure")
      .eq("awarded", true);

    const { data: statsData } = await (supabase as any)
      .from("genesis_stats")
      .select("id")
      .single();

    await (supabase as any)
      .from("genesis_stats")
      .upsert({
        id: statsData?.id || "default",
        total_participants: total || 0,
        eligible_for_btc: btcEligible || 0,
        eligible_for_structure: structureEligible || 0,
        structures_distributed: structuresDistributed || 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "id",
      });
  } catch (error) {
    console.error("Failed to update stats:", error);
  }
}

/**
 * Get participant status
 */
export async function getParticipantStatus(walletAddress: string): Promise<any> {
  try {
    const { data: participant } = await (supabase as any)
      .from("ilo_participants")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    const { data: verifications } = await (supabase as any)
      .from("social_media_verifications")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase());

    const { data: prizes } = await (supabase as any)
      .from("genesis_prizes")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase());

    return {
      participant,
      verifications: verifications || [],
      prizes: prizes || [],
      progress: calculateProgress(participant, verifications || []),
    };
  } catch (error) {
    return {
      participant: null,
      verifications: [],
      prizes: [],
      progress: {
        plotPurchased: false,
        comments: { twitter: 0, tiktok: 0, instagram: 0 },
        shares: { twitter: false, tiktok: false, instagram: false },
        eligibleForBTC: false,
        eligibleForStructure: false,
      },
    };
  }
}

function calculateProgress(participant: any, verifications: any[]): {
  plotPurchased: boolean;
  comments: { twitter: number; tiktok: number; instagram: number };
  shares: { twitter: boolean; tiktok: boolean; instagram: boolean };
  eligibleForBTC: boolean;
  eligibleForStructure: boolean;
} {
  const comments = verifications?.filter(v => v.action_type === 'comment' && v.verified) || [];
  const shares = verifications?.filter(v => v.action_type === 'share' && v.verified) || [];

  return {
    plotPurchased: participant?.plot_purchased || false,
    comments: {
      twitter: comments.filter(c => c.platform === 'twitter').length,
      tiktok: comments.filter(c => c.platform === 'tiktok').length,
      instagram: comments.filter(c => c.platform === 'instagram').length,
    },
    shares: {
      twitter: shares.some(s => s.platform === 'twitter'),
      tiktok: shares.some(s => s.platform === 'tiktok'),
      instagram: shares.some(s => s.platform === 'instagram'),
    },
    eligibleForBTC: participant?.eligible_for_btc || false,
    eligibleForStructure: participant?.eligible_for_structure || false,
  };
}

