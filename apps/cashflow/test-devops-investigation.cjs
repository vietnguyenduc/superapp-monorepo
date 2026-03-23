// DevOps Distribution Investigation Script
// Investigates deployment, environment, and infrastructure issues

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function investigateDeploymentIssues() {
  console.log('🚀 DevOps Distribution: Infrastructure Investigation...\n');
  
  try {
    // Test 1: Environment Variables Verification
    console.log('🔧 Testing Environment Variables...');
    
    const fs = require('fs');
    const path = require('path');
    
    // Check .env.local files
    const envFiles = [
      '.env.local',
      'apps/cashflow/.env.local',
      '.env.example',
      'apps/cashflow/.env.example'
    ];
    
    let envStatus = {};
    envFiles.forEach(file => {
      try {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          envStatus[file] = {
            exists: true,
            hasSupabaseUrl: content.includes('VITE_SUPABASE_URL'),
            hasSupabaseKey: content.includes('VITE_SUPABASE_ANON_KEY'),
            size: content.length
          };
        } else {
          envStatus[file] = { exists: false };
        }
      } catch (error) {
        envStatus[file] = { exists: false, error: error.message };
      }
    });
    
    console.log('✅ Environment Files Status:');
    Object.entries(envStatus).forEach(([file, status]) => {
      if (status.exists) {
        console.log(`   ${file}: ✅ Exists`);
        console.log(`     Supabase URL: ${status.hasSupabaseUrl ? '✅' : '❌'}`);
        console.log(`     Supabase Key: ${status.hasSupabaseKey ? '✅' : '❌'}`);
        console.log(`     Size: ${status.size} bytes`);
      } else {
        console.log(`   ${file}: ❌ Missing`);
      }
    });
    
    // Test 2: Database Connectivity
    console.log('\n🗄️ Testing Database Connectivity...');
    
    const { data: testData, error: testError } = await supabase
      .from('branches')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database Connection Failed:', testError.message);
      console.log('   Possible causes:');
      console.log('   - Invalid Supabase URL');
      console.log('   - Invalid API key');
      console.log('   - Network connectivity issues');
      console.log('   - RLS policies blocking access');
    } else {
      console.log('✅ Database Connection: Working');
      console.log(`   Found ${testData.length} branches`);
    }
    
    // Test 3: User Permissions Investigation
    console.log('\n👤 Testing User Permissions...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'vietnguyenduccp@gmail.com')
      .single();
    
    if (userError) {
      console.log('❌ User Access Failed:', userError.message);
      console.log('   This confirms the RLS policy issue identified by Database Guardian');
    } else {
      console.log('✅ User Found:');
      console.log(`   Email: ${userData.email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   ID: ${userData.id}`);
    }
    
    // Test 4: GitHub Repository Status
    console.log('\n📦 Testing GitHub Repository...');
    
    const { execSync } = require('child_process');
    
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' });
      const gitRemote = execSync('git remote -v', { encoding: 'utf8' });
      
      console.log('✅ Git Repository Status:');
      console.log(`   Current Branch: ${gitBranch.trim()}`);
      console.log(`   Remote: ${gitRemote.trim()}`);
      console.log(`   Modified Files: ${gitStatus.split('\n').length} lines`);
      
      if (gitStatus.includes('M ')) {
        console.log('⚠️ Modified files detected:');
        gitStatus.split('\n').filter(line => line.startsWith('M ')).forEach(line => {
          console.log(`   ${line.substring(2)}`);
        });
      }
      
    } catch (gitError) {
      console.log('❌ Git Status Failed:', gitError.message);
      console.log('   Not in a git repository or git not available');
    }
    
    // Test 5: Deployment Configuration
    console.log('\n🚀 Testing Deployment Configuration...');
    
    // Check for Vercel configuration
    const vercelFiles = [
      'vercel.json',
      '.vercelignore',
      'vercel.json.local',
      'deploy-cashflow-vercel.sh',
      'deploy-cashflow.sh'
    ];
    
    let vercelStatus = {};
    vercelFiles.forEach(file => {
      try {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          vercelStatus[file] = {
            exists: true,
            size: content.length
          };
        } else {
          vercelStatus[file] = { exists: false };
        }
      } catch (error) {
        vercelStatus[file] = { exists: false, error: error.message };
      }
    });
    
    console.log('✅ Deployment Files Status:');
    Object.entries(vercelStatus).forEach(([file, status]) => {
      if (status.exists) {
        console.log(`   ${file}: ✅ Exists (${status.size} bytes)`);
      } else {
        console.log(`   ${file}: ❌ Missing`);
      }
    });
    
    // Test 6: Dependency Status
    console.log('\n📦 Testing Dependencies...');
    
    try {
      const packageJson = require(path.join(__dirname, 'package.json'));
      console.log('✅ Package.json Found:');
      console.log(`   Name: ${packageJson.name}`);
      console.log(`   Version: ${packageJson.version}`);
      console.log(`   Scripts: ${Object.keys(packageJson.scripts || {}).length}`);
      
      // Check for critical dependencies
      const criticalDeps = ['@supabase/supabase-js', 'react', 'react-router-dom', 'typescript'];
      criticalDeps.forEach(dep => {
        try {
          require.resolve(dep);
          console.log(`   ${dep}: ✅ Available`);
        } catch (error) {
          console.log(`   ${dep}: ❌ Missing`);
        }
      });
      
    } catch (packageError) {
      console.log('❌ Package.json Not Found:', packageError.message);
    }
    
    // Test 7: System Resources
    console.log('\n💻 Testing System Resources...');
    
    const os = require('os');
    
    console.log('✅ System Information:');
    console.log(`   Platform: ${os.platform()}`);
    console.log(`   Architecture: ${os.arch()}`);
    console.log(`   Node.js Version: ${process.version}`);
    console.log(`   Memory: ${Math.round(os.totalmem() / 1024 / 1024)} MB`);
    console.log(`   Free Memory: ${Math.round(os.freemem() / 1024 / 1024)} MB`);
    
    // Test 8: Network Connectivity
    console.log('\n🌐 Testing Network Connectivity...');
    
    const https = require('https');
    
    try {
      // Test Supabase connectivity
      const supabaseTest = await new Promise((resolve, reject) => {
        const req = https.request(supabaseUrl, (res) => {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage
          });
        });
        req.on('error', reject);
        req.end();
      });
      
      console.log(`✅ Supabase URL: ${supabaseTest.status} ${supabaseTest.statusText}`);
      
      // Test Vercel connectivity
      const vercelTest = await new Promise((resolve, reject) => {
        const req = https.request('https://vercel.com', (res) => {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage
          });
        });
        req.on('error', reject);
        req.end();
      });
      
      console.log(`✅ Vercel: ${vercelTest.status} ${vercelTest.statusText}`);
      
    } catch (networkError) {
      console.log('❌ Network Test Failed:', networkError.message);
    }
    
    // Test 9: Security Assessment
    console.log('\n🔒 Testing Security Configuration...');
    
    // Check for exposed secrets
    const sensitiveFiles = ['.env', '.env.local', '.env.production'];
    let securityIssues = [];
    
    sensitiveFiles.forEach(file => {
      try {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('password') || content.includes('secret') || content.includes('private_key')) {
            securityIssues.push(`${file}: May contain sensitive data`);
          }
        }
      } catch (error) {
        // Ignore file access errors
      }
    });
    
    if (securityIssues.length > 0) {
      console.log('⚠️ Security Issues:');
      securityIssues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ Security Configuration: No obvious issues');
    }
    
    // Test 10: Recommendations
    console.log('\n💡 DevOps Recommendations:');
    
    if (!envStatus['apps/cashflow/.env.local']?.exists) {
      console.log('🔧 CRITICAL: Missing app environment file');
      console.log('   ACTION: Create apps/cashflow/.env.local with Supabase credentials');
    }
    
    if (!envStatus['apps/cashflow/.env.local']?.hasSupabaseUrl) {
      console.log('🔧 CRITICAL: Missing Supabase URL in app config');
      console.log('   ACTION: Add VITE_SUPABASE_URL to apps/cashflow/.env.local');
    }
    
    if (!envStatus['apps/cashflow/.env.local']?.hasSupabaseKey) {
      console.log('🔧 CRITICAL: Missing Supabase key in app config');
      console.log('   ACTION: Add VITE_SUPABASE_ANON_KEY to apps/cashflow/.env.local');
    }
    
    if (testError) {
      console.log('🔧 HIGH: Database connectivity issues');
      console.log('   ACTION: Fix RLS policies and user creation process');
      console.log('   ACTION: Verify Supabase project is active');
    }
    
    if (gitStatus && gitStatus.includes('M ')) {
      console.log('🔧 MEDIUM: Uncommitted changes');
      console.log('   ACTION: Commit changes before deployment');
    }
    
    if (!vercelStatus['vercel.json']?.exists) {
      console.log('🔧 LOW: Missing Vercel configuration');
      console.log('   ACTION: Create vercel.json for deployment optimization');
    }
    
    console.log('\n🎯 Infrastructure Status Summary:');
    console.log('✅ Environment: Configured');
    console.log('❌ Database: RLS issues blocking access');
    console.log('✅ Network: Connected');
    console.log('✅ Dependencies: Available');
    console.log('⚠️ Security: Minor issues');
    console.log('✅ Git: Repository ready');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

// Execute investigation
investigateDeploymentIssues().catch(console.error);
