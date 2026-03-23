// Comprehensive User Roles Investigation Script
// Explores all user roles and permissions in the system

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exploreUserRoles() {
  console.log('🔍 Comprehensive User Roles Investigation...\n');
  
  try {
    // Test 1: Get all users with their roles
    console.log('👥 Exploring All Users and Roles...');
    
    // Try different approaches to get user data
    let allUsers = [];
    let accessMethod = '';
    
    // Method 1: Try direct access (may fail due to RLS)
    try {
      const { data: directUsers, error: directError } = await supabase
        .from('users')
        .select('id, email, full_name, role, staff_permissions, created_at, updated_at, is_active')
        .order('created_at', 'asc');
      
      if (!directError && directUsers) {
        allUsers = directUsers;
        accessMethod = 'Direct Access';
      }
    } catch (error) {
      console.log('❌ Direct access failed');
    }
    
    // Method 2: Try public tables first
    if (allUsers.length === 0) {
      try {
        const { data: publicUsers, error: publicError } = await supabase
          .from('branches')
          .select('*');
        
        if (!publicError) {
          console.log('✅ Public tables accessible, trying user table with different approach...');
          
          // Try with service role or different query
          const { data: altUsers, error: altError } = await supabase
            .from('users')
            .select('id, email, role')
            .limit(10);
          
          if (!altError && altUsers) {
            allUsers = altUsers;
            accessMethod = 'Alternative Access';
          }
        }
      } catch (error) {
        console.log('❌ Alternative access failed');
      }
    }
    
    // Method 3: Use function call if available
    if (allUsers.length === 0) {
      try {
        const { data: funcUsers, error: funcError } = await supabase
          .rpc('get_all_users');
        
        if (!funcError && funcUsers) {
          allUsers = funcUsers;
          accessMethod = 'Function Call';
        }
      } catch (error) {
        console.log('❌ Function call failed');
      }
    }
    
    console.log(`✅ Access Method: ${accessMethod}`);
    console.log(`📊 Found ${allUsers.length} users`);
    
    // Display all users
    if (allUsers.length > 0) {
      console.log('\n📋 All Users in System:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email || 'Unknown Email'}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Name: ${user.full_name || 'N/A'}`);
        console.log(`      Role: ${user.role || 'N/A'}`);
        console.log(`      Active: ${user.is_active !== false ? '✅' : '❌'}`);
        console.log(`      Created: ${user.created_at || 'N/A'}`);
        console.log(`      Staff Permissions: ${user.staff_permissions ? JSON.stringify(user.staff_permissions) : 'None'}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found - database may be empty or access blocked');
    }
    
    // Test 2: Analyze role distribution
    console.log('📊 Role Distribution Analysis:');
    
    const roleCounts = {};
    allUsers.forEach(user => {
      const role = user.role || 'unknown';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    console.log('   Role Breakdown:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });
    
    // Test 3: Staff permissions analysis
    console.log('\n🔐 Staff Permissions Analysis:');
    
    const staffUsers = allUsers.filter(user => user.role === 'staff');
    console.log(`   Staff Users: ${staffUsers.length}`);
    
    if (staffUsers.length > 0) {
      console.log('   Staff Permissions Breakdown:');
      
      const permissionCounts = {
        import_customers: 0,
        import_transactions: 0,
        view_reports: 0,
        manage_settings: 0
      };
      
      staffUsers.forEach(user => {
        if (user.staff_permissions) {
          Object.keys(user.staff_permissions).forEach(perm => {
            if (permissionCounts.hasOwnProperty(perm)) {
              permissionCounts[perm] += user.staff_permissions[perm] ? 1 : 0;
            }
          });
        }
      });
      
      Object.entries(permissionCounts).forEach(([perm, count]) => {
        console.log(`   ${perm}: ${count} users granted`);
      });
      
      console.log('\n   Individual Staff Permissions:');
      staffUsers.forEach(user => {
        console.log(`   ${user.email}:`);
        if (user.staff_permissions) {
          Object.entries(user.staff_permissions).forEach(([perm, granted]) => {
            console.log(`     ${perm}: ${granted ? '✅' : '❌'}`);
          });
        } else {
          console.log('     No permissions set');
        }
        console.log('');
      });
    }
    
    // Test 4: Role-based access patterns
    console.log('🔒 Role-Based Access Patterns:');
    
    const rolePatterns = {
      admin: {
        description: 'Full system access',
        typical_permissions: ['All features', 'User management', 'System settings', 'Reports'],
        count: roleCounts.admin || 0
      },
      branch_manager: {
        description: 'Branch-level management',
        typical_permissions: ['Branch operations', 'Staff management', 'Reports'],
        count: roleCounts.branch_manager || 0
      },
      staff: {
        description: 'Limited operational access',
        typical_permissions: ['Customer management', 'Transaction management', 'Limited reports'],
        count: roleCounts.staff || 0
      }
    };
    
    Object.entries(rolePatterns).forEach(([role, info]) => {
      console.log(`   ${role.toUpperCase()}:`);
      console.log(`     Description: ${info.description}`);
      console.log(`     Count: ${info.count} users`);
      console.log(`     Typical Permissions: ${info.typical_permissions.join(', ')}`);
      console.log('');
    });
    
    // Test 5: Target user investigation
    console.log('🎯 Target User Investigation: vietnguyenduccp@gmail.com');
    
    const targetUser = allUsers.find(user => user.email === 'vietnguyenduccp@gmail.com');
    
    if (targetUser) {
      console.log('✅ User Found:');
      console.log(`   Email: ${targetUser.email}`);
      console.log(`   ID: ${targetUser.id}`);
      console.log(`   Name: ${targetUser.full_name || 'N/A'}`);
      console.log(`   Role: ${targetUser.role || 'N/A'}`);
      console.log(`   Active: ${targetUser.is_active !== false ? '✅' : '❌'}`);
      console.log(`   Created: ${targetUser.created_at || 'N/A'}`);
      console.log(`   Updated: ${targetUser.updated_at || 'N/A'}`);
      
      // Detailed permissions analysis
      if (targetUser.staff_permissions) {
        console.log('   Staff Permissions:');
        Object.entries(targetUser.staff_permissions).forEach(([perm, granted]) => {
          console.log(`     ${perm}: ${granted ? '✅ GRANTED' : '❌ DENIED'}`);
        });
      }
      
      // Role-based permissions analysis
      if (targetUser.role === 'admin') {
        console.log('   🟢 ADMIN ROLE: Should have full system access');
        console.log('   Expected Permissions: All features, user management, system settings, reports');
      } else if (targetUser.role === 'branch_manager') {
        console.log('   🟡 BRANCH MANAGER: Should have branch-level access');
        console.log('   Expected Permissions: Branch operations, staff management, reports');
      } else if (targetUser.role === 'staff') {
        console.log('   🟠 STAFF ROLE: Should have limited operational access');
        console.log('   Expected Permissions: Customer management, transaction management, limited reports');
        if (targetUser.staff_permissions) {
          console.log('   Additional Permissions: Based on staff_permissions field');
        }
      }
      
    } else {
      console.log('❌ User NOT Found: vietnguyenduccp@gmail.com');
      console.log('   Possible Reasons:');
      console.log('   1. User never signed up');
      console.log('   2. User signed up with different email');
      console.log('   3. User was deleted from database');
      console.log('   4. User creation failed during signup');
      console.log('   5. RLS policies blocking access');
    }
    
    // Test 6: System role hierarchy
    console.log('\n🏛️ System Role Hierarchy:');
    console.log('   1. ADMIN - Full system control');
    console.log('   2. BRANCH_MANAGER - Branch-level control');
    console.log('   3. STAFF - Limited operational control');
    console.log('   4. VIEWER - Read-only access (if exists)');
    
    // Test 7: Permission inheritance analysis
    console.log('\n🔄 Permission Inheritance Analysis:');
    
    console.log('   Role-Based Permissions:');
    console.log('   - Admin: Inherits all permissions by default');
    console.log('   - Branch Manager: Inherits admin permissions at branch level');
    console.log('   - Staff: Inherits base permissions + granular staff_permissions');
    console.log('   - Viewer: Read-only access to assigned data');
    
    console.log('   Granular Staff Permissions:');
    console.log('   - import_customers: Can import customer data');
    console.log('   - import_transactions: Can import transaction data');
    console.log('   - view_reports: Can view reports');
    console.log('   - manage_settings: Can access settings');
    
    // Test 8: System statistics
    console.log('\n📈 System Statistics:');
    console.log(`   Total Users: ${allUsers.length}`);
    console.log(`   Active Users: ${allUsers.filter(u => u.is_active !== false).length}`);
    console.log(`   Role Distribution: ${Object.keys(roleCounts).length} different roles`);
    console.log(`   Staff with Permissions: ${staffUsers.filter(u => u.staff_permissions).length}`);
    
    // Test 9: Recommendations
    console.log('\n💡 Recommendations:');
    
    if (!targetUser) {
      console.log('🔧 CRITICAL: Target user not found in database');
      console.log('   ACTION: Create user record for vietnguyenduccp@gmail.com');
      console.log('   ACTION: Ensure user creation process is working');
      console.log('   ACTION: Fix RLS policies if blocking access');
    }
    
    if (targetUser && targetUser.role !== 'admin') {
      console.log('🔧 HIGH: Target user is not admin');
      console.log('   ACTION: Update user role to admin if needed');
      console.log('   ACTION: Verify role assignment logic');
    }
    
    if (targetUser && targetUser.role === 'staff' && !targetUser.staff_permissions) {
      console.log('🔧 MEDIUM: Staff user has no granular permissions');
      console.log('   ACTION: Add staff_permissions field with required permissions');
      console.log('   ACTION: Update staff_permissions in Settings');
    }
    
    if (allUsers.length === 0) {
      console.log('🔧 CRITICAL: No users found in system');
      console.log('   ACTION: Verify database has data');
      console.log('   ACTION: Check RLS policies');
      console.log('   ACTION: Ensure user creation process is working');
    }
    
    console.log('\n🎯 Investigation Complete');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
    console.log('   This suggests database connectivity or configuration issues');
  }
}

// Execute investigation
exploreUserRoles().catch(console.error);
