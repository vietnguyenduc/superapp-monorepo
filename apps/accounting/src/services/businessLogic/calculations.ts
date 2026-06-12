// Shared Calculation Functions
// Pure functions for calculations - no data source dependencies

// Transaction type normalization
export function normalizeTransactionType(type: string): string {
  const normalized = type.toLowerCase().trim();
  if (normalized === "payment") return "payment";
  if (normalized === "charge") return "charge";
  if (normalized === "refund") return "refund";
  if (normalized === "adjustment") return "adjustment";
  return type;
}

// Parse amount from string/number
export function parseAmount(value: any): number {
  const num = Number(String(value ?? 0).replace(/[\s,]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

// Calculate customer balance from transactions
export function calculateCustomerBalance(
  customer: any,
  transactions: any[]
): number {
  const parseAmt = parseAmount;
  const openingBalance = parseAmt(customer.opening_balance || 0);
  
  let balance = openingBalance;
  
  for (const tx of transactions) {
    if (tx.customer_id !== customer.id) continue;
    
    const amtSigned = parseAmt(tx.amount);
    const amtAbs = Math.abs(amtSigned);
    const type = normalizeTransactionType(tx.transaction_type || "");
    
    switch (type) {
      case "payment":
        balance -= amtAbs; // Payment reduces debt
        break;
      case "charge":
        balance += amtAbs; // Charge increases debt
        break;
      case "refund":
        balance -= amtAbs; // Refund reduces debt
        break;
      case "adjustment":
        balance += amtSigned; // Adjustment keeps sign
        break;
      default:
        balance += amtSigned;
    }
  }
  
  return balance;
}

// Calculate transaction type breakdown
export function calculateTransactionTypeBreakdown(
  transactions: any[]
): { [key: string]: { count: number; total: number } } {
  const breakdown: { [key: string]: { count: number; total: number } } = {
    payment: { count: 0, total: 0 },
    charge: { count: 0, total: 0 },
    refund: { count: 0, total: 0 },
    adjustment: { count: 0, total: 0 },
  };
  
  for (const tx of transactions) {
    const type = normalizeTransactionType(tx.transaction_type || "");
    const amount = Math.abs(parseAmount(tx.amount));
    
    if (breakdown[type]) {
      breakdown[type].count++;
      breakdown[type].total += amount;
    }
  }
  
  return breakdown;
}

// Calculate outstanding balance across all customers
export function calculateOutstandingBalance(
  customers: any[],
  transactions: any[]
): number {
  let total = 0;
  
  for (const customer of customers) {
    const balance = calculateCustomerBalance(customer, transactions);
    total += Math.abs(balance);
  }
  
  return total;
}

// Calculate active customers count
export function calculateActiveCustomers(
  customers: any[],
  transactions: any[]
): number {
  const customerIds = new Set(
    transactions
      .filter((tx: any) => tx.customer_id)
      .map((tx: any) => tx.customer_id)
  );
  return customerIds.size;
}

// Calculate cash flow data for chart
export function calculateCashFlowData(
  transactions: any[],
  timeRange: string = "month",
  count: number = 1
): any[] {
  // Group transactions by time period
  const now = new Date();
  const data: any[] = [];
  
  // Determine period start dates based on timeRange
  const periodStarts: Date[] = [];
  for (let i = count; i >= 0; i--) {
    const startDate = new Date(now);
    switch (timeRange) {
      case "day":
        startDate.setDate(startDate.getDate() - i);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - (i * 7));
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - i);
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - (i * 3));
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - i);
        break;
    }
    periodStarts.push(startDate);
  }
  
  // Calculate cash flow for each period
  for (let i = 0; i < periodStarts.length - 1; i++) {
    const periodStart = periodStarts[i];
    const periodEnd = periodStarts[i + 1] || now;
    
    const periodTransactions = transactions.filter((tx: any) => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= periodStart && txDate <= periodEnd;
    });
    
    const income = periodTransactions
      .filter((tx: any) => {
        const type = normalizeTransactionType(tx.transaction_type || "");
        return type === "payment" || type === "refund";
      })
      .reduce((sum: number, tx: any) => sum + Math.abs(parseAmount(tx.amount)), 0);
    
    const debt = periodTransactions
      .filter((tx: any) => {
        const type = normalizeTransactionType(tx.transaction_type || "");
        return type === "charge";
      })
      .reduce((sum: number, tx: any) => sum + Math.abs(parseAmount(tx.amount)), 0);
    
    data.push({
      date: periodStart.toISOString(),
      income,
      debt,
      net: income - debt,
    });
  }
  
  return data;
}

// Calculate bank account balances from transactions
export function calculateBankAccountBalances(
  bankAccounts: any[],
  transactions: any[],
  timeRange: string = "month",
  count: number = 1
): any[] {
  const now = new Date();
  const end = now;
  const periodStarts: Date[] = [];
  
  // Build period starts
  for (let i = count; i >= 0; i--) {
    const startDate = new Date(now);
    switch (timeRange) {
      case "day":
        startDate.setDate(startDate.getDate() - i);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - (i * 7));
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - i);
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - (i * 3));
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - i);
        break;
    }
    periodStarts.push(startDate);
  }
  
  const periodStart = periodStarts[0] || now;
  
  // Calculate cash delta from transaction
  const cashDeltaFromTransaction = (tx: any): number => {
    const type = normalizeTransactionType(tx.transaction_type || "");
    const amount = parseAmount(tx.amount);
    
    switch (type) {
      case "payment":
        return Math.abs(amount); // Payment adds cash
      case "charge":
        return -Math.abs(amount); // Charge removes cash
      case "refund":
        return -Math.abs(amount); // Refund removes cash
      case "adjustment":
        return amount; // Adjustment keeps sign
      default:
        return amount;
    }
  };
  
  return bankAccounts.map((bank: any) => {
    const txForAccount = transactions.filter((t: any) => t.bank_account_id === bank.id);
    
    // Compute balances from all history
    const txBeforeStart = txForAccount.filter((t: any) =>
      new Date(t.transaction_date).getTime() < periodStart.getTime()
    );
    const baseCash = txBeforeStart.reduce((s: number, t: any) => s + cashDeltaFromTransaction(t), 0);
    
    const periodDeltas = periodStarts.map((ps, idx) => {
      const next = idx < periodStarts.length - 1 ? periodStarts[idx + 1] : null;
      const periodEnd = next
        ? new Date(new Date(next).getTime() - 1)
        : end;
      
      return txForAccount
        .filter((t: any) => {
          const ts = new Date(t.transaction_date).getTime();
          return ts >= ps.getTime() && ts <= periodEnd.getTime();
        })
        .reduce((s: number, t: any) => s + cashDeltaFromTransaction(t), 0);
    });
    
    const periodBalances: number[] = Array(periodStarts.length).fill(baseCash);
    let runningCash = baseCash;
    for (let i = 0; i < periodDeltas.length; i++) {
      runningCash += periodDeltas[i];
      periodBalances[i] = runningCash;
    }
    
    const historical_data = periodStarts.map((ps, idx) => ({
      date: ps.toISOString(),
      balance: periodBalances[idx] ?? baseCash,
    }));
    
    const balance = historical_data.length > 0 ? historical_data[historical_data.length - 1].balance : baseCash;
    
    return {
      bank_account_id: bank.id,
      account_name: bank.account_name,
      account_number: bank.account_number,
      balance,
      historical_data,
    };
  });
}

// Calculate transaction amounts by branch
export function calculateTransactionAmountsByBranch(
  transactions: any[],
  branches: any[]
): any[] {
  const branchNameMap = new Map(branches.map((b: any) => [b.id, b.name] as const));
  const branchAgg = new Map<string, { incomeAmount: number; debtAmount: number }>();
  
  for (const tx of transactions) {
    const branchIdForTx = tx.branch_id ? String(tx.branch_id) : "";
    const prev = branchAgg.get(branchIdForTx) || { incomeAmount: 0, debtAmount: 0 };
    
    const type = normalizeTransactionType(tx.transaction_type || "");
    const amount = Math.abs(parseAmount(tx.amount));
    
    if (type === "payment" || type === "refund") {
      prev.incomeAmount += amount;
    } else if (type === "charge") {
      prev.debtAmount += amount;
    } else if (type === "adjustment") {
      if (tx.amount >= 0) prev.incomeAmount += amount;
      else prev.debtAmount += Math.abs(amount);
    } else {
      prev.incomeAmount += amount;
    }
    
    branchAgg.set(branchIdForTx, prev);
  }
  
  return Array.from(branchAgg.entries())
    .map(([branch_id, v]) => ({
      branch_id,
      branch_name: branchNameMap.get(branch_id) || `Branch ${branch_id}`,
      incomeAmount: v.incomeAmount,
      debtAmount: v.debtAmount,
    }))
    .sort((a, b) => b.incomeAmount + b.debtAmount - (a.incomeAmount + a.debtAmount));
}

// Get top customers by balance
export function getTopCustomers(
  customers: any[],
  transactions: any[],
  limit: number = 10
): any[] {
  const customersWithBalance = customers.map((c: any) => ({
    ...c,
    total_balance: calculateCustomerBalance(c, transactions),
  }));
  
  const debtCustomers = customersWithBalance
    .filter((c: any) => c.total_balance < 0)
    .sort((a: any, b: any) => a.total_balance - b.total_balance);
  
  const creditCustomers = customersWithBalance
    .filter((c: any) => c.total_balance >= 0)
    .sort((a: any, b: any) => b.total_balance - a.total_balance);
  
  const topCustomers = [...debtCustomers, ...creditCustomers];
  return topCustomers.slice(0, limit);
}

// Get recent transactions
export function getRecentTransactions(
  transactions: any[],
  limit: number = 20,
  customerNameMap?: Map<string, string>,
  bankAccountNameMap?: Map<string, string>
): any[] {
  const sorted = [...transactions]
    .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, limit);
  
  return sorted.map((tx) => ({
    ...tx,
    customer_name: customerNameMap?.get(tx.customer_id || "") || tx.customer_name,
    bank_account_name: bankAccountNameMap?.get(tx.bank_account_id || "") || tx.bank_account_name,
  }));
}
