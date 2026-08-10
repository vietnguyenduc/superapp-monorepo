import { useEffect, useMemo, useState } from "react";
import { FiDollarSign, FiSun, FiMoon, FiUser, FiPlus, FiTrash2 } from "react-icons/fi";
import { Card, Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../contexts/ThemeContext";
import { useSession } from "../../contexts/SessionContext";
import * as service from "../../services/frameworkMethodService";
import type { FinanceExpenseCategory, IncomeEntry, FinanceExpense, IncomeMode } from "../../types";

const EXPENSE_CATEGORIES: {
  id: FinanceExpenseCategory;
  labelKey: string;
  hintKey?: string;
  color: string;
}[] = [
  { id: "family", labelKey: "categoryFamily", hintKey: "familyHint", color: "emerald" },
  { id: "savings", labelKey: "categorySavings", hintKey: "savingsHint", color: "violet" },
  { id: "merit_debt", labelKey: "categoryMeritDebt", hintKey: "meritDebtHint", color: "amber" },
  { id: "reinvest", labelKey: "categoryReinvest", color: "blue" },
  { id: "personal", labelKey: "categoryPersonal", hintKey: "personalHint", color: "rose" },
];

const defaultAllocations = () =>
  Object.fromEntries(
    EXPENSE_CATEGORIES.map((c) => [c.id, { amount: "", note: "" }])
  ) as Record<FinanceExpenseCategory, { amount: string; note: string }>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const parseAmount = (raw: string) => {
  const clean = raw.replace(/\./g, "").replace(/,/g, "").replace(/\D/g, "");
  return clean ? Number(clean) : 0;
};

const FinanceControl = () => {
  const { t, language } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { userId } = useSession();

  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<IncomeMode>("estimate");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [installments, setInstallments] = useState("1");
  const [note, setNote] = useState("");
  const [allocations, setAllocations] = useState(defaultAllocations);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const [inc, exp] = await Promise.all([
        service.getFinanceIncome(userId),
        service.getFinanceExpenses(userId),
      ]);
      setIncomeEntries(inc);
      setExpenses(exp);
    })();
  }, [userId]);

  const totals = useMemo(() => {
    const totalIncome = incomeEntries.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = EXPENSE_CATEGORIES.reduce((acc, c) => {
      acc[c.id] = expenses.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0);
      return acc;
    }, {} as Record<FinanceExpenseCategory, number>);
    return { totalIncome, totalExpense, byCategory, remaining: totalIncome - totalExpense };
  }, [incomeEntries, expenses]);

  const handleAmountChange = (value: string) => {
    const numeric = parseAmount(value);
    setAmount(numeric ? new Intl.NumberFormat("vi-VN").format(numeric) : "");
  };

  const handleAllocationChange = (category: FinanceExpenseCategory, field: "amount" | "note", value: string) => {
    setAllocations((prev) => {
      const next = { ...prev, [category]: { ...prev[category] } };
      if (field === "amount") {
        const numeric = parseAmount(value);
        next[category].amount = numeric ? new Intl.NumberFormat("vi-VN").format(numeric) : "";
      } else {
        next[category].note = value;
      }
      return next;
    });
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setInstallments("1");
    setNote("");
    setAllocations(defaultAllocations());
    setFormOpen(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    const numericAmount = parseAmount(amount);
    if (!numericAmount) return;

    const newIncome: IncomeEntry = {
      id: service.genId(),
      user_id: userId,
      amount: numericAmount,
      mode,
      date,
      title: title.trim() || (mode === "estimate" ? t("financeControl.modeEstimate") : t("financeControl.modeExact")),
      note: note.trim() || undefined,
      installments: mode === "exact" ? Math.max(1, Number(installments) || 1) : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const incomeId = newIncome.id;
    const newExpenses: FinanceExpense[] = [];

    EXPENSE_CATEGORIES.forEach((cat) => {
      const val = parseAmount(allocations[cat.id].amount);
      if (val > 0) {
        newExpenses.push({
          id: service.genId(),
          user_id: userId,
          income_id: incomeId,
          category: cat.id,
          amount: val,
          note: allocations[cat.id].note.trim() || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    const nextIncome = [newIncome, ...incomeEntries];
    const nextExpenses = [...newExpenses, ...expenses];
    setIncomeEntries(nextIncome);
    setExpenses(nextExpenses);
    await service.saveFinanceIncome(nextIncome);
    await service.saveFinanceExpenses(nextExpenses);
    resetForm();
  };

  const handleDeleteIncome = async (id: string) => {
    const nextIncome = incomeEntries.filter((i) => i.id !== id);
    const nextExpenses = expenses.filter((e) => e.income_id !== id);
    setIncomeEntries(nextIncome);
    setExpenses(nextExpenses);
    await service.saveFinanceIncome(nextIncome);
    await service.saveFinanceExpenses(nextExpenses);
  };

  const displayAmount = (raw: string) => raw;

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-center justify-between py-2">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-95 transition-all"
        >
          {theme === "dark" ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>
        <h2 className="text-lg font-semibold tracking-tight">{t("financeControl.title")}</h2>
        <button className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-200">
          <FiUser className="w-5 h-5" />
        </button>
      </header>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t("financeControl.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("financeControl.subtitle")}</p>
      </div>

      <Card className="p-4 bg-amber-50/40 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{t("financeControl.overallHint")}</p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("financeControl.totalIncome")}</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totals.totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("financeControl.totalExpense")}</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totals.totalExpense)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("financeControl.remaining")}</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totals.remaining)}</p>
        </Card>
      </div>

      <Button
        variant="secondary"
        onClick={() => setFormOpen((s) => !s)}
        className="w-full"
      >
        <FiPlus className="w-4 h-4 mr-2" />
        {formOpen ? t("common.close") : t("financeControl.addIncome")}
      </Button>

      {formOpen && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setMode("estimate")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "estimate" ? "bg-primary-600 text-white" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {t("financeControl.modeEstimate")}
            </button>
            <button
              onClick={() => setMode("exact")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "exact" ? "bg-primary-600 text-white" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {t("financeControl.modeExact")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label={t("financeControl.incomeTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === "en" ? "e.g. Salary August" : "VD: Lương tháng 8"}
            />
            <Input
              label={t("financeControl.amount")}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              inputMode="numeric"
            />
          </div>

          {mode === "exact" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label={t("financeControl.date")}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Input
                label={t("financeControl.installments")}
                value={installments}
                onChange={(e) => setInstallments(e.target.value.replace(/\D/g, ""))}
                placeholder="1"
                inputMode="numeric"
              />
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("financeControl.note")}
            rows={2}
            className="input resize-none text-sm"
          />

          <div className="space-y-3">
            <p className="text-sm font-semibold">{t("financeControl.allocate")}</p>
            {EXPENSE_CATEGORIES.map((cat) => {
              const c = cat;
              const catKey = c.labelKey;
              const hintKey = c.hintKey;
              return (
                <div key={c.id} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-${c.color}-50 dark:bg-${c.color}-900/20 text-${c.color}-600 flex items-center justify-center shrink-0`}>
                      <FiDollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t(`financeControl.${catKey}`)}</p>
                      {hintKey && <p className="text-xs text-gray-500 dark:text-gray-400">{t(`financeControl.${hintKey}`)}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      value={displayAmount(allocations[c.id].amount)}
                      onChange={(e) => handleAllocationChange(c.id, "amount", e.target.value)}
                      placeholder={t("financeControl.amount")}
                      inputMode="numeric"
                    />
                    <Input
                      value={allocations[c.id].note}
                      onChange={(e) => handleAllocationChange(c.id, "note", e.target.value)}
                      placeholder={t("financeControl.note")}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleSave} className="w-full">
            {t("financeControl.save")}
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {incomeEntries.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">{language === "en" ? "No income recorded yet." : "Chưa có thu nhập nào."}</p>
        )}
        {incomeEntries.map((income) => {
          const incomeExpenses = expenses.filter((e) => e.income_id === income.id);
          return (
            <Card key={income.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{income.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {income.mode === "estimate" ? t("financeControl.modeEstimate") : `${t("financeControl.modeExact")} · ${income.date}`}
                    {income.installments ? ` · ${income.installments} kỳ` : ""}
                  </p>
                  {income.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{income.note}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{formatCurrency(income.amount)}</p>
                  <button
                    onClick={() => handleDeleteIncome(income.id)}
                    className="text-gray-400 hover:text-red-500 p-1 mt-1"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {incomeExpenses.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                  {incomeExpenses.map((exp) => {
                    const cat = EXPENSE_CATEGORIES.find((c) => c.id === exp.category);
                    return (
                      <div key={exp.id} className="text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{cat ? t(`financeControl.${cat.labelKey}`) : exp.category}:</span>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(exp.amount)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FinanceControl;
