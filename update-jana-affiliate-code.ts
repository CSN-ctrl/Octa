/**
 * Script to update Jana's affiliate code in the database
 * 
 * IMPORTANT: This requires your SERVICE_ROLE key (not the anon key)
 * Get it from: Supabase Dashboard > Settings > API > service_role key
 * 
 * Run: npx tsx update-jana-affiliate-code.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (error) {
  console.warn('⚠️  Could not read .env file, using environment variables only');
}

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://agqkiwarwxrcemhspxxv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  console.error("Please set it in your .env file or pass it as an environment variable");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateJanaAffiliateCode() {
  const janaEmail = 'jana.barzilova@abv.bg';
  const newAffiliateCode = 'CSU.JB777';

  try {
    console.log(`Updating affiliate code for ${janaEmail} to ${newAffiliateCode}...`);

    // First, check if affiliate record exists
    const { data: existing, error: fetchError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('wallet_address', janaEmail.toLowerCase())
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('affiliates')
        .update({
          affiliate_code: newAffiliateCode,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', janaEmail.toLowerCase())
        .select();

      if (error) throw error;

      console.log('✅ Successfully updated affiliate code!');
      console.log('Updated record:', data);
    } else {
      // Create new record if it doesn't exist
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          wallet_address: janaEmail.toLowerCase(),
          affiliate_code: newAffiliateCode,
          commission_rate: 0.15,
          total_referrals: 0,
          total_commission: 0,
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      console.log('✅ Successfully created affiliate record!');
      console.log('Created record:', data);
    }
  } catch (error: any) {
    console.error('❌ Error updating affiliate code:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the update
updateJanaAffiliateCode()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
