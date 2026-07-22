"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ShoppingCart, TrendingUp, DollarSign, Users, ArrowRight, CheckCircle, XCircle } from "lucide-react";

const formatCurrency = (n: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(n);

const stages = [
  { key: "lead", label: "عميل محتمل", color: "bg-blue-100 text-blue-700" },
  { key: "negotiation", label: "تفاوض", color: "bg-amber-100 text-amber-700" },
  { key: "won", label: "تم البيع", color: "bg-emerald-100 text-emerald-700" },
  { key: "lost", label: "مرفوض", color: "bg-rose-100 text-rose-700" },
];

export default function SalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<string>("all");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { router.push("/login"); return; }
        const res = await fetch("/api/sales/deals?limit=50");
        if (res.ok) { const d = await res.json(); setDeals(d.deals || []); }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const filtered = activeStage === "all" ? deals : deals.filter(d => d.stage === activeStage);
  const stageCount = (s: string) => deals.filter(d => d.stage === s).length;
  const totalWon = deals.filter(d => d.stage === "won").reduce((s, d) => s + d.amount, 0);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">المبيعات</h1>
        <p className="text-slate-500 mt-1">خط سير العميل وإدارة الصفقات</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <ShoppingCart className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">إجمالي الصفقات</p>
          <p className="text-lg font-bold text-slate-900">{deals.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <DollarSign className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">قيمة المبيعات</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(totalWon)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <TrendingUp className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">قيد التفاوض</p>
          <p className="text-lg font-bold text-slate-900">{stageCount("negotiation")}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">تم البيع</p>
          <p className="text-lg font-bold text-slate-900">{stageCount("won")}</p>
        </div>
      </div>

      {/* Pipeline stages */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 overflow-x-auto">
        <button onClick={() => setActiveStage("all")} className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] whitespace-nowrap ${activeStage === "all" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>
          الكل ({deals.length})
        </button>
        {stages.map(s => (
          <button key={s.key} onClick={() => setActiveStage(s.key)} className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] whitespace-nowrap ${activeStage === s.key ? "bg-white shadow-sm" : "text-slate-600"}`}>
            <span className={s.color.split(" ")[0] + " " + s.color.split(" ")[1] + " px-2 py-0.5 rounded-full"}>{stageCount(s.key)}</span>
            <span className="mr-1">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">قائمة الصفقات</h2>
        </div>
        <div className="table-responsive">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-right p-3 font-medium">العميل</th>
                <th className="text-left p-3 font-medium">المبلغ</th>
                <th className="text-right p-3 font-medium">المصدر</th>
                <th className="text-center p-3 font-medium">المرحلة</th>
                <th className="text-center p-3 font-medium">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const stageInfo = stages.find(s => s.key === d.stage);
                return (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium text-slate-900">{d.customerName}</td>
                    <td className="p-3 text-left font-medium">{formatCurrency(d.amount)}</td>
                    <td className="p-3 text-slate-600">{d.source || "-"}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageInfo?.color || "bg-slate-100 text-slate-500"}`}>
                        {stageInfo?.label || d.stage}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-400 text-xs">{d.notes || "-"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">لا توجد صفقات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
