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

try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
  envFile.split('\n').forEach((line) => {
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
} catch {
  console.warn('⚠️  Could not read .env; using defaults + existing env');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestAccounts() {
  console.log('Creating test accounts...\n');

  // Admin account - using valid email format that Supabase accepts
  const adminEmail = 'admin@test.local';
  const adminPassword = 'admin123456';
  
  console.log(`Creating admin account: ${adminEmail}`);
  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      data: {
        role: 'admin',
        wallet_address: '0x0000000000000000000000000000000000000000'
      }
    }
  });

  if (adminError) {
    console.error('Admin account error:', adminError.message);
    // Try alternative email format
    const altAdminEmail = 'admin.test@example.com';
    console.log(`\nTrying alternative: ${altAdminEmail}`);
    const { data: altAdminData, error: altAdminError } = await supabase.auth.signUp({
      email: altAdminEmail,
      password: adminPassword,
      options: {
        data: {
          role: 'admin',
          wallet_address: '0x0000000000000000000000000000000000000000'
        }
      }
    });
    if (!altAdminError && altAdminData.user) {
      console.log('✅ Admin account created successfully!');
      console.log(`   Email: ${altAdminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   User ID: ${altAdminData.user.id}\n`);
    } else {
      console.error('Alternative admin account error:', altAdminError?.message);
    }
  } else {
    console.log('✅ Admin account created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   User ID: ${adminData.user?.id}\n`);
  }

  // Regular user account
  const userEmail = 'user@test.local';
  const userPassword = 'user123456';
  
  console.log(`Creating user account: ${userEmail}`);
  const { data: userData, error: userError } = await supabase.auth.signUp({
    email: userEmail,
    password: userPassword,
    options: {
      data: {
        wallet_address: '0x1234567890123456789012345678901234567890'
      }
    }
  });

  if (userError) {
    console.error('User account error:', userError.message);
    // Try alternative email format
    const altUserEmail = 'user.test@example.com';
    console.log(`\nTrying alternative: ${altUserEmail}`);
    const { data: altUserData, error: altUserError } = await supabase.auth.signUp({
      email: altUserEmail,
      password: userPassword,
      options: {
        data: {
          wallet_address: '0x1234567890123456789012345678901234567890'
        }
      }
    });
    if (!altUserError && altUserData.user) {
      console.log('✅ User account created successfully!');
      console.log(`   Email: ${altUserEmail}`);
      console.log(`   Password: ${userPassword}`);
      console.log(`   User ID: ${altUserData.user.id}\n`);
    } else {
      console.error('Alternative user account error:', altUserError?.message);
    }
  } else {
    console.log('✅ User account created successfully!');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${userPassword}`);
    console.log(`   User ID: ${userData.user?.id}\n`);
  }

  console.log('\n📋 Account Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ADMIN ACCOUNT:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('   Access: Admin Dashboard (/admin-dashboard)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('USER ACCOUNT:');
  console.log(`   Email: ${userEmail}`);
  console.log(`   Password: ${userPassword}`);
  console.log('   Access: User Dashboard (/dashboard)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createTestAccounts().catch(console.error);

