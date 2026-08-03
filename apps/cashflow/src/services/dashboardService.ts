import { BaseService } from "@superapp/shared-utils";
import { supabase , apiClient} from "./supabase";
import { getTrialMode, trialGet } from "./trialMockStore";
import { parseAmount } from "./businessLogic";
import type { Transaction, TimeRange, Customer } from "../types";

function getNowIso() {
  return new Date().toISOString();
}

function uuid() {
  const anyCrypto = (globalThis as any).crypto;
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function normalizeTransactionType(input: string) {
  const raw = (input || "").toLowerCase().trim();
  if (raw === "payment" || raw === "thu" || raw === "điều chỉnh giảm" || raw === "dieuchinhgiam" || raw === "thanh toán" || raw === "thanhtoan") return "payment";
  if (raw === "charge" || raw === "chi" || raw === "điều chỉnh tăng" || raw === "dieuchinhtang" || raw === "cho nợ" || raw === "chono") return "charge";
  if (raw === "refund" || raw === "hoàn tiền" || raw === "hoantien") return "refund";
  if (raw === "adjustment" || raw === "điều chỉnh" || raw === "dieuchinh") return "adjustment";
  return "payment";
}

function inflowOutflowByType(type: string, amount: number) {
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

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear() - i, 0, 1);
    starts.push(d);
  }
  return starts;
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
  if (tx.transaction_type === "payment") return Math.abs(tx.amount);
  if (tx.transaction_type === "refund") return -Math.abs(tx.amount);
  if (tx.transaction_type === "adjustment") return tx.amount;
  return 0;
}

function getPeriodWindow(timeRange: TimeRange, count: number, baseDate?: Date) {
  const end = endOfDay(baseDate ? new Date(baseDate) : new Date());
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

export class DashboardService extends BaseService {
  static async getDashboardMetrics(_branchId?: string, timeRange: TimeRange = "month", rangeCount?: any, companyId?: string) {
    const branchId = String(_branchId || "");

    if (getTrialMode()) {
      const mockTransactions = trialGet("transactions") || [];
      const mockCustomers = trialGet("customers") || [];
      const mockBankAccounts = trialGet("bank_accounts") || [];
      const mockBranches = trialGet("branches") || [];

      const currentIncome = mockTransactions
        .filter((t: any) => t.transaction_type === "payment" || t.transaction_type === "refund")
        .reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      const currentDebt = mockTransactions
        .filter((t: any) => t.transaction_type === "charge")
        .reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      const outstanding = mockCustomers.reduce((s: number, c: any) => s + (Math.abs(c.total_balance) || 0), 0);
      const activeCustomers = mockCustomers.length;
      const currentPaymentCount = mockTransactions.filter((t: any) => t.transaction_type === "payment").length;
      const currentChargeCount = mockTransactions.filter((t: any) => t.transaction_type === "charge").length;

      const recentTransactions = [...mockTransactions]
        .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        .slice(0, 20);

      const topCustomers = [...mockCustomers]
        .sort((a: any, b: any) => Math.abs(b.total_balance) - Math.abs(a.total_balance))
        .slice(0, 10);

      const balanceByBankAccount = mockBankAccounts.map((b: any) => ({
        bank_account_id: b.id,
        account_name: b.account_name,
        account_number: b.account_number,
        balance: b.balance || 0,
        historical_data: [],
      }));

      const count =
        timeRange === "day" ? rangeCount?.day || 7 : timeRange === "week" ? rangeCount?.week || 8 : timeRange === "month" ? rangeCount?.month || 7 : timeRange === "quarter" ? rangeCount?.quarter || 8 : 2;
      const cashFlowData = aggregateCashFlow(mockTransactions, timeRange, count);
      
      const transactionAmountsByBranch = mockBranches.map((b: any) => ({
        branch_id: b.id,
        branch_name: b.name,
        incomeAmount: currentIncome,
        debtAmount: currentDebt,
      }));

      return {
        data: {
          totalOutstanding: outstanding,
          totalOutstandingChange: 0,
          activeCustomers,
          activeCustomersChange: 0,
          transactionPaymentCount: currentPaymentCount,
          transactionChargeCount: currentChargeCount,
          transactionPaymentChange: 0,
          transactionChargeChange: 0,
          transactionIncomeInPeriod: currentIncome,
          transactionDebtInPeriod: currentDebt,
          transactionIncomeChange: 0,
          transactionDebtChange: 0,
          balanceByBankAccount,
          cashFlowData,
          cashFlowStartBalance: outstanding,
          cashFlowEndBalance: outstanding,
          transactionAmountsByBranch,
          recentTransactions,
          topCustomers,
        },
        error: null,
      };
    }

    const [txResult, custResult, bankResult, branchResult] = await Promise.all([
      apiClient.from("transactions").select("*").order("transaction_date", { ascending: false }),
      apiClient.from("customers").select("*"),
      apiClient.from("bank_accounts").select("*"),
      apiClient.from("branches").select("id, name"),
    ]);

    const transactionsAll: Transaction[] = (txResult.data || []) as Transaction[];
    let transactions = companyId ? transactionsAll.filter((t: any) => !t.company_id || t.company_id === companyId) : transactionsAll;
    transactions = branchId ? transactions.filter((t) => (t as any).branch_id === branchId) : transactions;

    const latestTxDate = transactions.length ? new Date(transactions.slice().sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0].transaction_date) : undefined;

    const count = timeRange === "day" ? rangeCount?.day || 7 : timeRange === "week" ? rangeCount?.week || 8 : timeRange === "month" ? rangeCount?.month || 7 : timeRange === "quarter" ? rangeCount?.quarter || 8 : 2;

    const { start, end, prevStart, prevEnd } = getPeriodWindow(timeRange, count, latestTxDate);
    const inRange = (tx: Transaction, s: Date, e: Date) => {
      const t = new Date(tx.transaction_date).getTime();
      return t >= s.getTime() && t <= e.getTime();
    };

    const currentTx = transactions.filter((tx) => inRange(tx, start, end));
    const prevTx = transactions.filter((tx) => inRange(tx, prevStart, prevEnd));

    const sumPositiveAdjustment = (txs: Transaction[]) => txs.filter((t) => t.transaction_type === "adjustment" && t.amount >= 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const sumNegativeAdjustment = (txs: Transaction[]) => txs.filter((t) => t.transaction_type === "adjustment" && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    const currentIncome = currentTx.filter((t) => t.transaction_type === "payment" || t.transaction_type === "refund").reduce((s, t) => s + Math.abs(t.amount), 0) + sumPositiveAdjustment(currentTx);
    const currentDebt = currentTx.filter((t) => t.transaction_type === "charge").reduce((s, t) => s + Math.abs(t.amount), 0) + sumNegativeAdjustment(currentTx);

    const prevIncome = prevTx.filter((t) => t.transaction_type === "payment" || t.transaction_type === "refund").reduce((s, t) => s + Math.abs(t.amount), 0) + sumPositiveAdjustment(prevTx);
    const prevDebt = prevTx.filter((t) => t.transaction_type === "charge").reduce((s, t) => s + Math.abs(t.amount), 0) + sumNegativeAdjustment(prevTx);

    const currentPaymentCount = currentTx.filter((t) => t.transaction_type === "payment").length;
    const currentChargeCount = currentTx.filter((t) => t.transaction_type === "charge").length;
    const prevPaymentCount = prevTx.filter((t) => t.transaction_type === "payment").length;
    const prevChargeCount = prevTx.filter((t) => t.transaction_type === "charge").length;

    const activeCustomers = new Set(currentTx.map((t) => t.customer_id).filter((id): id is string => id !== null)).size;
    const prevActiveCustomers = new Set(prevTx.map((t) => t.customer_id).filter((id): id is string => id !== null)).size;

    const customersAll: Customer[] = (custResult.data || []) as Customer[];
    const balanceMap = new Map<string, number>();
    for (const c of customersAll) {
      balanceMap.set(c.id, parseAmount(c.total_balance));
    }
    const applyTxToMap = (txs: Transaction[]) => {
      for (const tx of txs) {
        if (!tx.customer_id) continue;
        const prev = balanceMap.get(tx.customer_id) || 0;
        const amtSigned = parseAmount(tx.amount);
        const amtAbs = Math.abs(amtSigned);
        switch (normalizeTransactionType(String(tx.transaction_type || ""))) {
          case "payment": balanceMap.set(tx.customer_id, prev - amtAbs); break;
          case "charge": balanceMap.set(tx.customer_id, prev + amtAbs); break;
          case "refund": balanceMap.set(tx.customer_id, prev - amtAbs); break;
          case "adjustment": balanceMap.set(tx.customer_id, prev + amtSigned); break;
          default: balanceMap.set(tx.customer_id, prev + amtSigned); break;
        }
      }
    };

    applyTxToMap(transactions);
    const outstanding = Array.from(balanceMap.values()).reduce((s, v) => s + v, 0);

    const prevBalanceMap = new Map(balanceMap);
    prevBalanceMap.forEach((_, k) => prevBalanceMap.set(k, parseAmount(customersAll.find(c => c.id === k)?.total_balance)));
    for (const tx of transactions.filter((t) => new Date(t.transaction_date) <= prevEnd)) {
      if (!tx.customer_id) continue;
      const prev = prevBalanceMap.get(tx.customer_id) || 0;
      const amtSigned = parseAmount(tx.amount);
      const amtAbs = Math.abs(amtSigned);
      const type = normalizeTransactionType(String(tx.transaction_type || ""));
      if (type === "payment") prevBalanceMap.set(tx.customer_id, prev - amtAbs);
      else if (type === "charge") prevBalanceMap.set(tx.customer_id, prev + amtAbs);
      else if (type === "refund") prevBalanceMap.set(tx.customer_id, prev - amtAbs);
      else prevBalanceMap.set(tx.customer_id, prev + amtSigned);
    }
    const prevOutstanding = Array.from(prevBalanceMap.values()).reduce((s, v) => s + v, 0);

    const cashFlowData = aggregateCashFlow(currentTx, timeRange, count);

    const bankAccounts = (bankResult.data || []) as any[];
    const balanceByBankAccountAll = bankAccounts.map((b) => {
      const txForAccount = transactions.filter((t) => t.bank_account_id === b.id);
      const periodStarts = buildPeriodStarts(timeRange, count, end);
      const periodStart = periodStarts[0] ?? start;
      const txBeforeStart = txForAccount.filter((t) => new Date(t.transaction_date).getTime() < periodStart.getTime());
      const baseCash = txBeforeStart.reduce((s, t) => s + cashDeltaFromTransaction(t), 0);
      const periodDeltas = periodStarts.map((ps, idx) => {
        const next = idx < periodStarts.length - 1 ? periodStarts[idx + 1] : null;
        const periodEnd = next ? new Date(new Date(next).getTime() - 1) : end;
        return txForAccount.filter((t) => { const ts = new Date(t.transaction_date).getTime(); return ts >= ps.getTime() && ts <= periodEnd.getTime(); }).reduce((s, t) => s + cashDeltaFromTransaction(t), 0);
      });

      const periodBalances: number[] = Array(periodStarts.length).fill(baseCash);
      let runningCash = baseCash;
      for (let i = 0; i < periodDeltas.length; i++) {
        runningCash += periodDeltas[i];
        periodBalances[i] = runningCash;
      }

      const historical_data = periodStarts.map((ps, idx) => ({ date: ps.toISOString(), balance: periodBalances[idx] ?? baseCash }));
      const balance = historical_data.length > 0 ? historical_data[historical_data.length - 1].balance : baseCash;
      return { bank_account_id: b.id, account_name: b.account_name, account_number: b.account_number, balance, historical_data };
    });

    const balanceByBankAccount = balanceByBankAccountAll.slice().sort((a, b) => a.balance - b.balance).slice(Math.min(2, balanceByBankAccountAll.length));

    const customersWithBalance = customersAll.map((c) => ({ ...c, total_balance: balanceMap.get(c.id) ?? c.total_balance }));
    const debtCustomers = customersWithBalance.filter((c) => c.total_balance < 0).sort((a, b) => a.total_balance - b.total_balance);
    const creditCustomers = customersWithBalance.filter((c) => c.total_balance >= 0).sort((a, b) => b.total_balance - a.total_balance);
    const topCustomers = [...debtCustomers, ...creditCustomers];

    const customerNameMap = new Map(customersAll.map((c) => [c.id, c.full_name || c.customer_code || c.id] as const));
    const bankAccountNameMap = new Map(bankAccounts.map((b) => [b.id, b.account_name || b.bank_name || b.account_number || b.id] as const));

    const recentTransactions = [...transactions].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).slice(0, 20).map((tx) => ({
      ...tx, customer_name: customerNameMap.get(tx.customer_id || "") || tx.customer_name, bank_account_name: bankAccountNameMap.get(tx.bank_account_id || "") || tx.bank_account_name,
    }));

    const branches = (branchResult.data || []) as { id: string; name: string }[];
    const branchNameMap = new Map(branches.map((b) => [b.id, b.name] as const));
    const branchAgg = new Map<string, { incomeAmount: number; debtAmount: number }>();
    for (const tx of currentTx) {
      const branchIdForTx = tx.branch_id ? String(tx.branch_id) : "";
      const prev = branchAgg.get(branchIdForTx) || { incomeAmount: 0, debtAmount: 0 };
      if (tx.transaction_type === "payment" || tx.transaction_type === "refund") { prev.incomeAmount += Math.abs(tx.amount); }
      else if (tx.transaction_type === "charge") { prev.debtAmount += Math.abs(tx.amount); }
      else if (tx.transaction_type === "adjustment") { if (tx.amount >= 0) prev.incomeAmount += Math.abs(tx.amount); else prev.debtAmount += Math.abs(tx.amount); }
      else { prev.incomeAmount += tx.amount; }
      branchAgg.set(branchIdForTx, prev);
    }

    const transactionAmountsByBranch = Array.from(branchAgg.entries()).map(([branch_id, v]) => ({
      branch_id, branch_name: branchNameMap.get(branch_id) || `Branch ${branch_id}`, incomeAmount: v.incomeAmount, debtAmount: v.debtAmount,
    })).sort((a, b) => b.incomeAmount + b.debtAmount - (a.incomeAmount + a.debtAmount));

    return {
      data: {
        totalOutstanding: outstanding, totalOutstandingChange: outstanding - prevOutstanding,
        activeCustomers, activeCustomersChange: activeCustomers - prevActiveCustomers,
        transactionPaymentCount: currentPaymentCount, transactionChargeCount: currentChargeCount,
        transactionPaymentChange: currentPaymentCount - prevPaymentCount, transactionChargeChange: currentChargeCount - prevChargeCount,
        transactionIncomeInPeriod: currentIncome, transactionDebtInPeriod: currentDebt,
        transactionIncomeChange: currentIncome - prevIncome, transactionDebtChange: currentDebt - prevDebt,
        balanceByBankAccount, cashFlowData, cashFlowStartBalance: prevOutstanding, cashFlowEndBalance: outstanding,
        transactionAmountsByBranch, recentTransactions, topCustomers,
      }, error: null,
    };
  }

  static async getReceivableLedger(_branchId?: string, timeRange: TimeRange = "month", rangeCount?: any) {
    const branchId = String(_branchId || "");

    if (getTrialMode()) {
      const mockTransactions = trialGet("transactions") || [];
      const mockBranches = trialGet("branches") || [];
      return { transactions: mockTransactions, branches: mockBranches };
    }

    const [txResult, branchResult] = await Promise.all([
      apiClient.from("transactions").select("*").order("transaction_date", { ascending: false }),
      apiClient.from("branches").select("id, name"),
    ]);

    const transactionsAll: Transaction[] = (txResult.data || []) as Transaction[];
    const transactions = branchId ? transactionsAll.filter((t: any) => t.branch_id === branchId) : transactionsAll;

    const count = timeRange === "day" ? rangeCount?.day || 7 : timeRange === "week" ? rangeCount?.week || 8 : timeRange === "month" ? rangeCount?.month || 7 : timeRange === "quarter" ? rangeCount?.quarter || 8 : 2;
    const { start, end } = getPeriodWindow(timeRange, count);

    const periodStart = start;
    const periodEnd = end;

    const txBeforeStart = transactions.filter((t) => new Date(t.transaction_date).getTime() < periodStart.getTime());
    const openingBalance = receivableBalanceFromTransactions(txBeforeStart);

    const txInPeriod = transactions.filter((t) => {
      const ts = new Date(t.transaction_date).getTime();
      return ts >= periodStart.getTime() && ts <= periodEnd.getTime();
    }).sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    const branches = (branchResult.data || []) as { id: string; name: string }[];
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
        transaction_date: t.transaction_date, transaction_code: t.transaction_code, customer_id: t.customer_id,
        customer_name: t.customer_name, branch_id: t.branch_id, branch_name: t.branch_id ? (branchNameMap.get(t.branch_id) || `Branch ${t.branch_id}`) : "",
        bank_account_id: t.bank_account_id, bank_account_name: t.bank_account_name, transaction_type: t.transaction_type,
        description: t.description || "", reference_number: t.reference_number || "", increase: rowIncrease(t),
        decrease: rowDecrease(t), delta, running_balance: runningBalance,
      };
    });

    return {
      data: {
        timeRange, count, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString(),
        openingBalance, closingBalance: runningBalance, rows,
      },
      error: null,
    };
  }
}

export const dashboardService = {
  getDashboardMetrics: DashboardService.getDashboardMetrics.bind(DashboardService),
  getReceivableLedger: DashboardService.getReceivableLedger.bind(DashboardService),
};
