import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://agqkiwarwxrcemhspxxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncWtpd2Fyd3hyY2VtaHNweHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTE5NDEsImV4cCI6MjA4MjM4Nzk0MX0.kaiilK_5cdDPYgFxZRKXAsmepjTpSdAw3ZdY3IW6HxM';

// Create Supabase client
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

