import { supabase } from "@/integrations/supabase/client";
import {
  calculatePlotCoordinates,
  getPlotZoneType,
} from "@/lib/plot-coordinates";

/**
 * Seed plots in the database
 * This function creates plots dynamically (no hard limit)
 * Phase 1 is limited to 10,000 participants, not plots
 */
export async function seedPlots(
  maxPlotId: number = 10000, // Default to 10k for initial seeding, but can be higher
  batchSize: number = 100
): Promise<{ success: boolean; message: string; created: number }> {
  try {
    // Check how many plots already exist
    const { count: existingCount } = await supabase
      .from("plots")
      .select("*", { count: "exact", head: true });

    if (existingCount && existingCount >= maxPlotId) {
      return {
        success: true,
        message: `All ${maxPlotId} plots already exist in the database`,
        created: 0,
      };
    }

    const plotsToCreate: any[] = [];
    
    // Generate plots up to maxPlotId
    for (let plotId = 1; plotId <= maxPlotId; plotId++) {
      // Check if plot already exists
      const { data: existing } = await supabase
        .from("plots")
        .select("id")
        .eq("id", plotId)
        .single();

      if (existing) continue; // Skip if already exists

      const coords = calculatePlotCoordinates(plotId);
      const zoneType = getPlotZoneType(plotId);

      plotsToCreate.push({
        id: plotId,
        coord_x: coords.x,
        coord_y: coords.y,
        zone_type: zoneType,
        owner_wallet: null, // Available for purchase
        planet_id: null, // Can be set later
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (plotsToCreate.length === 0) {
      return {
        success: true,
        message: "All plots already exist",
        created: 0,
      };
    }

    // Insert plots in batches
    let created = 0;
    for (let i = 0; i < plotsToCreate.length; i += batchSize) {
      const batch = plotsToCreate.slice(i, i + batchSize);
      const { error } = await supabase
        .from("plots")
        .insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        // Continue with next batch even if one fails
      } else {
        created += batch.length;
      }
    }

    return {
      success: true,
      message: `Successfully created ${created} plots`,
      created,
    };
  } catch (error: any) {
    console.error("Error seeding plots:", error);
    return {
      success: false,
      message: error.message || "Failed to seed plots",
      created: 0,
    };
  }
}

/**
 * Seed plots from admin dashboard or API
 * This can be called from the frontend
 */
export async function seedPlotsFromAdmin(): Promise<void> {
  const result = await seedPlots(100);
  if (result.success) {
    console.log(result.message);
  } else {
    throw new Error(result.message);
  }
}

