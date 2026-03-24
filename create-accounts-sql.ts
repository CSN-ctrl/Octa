/**
 * Alternative: Create accounts using regular signup API (with publishable key)
 * This bypasses the Admin API requirement
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from './src/config/supabase-project-defaults';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
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
  console.warn('⚠️  Could not read .env file');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, anonKey);

async function createAccounts() {
  console.log('🔐 Creating test accounts using signup API...\n');
  console.log('⚠️  Note: This uses regular signup, so email validation may still apply\n');

  // Admin Account
  console.log('Creating ADMIN account...');
  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: 'admin@test.com',
    password: 'admin123456',
    options: {
      data: {
        role: 'admin',
        wallet_address: '0x0000000000000000000000000000000000000000'
      },
      emailRedirectTo: undefined
    }
  });

  if (adminError) {
    console.error('❌ Admin account error:', adminError.message);
    if (adminError.message.includes('invalid')) {
      console.log('💡 Try using a real email domain like admin@gmail.com');
    }
  } else {
    console.log('✅ Admin account created!');
    console.log(`   Email: admin@test.com`);
    console.log(`   Password: admin123456`);
    if (adminData.user) {
      console.log(`   User ID: ${adminData.user.id}`);
      // Try to confirm email immediately if possible
      if (!adminData.user.email_confirmed_at) {
        console.log('   ⚠️  Email confirmation may be required');
      }
    }
    console.log('');
  }

  // User Account
  console.log('Creating USER account...');
  const { data: userData, error: userError } = await supabase.auth.signUp({
    email: 'user@test.com',
    password: 'user123456',
    options: {
      data: {
        wallet_address: '0x1234567890123456789012345678901234567890'
      },
      emailRedirectTo: undefined
    }
  });

  if (userError) {
    console.error('❌ User account error:', userError.message);
    if (userError.message.includes('invalid')) {
      console.log('💡 Try using a real email domain like user@gmail.com');
    }
  } else {
    console.log('✅ User account created!');
    console.log(`   Email: user@test.com`);
    console.log(`   Password: user123456`);
    if (userData.user) {
      console.log(`   User ID: ${userData.user.id}`);
      if (!userData.user.email_confirmed_at) {
        console.log('   ⚠️  Email confirmation may be required');
      }
    }
    console.log('');
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

