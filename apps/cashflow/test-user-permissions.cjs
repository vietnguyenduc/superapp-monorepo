// Database Guardian Investigation Script
// Investigates user permissions and admin access issues

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function investigateUserPermissions() {
  console.log('🔍 Database Guardian: Investigating User Permissions...\n');
  
  try {
    // Test 1: Check if we can access the users table
    console.log('📋 Testing Users Table Access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'vietnguyenduccp@gmail.com')
      .single();
    
    if (usersError) {
      console.log('❌ Users Table Access Failed:', usersError.message);
      console.log('   This suggests either:');
      console.log('   - User does not exist in database');
      console.log('   - RLS policies blocking access');
      console.log('   - Table does not exist');
    } else {
      console.log('✅ User Found:');
      console.log(`   ID: ${users.id}`);
      console.log(`   Email: ${users.email}`);
      console.log(`   Role: ${users.role}`);
      console.log(`   Full Name: ${users.full_name}`);
      console.log(`   Created: ${users.created_at}`);
      console.log(`   Staff Permissions: ${JSON.stringify(users.staff_permissions)}`);
    }
    
    // Test 2: Check user role and permissions
    console.log('\n👤 Testing User Role and Permissions...');
    
    if (users) {
      console.log(`   User Role: ${users.role}`);
      
      if (users.role === 'admin') {
        console.log('✅ Admin Role: Should have all permissions');
      } else if (users.role === 'branch_manager') {
        console.log('⚠️ Branch Manager Role: Limited permissions');
      } else if (users.role === 'staff') {
        console.log('⚠️ Staff Role: Limited permissions');
        console.log(`   Staff Permissions: ${JSON.stringify(users.staff_permissions)}`);
      } else {
        console.log('❌ Unknown Role: May have no permissions');
      }
    }
    
    // Test 3: Check RLS policies
    console.log('\n🔒 Testing RLS (Row Level Security) Policies...');
    
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    if (allUsersError) {
      console.log('❌ RLS Policy Check Failed:', allUsersError.message);
      console.log('   This suggests RLS policies are blocking access');
    } else {
      console.log(`✅ RLS Policies: Can access ${allUsers.length} users`);
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }
    
    // Test 4: Check if user exists in auth system
    console.log('\n🔐 Testing Authentication System...');
    
    // We can't directly test auth without actual login, but we can check
    // if the user ID format looks correct
    if (users) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(users.id)) {
        console.log('✅ User ID format: Valid UUID');
      } else {
        console.log('❌ User ID format: Invalid UUID');
      }
    }
    
    // Test 5: Recommendations
    console.log('\n💡 Database Guardian Recommendations:');
    
    if (!users) {
      console.log('🔧 ISSUE: User not found in database');
      console.log('   SOLUTIONS:');
      console.log('   1. Check if user is properly signed up');
      console.log('   2. Verify email is correct: vietnguyenduccp@gmail.com');
      console.log('   3. Check if user completed email confirmation');
      console.log('   4. Verify user was created in users table');
    } else if (users.role !== 'admin') {
      console.log('🔧 ISSUE: User is not admin');
      console.log('   SOLUTIONS:');
      console.log('   1. Update user role to admin in database');
      console.log('   2. Check if admin role assignment is automatic');
      console.log('   3. Verify admin role in auth metadata');
    } else if (usersError) {
      console.log('🔧 ISSUE: Database access problems');
      console.log('   SOLUTIONS:');
      console.log('   1. Check RLS policies on users table');
      console.log('   2. Verify service role permissions');
      console.log('   3. Check if user is authenticated');
    } else {
      console.log('✅ User appears to have correct admin setup');
      console.log('   If still experiencing issues:');
      console.log('   1. Check browser authentication state');
      console.log('   2. Clear browser cache and cookies');
      console.log('   3. Verify session is active');
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
    console.log('   This suggests network or configuration issues');
  }
}

// Execute investigation
investigateUserPermissions().catch(console.error);
