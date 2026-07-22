"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Megaphone, Users, BarChart3, Target } from "lucide-react";

const formatCurrency = (n: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(n);

export default function MarketingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campaigns" | "leads">("campaigns");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { router.push("/login"); return; }
        const [cRes, lRes] = await Promise.all([fetch("/api/mkt/campaigns?limit=50"), fetch("/api/mkt/leads?limit=50")]);
        if (cRes.ok) { const d = await cRes.json(); setCampaigns(d.campaigns || []); }
        if (lRes.ok) { const d = await lRes.json(); setLeads(d.leads || []); }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const badge = (status: string, map: Record<string, string>) => {
    const c = map[status] || "bg-slate-100 text-slate-500";
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c}`}>{status}</span>;
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700", paused: "bg-amber-100 text-amber-700", completed: "bg-blue-100 text-blue-700",
    new: "bg-blue-100 text-blue-700", contacted: "bg-amber-100 text-amber-700", qualified: "bg-purple-100 text-purple-700",
    converted: "bg-emerald-100 text-emerald-700", lost: "bg-rose-100 text-rose-700",
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">التسويق</h1>
        <p className="text-slate-500 mt-1">إدارة الحملات الإعلانية والعملاء المحتملين</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <Megaphone className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">الحملات</p>
          <p className="text-lg font-bold text-slate-900">{campaigns.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <Users className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">العملاء المحتملين</p>
          <p className="text-lg font-bold text-slate-900">{leads.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <Target className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">متحولون</p>
          <p className="text-lg font-bold text-slate-900">{leads.filter(l => l.status === "converted").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <BarChart3 className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">إجمالي الإنفاق</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(campaigns.reduce((s, c) => s + c.spent, 0))}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab("campaigns")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] ${activeTab === "campaigns" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>
          <Megaphone className="w-4 h-4" /> الحملات
        </button>
        <button onClick={() => setActiveTab("leads")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] ${activeTab === "leads" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>
          <Users className="w-4 h-4" /> العملاء المحتملين
        </button>
      </div>

      {activeTab === "campaigns" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">الحملات الإعلانية</h2></div>
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-slate-600">
                <th className="text-right p-3 font-medium">الاسم</th><th className="text-right p-3 font-medium">القناة</th>
                <th className="text-left p-3 font-medium">الميزانية</th><th className="text-left p-3 font-medium">المنفق</th>
                <th className="text-center p-3 font-medium">العملاء</th><th className="text-center p-3 font-medium">الحالة</th>
              </tr></thead>
              <tbody>
                {campaigns.map(c => <tr key={c.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium text-slate-900">{c.name}</td>
                  <td className="p-3 text-slate-600">{c.channel}</td>
                  <td className="p-3 text-left">{formatCurrency(c.budget)}</td>
                  <td className="p-3 text-left">{formatCurrency(c.spent)}</td>
                  <td className="p-3 text-center">{c._count?.leads || 0}</td>
                  <td className="p-3 text-center">{badge(c.status, statusColors)}</td>
                </tr>)}
                {campaigns.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">لا توجد حملات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "leads" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">العملاء المحتملين</h2></div>
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-slate-600">
                <th className="text-right p-3 font-medium">الاسم</th><th className="text-right p-3 font-medium">المصدر</th>
                <th className="text-right p-3 font-medium">الحملة</th><th className="text-center p-3 font-medium">الحالة</th>
              </tr></thead>
              <tbody>
                {leads.map(l => <tr key={l.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium text-slate-900">{l.name}</td>
                  <td className="p-3 text-slate-600">{l.source}</td>
                  <td className="p-3 text-slate-600">{l.campaign?.name || "-"}</td>
                  <td className="p-3 text-center">{badge(l.status, statusColors)}</td>
                </tr>)}
                {leads.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-400">لا يوجد عملاء محتملين</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
