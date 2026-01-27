// Mock services for cashflow app
import type { Customer, Transaction, TransactionType } from "../types";
import { dashboardMockData } from "./mockData";

type TimeRange = "day" | "week" | "month" | "quarter" | "year";

const STORAGE_KEYS = {
  customers: "cashflow_customers",
  transactions: "cashflow_transactions",
  bankAccounts: "cashflow_bank_accounts",
};

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function softenPositiveBalances(customers: Customer[], ratio = 0.25, cap = 2_000_000) {
  return customers.map((customer) => {
    if (customer.total_balance <= 0) return customer;
    const scaled = Math.min(Math.round(customer.total_balance * ratio), cap);
    return {
      ...customer,
      total_balance: scaled,
    };
  });
}

function getNowIso() {
  return new Date().toISOString();
}

function uuid() {
  const anyCrypto = (globalThis as any).crypto;
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function padTxnCode(n: number) {
  return `TXN${String(n).padStart(4, "0")}`;
}

function generateCustomerCode(index: number) {
  return `CUST${String(index).padStart(4, "0")}`;
}

const CUSTOMER_SEED_PREFIXES = [
  "Công ty TNHH",
  "Công ty CP",
  "Doanh nghiệp",
  "Hộ kinh doanh",
  "Công ty TM",
];
const CUSTOMER_SEED_NAMES = [
  "An Phát",
  "Việt Thịnh",
  "Hoàng Gia",
  "Minh Long",
  "Đại Phú",
  "Bình Minh",
  "Sao Việt",
  "Thành Công",
  "Hưng Thịnh",
  "Vạn Lộc",
];
const CUSTOMER_SEED_STREETS = [
  "Nguyễn Huệ",
  "Lê Lợi",
  "Điện Biên Phủ",
  "Phan Xích Long",
  "Cách Mạng Tháng 8",
  "Trần Hưng Đạo",
  "Hai Bà Trưng",
  "Pasteur",
  "Nguyễn Trãi",
  "Lý Tự Trọng",
];

function buildSeedAddress(idx: number) {
  const number = 100 + (idx % 200);
  const district = (idx % 10) + 1;
  return `${number} ${CUSTOMER_SEED_STREETS[idx % CUSTOMER_SEED_STREETS.length]}, Quận ${district}, TP.HCM`;
}

function buildSeedPhone(idx: number) {
  return `0${(900000000 + (idx % 90000000)).toString()}`;
}

function buildSeedEmail(prefix: string, name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "");
  return `${slug}@${prefix.includes("CP") ? "corp" : "biz"}.vn`;
}

function randomBranchId(idx: number) {
  const branchIds = ["1", "2", "3"];
  return branchIds[idx % branchIds.length];
}

function generateSeedCustomers(startIndex: number, count: number) {
  const customers: Customer[] = [];
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const companyPrefix = CUSTOMER_SEED_PREFIXES[idx % CUSTOMER_SEED_PREFIXES.length];
    const companyName = CUSTOMER_SEED_NAMES[idx % CUSTOMER_SEED_NAMES.length];
    const code = generateCustomerCode(idx + 1);
    const fullName = `${companyPrefix} ${companyName}`;
    const phone = buildSeedPhone(idx);
    const email = buildSeedEmail(companyPrefix, companyName);
    const address = buildSeedAddress(idx);

    customers.push({
      id: uuid(),
      customer_code: code,
      full_name: fullName,
      phone,
      email,
      address,
      branch_id: null,
      total_balance: 0,
      last_transaction_date: undefined,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    });
  }
  return customers;
}

function normalizeTransactionType(input: string): TransactionType {
  const raw = (input || "").toLowerCase().trim();
  if (raw === "payment" || raw === "thu" || raw === "thanh toán" || raw === "thanhtoan") return "payment";
  if (raw === "charge" || raw === "chi" || raw === "cho nợ" || raw === "chono" || raw === "chon o") return "charge";
  if (raw === "refund" || raw === "hoàn tiền" || raw === "hoantien") return "refund";
  if (raw === "adjustment" || raw === "điều chỉnh" || raw === "dieuchinh") return "adjustment";
  return "payment";
}

function ensureSeedData() {
  if (!isBrowser) return;

  const existingTransactions = safeParseJson<Transaction[]>(
    window.localStorage.getItem(STORAGE_KEYS.transactions),
    [],
  );
  const existingCustomers = safeParseJson<Customer[]>(
    window.localStorage.getItem(STORAGE_KEYS.customers),
    [],
  );
  const existingBankAccounts = safeParseJson<any[]>(
    window.localStorage.getItem(STORAGE_KEYS.bankAccounts),
    [],
  );

  if (existingTransactions.length > 0 && existingCustomers.length > 0 && existingBankAccounts.length > 0) {
    let currentCustomers = [...existingCustomers];
    const desiredCustomerCount = 30;

    if (currentCustomers.length < desiredCustomerCount) {
      const extraCustomers = generateSeedCustomers(
        currentCustomers.length,
        desiredCustomerCount - currentCustomers.length,
      );
      currentCustomers = [...currentCustomers, ...extraCustomers];
      writeCustomers(currentCustomers);
    }

    const customerMap = new Map(currentCustomers.map((c) => [c.id, c] as const));
    const missingFromTransactions = existingTransactions.filter(
      (t) => t.customer_id && !customerMap.has(t.customer_id),
    );
    if (missingFromTransactions.length > 0) {
      const now = getNowIso();
      const added = missingFromTransactions.map((t, idx) => ({
        id: t.customer_id,
        customer_code: generateCustomerCode(currentCustomers.length + idx + 1),
        full_name: t.customer_name || `Khách hàng ${currentCustomers.length + idx + 1}`,
        phone: buildSeedPhone(currentCustomers.length + idx),
        email: buildSeedEmail("Công ty", `Khach${currentCustomers.length + idx + 1}`),
        address: buildSeedAddress(currentCustomers.length + idx),
        branch_id: t.branch_id || randomBranchId(currentCustomers.length + idx),
        total_balance: 0,
        last_transaction_date: t.transaction_date,
        is_active: true,
        created_at: now,
        updated_at: now,
      }));
      currentCustomers = [...currentCustomers, ...added];
      writeCustomers(currentCustomers);
    }

    const refreshedCustomerMap = new Map(
      currentCustomers.map((c) => [c.id, c] as const),
    );
    let enrichedTransactions = existingTransactions.map((t) => {
      if (t.customer_name) return t;
      const customer = refreshedCustomerMap.get(t.customer_id);
      if (!customer) return t;
      return {
        ...t,
        customer_name: customer.full_name,
      };
    });
    const hasAdjustment = enrichedTransactions.some((t) => t.transaction_type === "adjustment");
    const hasRefund = enrichedTransactions.some((t) => t.transaction_type === "refund");
    if (!hasAdjustment || !hasRefund) {
      const now = new Date();
      const fallbackCustomer = currentCustomers[0];
      const fallbackBank = existingBankAccounts[0];
      if (fallbackCustomer && fallbackBank) {
        const extra: Transaction[] = [];
        if (!hasAdjustment) {
          extra.push({
            id: uuid(),
            transaction_code: padTxnCode(enrichedTransactions.length + 1),
            customer_id: fallbackCustomer.id,
            customer_name: fallbackCustomer.full_name,
            bank_account_id: fallbackBank.id,
            bank_account_name: fallbackBank.account_name,
            branch_id: fallbackBank.branch_id,
            transaction_type: "adjustment",
            amount: -1_200_000,
            description: "Điều chỉnh công nợ",
            reference_number: "",
            transaction_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: "seed",
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          });
        }
        if (!hasRefund) {
          extra.push({
            id: uuid(),
            transaction_code: padTxnCode(enrichedTransactions.length + extra.length + 1),
            customer_id: fallbackCustomer.id,
            customer_name: fallbackCustomer.full_name,
            bank_account_id: fallbackBank.id,
            bank_account_name: fallbackBank.account_name,
            branch_id: fallbackBank.branch_id,
            transaction_type: "refund",
            amount: 950_000,
            description: "Hoàn tiền",
            reference_number: "",
            transaction_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            created_by: "seed",
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          });
        }
        if (extra.length) {
          enrichedTransactions = [...extra, ...enrichedTransactions];
        }
      }
    }
    const balanceMap = new Map<string, { balance: number; lastDate?: string }>();
    enrichedTransactions.forEach((tx) => {
      const prev = balanceMap.get(tx.customer_id) || { balance: 0 };
      if (tx.transaction_type === "charge") prev.balance -= Math.abs(tx.amount);
      else if (tx.transaction_type === "payment" || tx.transaction_type === "refund") prev.balance += Math.abs(tx.amount);
      else if (tx.transaction_type === "adjustment") prev.balance += tx.amount;
      const prevDate = prev.lastDate ? new Date(prev.lastDate).getTime() : 0;
      const txDate = new Date(tx.transaction_date).getTime();
      prev.lastDate = txDate > prevDate ? tx.transaction_date : prev.lastDate;
      balanceMap.set(tx.customer_id, prev);
    });
    const updatedCustomers = currentCustomers.map((customer, idx) => {
      const stats = balanceMap.get(customer.id);
      return {
        ...customer,
        phone: customer.phone || buildSeedPhone(idx),
        email: customer.email || buildSeedEmail("Công ty", `Khach${idx + 1}`),
        address: customer.address || buildSeedAddress(idx),
        branch_id: customer.branch_id || randomBranchId(idx),
        total_balance: stats?.balance ?? customer.total_balance,
        last_transaction_date: stats?.lastDate ?? customer.last_transaction_date,
      };
    });
    const hasChanges = enrichedTransactions.some(
      (t, idx) => t.customer_name !== existingTransactions[idx]?.customer_name,
    );
    if (hasChanges || (!hasAdjustment || !hasRefund)) {
      writeTransactions(enrichedTransactions);
    }
    writeCustomers(softenPositiveBalances(updatedCustomers));
    return;
  }

  const bankAccounts = dashboardMockData.bankAccounts.map((account, idx) => ({
    id: account.id,
    account_number: account.account_number || `ACCT${idx + 1}`,
    account_name: account.account_name,
    bank_name: account.account_name.split(" - ")[0],
    branch_id: randomBranchId(idx),
    balance: account.balance,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }));

  const baseCustomers: Customer[] = dashboardMockData.topCustomers.map((c, idx) => {
    const seedIdx = idx;
    const nameParts = c.full_name.split(" ");
    const seedPrefix = CUSTOMER_SEED_PREFIXES[seedIdx % CUSTOMER_SEED_PREFIXES.length];
    const seedName = nameParts[nameParts.length - 1] || CUSTOMER_SEED_NAMES[seedIdx % CUSTOMER_SEED_NAMES.length];
    return {
      id: c.id,
      customer_code: c.customer_code,
      full_name: c.full_name,
      phone: c.phone || buildSeedPhone(seedIdx),
      email: c.email || buildSeedEmail(seedPrefix, seedName),
      address: (c as { address?: string }).address || buildSeedAddress(seedIdx),
      branch_id: randomBranchId(seedIdx),
      total_balance: c.total_balance,
      last_transaction_date: c.last_transaction_date,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
  });

  const generatedCustomers = generateSeedCustomers(baseCustomers.length, Math.max(0, 30 - baseCustomers.length));
  const customers: Customer[] = [...baseCustomers, ...generatedCustomers];

  // Seed ~15 months of varied transactions so charts look alive.
  const seeded: Transaction[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 15);
  start.setHours(0, 0, 0, 0);

  let txnCounter = 1;
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const day = d.getDate();
    const weekday = d.getDay();
    const month = d.getMonth();

    let txCount = 0;
    if (weekday === 0) txCount = 0;
    else if (day <= 5) txCount = 2 + Math.floor(Math.random() * 2);
    else if (day >= 25) txCount = 1 + Math.floor(Math.random() * 2);
    else txCount = Math.floor(Math.random() * 2);

    const seasonFactor = month === 11 || month === 0 ? 1.25 : month === 6 || month === 7 ? 0.85 : 1;

    for (let i = 0; i < txCount; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const bankAccount = bankAccounts[Math.floor(Math.random() * bankAccounts.length)];
      const isInflowDay = day <= 10;
      const roll = Math.random();

      const type: TransactionType = isInflowDay
        ? roll < 0.6
          ? "payment"
          : roll < 0.85
            ? "charge"
            : roll < 0.95
              ? "refund"
              : "adjustment"
        : roll < 0.6
          ? "charge"
          : roll < 0.8
            ? "payment"
            : roll < 0.9
              ? "refund"
              : "adjustment";

      const base =
        type === "payment"
          ? 3_000_000
          : type === "charge"
            ? 4_000_000
            : type === "refund"
              ? 1_500_000
              : 800_000;
      const spread =
        type === "payment"
          ? 12_000_000
          : type === "charge"
            ? 15_000_000
            : type === "refund"
              ? 4_000_000
              : 2_500_000;
      let amount = Math.max(100_000, Math.floor((base + Math.random() * spread) * seasonFactor));
      if (type === "adjustment") {
        amount = Math.max(50_000, Math.floor((base + Math.random() * spread) * seasonFactor));
        amount = Math.random() < 0.5 ? -amount : amount;
      }

      const date = new Date(d);
      date.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0);

      const description =
        type === "payment"
          ? "Thu tiền"
          : type === "charge"
            ? "Chi tiền"
            : type === "refund"
              ? "Hoàn tiền"
              : "Điều chỉnh";

      seeded.push({
        id: uuid(),
        transaction_code: padTxnCode(txnCounter++),
        customer_id: customer.id,
        customer_name: customer.full_name,
        bank_account_id: bankAccount.id,
        bank_account_name: bankAccount.account_name,
        branch_id: bankAccount.branch_id,
        transaction_type: type,
        amount,
        description,
        reference_number: "",
        transaction_date: date.toISOString(),
        created_by: "seed",
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
      });
    }
  }

  const legacyTransactions: Transaction[] = dashboardMockData.recentTransactions.map((t, idx) => ({
    id: t.id,
    transaction_code: t.transaction_code || padTxnCode(idx + 1),
    customer_id: t.customer_id,
    customer_name: (t as any).customer_name,
    bank_account_id: t.bank_account_id,
    bank_account_name: (t as any).bank_account_name,
    branch_id: t.branch_id,
    transaction_type: normalizeTransactionType(String(t.transaction_type)),
    amount: t.amount,
    description: t.description,
    reference_number: t.reference_number,
    transaction_date: t.transaction_date,
    created_by: t.created_by,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));

  const allTransactions = [...legacyTransactions, ...seeded];
  const customerTxnMap = new Map<string, Transaction[]>();
  allTransactions.forEach((tx) => {
    const arr = customerTxnMap.get(tx.customer_id) || [];
    arr.push(tx);
    customerTxnMap.set(tx.customer_id, arr);
  });

  customers.forEach((customer, idx) => {
    if (!customerTxnMap.has(customer.id)) {
      const fallbackAccount = bankAccounts[idx % bankAccounts.length];
      const date = new Date(now);
      date.setDate(now.getDate() - (idx % 20));
      date.setHours(10 + (idx % 8), 15, 0, 0);
      const tx: Transaction = {
        id: uuid(),
        transaction_code: padTxnCode(txnCounter++),
        customer_id: customer.id,
        customer_name: customer.full_name,
        bank_account_id: fallbackAccount.id,
        bank_account_name: fallbackAccount.account_name,
        branch_id: fallbackAccount.branch_id,
        transaction_type: idx % 2 === 0 ? "charge" : "payment",
        amount: 3_000_000 + (idx % 7) * 1_200_000,
        description: idx % 2 === 0 ? "Phát sinh công nợ" : "Thu hồi công nợ",
        reference_number: "",
        transaction_date: date.toISOString(),
        created_by: "seed",
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
      };
      allTransactions.push(tx);
      customerTxnMap.set(customer.id, [tx]);
    }
  });

  const balanceMap = new Map<string, { balance: number; lastDate?: string }>();
  allTransactions.forEach((tx) => {
    const prev = balanceMap.get(tx.customer_id) || { balance: 0 };
    if (tx.transaction_type === "charge") prev.balance -= Math.abs(tx.amount);
    else if (tx.transaction_type === "payment" || tx.transaction_type === "refund") prev.balance += Math.abs(tx.amount);
    else if (tx.transaction_type === "adjustment") prev.balance += tx.amount;
    const prevDate = prev.lastDate ? new Date(prev.lastDate).getTime() : 0;
    const txDate = new Date(tx.transaction_date).getTime();
    prev.lastDate = txDate > prevDate ? tx.transaction_date : prev.lastDate;
    balanceMap.set(tx.customer_id, prev);
  });

  const customersWithBalances = customers.map((customer) => {
    const stats = balanceMap.get(customer.id);
    return {
      ...customer,
      total_balance: stats?.balance ?? customer.total_balance,
      last_transaction_date: stats?.lastDate ?? customer.last_transaction_date,
      branch_id: customer.branch_id || randomBranchId(Math.abs(customer.id.length + customer.full_name.length)),
    };
  });

  window.localStorage.setItem(STORAGE_KEYS.bankAccounts, JSON.stringify(bankAccounts));
  window.localStorage.setItem(
    STORAGE_KEYS.customers,
    JSON.stringify(softenPositiveBalances(customersWithBalances)),
  );
  window.localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(allTransactions));
}

function readTransactions(): Transaction[] {
  if (!isBrowser) return [];
  ensureSeedData();
  return safeParseJson<Transaction[]>(window.localStorage.getItem(STORAGE_KEYS.transactions), []);
}

function writeTransactions(transactions: Transaction[]) {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}

function readCustomers(): Customer[] {
  if (!isBrowser) return [];
  ensureSeedData();
  return safeParseJson<Customer[]>(window.localStorage.getItem(STORAGE_KEYS.customers), []);
}

function writeCustomers(customers: Customer[]) {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers));
}

function readBankAccounts(): any[] {
  if (!isBrowser) return [];
  ensureSeedData();
  return safeParseJson<any[]>(window.localStorage.getItem(STORAGE_KEYS.bankAccounts), []);
}

function readBranches(): Array<{ id: string; name: string }> {
  if (!isBrowser) {
    return [
      { id: "1", name: "Văn phòng chính" },
      { id: "2", name: "Văn phòng Bắc" },
      { id: "3", name: "Văn phòng Nam" },
    ];
  }

  const saved = safeParseJson<any[]>(window.localStorage.getItem("branches"), []);
  if (Array.isArray(saved) && saved.length > 0) {
    return saved
      .map((b: any) => {
        const rawName = String(b.name || b.branch_name || b.code || b.id);
        const normalizedName = rawName.replace(/Chi nhánh/gi, "Văn phòng");
        return { id: String(b.id), name: normalizedName };
      })
      .filter((b: any) => b.id);
  }

  return [
    { id: "1", name: "Văn phòng chính" },
    { id: "2", name: "Văn phòng Bắc" },
    { id: "3", name: "Văn phòng Nam" },
  ];
}

function inflowOutflowByType(type: TransactionType, amount: number) {
  // AR-flow mapping (receivables):
  // - payment: reduce receivable (toward 0)
  // - charge: increase receivable (more negative)
  // - refund: reduce receivable (e.g. return goods reduces debt)
  // - adjustment: can be +/-; positive reduces receivable, negative increases receivable
  if (type === "payment") return { inflow: Math.abs(amount), outflow: 0 };
  if (type === "refund") return { inflow: Math.abs(amount), outflow: 0 };
  if (type === "charge") return { inflow: 0, outflow: Math.abs(amount) };
  if (type === "adjustment") {
    return amount >= 0
      ? { inflow: Math.abs(amount), outflow: 0 }
      : { inflow: 0, outflow: Math.abs(amount) };
  }
  return { inflow: Math.abs(amount), outflow: 0 };
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function dateKeyForRange(date: Date, timeRange: TimeRange) {
  const d = new Date(date);
  if (timeRange === "day") {
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  if (timeRange === "week") {
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  if (timeRange === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  if (timeRange === "quarter") {
    const qStart = Math.floor(d.getMonth() / 3) * 3;
    d.setMonth(qStart, 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function aggregateCashFlow(transactions: Transaction[], timeRange: TimeRange, count: number) {
  const map = new Map<string, { date: string; inflow: number; outflow: number; netFlow: number }>();
  const periodStarts = buildPeriodStarts(timeRange, count, new Date());

  periodStarts.forEach((start) => {
    const key = dateKeyForRange(start, timeRange);
    map.set(key, { date: new Date(key).toISOString(), inflow: 0, outflow: 0, netFlow: 0 });
  });

  for (const tx of transactions) {
    const dt = new Date(tx.transaction_date);
    const key = dateKeyForRange(dt, timeRange);
    const agg = map.get(key) || { date: new Date(key).toISOString(), inflow: 0, outflow: 0, netFlow: 0 };
    const { inflow, outflow } = inflowOutflowByType(tx.transaction_type, tx.amount);
    agg.inflow += inflow;
    agg.outflow += outflow;
    agg.netFlow = agg.inflow - agg.outflow;
    map.set(key, agg);
  }
  return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function receivableBalanceFromTransactions(transactions: Transaction[]) {
  // Receivable (AR) balance: typically negative when there is money to collect.
  // Convention:
  //   charge (increase receivable): subtract
  //   payment/refund (decrease receivable): add
  //   adjustment: add signed amount
  let sum = 0;
  for (const tx of transactions) {
    if (tx.transaction_type === "charge") sum -= Math.abs(tx.amount);
    else if (tx.transaction_type === "payment") sum += Math.abs(tx.amount);
    else if (tx.transaction_type === "refund") sum += Math.abs(tx.amount);
    else if (tx.transaction_type === "adjustment") sum += tx.amount;
    else sum += tx.amount;
  }
  return sum;
}

function cashDeltaFromTransaction(tx: Transaction) {
  // Cash/bank balance convention:
  // - payment increases cash
  // - refund decreases cash
  // - charge does not affect cash (it increases receivable)
  // - adjustment: signed cash adjustment (can be +/-)
  if (tx.transaction_type === "payment") return Math.abs(tx.amount);
  if (tx.transaction_type === "refund") return -Math.abs(tx.amount);
  if (tx.transaction_type === "adjustment") return tx.amount;
  return 0;
}

function buildPeriodStarts(timeRange: TimeRange, count: number, endDate: Date) {
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const starts: Date[] = [];

  if (timeRange === "day") {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      starts.push(d);
    }
    return starts;
  }

  if (timeRange === "week") {
    // Align weeks to Monday
    const endMonday = new Date(end);
    const day = (endMonday.getDay() + 6) % 7;
    endMonday.setDate(endMonday.getDate() - day);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(endMonday);
      d.setDate(endMonday.getDate() - i * 7);
      starts.push(d);
    }
    return starts;
  }

  if (timeRange === "month") {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      starts.push(d);
    }
    return starts;
  }

  if (timeRange === "quarter") {
    const endQuarterStartMonth = Math.floor(end.getMonth() / 3) * 3;
    const endQuarterStart = new Date(end.getFullYear(), endQuarterStartMonth, 1);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(endQuarterStart);
      d.setMonth(endQuarterStart.getMonth() - i * 3);
      starts.push(d);
    }
    return starts;
  }

  // year
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear() - i, 0, 1);
    starts.push(d);
  }
  return starts;
}

function getPeriodWindow(timeRange: TimeRange, count: number) {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date(end));

  if (timeRange === "day") {
    start.setDate(start.getDate() - (count - 1));
  } else if (timeRange === "week") {
    start.setDate(start.getDate() - (count * 7 - 1));
  } else if (timeRange === "month") {
    start.setMonth(start.getMonth() - (count - 1));
    start.setDate(1);
  } else if (timeRange === "quarter") {
    start.setMonth(start.getMonth() - (count * 3 - 3));
    const qStart = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(qStart, 1);
  } else {
    start.setFullYear(start.getFullYear() - (count - 1), 0, 1);
  }

  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
  const prevStart = startOfDay(new Date(prevEnd));
  if (timeRange === "day") {
    prevStart.setDate(prevStart.getDate() - (count - 1));
  } else if (timeRange === "week") {
    prevStart.setDate(prevStart.getDate() - (count * 7 - 1));
  } else if (timeRange === "month") {
    prevStart.setMonth(prevStart.getMonth() - (count - 1));
    prevStart.setDate(1);
  } else if (timeRange === "quarter") {
    prevStart.setMonth(prevStart.getMonth() - (count * 3 - 3));
    const qStart = Math.floor(prevStart.getMonth() / 3) * 3;
    prevStart.setMonth(qStart, 1);
  } else {
    prevStart.setFullYear(prevStart.getFullYear() - (count - 1), 0, 1);
  }

  return { start, end, prevStart, prevEnd };
}

// Customer service
const customerService = {
  async getCustomers(_filters?: any) {
    ensureSeedData();
    const all = readCustomers();
    const search = String(_filters?.search || "").toLowerCase().trim();
    const filtered = search
      ? all.filter((c) =>
          [c.full_name, c.customer_code, c.email, c.phone]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search)),
        )
      : all;
    const limit = Number.isFinite(_filters?.limit) ? Number(_filters.limit) : filtered.length;
    const offset = Number.isFinite(_filters?.offset) ? Number(_filters.offset) : 0;
    const data = filtered.slice(offset, offset + limit);
    return {
      data,
      error: null,
      count: filtered.length,
    };
  },
  
  async getCustomerById(id: string) {
    ensureSeedData();
    const customers = readCustomers();
    const customer = customers.find((c) => c.id === id);
    
    if (!customer) {
      return {
        data: null,
        error: "Customer not found",
      };
    }

    return {
      data: {
        ...customer,
      },
      error: null,
    };
  },
  
  async createCustomer(_customerData?: any) {
    ensureSeedData();
    const now = getNowIso();
    const customers = readCustomers();
    const id = uuid();
    const customer: Customer = {
      id,
      customer_code: _customerData?.customer_code || `CUST${String(customers.length + 1).padStart(4, "0")}`,
      full_name: String(_customerData?.full_name || "").trim(),
      phone: _customerData?.phone || "",
      email: _customerData?.email || "",
      address: _customerData?.address || "",
      branch_id: _customerData?.branch_id ?? null,
      total_balance: 0,
      last_transaction_date: undefined,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    writeCustomers([customer, ...customers]);
    return { data: customer, error: null };
  },
  
  async updateCustomer(_id: string, _updates?: any) {
    ensureSeedData();
    const customers = readCustomers();
    const idx = customers.findIndex((c) => c.id === _id);
    if (idx === -1) {
      return { data: null, error: "Customer not found" };
    }
    const now = getNowIso();
    const updated = {
      ...customers[idx],
      ..._updates,
      updated_at: now,
    } as Customer;
    const next = [...customers];
    next[idx] = updated;
    writeCustomers(next);
    return { data: updated, error: null };
  },
  
  async deleteCustomer(_id: string) {
    ensureSeedData();
    const customers = readCustomers();
    const next = customers.filter((c) => c.id !== _id);
    writeCustomers(next);
    return { error: null };
  },
  
  async bulkCreateCustomers(_customers?: any[]) {
    ensureSeedData();
    const customers = readCustomers();
    const now = getNowIso();
    const created: Customer[] = [];
    const errors: any[] = [];

    (_customers || []).forEach((raw: any, idx: number) => {
      if (!raw?.full_name) {
        errors.push({ row: idx, message: "Missing full_name" });
        return;
      }
      const id = uuid();
      const customer: Customer = {
        id,
        customer_code: raw.customer_code || generateCustomerCode(customers.length + created.length + 1),
        full_name: String(raw.full_name || "").trim(),
        phone: raw.phone || "",
        email: raw.email || "",
        address: raw.address || "",
        branch_id: raw.branch_id ?? null,
        total_balance: 0,
        last_transaction_date: undefined,
        is_active: raw.is_active ?? true,
        created_at: now,
        updated_at: now,
      };
      created.push(customer);
    });

    writeCustomers([...created, ...customers]);
    return { data: created, errors };
  },
};

// Transaction service
const transactionService = {
  async getTransactions(_filters?: any) {
    ensureSeedData();
    const filters = _filters || {};
    const all = readTransactions();

    const search = String(filters.search || "").toLowerCase().trim();
    const dateRange = filters.dateRange as { start: string; end: string } | undefined;
    const transactionType = filters.transaction_type as TransactionType | undefined;
    const customerId = filters.customer_id as string | undefined;
    const branchId = filters.branch_id as string | undefined;

    const filtered = all.filter((tx) => {
      if (branchId && tx.branch_id !== branchId) return false;
      if (transactionType && tx.transaction_type !== transactionType) return false;
      if (customerId && tx.customer_id !== customerId) return false;
      if (dateRange?.start && dateRange?.end) {
        const t = new Date(tx.transaction_date).getTime();
        const s = new Date(dateRange.start).getTime();
        const e = new Date(dateRange.end).getTime();
        if (Number.isFinite(s) && Number.isFinite(e)) {
          if (t < s || t > e) return false;
        }
      }
      if (search) {
        const hay = [
          tx.transaction_code,
          tx.customer_name,
          tx.bank_account_name,
          tx.description,
          tx.reference_number,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    const page = Number(filters.page || 1);
    const pageSize = Number(filters.pageSize || 20);
    const startIndex = (page - 1) * pageSize;
    const pageData = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data: pageData,
      error: null,
      count: filtered.length,
    };
  },
  
  async getTransactionById(id: string) {
    ensureSeedData();
    const transaction = readTransactions().find((t) => t.id === id);
    
    if (!transaction) {
      return {
        data: {
          id: "1",
          transaction_code: "TXN0001",
          customer_id: "1",
          bank_account_id: "1",
          branch_id: "1",
          transaction_type: "payment" as const,
          amount: 500,
          description: "Test payment",
          reference_number: "REF123",
          transaction_date: "2024-01-01T00:00:00Z",
          created_by: "test-user",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        error: null,
      };
    }
    
    return {
      data: transaction,
      error: null,
    };
  },
  
  async createTransaction(_transactionData?: any) {
    ensureSeedData();
    const now = getNowIso();
    const all = readTransactions();
    const customers = readCustomers();
    const bankAccounts = readBankAccounts();

    const bankAccountId = String(_transactionData?.bank_account_id || "");
    const bank = bankAccounts.find((b) => b.id === bankAccountId) || bankAccounts[0];
    const customerId = String(_transactionData?.customer_id || "");
    const customer = customers.find((c) => c.id === customerId);

    const tx: Transaction = {
      id: uuid(),
      transaction_code: padTxnCode(all.length + 1),
      customer_id: customer?.id || customerId || "",
      customer_name: customer?.full_name,
      bank_account_id: bank?.id || bankAccountId || "",
      bank_account_name: bank?.account_name,
      branch_id: String(_transactionData?.branch_id || bank?.branch_id || "1"),
      transaction_type: normalizeTransactionType(String(_transactionData?.transaction_type || "payment")),
      amount: Number(_transactionData?.amount || 0),
      description: _transactionData?.description || "",
      reference_number: _transactionData?.reference_number || "",
      transaction_date: _transactionData?.transaction_date || now,
      created_by: _transactionData?.created_by || "",
      created_at: now,
      updated_at: now,
    };

    writeTransactions([tx, ...all]);
    return { data: tx, error: null };
  },
  
  async updateTransaction(_id: string, _updates?: any) {
    return { data: null, error: null };
  },
  
  async deleteTransaction(_id: string) {
    return { error: null };
  },
  
  async bulkImportTransactions(
    _rawData?: any[],
    _branchId?: string,
    _createdBy?: string,
  ) {
    ensureSeedData();
    const raw = Array.isArray(_rawData) ? _rawData : [];
    const branchId = String(_branchId || "1");
    const createdBy = String(_createdBy || "");

    const bankAccounts = readBankAccounts();
    const customers = readCustomers();
    const transactions = readTransactions();

    const created: Transaction[] = [];
    const errors: any[] = [];
    let nextCounter = transactions.length + 1;

    const findOrCreateCustomer = (name: string) => {
      const fullName = String(name || "").trim();
      if (!fullName) return null;
      const existed = customers.find((c) => c.full_name.toLowerCase() === fullName.toLowerCase());
      if (existed) return existed;
      const now = getNowIso();
      const newCustomer: Customer = {
        id: uuid(),
        customer_code: `CUST${String(customers.length + 1).padStart(4, "0")}`,
        full_name: fullName,
        phone: "",
        email: "",
        address: "",
        branch_id: branchId,
        total_balance: 0,
        last_transaction_date: undefined,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      customers.unshift(newCustomer);
      return newCustomer;
    };

    const resolveBankAccount = (input: string) => {
      const v = String(input || "").trim();
      if (!v) return bankAccounts[0];
      const byNumber = bankAccounts.find((b) => String(b.account_number || "") === v);
      if (byNumber) return byNumber;
      const lower = v.toLowerCase();
      const byName = bankAccounts.find((b) => String(b.account_name || "").toLowerCase().includes(lower));
      if (byName) return byName;
      const byBank = bankAccounts.find((b) => String(b.bank_name || "").toLowerCase().includes(lower));
      return byBank || bankAccounts[0];
    };

    for (let i = 0; i < raw.length; i++) {
      const row = raw[i] || {};
      try {
        const customerName = row.customer_name || row.full_name || row.customer || "";
        const customer = findOrCreateCustomer(customerName);

        const bankInput = row.bank_account || row.bank_account_name || row.account_number || "";
        const bank = resolveBankAccount(bankInput);

        const type = normalizeTransactionType(String(row.transaction_type || "payment"));
        const amount = Number(String(row.amount || 0).replace(/[$,€£¥₫\s]/g, ""));
        const dateStr = String(row.transaction_date || row.date || "");
        const txDate = dateStr ? new Date(dateStr) : new Date();

        const now = getNowIso();
        const tx: Transaction = {
          id: uuid(),
          transaction_code: padTxnCode(nextCounter++),
          customer_id: customer?.id || "",
          customer_name: customer?.full_name,
          bank_account_id: bank?.id || "",
          bank_account_name: bank?.account_name,
          branch_id: branchId,
          transaction_type: type,
          amount: Number.isFinite(amount) ? amount : 0,
          description: row.description || "",
          reference_number: row.reference_number || "",
          transaction_date: Number.isFinite(txDate.getTime()) ? txDate.toISOString() : now,
          created_by: createdBy,
          created_at: now,
          updated_at: now,
        };
        created.push(tx);
      } catch (e) {
        errors.push({ row: i, message: e instanceof Error ? e.message : "Import error" });
      }
    }

    if (created.length > 0) {
      writeCustomers(customers);
      writeTransactions([...created, ...transactions]);
    }

    return { data: created, errors };
  },
};

// Bank account service
const bankAccountService = {
  async getBankAccounts(_filters?: any) {
    ensureSeedData();
    return {
      data: readBankAccounts(),
      error: null,
    };
  },
  
  async getBankAccountById(id: string) {
    ensureSeedData();
    const account = readBankAccounts().find((a) => a.id === id);
    
    if (!account) {
      return {
        data: {
          id: "1",
          account_number: "123456",
          account_name: "Test Bank",
          bank_name: "Test Bank",
          branch_id: "1",
          balance: 1000,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        error: null,
      };
    }
    
    return {
      data: {
        ...account,
      },
      error: null,
    };
  },
};

// Branch service
const branchService = {
  async getBranches() {
    return {
      data: dashboardMockData.transactionAmountsByBranch.day.map(branch => ({
        id: branch.branch_id,
        name: branch.branch_name,
        code: `BR${branch.branch_id}`,
        address: `${branch.branch_id}23 Đường chính, Quận 1, TP.HCM`,
        phone: `01234${branch.branch_id}789`,
        email: `${branch.branch_name.toLowerCase().replace(/\s+/g, '')}@branch.com`,
        manager_id: "test-user",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      })),
      error: null,
    };
  },
  
  async getBranchById(id: string) {
    const branch = dashboardMockData.transactionAmountsByBranch.day.find(b => b.branch_id === id);
    
    if (!branch) {
      return {
        data: {
          id: "1",
          name: "Main Branch",
          code: "MB001",
          address: "123 Main St",
          phone: "0123456789",
          email: "main@branch.com",
          manager_id: "test-user",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        error: null,
      };
    }
    
    return {
      data: {
        id: branch.branch_id,
        name: branch.branch_name,
        code: `BR${branch.branch_id}`,
        address: `${branch.branch_id}23 Đường chính, Quận 1, TP.HCM`,
        phone: `01234${branch.branch_id}789`,
        email: `${branch.branch_name.toLowerCase().replace(/\s+/g, '')}@branch.com`,
        manager_id: "test-user",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      error: null,
    };
  },
};

// Dashboard service
const dashboardService = {
  async getDashboardMetrics(
    _branchId?: string,
    timeRange: TimeRange = "month",
    rangeCount?: { day: number; week: number; month: number; quarter: number }
  ) {
    ensureSeedData();
    const branchId = String(_branchId || "");
    const transactionsAll = readTransactions();
    const transactions = branchId ? transactionsAll.filter((t) => t.branch_id === branchId) : transactionsAll;

    const count =
      timeRange === "day"
        ? rangeCount?.day || 7
        : timeRange === "week"
          ? rangeCount?.week || 8
          : timeRange === "month"
            ? rangeCount?.month || 7
            : timeRange === "quarter"
              ? rangeCount?.quarter || 8
              : 2;

    const { start, end, prevStart, prevEnd } = getPeriodWindow(timeRange, count);
    const inRange = (tx: Transaction, s: Date, e: Date) => {
      const t = new Date(tx.transaction_date).getTime();
      return t >= s.getTime() && t <= e.getTime();
    };

    const currentTx = transactions.filter((tx) => inRange(tx, start, end));
    const prevTx = transactions.filter((tx) => inRange(tx, prevStart, prevEnd));

    // Display purposes in UI currently use labels "Thu" and "Cho nợ".
    // Map to receivable logic:
    // - Thu (decrease AR): payment + refund + positive adjustments
    // - Cho nợ (increase AR): charge + negative adjustments
    const sumPositiveAdjustment = (txs: Transaction[]) =>
      txs
        .filter((t) => t.transaction_type === "adjustment" && t.amount >= 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
    const sumNegativeAdjustment = (txs: Transaction[]) =>
      txs
        .filter((t) => t.transaction_type === "adjustment" && t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);

    const currentIncome =
      currentTx
        .filter((t) => t.transaction_type === "payment" || t.transaction_type === "refund")
        .reduce((s, t) => s + Math.abs(t.amount), 0) + sumPositiveAdjustment(currentTx);
    const currentDebt =
      currentTx
        .filter((t) => t.transaction_type === "charge")
        .reduce((s, t) => s + Math.abs(t.amount), 0) + sumNegativeAdjustment(currentTx);

    const prevIncome =
      prevTx
        .filter((t) => t.transaction_type === "payment" || t.transaction_type === "refund")
        .reduce((s, t) => s + Math.abs(t.amount), 0) + sumPositiveAdjustment(prevTx);
    const prevDebt =
      prevTx
        .filter((t) => t.transaction_type === "charge")
        .reduce((s, t) => s + Math.abs(t.amount), 0) + sumNegativeAdjustment(prevTx);

    const currentPaymentCount = currentTx.filter((t) => t.transaction_type === "payment").length;
    const currentChargeCount = currentTx.filter((t) => t.transaction_type === "charge").length;
    const prevPaymentCount = prevTx.filter((t) => t.transaction_type === "payment").length;
    const prevChargeCount = prevTx.filter((t) => t.transaction_type === "charge").length;

    const activeCustomers = new Set(currentTx.map((t) => t.customer_id)).size;
    const prevActiveCustomers = new Set(prevTx.map((t) => t.customer_id)).size;

    const outstanding = receivableBalanceFromTransactions(transactions);
    const prevOutstanding = receivableBalanceFromTransactions(
      transactions.filter((t) => new Date(t.transaction_date) <= prevEnd),
    );

    const cashFlowData = aggregateCashFlow(currentTx, timeRange, count);

    const bankAccounts = readBankAccounts();
    const balanceByBankAccountAll = bankAccounts.map((b) => {
      const txForAccount = transactions.filter((t) => t.bank_account_id === b.id);
      // Cash balance at period end (never negative)
      const baseCash = Number(b.balance || 0);
      const periodStarts = buildPeriodStarts(timeRange, count, end);
      const periodStart = periodStarts[0] ? new Date(periodStarts[0]) : start;
      const cashBeforeStart = txForAccount
        .filter((t) => new Date(t.transaction_date).getTime() < periodStart.getTime())
        .reduce((s, t) => s + cashDeltaFromTransaction(t), 0);

      let runningCash = Math.max(0, baseCash + cashBeforeStart);

      const historical_data = periodStarts.map((ps, idx) => {
        const next = idx < periodStarts.length - 1 ? periodStarts[idx + 1] : null;
        const periodEnd = next
          ? new Date(new Date(next).getTime() - 1)
          : end;

        const delta = txForAccount
          .filter((t) => {
            const ts = new Date(t.transaction_date).getTime();
            return ts >= ps.getTime() && ts <= periodEnd.getTime();
          })
          .reduce((s, t) => s + cashDeltaFromTransaction(t), 0);

        runningCash = Math.max(0, runningCash + delta);
        return { date: ps.toISOString(), balance: runningCash };
      });

      const balance = historical_data.length > 0 ? historical_data[historical_data.length - 1].balance : runningCash;
      return {
        bank_account_id: b.id,
        account_name: b.account_name,
        account_number: b.account_number,
        balance,
        historical_data,
      };
    });

    const balanceByBankAccount = balanceByBankAccountAll
      .slice()
      .sort((a, b) => a.balance - b.balance)
      .slice(Math.min(2, balanceByBankAccountAll.length));

    const customers = readCustomers();
    const customerBalanceMap = new Map<string, number>();
    for (const tx of transactions) {
      const prev = customerBalanceMap.get(tx.customer_id) || 0;
      if (tx.transaction_type === "charge") customerBalanceMap.set(tx.customer_id, prev - Math.abs(tx.amount));
      else if (tx.transaction_type === "payment") customerBalanceMap.set(tx.customer_id, prev + Math.abs(tx.amount));
      else if (tx.transaction_type === "refund") customerBalanceMap.set(tx.customer_id, prev + Math.abs(tx.amount));
      else if (tx.transaction_type === "adjustment") customerBalanceMap.set(tx.customer_id, prev + tx.amount);
      else customerBalanceMap.set(tx.customer_id, prev + tx.amount);
    }

    const customersWithBalance = customers.map((c) => ({
      ...c,
      total_balance: customerBalanceMap.get(c.id) ?? c.total_balance,
    }));

    const debtCustomers = customersWithBalance
      .filter((c) => c.total_balance < 0)
      .sort((a, b) => a.total_balance - b.total_balance);

    const positiveThreshold = 5_000_000;
    const smallCreditCustomers = customersWithBalance
      .filter((c) => c.total_balance >= 0 && c.total_balance <= positiveThreshold)
      .sort((a, b) => b.total_balance - a.total_balance);

    const topCustomers = [...debtCustomers, ...smallCreditCustomers].slice(0, 10);

    const recentTransactions = [...currentTx]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 20);

    const branches = readBranches();
    const branchNameMap = new Map(branches.map((b) => [b.id, b.name] as const));

    const branchAgg = new Map<string, { incomeAmount: number; debtAmount: number }>();
    for (const tx of currentTx) {
      const branchIdForTx = String(tx.branch_id || "1");
      const prev = branchAgg.get(branchIdForTx) || { incomeAmount: 0, debtAmount: 0 };
      if (tx.transaction_type === "payment" || tx.transaction_type === "refund") {
        prev.incomeAmount += Math.abs(tx.amount);
      } else if (tx.transaction_type === "charge") {
        prev.debtAmount += Math.abs(tx.amount);
      } else if (tx.transaction_type === "adjustment") {
        if (tx.amount >= 0) prev.incomeAmount += Math.abs(tx.amount);
        else prev.debtAmount += Math.abs(tx.amount);
      } else {
        prev.incomeAmount += tx.amount;
      }
      branchAgg.set(branchIdForTx, prev);
    }

    const transactionAmountsByBranch = Array.from(branchAgg.entries())
      .map(([branch_id, v]) => ({
        branch_id,
        branch_name: branchNameMap.get(branch_id) || `Branch ${branch_id}`,
        incomeAmount: v.incomeAmount,
        debtAmount: v.debtAmount,
      }))
      .sort((a, b) => b.incomeAmount + b.debtAmount - (a.incomeAmount + a.debtAmount));

    // Return the dashboard metrics
    return {
      data: {
        totalOutstanding: outstanding,
        totalOutstandingChange: outstanding - prevOutstanding,
        activeCustomers,
        activeCustomersChange: activeCustomers - prevActiveCustomers,
        transactionPaymentCount: currentPaymentCount,
        transactionChargeCount: currentChargeCount,
        transactionPaymentChange: currentPaymentCount - prevPaymentCount,
        transactionChargeChange: currentChargeCount - prevChargeCount,
        transactionIncomeInPeriod: currentIncome,
        transactionDebtInPeriod: currentDebt,
        transactionIncomeChange: currentIncome - prevIncome,
        transactionDebtChange: currentDebt - prevDebt,
        balanceByBankAccount,
        cashFlowData,
        cashFlowStartBalance: prevOutstanding,
        cashFlowEndBalance: outstanding,
        transactionAmountsByBranch,
        recentTransactions,
        topCustomers,
      },
      error: null,
    };
  }
  ,

  async getReceivableLedger(
    _branchId?: string,
    timeRange: TimeRange = "month",
    rangeCount?: { day: number; week: number; month: number; quarter: number },
  ) {
    ensureSeedData();
    const branchId = String(_branchId || "");
    const transactionsAll = readTransactions();
    const transactions = branchId
      ? transactionsAll.filter((t) => t.branch_id === branchId)
      : transactionsAll;

    const count =
      timeRange === "day"
        ? rangeCount?.day || 7
        : timeRange === "week"
          ? rangeCount?.week || 8
          : timeRange === "month"
            ? rangeCount?.month || 7
            : timeRange === "quarter"
              ? rangeCount?.quarter || 8
              : 2;

    const { start, end } = getPeriodWindow(timeRange, count);

    const periodStart = start;
    const periodEnd = end;

    const txBeforeStart = transactions.filter(
      (t) => new Date(t.transaction_date).getTime() < periodStart.getTime(),
    );
    const openingBalance = receivableBalanceFromTransactions(txBeforeStart);

    const txInPeriod = transactions
      .filter((t) => {
        const ts = new Date(t.transaction_date).getTime();
        return ts >= periodStart.getTime() && ts <= periodEnd.getTime();
      })
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    const branches = readBranches();
    const branchNameMap = new Map(branches.map((b) => [b.id, b.name] as const));

    const rowEffect = (t: Transaction) => {
      if (t.transaction_type === "charge") return -Math.abs(t.amount);
      if (t.transaction_type === "payment") return Math.abs(t.amount);
      if (t.transaction_type === "refund") return Math.abs(t.amount);
      if (t.transaction_type === "adjustment") return t.amount;
      return t.amount;
    };

    const rowIncrease = (t: Transaction) => {
      if (t.transaction_type === "charge") return Math.abs(t.amount);
      if (t.transaction_type === "adjustment" && t.amount < 0) return Math.abs(t.amount);
      return 0;
    };

    const rowDecrease = (t: Transaction) => {
      if (t.transaction_type === "payment") return Math.abs(t.amount);
      if (t.transaction_type === "refund") return Math.abs(t.amount);
      if (t.transaction_type === "adjustment" && t.amount > 0) return Math.abs(t.amount);
      return 0;
    };

    let runningBalance = openingBalance;
    const rows = txInPeriod.map((t) => {
      const delta = rowEffect(t);
      runningBalance += delta;
      return {
        transaction_date: t.transaction_date,
        transaction_code: t.transaction_code,
        customer_id: t.customer_id,
        customer_name: t.customer_name,
        branch_id: t.branch_id,
        branch_name: branchNameMap.get(t.branch_id) || `Branch ${t.branch_id}`,
        bank_account_id: t.bank_account_id,
        bank_account_name: t.bank_account_name,
        transaction_type: t.transaction_type,
        description: t.description || "",
        reference_number: t.reference_number || "",
        increase: rowIncrease(t),
        decrease: rowDecrease(t),
        delta,
        running_balance: runningBalance,
      };
    });

    const closingBalance = runningBalance;

    return {
      data: {
        timeRange,
        count,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        openingBalance,
        closingBalance,
        rows,
      },
      error: null,
    };
  }
};

// Export all services as a single object to match the import in Dashboard.tsx
export const databaseService = {
  dashboard: dashboardService,
  customers: customerService,
  transactions: transactionService,
  bankAccounts: bankAccountService,
  branches: branchService
};
