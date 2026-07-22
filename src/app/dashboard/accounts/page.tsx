"use client";

import { useEffect, useState } from "react";
import { Calculator, FileText, TrendingUp, DollarSign, PieChart, Activity, AlertCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

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
  solvency: { debtToAssets: number; debtToEquity: number; timesInterestEarned: number };
  activity: { inventoryTurnover: number; accountsReceivableTurnover: number; totalAssetTurnover: number };
}

interface CashFlowData {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netChange: number;
  beginningCash: number;
  endingCash: number;
}

const formatPercent = (value: number) => value.toFixed(2) + "%";

export default function AccountsPage() {
  const [loading, setLoading] = useState(true);
  const [tbData, setTbData] = useState<TBEntry[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeStatementData | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceSheetData | null>(null);
  const [ratiosData, setRatiosData] = useState<RatiosData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [tbBalanced, setTbBalanced] = useState(true);
  const [activeTab, setActiveTab] = useState<"tb" | "income" | "balance" | "ratios" | "cashflow" | "journal">("tb");
  const [tbTotals, setTbTotals] = useState({ debit: 0, credit: 0 });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    (async () => {
      try {
        const [tbRes, incomeRes, balanceRes, ratiosRes, cfRes] = await Promise.all([
          fetch(`/api/accounts/trial-balance?year=${year}&month=${month}`),
          fetch(`/api/accounts/income-statement?year=${year}&month=${month}`),
          fetch(`/api/accounts/balance-sheet?year=${year}&month=${month}`),
          fetch(`/api/accounts/ratios?year=${year}&month=${month}`),
          fetch(`/api/accounts/cash-flow?year=${year}&month=${month}`),
        ]);

        if (tbRes.ok) { const tb = await tbRes.json(); setTbData(tb.entries || []); setTbBalanced(tb.isBalanced); setTbTotals(tb.totals); }
        if (incomeRes.ok) setIncomeData(await incomeRes.json());
        if (balanceRes.ok) setBalanceData(await balanceRes.json());
        if (ratiosRes.ok) { const r = await ratiosRes.json(); setRatiosData(r.ratios); }
        if (cfRes.ok) setCashFlowData(await cfRes.json());
      } catch (err) { console.error("Error fetching accounts data:", err); }
      setLoading(false);
    })();
  }, [year, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const tabs = [
    { key: "tb" as const, label: "ميزان المراجعة", icon: FileText },
    { key: "income" as const, label: "قائمة الدخل", icon: TrendingUp },
    { key: "balance" as const, label: "الميزانية", icon: PieChart },
    { key: "cashflow" as const, label: "التدفق النقدي", icon: Activity },
    { key: "ratios" as const, label: "النسب المالية", icon: Calculator },
    { key: "journal" as const, label: "قيود اليومية", icon: BookOpen },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">موديول الحسابات</h1>
        <p className="text-slate-500 mt-1">{year}/{month.toString().padStart(2, "0")} — تقارير مالية شاملة</p>
        {!tbBalanced && (
          <div className="mt-3 flex items-center gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-sm border border-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>تنبيه: ميزان المراجعة غير متوازن. المجاميع لا تتطابق.</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "الإيرادات", value: incomeData?.revenue || 0, icon: DollarSign, color: "text-blue-600" },
          { label: "المصروفات", value: incomeData?.expenses || 0, icon: TrendingUp, color: "text-rose-600" },
          { label: "صافي الدخل", value: incomeData?.netIncome || 0, icon: TrendingUp, color: "text-emerald-600" },
          { label: "النقدية", value: cashFlowData?.endingCash || 0, icon: DollarSign, color: "text-purple-600" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`flex items-center gap-2 ${card.color} mb-2`}>
              <card.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{card.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
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
                  <tr><td colSpan={4} className="p-6 text-center text-slate-400">لا توجد قيود في هذه الفترة</td></tr>
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
        </div>
      )}

      {/* Income Statement */}
      {activeTab === "income" && incomeData && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">قائمة الدخل</h2></div>
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
          <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">الميزانية العمومية</h2></div>
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

      {/* Cash Flow Statement */}
      {activeTab === "cashflow" && cashFlowData && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">قائمة التدفقات النقدية</h2></div>
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-500">الأنشطة التشغيلية</h3>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">صافي التدفق النقدي من الأنشطة التشغيلية</span>
              <span className={`font-medium ${cashFlowData.operatingActivities >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(cashFlowData.operatingActivities)}
              </span>
            </div>

            <h3 className="text-sm font-medium text-slate-500 pt-3 border-t border-slate-100">الأنشطة الاستثمارية</h3>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">صافي التدفق النقدي من الأنشطة الاستثمارية</span>
              <span className={`font-medium ${cashFlowData.investingActivities >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(cashFlowData.investingActivities)}
              </span>
            </div>

            <h3 className="text-sm font-medium text-slate-500 pt-3 border-t border-slate-100">الأنشطة التمويلية</h3>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">صافي التدفق النقدي من الأنشطة التمويلية</span>
              <span className={`font-medium ${cashFlowData.financingActivities >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(cashFlowData.financingActivities)}
              </span>
            </div>

            <div className="border-t-2 border-slate-200 pt-3 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-slate-600">صافي الزيادة (النقص) في النقدية</span>
                <span className={`font-semibold ${cashFlowData.netChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(cashFlowData.netChange)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">النقدية أول الفترة</span>
                <span className="font-medium text-slate-900">{formatCurrency(cashFlowData.beginningCash)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-100 pt-2">
                <span className="font-bold text-slate-900">النقدية آخر الفترة</span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(cashFlowData.endingCash)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Ratios */}
      {activeTab === "ratios" && ratiosData && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">نسب السيولة</h2></div>
            <div className="divide-y divide-slate-100">
              {[
                { label: "Current Ratio", value: ratiosData.liquidity.currentRatio, desc: "الأصول المتداولة / الخصوم المتداولة" },
                { label: "Quick Ratio", value: ratiosData.liquidity.quickRatio, desc: "(الأصول المتداولة - المخزون) / الخصوم المتداولة" },
                { label: "Cash Ratio", value: ratiosData.liquidity.cashRatio, desc: "النقدية / الخصوم المتداولة" },
              ].map((item, i) => (
                <div key={i} className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-900">{item.label}</span>
                    <span className={`font-semibold ${item.value >= 1 ? "text-emerald-600" : "text-amber-600"}`}>{item.value.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">نسب الربحية</h2></div>
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

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">نسب الملاءة</h2></div>
            <div className="divide-y divide-slate-100">
              {[
                { label: "Debt to Assets", value: ratiosData.solvency.debtToAssets },
                { label: "Debt to Equity", value: ratiosData.solvency.debtToEquity },
                { label: "Times Interest Earned", value: ratiosData.solvency.timesInterestEarned },
              ].map((item, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.label.includes("Times") ? item.value.toFixed(2) + "x" : formatPercent(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">نسب النشاط</h2></div>
            <div className="divide-y divide-slate-100">
              {[
                { label: "Inventory Turnover", value: ratiosData.activity.inventoryTurnover },
                { label: "AR Turnover", value: ratiosData.activity.accountsReceivableTurnover },
                { label: "Total Asset Turnover", value: ratiosData.activity.totalAssetTurnover },
              ].map((item, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <span className="font-medium text-slate-900">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.value.toFixed(2)}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Journal Entries Tab */}
      {activeTab === "journal" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 text-center">
            <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h2 className="font-semibold text-slate-900 mb-2">دفتر اليومية العامة</h2>
            <p className="text-slate-500 mb-4">إدارة القيود المحاسبية - إضافة وتعديل وحذف مع قوالب جاهزة</p>
            <Link href="/dashboard/accounts/journal"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700">
              <BookOpen className="w-4 h-4" />فتح دفتر اليومية
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
