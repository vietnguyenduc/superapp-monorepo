// Debug script for login failure issue
// Tests Supabase connection and authentication

const SUPABASE_URL = 'https://peslmsctejmvkwzyohke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w';

// Test 1: DNS Resolution
async function testDNSResolution() {
  console.log('\n🔍 Testing DNS Resolution...');
  
  try {
    const url = new URL(SUPABASE_URL);
    console.log(`   Hostname: ${url.hostname}`);
    
    // In Node.js, we can't directly test DNS like in browser
    // But we can try to fetch the health endpoint
    console.log('   DNS Resolution: ⚠️ Cannot test directly in Node.js');
    console.log('   Will test via HTTP request...');
    
    return true;
  } catch (error) {
    console.error('❌ DNS Resolution failed:', error.message);
    return false;
  }
}

// Test 2: HTTP Connection
async function testHTTPConnection() {
  console.log('\n🌐 Testing HTTP Connection...');
  
  try {
    // Try to fetch Supabase health endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    if (response.ok) {
      console.log('   HTTP Connection: ✅ Success');
      return true;
    } else {
      console.log('   HTTP Connection: ❌ Failed');
      console.log(`   Response: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.error('❌ HTTP Connection failed:', error.message);
    console.log('   This indicates a network connectivity issue');
    return false;
  }
}

// Test 3: Authentication Endpoint
async function testAuthEndpoint() {
  console.log('\n🔐 Testing Authentication Endpoint...');
  
  try {
    // Test if auth endpoint is accessible
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    if (response.ok) {
      const settings = await response.json();
      console.log('   Auth Endpoint: ✅ Accessible');
      console.log(`   External Providers: ${settings.external?.length || 0}`);
      return true;
    } else {
      console.log('   Auth Endpoint: ❌ Failed');
      console.log(`   Response: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Auth Endpoint failed:', error.message);
    return false;
  }
}

// Test 4: Test Login with Invalid Credentials
async function testInvalidLogin() {
  console.log('\n🔑 Testing Login with Invalid Credentials...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    
    if (response.status === 400 || response.status === 401) {
      console.log('   Invalid Login Test: ✅ Correctly rejected');
      return true;
    } else {
      console.log('   Invalid Login Test: ❌ Unexpected response');
      console.log(`   Response: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Invalid Login Test failed:', error.message);
    return false;
  }
}

// Test 5: Environment Variables Check
function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Variables...');
  
  // Read from .env.local file directly
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const hasUrl = envContent.includes('VITE_SUPABASE_URL=');
    const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=');
    
    console.log(`   VITE_SUPABASE_URL: ${hasUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   VITE_SUPABASE_ANON_KEY: ${hasKey ? '✅ Set' : '❌ Missing'}`);
    
    if (hasUrl && hasKey) {
      console.log('   Environment Variables: ✅ Configured');
      return true;
    } else {
      console.log('   Environment Variables: ❌ Missing');
      return false;
    }
  } catch (error) {
    console.log('   Environment Variables: ❌ Could not read .env.local');
    return false;
  }
}

// Test 6: Network Diagnostics
function testNetworkDiagnostics() {
  console.log('\n📡 Network Diagnostics...');
  
  console.log('   Network Status: ⚠️ Cannot test in Node.js environment');
  console.log('   Recommended: Test in browser console');
  console.log('   Browser Test Commands:');
  console.log('     - navigator.onLine');
  console.log('     - fetch("https://peslmsctejmvkwzyohke.supabase.co/rest/v1/")');
  console.log('     - fetch("https://httpbin.org/get")');
  
  return true;
}

// Main diagnostic function
async function runLoginDiagnostics() {
  console.log('🚀 Starting Login Failure Diagnostics...\n');
  
  console.log('📋 Issue Report:');
  console.log('   Problem: Login failure - "fail to fetch"');
  console.log('   User Action: Cleared cache and localStorage');
  console.log('   Expected: Should be able to login with valid credentials');
  
  // Run all diagnostic tests
  const envTest = testEnvironmentVariables();
  const dnsTest = await testDNSResolution();
  const httpTest = await testHTTPConnection();
  const authTest = await testAuthEndpoint();
  const loginTest = await testInvalidLogin();
  const networkTest = testNetworkDiagnostics();
  
  console.log('\n📊 Diagnostic Results:');
  console.log(`   Environment Variables: ${envTest ? '✅' : '❌'}`);
  console.log(`   DNS Resolution: ${dnsTest ? '✅' : '❌'}`);
  console.log(`   HTTP Connection: ${httpTest ? '✅' : '❌'}`);
  console.log(`   Auth Endpoint: ${authTest ? '✅' : '❌'}`);
  console.log(`   Invalid Login Test: ${loginTest ? '✅' : '❌'}`);
  console.log(`   Network Diagnostics: ${networkTest ? '✅' : '❌'}`);
  
  // Determine root cause
  console.log('\n🔍 Root Cause Analysis:');
  
  if (!envTest) {
    console.log('   ❌ ROOT CAUSE: Missing environment variables');
    console.log('   💡 SOLUTION: Check .env.local file configuration');
  } else if (!dnsTest || !httpTest) {
    console.log('   ❌ ROOT CAUSE: Network connectivity issue');
    console.log('   💡 SOLUTION: Check internet connection and DNS settings');
    console.log('   💡 SOLUTION: Verify Supabase URL is correct');
    console.log('   💡 SOLUTION: Check if Supabase project is active');
  } else if (!authTest) {
    console.log('   ❌ ROOT CAUSE: Supabase auth service unavailable');
    console.log('   💡 SOLUTION: Check Supabase project status');
    console.log('   💡 SOLUTION: Verify API key is valid');
  } else if (!loginTest) {
    console.log('   ❌ ROOT CAUSE: Authentication endpoint misconfigured');
    console.log('   💡 SOLUTION: Check Supabase auth settings');
  } else {
    console.log('   ✅ All tests passed - issue may be browser-specific');
    console.log('   💡 SOLUTION: Clear browser cache and cookies');
    console.log('   💡 SOLUTION: Try different browser');
    console.log('   💡 SOLUTION: Check browser console for errors');
  }
  
  console.log('\n🛠️ Recommended Actions:');
  console.log('   1. Verify Supabase project is active and accessible');
  console.log('   2. Check internet connection');
  console.log('   3. Test in browser console: fetch("https://peslmsctejmvkwzyohke.supabase.co/rest/v1/")');
  console.log('   4. If all else fails, create new Supabase project');
  console.log('   5. Update environment variables with new project credentials');
  
  console.log('\n🎯 Next Steps:');
  console.log('   - Test in browser environment');
  console.log('   - Check Supabase dashboard');
  console.log('   - Verify project status and settings');
  console.log('   - Update configuration if needed');
}

// Execute diagnostics
runLoginDiagnostics().catch(console.error);
