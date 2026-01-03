/**
 * Script to create test accounts using Supabase Admin API
 * 
 * IMPORTANT: This requires your SERVICE_ROLE key (not the anon key)
 * Get it from: Supabase Dashboard > Settings > API > service_role key
 * 
 * Run: npx tsx create-accounts-admin.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file manually
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

// Get Supabase URL from env or use default
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://agqkiwarwxrcemhspxxv.supabase.co';

// Get service_role key from environment
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY not found');
  console.log('\n📝 Make sure your .env file contains:');
  console.log('   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_key_here\n');
  process.exit(1);
}

console.log('✅ Using publishable key as service_role key');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SERVICE_ROLE_KEY.substring(0, 20)}...\n`);

// Create admin client with service_role key
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAccounts() {
  console.log('🔐 Creating test accounts with Admin API...\n');

  // Admin Account
  console.log('Creating ADMIN account...');
  const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'admin123456',
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      role: 'admin',
      wallet_address: '0x0000000000000000000000000000000000000000'
    }
  });

  if (adminError) {
    console.error('❌ Admin account error:', adminError.message);
  } else {
    console.log('✅ Admin account created!');
    console.log(`   Email: admin@test.com`);
    console.log(`   Password: admin123456`);
    console.log(`   User ID: ${adminData.user.id}\n`);
  }

  // User Account
  console.log('Creating USER account...');
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: 'user@test.com',
    password: 'user123456',
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      wallet_address: '0x1234567890123456789012345678901234567890'
    }
  });

  if (userError) {
    console.error('❌ User account error:', userError.message);
  } else {
    console.log('✅ User account created!');
    console.log(`   Email: user@test.com`);
    console.log(`   Password: user123456`);
    console.log(`   User ID: ${userData.user.id}\n`);
  }

  // Summary
  console.log('\n📋 ACCOUNT CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 ADMIN ACCOUNT:');
  console.log('   Email:    admin@test.com');
  console.log('   Password: admin123456');
  console.log('   Access:   /admin-dashboard');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 USER ACCOUNT:');
  console.log('   Email:    user@test.com');
  console.log('   Password: user123456');
  console.log('   Access:   /dashboard');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createAccounts().catch(console.error);

