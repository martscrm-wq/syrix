"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Calculator, FileText, BarChart3, TrendingUp, DollarSign, PieChart, AlertCircle } from "lucide-react";

interface TBEntry {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface IncomeStatementData {
  revenue: number;
  expenses: number;
  netIncome: number;
}

interface BalanceSheetData {
  assets: number;
  liabilities: number;
  equity: number;
}

interface RatiosData {
  liquidity: { currentRatio: number; quickRatio: number; cashRatio: number };
  profitability: { grossProfitMargin: number; netProfitMargin: number; returnOnAssets: number; returnOnEquity: number };
  solvency: { debtToAssets: number; debtToEquity: number };
  activity: { totalAssetTurnover: number };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(amount);
};

const formatPercent = (value: number) => {
  return (value * 100).toFixed(2) + "%";
};

export default function AccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tbData, setTbData] = useState<TBEntry[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeStatementData | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceSheetData | null>(null);
  const [ratiosData, setRatiosData] = useState<RatiosData | null>(null);
  const [tbBalanced, setTbBalanced] = useState(true);
  const [activeTab, setActiveTab] = useState<"tb" | "income" | "balance" | "ratios">("tb");
  const [tbTotals, setTbTotals] = useState({ debit: 0, credit: 0 });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }

      try {
        const [tbRes, incomeRes, balanceRes, ratiosRes] = await Promise.all([
          fetch(`/api/accounts/trial-balance?year=${year}&month=${month}`),
          fetch(`/api/accounts/income-statement?year=${year}&month=${month}`),
          fetch(`/api/accounts/balance-sheet?year=${year}&month=${month}`),
          fetch(`/api/accounts/ratios?year=${year}&month=${month}`),
        ]);

        if (tbRes.ok) {
          const tb = await tbRes.json();
          setTbData(tb.entries || []);
          setTbBalanced(tb.isBalanced);
          setTbTotals(tb.totals);
        }

        if (incomeRes.ok) {
          const income = await incomeRes.json();
          setIncomeData(income);
        }

        if (balanceRes.ok) {
          const bs = await balanceRes.json();
          setBalanceData(bs);
        }

        if (ratiosRes.ok) {
          const r = await ratiosRes.json();
          setRatiosData(r.ratios);
        }
      } catch (err) {
        console.error("Error fetching accounts data:", err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, year, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">موديول الحسابات</h1>
        <p className="text-slate-500 mt-1">
          {year}/{month.toString().padStart(2, "0")} — تقارير مالية شاملة
        </p>
        {!tbBalanced && (
          <div className="mt-3 flex items-center gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-sm border border-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>تنبيه: ميزان المراجعة غير متوازن. المجاميع لا تتطابق.</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-xs font-medium">الإيرادات</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(incomeData?.revenue || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-medium">المصروفات</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(incomeData?.expenses || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-medium">صافي الدخل</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(incomeData?.netIncome || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <PieChart className="w-5 h-5" />
            <span className="text-xs font-medium">الأصول</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(balanceData?.assets || 0)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {[
          { key: "tb" as const, label: "ميزان المراجعة", icon: FileText },
          { key: "income" as const, label: "قائمة الدخل", icon: TrendingUp },
          { key: "balance" as const, label: "الميزانية", icon: PieChart },
          { key: "ratios" as const, label: "النسب المالية", icon: Calculator },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
              activeTab === tab.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Trial Balance */}
      {activeTab === "tb" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">ميزان المراجعة</h2>
          </div>

          {/* Desktop table */}
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-3 font-medium">الكود</th>
                  <th className="text-right p-3 font-medium">الحساب</th>
                  <th className="text-left p-3 font-medium">مدين</th>
                  <th className="text-left p-3 font-medium">دائن</th>
                </tr>
              </thead>
              <tbody>
                {tbData.map((entry, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{entry.accountCode}</td>
                    <td className="p-3 font-medium text-slate-900">{entry.accountName}</td>
                    <td className="p-3 text-left text-slate-900">{entry.debit > 0 ? formatCurrency(entry.debit) : "-"}</td>
                    <td className="p-3 text-left text-slate-900">{entry.credit > 0 ? formatCurrency(entry.credit) : "-"}</td>
                  </tr>
                ))}
                {tbData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">لا توجد قيود في هذه الفترة</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr className="font-semibold">
                  <td colSpan={2} className="p-3 text-slate-700">المجموع</td>
                  <td className="p-3 text-left text-blue-700">{formatCurrency(tbTotals.debit)}</td>
                  <td className="p-3 text-left text-blue-700">{formatCurrency(tbTotals.credit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="table-card-view divide-y divide-slate-100">
            {tbData.map((entry, i) => (
              <div key={i} className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-slate-500">{entry.accountCode}</span>
                  {entry.debit > 0 && <span className="text-sm font-medium text-slate-900">{formatCurrency(entry.debit)} مدين</span>}
                  {entry.credit > 0 && <span className="text-sm font-medium text-slate-900">{formatCurrency(entry.credit)} دائن</span>}
                </div>
                <p className="font-medium text-slate-900">{entry.accountName}</p>
              </div>
            ))}
            <div className="p-4 bg-slate-50 flex justify-between font-semibold">
              <span>المجموع</span>
              <span className="text-blue-700">{formatCurrency(tbTotals.debit)} / {formatCurrency(tbTotals.credit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Income Statement */}
      {activeTab === "income" && incomeData && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">قائمة الدخل</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-slate-600">الإيرادات</span>
              <span className="font-medium text-emerald-600">{formatCurrency(incomeData.revenue)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-slate-100">
              <span className="text-slate-600">المصروفات</span>
              <span className="font-medium text-rose-600">{formatCurrency(incomeData.expenses)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-slate-200">
              <span className="font-bold text-slate-900">صافي الدخل</span>
              <span className={`font-bold text-lg ${incomeData.netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(incomeData.netIncome)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {activeTab === "balance" && balanceData && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">الميزانية العمومية</h2>
          </div>
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-500">الأصول</h3>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">إجمالي الأصول</span>
              <span className="font-medium text-slate-900">{formatCurrency(balanceData.assets)}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-3">
              <h3 className="text-sm font-medium text-slate-500">الخصوم وحقوق الملكية</h3>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">إجمالي الخصوم</span>
                <span className="font-medium text-slate-900">{formatCurrency(balanceData.liabilities)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">حقوق الملكية</span>
                <span className="font-medium text-slate-900">{formatCurrency(balanceData.equity)}</span>
              </div>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-slate-200">
              <span className="font-bold text-slate-900">الخصوم + حقوق الملكية</span>
              <span className="font-bold text-lg text-blue-600">{formatCurrency(balanceData.liabilities + balanceData.equity)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Ratios */}
      {activeTab === "ratios" && ratiosData && (
        <div className="space-y-4">
          {/* Liquidity */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">نسب السيولة</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { label: "Current Ratio", value: ratiosData.liquidity.currentRatio, desc: "الأصول المتداولة / الخصوم المتداولة" },
                { label: "Quick Ratio", value: ratiosData.liquidity.quickRatio, desc: "(الأصول المتداولة - المخزون) / الخصوم المتداولة" },
                { label: "Cash Ratio", value: ratiosData.liquidity.cashRatio, desc: "النقدية / الخصوم المتداولة" },
              ].map((item, i) => (
                <div key={i} className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-900">{item.label}</span>
                    <span className={`font-semibold ${item.value >= 1 ? "text-emerald-600" : "text-amber-600"}`}>
                      {item.value.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Profitability */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">نسب الربحية</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { label: "Gross Profit Margin", value: ratiosData.profitability.grossProfitMargin },
                { label: "Net Profit Margin", value: ratiosData.profitability.netProfitMargin },
                { label: "ROA", value: ratiosData.profitability.returnOnAssets },
                { label: "ROE", value: ratiosData.profitability.returnOnEquity },
              ].map((item, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="font-semibold text-slate-900">{formatPercent(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Solvency */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">نسب الملاءة</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { label: "Debt to Assets", value: ratiosData.solvency.debtToAssets },
                { label: "Debt to Equity", value: ratiosData.solvency.debtToEquity },
              ].map((item, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="font-semibold text-slate-900">{formatPercent(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">نسب النشاط</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { label: "Total Asset Turnover", value: ratiosData.activity.totalAssetTurnover },
              ].map((item, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
