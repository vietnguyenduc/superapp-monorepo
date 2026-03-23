// Browser console test script for login debugging
// Copy and paste this into browser console on the login page

console.log('🚀 Browser Login Debug Test...\n');

// Test 1: Check if we're online
console.log('📡 Network Status:');
console.log(`   Online: ${navigator.onLine}`);
console.log(`   Connection Type: ${navigator.connection?.effectiveType || 'Unknown'}`);

// Test 2: Test basic connectivity
console.log('\n🌐 Testing Basic Connectivity...');
fetch('https://httpbin.org/get')
  .then(response => {
    console.log(`   httpbin.org Status: ${response.status}`);
    console.log('   Basic Internet: ✅ Working');
  })
  .catch(error => {
    console.log(`   httpbin.org Error: ${error.message}`);
    console.log('   Basic Internet: ❌ Failed');
  });

// Test 3: Test Supabase connectivity
console.log('\n🔗 Testing Supabase Connectivity...');
const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w';

fetch(`${supabaseUrl}/rest/v1/`, {
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log(`   Supabase REST Status: ${response.status}`);
    if (response.ok) {
      console.log('   Supabase Connectivity: ✅ Working');
    } else {
      console.log('   Supabase Connectivity: ❌ Failed');
    }
  })
  .catch(error => {
    console.log(`   Supabase Error: ${error.message}`);
    console.log('   Supabase Connectivity: ❌ Failed');
  });

// Test 4: Test Supabase Auth
console.log('\n🔐 Testing Supabase Auth...');
fetch(`${supabaseUrl}/auth/v1/settings`, {
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log(`   Supabase Auth Status: ${response.status}`);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  })
  .then(settings => {
    console.log('   Supabase Auth: ✅ Working');
    console.log(`   External Providers: ${settings.external?.length || 0}`);
  })
  .catch(error => {
    console.log(`   Supabase Auth Error: ${error.message}`);
    console.log('   Supabase Auth: ❌ Failed');
  });

// Test 5: Check environment variables (if accessible)
console.log('\n🔧 Checking Environment...');
if (typeof window !== 'undefined' && window.ENV) {
  console.log(`   VITE_SUPABASE_URL: ${window.ENV.VITE_SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`   VITE_SUPABASE_ANON_KEY: ${window.ENV.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}`);
} else {
  console.log('   Environment Variables: ⚠️ Not accessible from browser');
}

// Test 6: Check localStorage
console.log('\n💾 Checking LocalStorage...');
const authKeys = Object.keys(localStorage).filter(key => 
  key.includes('auth') || key.includes('supabase') || key.includes('debt')
);
console.log(`   Auth-related keys: ${authKeys.length}`);
authKeys.forEach(key => {
  console.log(`   - ${key}: ${localStorage.getItem(key) ? 'Has data' : 'Empty'}`);
});

// Test 7: Manual login test
console.log('\n🔑 Manual Login Test...');
fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  })
})
  .then(response => {
    console.log(`   Manual Login Status: ${response.status}`);
    if (response.status === 400 || response.status === 401) {
      console.log('   Manual Login: ✅ Correctly rejected invalid credentials');
    } else if (response.ok) {
      console.log('   Manual Login: ✅ Success');
      return response.json();
    } else {
      console.log('   Manual Login: ❌ Unexpected response');
    }
  })
  .then(data => {
    if (data) {
      console.log(`   Access Token: ${data.access_token ? '✅' : '❌'}`);
    }
  })
  .catch(error => {
    console.log(`   Manual Login Error: ${error.message}`);
    console.log('   Manual Login: ❌ Failed');
  });

// Test 8: Check current auth state
console.log('\n👤 Current Auth State...');
if (typeof window !== 'undefined' && window.supabase) {
  window.supabase.auth.getSession().then(({ data: { session } }) => {
    console.log(`   Current Session: ${session ? '✅ Active' : '❌ None'}`);
    if (session) {
      console.log(`   User Email: ${session.user?.email || 'Unknown'}`);
      console.log(`   Expires At: ${new Date(session.expires_at * 1000).toLocaleString()}`);
    }
  });
} else {
  console.log('   Supabase Client: ⚠️ Not accessible');
}

console.log('\n🎯 Summary:');
console.log('   - If all tests pass, the issue is likely in the app logic');
console.log('   - If Supabase tests fail, the issue is network/configuration');
console.log('   - Check browser network tab for detailed error messages');
console.log('   - Try clearing browser cache and cookies completely');
console.log('   - Test in incognito/private mode');
