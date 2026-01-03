import { supabase } from "@/integrations/supabase/client";

// Helper function to calculate coordinates based on plot ID
// Plot 1 is at center (0,0), plots spiral outward in octagonal pattern
function calculateCoordinates(plotId: number): { x: number; y: number } {
  if (plotId === 1) return { x: 0, y: 0 };
  
  // Calculate distance from center (ring number)
  // Each ring has 8 * ring plots (except center)
  let ring = 1;
  let totalPlots = 1; // Center plot
  
  while (totalPlots < plotId) {
    totalPlots += ring * 8;
    if (totalPlots >= plotId) break;
    ring++;
  }
  
  // Position within current ring (0 to ring*8-1)
  const positionInRing = plotId - (totalPlots - ring * 8) - 1;
  const side = Math.floor(positionInRing / ring);
  const posOnSide = positionInRing % ring;
  
  // Calculate coordinates based on octagonal pattern
  let x = 0, y = 0;
  const baseX = ring;
  const baseY = ring;
  
  switch (side) {
    case 0: // Top
      x = -baseX + posOnSide;
      y = -baseY;
      break;
    case 1: // Top-right
      x = baseX;
      y = -baseY + posOnSide;
      break;
    case 2: // Right
      x = baseX - posOnSide;
      y = baseY;
      break;
    case 3: // Bottom-right
      x = -baseX;
      y = baseY - posOnSide;
      break;
    case 4: // Bottom
      x = -baseX + posOnSide;
      y = baseY;
      break;
    case 5: // Bottom-left
      x = -baseX;
      y = baseY - posOnSide;
      break;
    case 6: // Left
      x = -baseX + posOnSide;
      y = -baseY;
      break;
    case 7: // Top-left
      x = -baseX;
      y = -baseY + posOnSide;
      break;
  }
  
  return { x, y };
}

// Helper function to determine zone type based on distance from center
function getZoneType(plotId: number): string {
  const distance = plotId;
  
  if (distance <= 100) return "Central District";
  if (distance <= 1000) return "Inner Ring - Commercial";
  if (distance <= 3000) return "Residential Zone";
  if (distance <= 6000) return "Mixed Use";
  if (distance <= 9000) return "Industrial Zone";
  return "Outer Frontier";
}

/**
 * Seed 10,000 plots in the database
 * This function creates all plots from ID 1 to 10000
 */
export async function seedPlots(batchSize: number = 100): Promise<{ success: boolean; message: string; created: number }> {
  try {
    // Check how many plots already exist
    const { count: existingCount } = await supabase
      .from("plots")
      .select("*", { count: "exact", head: true });

    if (existingCount && existingCount >= 10000) {
      return {
        success: true,
        message: "All 10,000 plots already exist in the database",
        created: 0,
      };
    }

    const plotsToCreate: any[] = [];
    
    // Generate all 10,000 plots
    for (let plotId = 1; plotId <= 10000; plotId++) {
      // Check if plot already exists
      const { data: existing } = await supabase
        .from("plots")
        .select("id")
        .eq("id", plotId)
        .single();

      if (existing) continue; // Skip if already exists

      const coords = calculateCoordinates(plotId);
      const zoneType = getZoneType(plotId);

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

