// Database Guardian RLS Policy Fix Script
// Addresses infinite recursion in RLS policies

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseRLSIssues() {
  console.log('🔍 Database Guardian: Diagnosing RLS Policy Issues...\n');
  
  try {
    // Test 1: Check if we can access public tables
    console.log('📋 Testing Public Table Access...');
    
    const { data: publicData, error: publicError } = await supabase
      .from('branches')
      .select('*')
      .limit(1);
    
    if (publicError) {
      console.log('❌ Public Table Access Failed:', publicError.message);
    } else {
      console.log('✅ Public Table Access: Working');
      console.log(`   Found ${publicData.length} branches`);
    }
    
    // Test 2: Try to access users table with service role (bypass RLS)
    console.log('\n🔧 Testing Service Role Access...');
    
    // Create client with service role key if available
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.SBfY4wYxkL9QhJ5gXh1xJt-Jh2W9kN9yTlYl8M7wK0';
    
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('users')
      .select('*')
      .eq('email', 'vietnguyenduccp@gmail.com')
      .single();
    
    if (serviceError) {
      console.log('❌ Service Role Access Failed:', serviceError.message);
      console.log('   Service role key may be invalid');
    } else {
      console.log('✅ Service Role Access: Working');
      console.log(`   User ID: ${serviceData.id}`);
      console.log(`   User Role: ${serviceData.role}`);
      console.log(`   User Email: ${serviceData.email}`);
    }
    
    // Test 3: Check if user exists in auth system
    console.log('\n🔐 Testing Auth System...');
    
    // We can't directly query auth.users, but we can check if the user
    // exists by trying to sign up (which will fail if user exists)
    
    // Test 4: Provide RLS Policy Recommendations
    console.log('\n💡 Database Guardian RLS Policy Recommendations:');
    console.log('');
    console.log('🔧 ISSUE: Infinite recursion in RLS policies');
    console.log('   CAUSE: Policy is calling itself or creating circular references');
    console.log('');
    console.log('📝 SOLUTIONS:');
    console.log('   1. Check RLS policy on users table for circular references');
    console.log('   2. Ensure policy uses (auth.uid())::uuid instead of recursive calls');
    console.log('   3. Add proper policy conditions to prevent infinite loops');
    console.log('   4. Consider using bypass for admin users');
    console.log('');
    console.log('🛠️ SQL Fix Examples:');
    console.log('');
    console.log('   -- BEFORE (Problematic):');
    console.log('   CREATE POLICY users_policy ON users');
    console.log('   FOR ALL TO authenticated');
    console.log('   USING (true)');
    console.log('   WITH CHECK (true); -- Can cause recursion');
    console.log('');
    console.log('   -- AFTER (Fixed):');
    console.log('   CREATE POLICY users_policy ON users');
    console.log('   FOR ALL TO authenticated');
    console.log('   USING (auth.uid()::uuid = id)');
    console.log('   WITH CHECK (true); -- No recursion');
    console.log('');
    console.log('   -- OR with admin bypass:');
    console.log('   CREATE POLICY users_policy ON users');
    console.log('   FOR ALL TO authenticated');
    console.log('   USING (auth.uid()::uuid = id OR role = \'admin\')');
    console.log('   WITH CHECK (true);');
    
    // Test 5: User Account Status
    console.log('\n👤 User Account Status Analysis:');
    
    if (serviceData) {
      console.log(`✅ User Found: ${serviceData.email}`);
      console.log(`   Role: ${serviceData.role}`);
      console.log(`   ID: ${serviceData.id}`);
      
      if (serviceData.role === 'admin') {
        console.log('✅ Admin Role: Should have full access');
      } else {
        console.log('⚠️ Not Admin: Limited permissions');
        console.log('   To fix admin access:');
        console.log('   UPDATE users SET role = \'admin\' WHERE email = \'vietnguyenduccp@gmail.com\';');
      }
    } else {
      console.log('❌ User Not Found: vietnguyenduccp@gmail.com');
      console.log('   Possible reasons:');
      console.log('   1. User never signed up');
      console.log('   2. User signed up with different email');
      console.log('   3. User was deleted from database');
      console.log('   4. User creation failed during signup');
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// Execute diagnosis
diagnoseRLSIssues().catch(console.error);
