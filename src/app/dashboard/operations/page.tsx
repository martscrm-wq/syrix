"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Building2, CalendarCheck, FileText, AlertTriangle, Plus, Building } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(amount);

const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(d));

export default function OperationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"units" | "bookings" | "contracts">("units");
  const [units, setUnits] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { router.push("/login"); return; }
        const [uRes, bRes, cRes] = await Promise.all([
          fetch("/api/ops/units?limit=50"),
          fetch("/api/ops/bookings?limit=50"),
          fetch("/api/ops/contracts?limit=50"),
        ]);
        if (uRes.ok) { const d = await uRes.json(); setUnits(d.units || []); }
        if (bRes.ok) { const d = await bRes.json(); setBookings(d.bookings || []); }
        if (cRes.ok) { const d = await cRes.json(); setContracts(d.contracts || []); }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-emerald-100 text-emerald-700",
      rented: "bg-blue-100 text-blue-700",
      under_maintenance: "bg-amber-100 text-amber-700",
      sold: "bg-slate-100 text-slate-500",
      pending: "bg-amber-100 text-amber-700",
      confirmed: "bg-blue-100 text-blue-700",
      cancelled: "bg-rose-100 text-rose-700",
      completed: "bg-emerald-100 text-emerald-700",
      active: "bg-emerald-100 text-emerald-700",
      expired: "bg-rose-100 text-rose-700",
      terminated: "bg-slate-100 text-slate-500",
    };
    return colors[status] || "bg-slate-100 text-slate-500";
  };

  const statusLabel = (status: string, type: string) => {
    const labels: Record<string, string> = {
      available: "متاحة", rented: "مؤجرة", under_maintenance: "صيانة", sold: "مباعة",
      pending: "قيد الانتظار", confirmed: "مؤكد", cancelled: "ملغي", completed: "مكتمل",
      active: "نشط", expired: "منتهي", terminated: "منتهى",
    };
    return labels[status] || status;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const expiringSoon = contracts.filter(c => {
    if (c.status !== "active") return false;
    const days = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 3600 * 24));
    return days >= 0 && days <= 30;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">العمليات</h1>
        <p className="text-slate-500 mt-1">إدارة الوحدات، الحجوزات، والتعاقدات</p>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-sm border border-amber-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>توجد {expiringSoon.length} تعاقدات تنتهي خلال 30 يومًا</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <Building className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-slate-500">الوحدات</p>
          <p className="text-lg font-bold text-slate-900">{units.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <CalendarCheck className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-sm font-medium text-slate-500">الحجوزات</p>
          <p className="text-lg font-bold text-slate-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <FileText className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-slate-500">التعاقدات</p>
          <p className="text-lg font-bold text-slate-900">{contracts.length}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {[
          { key: "units" as const, label: "الوحدات", icon: Building2 },
          { key: "bookings" as const, label: "الحجوزات", icon: CalendarCheck },
          { key: "contracts" as const, label: "التعاقدات", icon: FileText },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
              activeTab === tab.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Units */}
      {activeTab === "units" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">الوحدات العقارية</h2>
          </div>
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-3 font-medium">الاسم</th>
                  <th className="text-right p-3 font-medium">النوع</th>
                  <th className="text-left p-3 font-medium">السعر</th>
                  <th className="text-center p-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium text-slate-900">{u.nameAr}</td>
                    <td className="p-3 text-slate-600">{u.type}</td>
                    <td className="p-3 text-left">{formatCurrency(u.price)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(u.status)}`}>{statusLabel(u.status, "unit")}</span>
                    </td>
                  </tr>
                ))}
                {units.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-400">لا توجد وحدات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bookings */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">الحجوزات</h2>
          </div>
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-3 font-medium">العميل</th>
                  <th className="text-right p-3 font-medium">الوحدة</th>
                  <th className="text-right p-3 font-medium">من</th>
                  <th className="text-right p-3 font-medium">إلى</th>
                  <th className="text-left p-3 font-medium">المبلغ</th>
                  <th className="text-center p-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium text-slate-900">{b.customerName}</td>
                    <td className="p-3 text-slate-600">{b.unit?.nameAr}</td>
                    <td className="p-3 text-slate-600">{formatDate(b.startDate)}</td>
                    <td className="p-3 text-slate-600">{formatDate(b.endDate)}</td>
                    <td className="p-3 text-left">{formatCurrency(b.totalAmount)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(b.status)}`}>{statusLabel(b.status, "booking")}</span>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">لا توجد حجوزات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contracts */}
      {activeTab === "contracts" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">التعاقدات</h2>
          </div>
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-3 font-medium">العميل</th>
                  <th className="text-right p-3 font-medium">الوحدة</th>
                  <th className="text-right p-3 font-medium">النوع</th>
                  <th className="text-right p-3 font-medium">تاريخ الانتهاء</th>
                  <th className="text-left p-3 font-medium">القيمة</th>
                  <th className="text-center p-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const daysLeft = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                  return (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="p-3 font-medium text-slate-900">{c.clientName}</td>
                      <td className="p-3 text-slate-600">{c.unit?.nameAr}</td>
                      <td className="p-3 text-slate-600">{c.contractType}</td>
                      <td className="p-3 text-slate-600">
                        {formatDate(c.endDate)}
                        {c.status === "active" && daysLeft <= 30 && daysLeft >= 0 && (
                          <span className="mr-2 text-amber-600 text-xs font-medium">(متبقي {daysLeft} يوم)</span>
                        )}
                      </td>
                      <td className="p-3 text-left">{formatCurrency(c.totalAmount)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(c.status)}`}>{statusLabel(c.status, "contract")}</span>
                      </td>
                    </tr>
                  );
                })}
                {contracts.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">لا توجد تعاقدات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
