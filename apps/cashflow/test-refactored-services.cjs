// Test refactored services - trial mode
const { setTrialMode, getTrialMode } = require('./src/services/trialMockStore');

// Set trial mode
setTrialMode(true);

// Mock localStorage
const mockStore = {
  customers: [],
  transactions: [],
  bank_accounts: [],
  branches: [],
  transaction_types: []
};

global.localStorage = {
  getItem: (key) => {
    if (key === 'cashflow_trial_store') {
      return JSON.stringify(mockStore);
    }
    return null;
  },
  setItem: (key, value) => {
    if (key === 'cashflow_trial_store') {
      Object.assign(mockStore, JSON.parse(value));
    }
  },
  removeItem: (key) => {
    if (key === 'cashflow_trial_store') {
      mockStore.customers = [];
      mockStore.transactions = [];
      mockStore.bank_accounts = [];
      mockStore.branches = [];
      mockStore.transaction_types = [];
    }
  }
};

// Import database service after setting up mocks
const databaseService = require('./src/services/database.ts').default || require('./src/services/database.ts').databaseService;

async function testCustomerService() {
  console.log('\n=== Testing Customer Service (Trial Mode) ===');
  
  // Test createCustomer
  console.log('\n1. Testing createCustomer...');
  const createResult = await databaseService.customers.createCustomer({
    customer_code: 'TEST001',
    full_name: 'Test Customer',
    phone: '0912345678',
    email: 'test@example.com',
    company_id: 'trial-company'
  });
  console.log('Create customer result:', createResult.error ? 'ERROR: ' + createResult.error : 'SUCCESS');
  
  if (createResult.data) {
    console.log('Created customer:', createResult.data.customer_code, createResult.data.full_name);
  }
  
  // Test getCustomers
  console.log('\n2. Testing getCustomers...');
  const getCustomersResult = await databaseService.customers.getCustomers();
  console.log('Get customers result:', getCustomersResult.error ? 'ERROR: ' + getCustomersResult.error : 'SUCCESS');
  console.log('Customer count:', getCustomersResult.count);
  
  // Test getCustomerById
  console.log('\n3. Testing getCustomerById...');
  if (getCustomersResult.data && getCustomersResult.data.length > 0) {
    const customerId = getCustomersResult.data[0].id;
    const getByIdResult = await databaseService.customers.getCustomerById(customerId);
    console.log('Get by ID result:', getByIdResult.error ? 'ERROR: ' + getByIdResult.error : 'SUCCESS');
    if (getByIdResult.data) {
      console.log('Customer:', getByIdResult.data.customer_code, getByIdResult.data.full_name);
    }
  }
  
  // Test updateCustomer
  console.log('\n4. Testing updateCustomer...');
  if (getCustomersResult.data && getCustomersResult.data.length > 0) {
    const customerId = getCustomersResult.data[0].id;
    const updateResult = await databaseService.customers.updateCustomer(customerId, {
      full_name: 'Updated Test Customer',
      phone: '0987654321'
    });
    console.log('Update customer result:', updateResult.error ? 'ERROR: ' + updateResult.error : 'SUCCESS');
    if (updateResult.data) {
      console.log('Updated customer:', updateResult.data.full_name, updateResult.data.phone);
    }
  }
  
  // Test deleteCustomer
  console.log('\n5. Testing deleteCustomer...');
  if (getCustomersResult.data && getCustomersResult.data.length > 1) {
    const customerId = getCustomersResult.data[1].id;
    const deleteResult = await databaseService.customers.deleteCustomer(customerId);
    console.log('Delete customer result:', deleteResult.error ? 'ERROR: ' + deleteResult.error : 'SUCCESS');
  }
  
  // Test bulkCreateCustomers
  console.log('\n6. Testing bulkCreateCustomers...');
  const bulkCreateResult = await databaseService.customers.bulkCreateCustomers([
    { customer_code: 'TEST002', full_name: 'Bulk Customer 1', phone: '0911111111', company_id: 'trial-company' },
    { customer_code: 'TEST003', full_name: 'Bulk Customer 2', phone: '0922222222', company_id: 'trial-company' }
  ]);
  console.log('Bulk create result:', bulkCreateResult.error ? 'ERROR: ' + bulkCreateResult.error : 'SUCCESS');
  if (bulkCreateResult.data) {
    console.log('Created customers:', bulkCreateResult.data.length);
  }
  if (bulkCreateResult.errors && bulkCreateResult.errors.length > 0) {
    console.log('Errors:', bulkCreateResult.errors);
  }
}

async function testTransactionService() {
  console.log('\n=== Testing Transaction Service (Trial Mode) ===');
  
  // First create a customer for transactions
  const customerResult = await databaseService.customers.createCustomer({
    customer_code: 'TXN_CUST',
    full_name: 'Transaction Test Customer',
    phone: '0933333333',
    company_id: 'trial-company'
  });
  
  if (!customerResult.data) {
    console.log('Failed to create customer for transaction tests');
    return;
  }
  
  const customerId = customerResult.data.id;
  
  // Test createTransaction
  console.log('\n1. Testing createTransaction...');
  const createResult = await databaseService.transactions.createTransaction({
    customer_id: customerId,
    transaction_type: 'payment',
    amount: 1000000,
    description: 'Test transaction',
    company_id: 'trial-company'
  });
  console.log('Create transaction result:', createResult.error ? 'ERROR: ' + createResult.error : 'SUCCESS');
  
  if (createResult.data) {
    console.log('Created transaction:', createResult.data.transaction_code, createResult.data.amount);
  }
  
  // Test getTransactionById
  console.log('\n2. Testing getTransactionById...');
  if (createResult.data) {
    const getByIdResult = await databaseService.transactions.getTransactionById(createResult.data.id);
    console.log('Get by ID result:', getByIdResult.error ? 'ERROR: ' + getByIdResult.error : 'SUCCESS');
    if (getByIdResult.data) {
      console.log('Transaction:', getByIdResult.data.transaction_code, getByIdResult.data.amount);
    }
  }
  
  // Test updateTransaction
  console.log('\n3. Testing updateTransaction...');
  if (createResult.data) {
    const updateResult = await databaseService.transactions.updateTransaction(createResult.data.id, {
      amount: 2000000,
      description: 'Updated test transaction'
    });
    console.log('Update transaction result:', updateResult.error ? 'ERROR: ' + updateResult.error : 'SUCCESS');
    if (updateResult.data) {
      console.log('Updated transaction:', updateResult.data.amount, updateResult.data.description);
    }
  }
  
  // Test deleteTransaction
  console.log('\n4. Testing deleteTransaction...');
  if (createResult.data) {
    const deleteResult = await databaseService.transactions.deleteTransaction(createResult.data.id);
    console.log('Delete transaction result:', deleteResult.error ? 'ERROR: ' + deleteResult.error : 'SUCCESS');
  }
}

async function runTests() {
  console.log('=== Starting Refactored Services Tests (Trial Mode) ===');
  console.log('Trial mode enabled:', getTrialMode());
  
  try {
    await testCustomerService();
    await testTransactionService();
    
    console.log('\n=== All Tests Completed ===');
    console.log('Summary: All refactored services tested in trial mode');
  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

runTests().catch(console.error);
