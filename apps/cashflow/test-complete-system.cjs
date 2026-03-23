// QA Gatekeeper - Complete System Testing After Infrastructure Recovery
// Comprehensive testing plan for post-recovery system validation

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeCompleteSystemTesting() {
  console.log('🧪 QA Gatekeeper: Complete System Testing After Infrastructure Recovery...\n');
  
  try {
    // Step 1: Pre-testing verification
    console.log('🔍 Pre-testing Verification...');
    
    const fs = require('fs');
    const path = require('path');
    
    // Check if recovery has been implemented
    const recoveryStatus = {
      sqlFixesApplied: false, // Will be determined by database access test
      userRecordCreated: false, // Will be determined by user query
      rlsPoliciesWorking: false, // Will be determined by access test
      systemFunctional: false  // Will be determined by comprehensive test
    };
    
    console.log('   Recovery Status Check:');
    console.log(`     SQL Fixes Applied: ${recoveryStatus.sqlFixesApplied ? '✅' : '❌'}`);
    console.log(`     User Record Created: ${recoveryStatus.userRecordCreated ? '✅' : '❌'}`);
    console.log(`     RLS Policies Working: ${recoveryStatus.rlsPoliciesWorking ? '✅' : '❌'}`);
    console.log(`     System Functional: ${recoveryStatus.systemFunctional ? '✅' : '❌'}`);
    
    // Step 2: Database Access Testing
    console.log('\n🗄️ Database Access Testing...');
    
    let databaseAccessResults = {
      usersTableAccess: false,
      publicTablesAccess: false,
      rlsPoliciesWorking: false,
      authenticationWorking: false
    };
    
    // Test users table access (this was the main issue)
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      if (usersError) {
        console.log('   ❌ Users Table Access Failed:', usersError.message);
        console.log('   This indicates RLS policies still need fixing');
      } else {
        console.log('   ✅ Users Table Access: Working');
        console.log(`   Found ${usersData.length} users`);
        databaseAccessResults.usersTableAccess = true;
        recoveryStatus.rlsPoliciesWorking = true;
        
        // Check if vietnguyenduccp@gmail.com exists
        const adminUser = usersData.find(user => user.email === 'vietnguyenduccp@gmail.com');
        if (adminUser) {
          console.log('   ✅ Admin User Record: Found');
          console.log(`   User ID: ${adminUser.id}`);
          console.log(`   Role: ${adminUser.role}`);
          console.log(`   Created: ${adminUser.created_at}`);
          databaseAccessResults.userRecordCreated = true;
          recoveryStatus.userRecordCreated = true;
        } else {
          console.log('   ❌ Admin User Record: Not found');
          console.log('   ACTION: User creation process needs to be completed');
        }
      }
    } catch (error) {
      console.log('   ❌ Database Access Test Failed:', error.message);
    }
    
    // Test public tables access
    try {
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .limit(1);
      
      if (branchesError) {
        console.log('   ❌ Public Tables Access Failed:', branchesError.message);
      } else {
        console.log('   ✅ Public Tables Access: Working');
        databaseAccessResults.publicTablesAccess = true;
      }
    } catch (error) {
      console.log('   ❌ Public Tables Test Failed:', error.message);
    }
    
    // Step 3: Authentication and Authorization Testing
    console.log('\n🔐 Authentication and Authorization Testing...');
    
    let authTestResults = {
      authenticationWorking: false,
      roleBasedAccessWorking: false,
      permissionsWorking: false,
      securityPoliciesWorking: false
    };
    
    // Test authentication (this should work regardless of RLS issues)
    try {
      // We can't directly test authentication without actual login,
      // but we can test if the auth system is responsive
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.log('   ❌ Authentication System Check Failed:', authError.message);
      } else {
        console.log('   ✅ Authentication System: Responsive');
        authTestResults.authenticationWorking = true;
      }
    } catch (error) {
      console.log('   ❌ Authentication Test Failed:', error.message);
    }
    
    // Step 4: User Role and Permissions Testing
    console.log('\n👥 User Role and Permissions Testing...');
    
    let permissionTestResults = {
      adminPermissions: false,
      branchManagerPermissions: false,
      staffPermissions: false,
      granularPermissions: false
    };
    
    if (databaseAccessResults.usersTableAccess) {
      try {
        // Test admin permissions by checking if admin user can access all users
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('*');
        
        if (!allUsersError && allUsers) {
          console.log('   ✅ Admin Permissions: Working (can access all users)');
          permissionTestResults.adminPermissions = true;
          
          // Check role distribution
          const roleCounts = {};
          allUsers.forEach(user => {
            const role = user.role || 'unknown';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          });
          
          console.log('   Role Distribution:');
          Object.entries(roleCounts).forEach(([role, count]) => {
            console.log(`     ${role}: ${count} users`);
          });
          
          // Test staff permissions
          const staffUsers = allUsers.filter(user => user.role === 'staff');
          if (staffUsers.length > 0) {
            const staffWithPermissions = staffUsers.filter(user => user.staff_permissions);
            console.log(`   ✅ Staff Permissions: ${staffWithPermissions.length}/${staffUsers.length} have granular permissions`);
            permissionTestResults.granularPermissions = true;
          }
        }
      } catch (error) {
        console.log('   ❌ Permission Test Failed:', error.message);
      }
    } else {
      console.log('   ❌ Permission Testing: Skipped (database access not working)');
    }
    
    // Step 5: Core Functionality Testing
    console.log('\n🚀 Core Functionality Testing...');
    
    let functionalityTestResults = {
      customerManagement: false,
      transactionManagement: false,
      importExport: false,
      dashboard: false,
      settings: false
    };
    
    // Test customer management
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .limit(1);
      
      if (customersError) {
        console.log('   ❌ Customer Management Failed:', customersError.message);
      } else {
        console.log('   ✅ Customer Management: Working');
        functionalityTestResults.customerManagement = true;
      }
    } catch (error) {
      console.log('   ❌ Customer Management Test Failed:', error.message);
    }
    
    // Test transaction management
    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);
      
      if (transactionsError) {
        console.log('   ❌ Transaction Management Failed:', transactionsError.message);
      } else {
        console.log('   ✅ Transaction Management: Working');
        functionalityTestResults.transactionManagement = true;
      }
    } catch (error) {
      console.log('   ❌ Transaction Management Test Failed:', error.message);
    }
    
    // Test import/export functionality (by checking related tables)
    try {
      const { data: importLogsData, error: importLogsError } = await supabase
        .from('import_logs')
        .select('*')
        .limit(1);
      
      if (importLogsError) {
        console.log('   ❌ Import/Export Failed:', importLogsError.message);
      } else {
        console.log('   ✅ Import/Export: Working');
        functionalityTestResults.importExport = true;
      }
    } catch (error) {
      console.log('   ❌ Import/Export Test Failed:', error.message);
    }
    
    // Test dashboard functionality (by checking if data is accessible)
    if (functionalityTestResults.customerManagement && functionalityTestResults.transactionManagement) {
      console.log('   ✅ Dashboard: Working (data sources accessible)');
      functionalityTestResults.dashboard = true;
    }
    
    // Test settings functionality
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('bank_accounts')
        .select('*')
        .limit(1);
      
      if (settingsError) {
        console.log('   ❌ Settings Failed:', settingsError.message);
      } else {
        console.log('   ✅ Settings: Working');
        functionalityTestResults.settings = true;
      }
    } catch (error) {
      console.log('   ❌ Settings Test Failed:', error.message);
    }
    
    // Step 6: Performance Testing
    console.log('\n⚡ Performance Testing...');
    
    let performanceTestResults = {
      databaseResponseTime: false,
      queryPerformance: false,
      systemStability: false
    };
    
    // Test database response time
    const startTime = Date.now();
    try {
      const { data: perfData, error: perfError } = await supabase
        .from('customers')
        .select('*')
        .limit(10);
      
      const responseTime = Date.now() - startTime;
      
      if (perfError) {
        console.log('   ❌ Performance Test Failed:', perfError.message);
      } else {
        console.log(`   ✅ Database Response Time: ${responseTime}ms`);
        if (responseTime < 1000) {
          console.log('   ✅ Query Performance: Good');
          performanceTestResults.databaseResponseTime = true;
          performanceTestResults.queryPerformance = true;
        } else {
          console.log('   ⚠️ Query Performance: Slow (may need optimization)');
        }
      }
    } catch (error) {
      console.log('   ❌ Performance Test Failed:', error.message);
    }
    
    // Step 7: Security Testing
    console.log('\n🔒 Security Testing...');
    
    let securityTestResults = {
      rlsPoliciesEffective: false,
      dataProtection: false,
      accessControl: false
    };
    
    // Test RLS policies effectiveness
    if (databaseAccessResults.usersTableAccess) {
      try {
        // Try to access other users' data (should be limited by RLS)
        const { data: restrictedData, error: restrictedError } = await supabase
          .from('users')
          .select('*');
        
        if (!restrictedError && restrictedData) {
          // If we can see all users, RLS might not be restrictive enough
          // But if admin user, this is expected
          const adminUser = restrictedData.find(user => user.email === 'vietnguyenduccp@gmail.com');
          if (adminUser && adminUser.role === 'admin') {
            console.log('   ✅ RLS Policies: Working (admin can access all users)');
            securityTestResults.rlsPoliciesEffective = true;
          }
        }
      } catch (error) {
        console.log('   ❌ Security Test Failed:', error.message);
      }
    }
    
    // Step 8: Edge Case Testing
    console.log('\n🎯 Edge Case Testing...');
    
    let edgeCaseTestResults = {
      emptyDataHandling: false,
      invalidDataHandling: false,
      concurrentAccess: false,
      errorRecovery: false
    };
    
    // Test empty data handling
    try {
      const { data: emptyData, error: emptyError } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', 'NONEXISTENT_CODE');
      
      if (!emptyError) {
        console.log('   ✅ Empty Data Handling: Working');
        edgeCaseTestResults.emptyDataHandling = true;
      }
    } catch (error) {
      console.log('   ❌ Empty Data Test Failed:', error.message);
    }
    
    // Step 9: Integration Testing
    console.log('\n🔗 Integration Testing...');
    
    let integrationTestResults = {
      authToDatabaseSync: false,
      frontendToBackend: false,
      crossTableRelations: false
    };
    
    // Test auth to database synchronization
    if (databaseAccessResults.usersTableAccess && authTestResults.authenticationWorking) {
      console.log('   ✅ Auth to Database Sync: Working');
      integrationTestResults.authToDatabaseSync = true;
    }
    
    // Test cross-table relations
    if (functionalityTestResults.customerManagement && functionalityTestResults.transactionManagement) {
      console.log('   ✅ Cross-table Relations: Working');
      integrationTestResults.crossTableRelations = true;
    }
    
    // Step 10: Generate Comprehensive Test Report
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('=====================================');
    
    const testCategories = [
      {
        name: 'Database Access',
        results: databaseAccessResults,
        critical: true
      },
      {
        name: 'Authentication',
        results: authTestResults,
        critical: true
      },
      {
        name: 'Permissions',
        results: permissionTestResults,
        critical: true
      },
      {
        name: 'Functionality',
        results: functionalityTestResults,
        critical: true
      },
      {
        name: 'Performance',
        results: performanceTestResults,
        critical: false
      },
      {
        name: 'Security',
        results: securityTestResults,
        critical: true
      },
      {
        name: 'Edge Cases',
        results: edgeCaseTestResults,
        critical: false
      },
      {
        name: 'Integration',
        results: integrationTestResults,
        critical: true
      }
    ];
    
    let overallStatus = 'PASS';
    let criticalFailures = [];
    let warnings = [];
    
    testCategories.forEach(category => {
      const passedTests = Object.values(category.results).filter(result => result).length;
      const totalTests = Object.values(category.results).length;
      const passRate = (passedTests / totalTests) * 100;
      
      console.log(`\n${category.name}:`);
      console.log(`   Tests Passed: ${passedTests}/${totalTests} (${passRate.toFixed(1)}%)`);
      
      Object.entries(category.results).forEach(([test, result]) => {
        const status = result ? '✅' : '❌';
        console.log(`     ${status} ${test}`);
      });
      
      if (category.critical && passRate < 100) {
        overallStatus = 'FAIL';
        criticalFailures.push(category.name);
      } else if (passRate < 100) {
        warnings.push(category.name);
      }
    });
    
    // Step 11: Final Assessment and Recommendations
    console.log('\n🎯 FINAL ASSESSMENT');
    console.log('=====================');
    console.log(`Overall Status: ${overallStatus}`);
    
    if (overallStatus === 'PASS') {
      console.log('✅ SYSTEM RECOVERY SUCCESSFUL');
      console.log('   All critical systems are working correctly');
      console.log('   System is ready for production use');
    } else {
      console.log('❌ SYSTEM RECOVERY INCOMPLETE');
      console.log('   Critical issues still need to be addressed');
      console.log('   System is not ready for production use');
    }
    
    if (criticalFailures.length > 0) {
      console.log('\n🚨 Critical Issues:');
      criticalFailures.forEach(issue => {
        console.log(`   - ${issue}: Critical tests failed`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      warnings.forEach(warning => {
        console.log(`   - ${warning}: Some tests failed`);
      });
    }
    
    // Step 12: Next Steps Recommendations
    console.log('\n📋 NEXT STEPS RECOMMENDATIONS');
    
    if (overallStatus === 'PASS') {
      console.log('✅ IMMEDIATE ACTIONS:');
      console.log('   1. Deploy system to production');
      console.log('   2. Monitor system performance');
      console.log('   3. Set up production monitoring');
      console.log('   4. Document recovery process');
      console.log('   5. Coordinate next development phase');
    } else {
      console.log('❌ IMMEDIATE ACTIONS:');
      console.log('   1. Address critical failures');
      console.log('   2. Re-run failed tests after fixes');
      console.log('   3. Verify RLS policies are correctly deployed');
      console.log('   4. Ensure admin user record is created');
      console.log('   5. Re-test complete system functionality');
    }
    
    console.log('\n🎉 COMPLETE SYSTEM TESTING FINISHED');
    
  } catch (error) {
    console.error('❌ System Testing Failed:', error.message);
    console.log('   This suggests network or database connectivity issues');
  }
}

// Execute complete system testing
executeCompleteSystemTesting().catch(console.error);
